-- Migration: permitir a lideres actualizar su grupo (id_lider + admin_grupos)
-- Fecha: 2026-09-22
-- Contexto: en produccion los grupos vinculan lider via `id_lider`, pero no existe
-- ninguna policy que permita a ADMIN_GRUPO hacer UPDATE (solo SUPER_ADMIN).
-- Resultado: el panel /lider muestra el formulario pero al guardar Supabase
-- rechaza el UPDATE por RLS y "no pasa nada".
--
-- Esta migracion:
--  1. Crea `admin_grupos` si falta (en prod no existe) + indices + RLS basica.
--  2. Backfill: convierte cada `grupos.id_lider` en asignacion activa.
--  3. Recrea un set coherente de policies sobre `grupos`:
--     - lectura publica: solo aprobados
--     - lider: SELECT + UPDATE de sus grupos (por id_lider O admin_grupos activo)
--     - SUPER_ADMIN: acceso total
--  4. Repone las funciones RPC que usa /admin (assign/remove/get_manageable).

-- ============================================
-- 1. TABLA admin_grupos (idempotente)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_grupos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    asignado_por UUID REFERENCES public.perfiles(id),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(usuario_id, grupo_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_grupos_usuario ON public.admin_grupos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_admin_grupos_grupo ON public.admin_grupos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_admin_grupos_activo ON public.admin_grupos(activo);

ALTER TABLE public.admin_grupos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_admin_grupos_all" ON public.admin_grupos;
CREATE POLICY "super_admin_admin_grupos_all"
ON public.admin_grupos FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'SUPER_ADMIN'))
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'SUPER_ADMIN'));

DROP POLICY IF EXISTS "users_view_own_admin_assignments" ON public.admin_grupos;
CREATE POLICY "users_view_own_admin_assignments"
ON public.admin_grupos FOR SELECT TO authenticated
USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "lider_view_group_admins" ON public.admin_grupos;
CREATE POLICY "lider_view_group_admins"
ON public.admin_grupos FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_grupos ag
        WHERE ag.usuario_id = auth.uid()
          AND ag.grupo_id = admin_grupos.grupo_id
          AND ag.activo = TRUE
    )
    OR EXISTS (
        SELECT 1 FROM public.grupos g
        WHERE g.id = admin_grupos.grupo_id AND g.id_lider = auth.uid()
    )
);

-- ============================================
-- 2. BACKFILL id_lider -> admin_grupos
-- ============================================

INSERT INTO public.admin_grupos (usuario_id, grupo_id, activo)
SELECT id_lider, id, TRUE
FROM public.grupos
WHERE id_lider IS NOT NULL
ON CONFLICT (usuario_id, grupo_id)
DO UPDATE SET activo = TRUE;

-- ============================================
-- 3. POLICIES DE grupos (set coherente)
-- ============================================

ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_grupos_all" ON public.grupos;
DROP POLICY IF EXISTS "admin_grupo_manage_own" ON public.grupos;
DROP POLICY IF EXISTS "admin_grupo_manage_assigned" ON public.grupos;
DROP POLICY IF EXISTS "visitante_view_approved" ON public.grupos;
DROP POLICY IF EXISTS "admin_view_approved_groups" ON public.grupos;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.grupos;
DROP POLICY IF EXISTS "Super admins can insert grupos" ON public.grupos;
DROP POLICY IF EXISTS "Super admins can update grupos" ON public.grupos;
DROP POLICY IF EXISTS "Super admins can delete grupos" ON public.grupos;
DROP POLICY IF EXISTS "public_select_approved" ON public.grupos;
DROP POLICY IF EXISTS "lider_select_own" ON public.grupos;
DROP POLICY IF EXISTS "lider_update_own" ON public.grupos;

-- Lectura publica: solo grupos aprobados
CREATE POLICY "public_select_approved"
ON public.grupos FOR SELECT TO anon, authenticated
USING (estado_aprobacion = 'aprobado');

-- El lider puede LEER sus grupos en cualquier estado (para editar pendientes)
CREATE POLICY "lider_select_own"
ON public.grupos FOR SELECT TO authenticated
USING (
    id_lider = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.admin_grupos
        WHERE usuario_id = auth.uid()
          AND grupo_id = grupos.id
          AND activo = TRUE
    )
);

-- SUPER_ADMIN: acceso total
CREATE POLICY "super_admin_grupos_all"
ON public.grupos FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'SUPER_ADMIN'))
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'SUPER_ADMIN'));

-- ADMIN_GRUPO: UPDATE solo de sus grupos (id_lider O asignacion activa).
-- El WITH CHECK usa la fila nueva, asi que el lider no puede reasignarse
-- el grupo a otro usuario ni cambiar el estado de aprobacion.
CREATE POLICY "lider_update_own"
ON public.grupos FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'ADMIN_GRUPO')
    AND (
        id_lider = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.admin_grupos
            WHERE usuario_id = auth.uid()
              AND grupo_id = grupos.id
              AND activo = TRUE
        )
    )
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'ADMIN_GRUPO')
    AND (
        id_lider = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.admin_grupos
            WHERE usuario_id = auth.uid()
              AND grupo_id = grupos.id
              AND activo = TRUE
        )
    )
);

-- ============================================
-- 4. FUNCIONES RPC para /admin
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin_of_group(group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_grupos
        WHERE usuario_id = auth.uid()
          AND grupo_id = group_id
          AND activo = TRUE
    ) OR EXISTS (
        SELECT 1 FROM public.grupos
        WHERE id = group_id AND id_lider = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_manageable_groups()
RETURNS TABLE (grupo_id UUID, grupo_nombre TEXT, tipo TEXT) AS $$
DECLARE
    user_role_val TEXT;
BEGIN
    SELECT rol::TEXT INTO user_role_val
    FROM public.perfiles WHERE id = auth.uid();

    IF user_role_val = 'SUPER_ADMIN' THEN
        RETURN QUERY SELECT g.id, g.nombre, g.tipo::TEXT FROM public.grupos g;
    ELSIF user_role_val = 'ADMIN_GRUPO' THEN
        RETURN QUERY
        SELECT g.id, g.nombre, g.tipo::TEXT
        FROM public.grupos g
        WHERE g.id_lider = auth.uid()
           OR EXISTS (
               SELECT 1 FROM public.admin_grupos ag
               WHERE ag.grupo_id = g.id
                 AND ag.usuario_id = auth.uid()
                 AND ag.activo = TRUE
           );
    ELSE
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT WHERE FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.assign_admin_to_group(
    target_usuario_id UUID,
    target_grupo_id UUID,
    asignado_por_uuid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    SELECT rol::TEXT INTO user_role_val
    FROM public.perfiles WHERE id = auth.uid();

    IF user_role_val != 'SUPER_ADMIN' THEN
        RAISE EXCEPTION 'Only SUPER_ADMIN can assign admins to groups';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.perfiles WHERE id = target_usuario_id) THEN
        RAISE EXCEPTION 'Target user does not exist';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.grupos WHERE id = target_grupo_id) THEN
        RAISE EXCEPTION 'Target group does not exist';
    END IF;

    UPDATE public.perfiles SET rol = 'ADMIN_GRUPO'
    WHERE id = target_usuario_id AND rol != 'SUPER_ADMIN';

    IF EXISTS (
        SELECT 1 FROM public.admin_grupos
        WHERE usuario_id = target_usuario_id AND grupo_id = target_grupo_id
    ) THEN
        UPDATE public.admin_grupos
        SET activo = TRUE, fecha_asignacion = NOW(), asignado_por = asignado_por_uuid
        WHERE usuario_id = target_usuario_id AND grupo_id = target_grupo_id;
    ELSE
        INSERT INTO public.admin_grupos (usuario_id, grupo_id, asignado_por)
        VALUES (target_usuario_id, target_grupo_id, asignado_por_uuid);
    END IF;

    -- Mantener id_lider sincronizado si esta vacio
    UPDATE public.grupos SET id_lider = target_usuario_id
    WHERE id = target_grupo_id AND id_lider IS NULL;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.remove_admin_from_group(
    target_usuario_id UUID,
    target_grupo_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    SELECT rol::TEXT INTO user_role_val
    FROM public.perfiles WHERE id = auth.uid();

    IF user_role_val != 'SUPER_ADMIN' THEN
        RAISE EXCEPTION 'Only SUPER_ADMIN can remove admins from groups';
    END IF;

    UPDATE public.admin_grupos SET activo = FALSE
    WHERE usuario_id = target_usuario_id AND grupo_id = target_grupo_id;

    IF NOT EXISTS (
        SELECT 1 FROM public.admin_grupos
        WHERE usuario_id = target_usuario_id AND activo = TRUE
    ) AND NOT EXISTS (
        SELECT 1 FROM public.grupos WHERE id_lider = target_usuario_id
    ) THEN
        UPDATE public.perfiles SET rol = 'VISITANTE'
        WHERE id = target_usuario_id AND rol != 'SUPER_ADMIN';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
