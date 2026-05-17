-- Migration: Improve Admin System with Group-Level Administration
-- Date: 2025-05-16
-- Description: Add support for total admins and group-specific admins

-- ============================================
-- UPDATE ENUMS
-- ============================================

-- Drop and recreate user_role enum with new roles
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN_GRUPO', 'LIDER_GRUPO', 'VISITANTE');

-- ============================================
-- NEW TABLES
-- ============================================

-- Table for group administrators (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.admin_grupos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    asignado_por UUID REFERENCES public.perfiles(id),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(usuario_id, grupo_id)
);

-- ============================================
-- MODIFY EXISTING TABLES
-- ============================================

-- Add index for admin_grupos lookups
CREATE INDEX IF NOT EXISTS idx_admin_grupos_usuario ON public.admin_grupos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_admin_grupos_grupo ON public.admin_grupos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_admin_grupos_activo ON public.admin_grupos(activo);

-- Add column to track if a user can manage multiple groups
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS es_admin_multi_grupo BOOLEAN DEFAULT FALSE;

-- ============================================
-- RLS POLICIES FOR NEW TABLE
-- ============================================

ALTER TABLE public.admin_grupos ENABLE ROW LEVEL SECURITY;

-- SUPER_ADMIN: Full access to admin assignments
CREATE POLICY "super_admin_admin_grupos_all"
ON public.admin_grupos
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Users can view their own admin assignments
CREATE POLICY "users_view_own_admin_assignments"
ON public.admin_grupos
FOR SELECT
TO authenticated
USING (auth.uid() = usuario_id);

-- ADMIN_GRUPO can view admins for groups they manage
CREATE POLICY "admin_grupo_view_group_admins"
ON public.admin_grupos
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_grupos 
        WHERE usuario_id = auth.uid() 
        AND grupo_id = admin_grupos.grupo_id 
        AND activo = TRUE
    )
);

-- ============================================
-- UPDATE EXISTING RLS POLICIES
-- ============================================

-- Update grupos policies to work with new admin system

-- Drop old policies
DROP POLICY IF EXISTS "super_admin_grupos_all" ON public.grupos;
DROP POLICY IF EXISTS "admin_grupo_manage_own" ON public.grupos;
DROP POLICY IF EXISTS "visitante_view_approved" ON public.grupos;

-- Create new policies

-- SUPER_ADMIN: Full access
CREATE POLICY "super_admin_grupos_all"
ON public.grupos
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- ADMIN_GRUPO: Can manage groups they are assigned to
CREATE POLICY "admin_grupo_manage_assigned"
ON public.grupos
FOR ALL
TO authenticated
USING (
    auth.jwt() ->> 'role' = 'ADMIN_GRUPO'
    AND EXISTS (
        SELECT 1 FROM public.admin_grupos 
        WHERE usuario_id = auth.uid() 
        AND grupo_id = grupos.id 
        AND activo = TRUE
    )
)
WITH CHECK (
    auth.jwt() ->> 'role' = 'ADMIN_GRUPO'
    AND EXISTS (
        SELECT 1 FROM public.admin_grupos 
        WHERE usuario_id = auth.uid() 
        AND grupo_id = grupos.id 
        AND activo = TRUE
    )
);

-- LIDER_GRUPO: Can manage groups where they are the leader
CREATE POLICY "lider_grupo_manage_own"
ON public.grupos
FOR ALL
TO authenticated
USING (
    auth.jwt() ->> 'role' = 'LIDER_GRUPO'
    AND id_lider = auth.uid()
)
WITH CHECK (
    auth.jwt() ->> 'role' = 'LIDER_GRUPO'
    AND id_lider = auth.uid()
);

-- VISITANTE: Can only SELECT approved groups
CREATE POLICY "visitante_view_approved"
ON public.grupos
FOR SELECT
TO anon, authenticated
USING (estado_aprobacion = 'aprobado');

-- ADMIN_GRUPO and LIDER_GRUPO can also view approved groups
CREATE POLICY "admin_view_approved_groups"
ON public.grupos
FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'ADMIN_GRUPO' OR auth.jwt() ->> 'role' = 'LIDER_GRUPO')
    AND estado_aprobacion = 'aprobado'
);

-- ============================================
-- UPDATE PERFILES POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "super_admin_perfiles_all" ON public.perfiles;
DROP POLICY IF EXISTS "users_view_own_profile" ON public.perfiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.perfiles;
DROP POLICY IF EXISTS "public_insert_profile" ON public.perfiles;

-- Create new policies

-- SUPER_ADMIN: Full access
CREATE POLICY "super_admin_perfiles_all"
ON public.perfiles
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Users can view their own profile
CREATE POLICY "users_view_own_profile"
ON public.perfiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile (except role and admin_multi_grupo)
CREATE POLICY "users_update_own_profile"
ON public.perfiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND rol = (SELECT rol FROM public.perfiles WHERE id = auth.uid())
    AND es_admin_multi_grupo = (SELECT es_admin_multi_grupo FROM public.perfiles WHERE id = auth.uid())
);

-- Public can insert (for registration)
CREATE POLICY "public_insert_profile"
ON public.perfiles
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user is admin of a specific group
CREATE OR REPLACE FUNCTION public.is_admin_of_group(group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_grupos 
        WHERE usuario_id = auth.uid() 
        AND grupo_id = group_id 
        AND activo = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all groups a user can manage
CREATE OR REPLACE FUNCTION public.get_manageable_groups()
RETURNS TABLE (grupo_id UUID, grupo_nombre TEXT, tipo TEXT) AS $$
BEGIN
    IF (auth.jwt() ->> 'role') = 'SUPER_ADMIN' THEN
        RETURN QUERY
        SELECT g.id, g.nombre, g.tipo::TEXT
        FROM public.grupos g;
    ELSEIF (auth.jwt() ->> 'role') = 'ADMIN_GRUPO' THEN
        RETURN QUERY
        SELECT g.id, g.nombre, g.tipo::TEXT
        FROM public.grupos g
        INNER JOIN public.admin_grupos ag ON g.id = ag.grupo_id
        WHERE ag.usuario_id = auth.uid() AND ag.activo = TRUE;
    ELSEIF (auth.jwt() ->> 'role') = 'LIDER_GRUPO' THEN
        RETURN QUERY
        SELECT id, nombre, tipo::TEXT
        FROM public.grupos
        WHERE id_lider = auth.uid();
    ELSE
        RETURN QUERY
        SELECT NULL::UUID, NULL::TEXT, NULL::TEXT
        WHERE FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign admin to group
CREATE OR REPLACE FUNCTION public.assign_admin_to_group(
    target_usuario_id UUID,
    target_grupo_id UUID,
    asignado_por_uuid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val TEXT;
BEGIN
    -- Check if caller is SUPER_ADMIN
    SELECT rol::TEXT INTO user_role_val
    FROM public.perfiles
    WHERE id = auth.uid();
    
    IF user_role_val != 'SUPER_ADMIN' THEN
        RAISE EXCEPTION 'Only SUPER_ADMIN can assign admins to groups';
    END IF;
    
    -- Update target user role to ADMIN_GRUPO if not already
    UPDATE public.perfiles
    SET rol = 'ADMIN_GRUPO'
    WHERE id = target_usuario_id AND rol != 'SUPER_ADMIN';
    
    -- Check if user already admin of this group
    IF EXISTS (
        SELECT 1 FROM public.admin_grupos 
        WHERE usuario_id = target_usuario_id 
        AND grupo_id = target_grupo_id
    ) THEN
        -- Reactivate if exists
        UPDATE public.admin_grupos
        SET activo = TRUE, fecha_asignacion = NOW(), asignado_por = asignado_por_uuid
        WHERE usuario_id = target_usuario_id AND grupo_id = target_grupo_id;
    ELSE
        -- Create new assignment
        INSERT INTO public.admin_grupos (usuario_id, grupo_id, asignado_por)
        VALUES (target_usuario_id, target_grupo_id, asignado_por_uuid);
    END IF;
    
    -- Check if user has multiple groups
    UPDATE public.perfiles
    SET es_admin_multi_grupo = (
        SELECT COUNT(*) > 1
        FROM public.admin_grupos
        WHERE usuario_id = target_usuario_id AND activo = TRUE
    )
    WHERE id = target_usuario_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove admin from group
CREATE OR REPLACE FUNCTION public.remove_admin_from_group(
    target_usuario_id UUID,
    target_grupo_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val TEXT;
BEGIN
    -- Check if caller is SUPER_ADMIN
    SELECT rol::TEXT INTO user_role_val
    FROM public.perfiles
    WHERE id = auth.uid();
    
    IF user_role_val != 'SUPER_ADMIN' THEN
        RAISE EXCEPTION 'Only SUPER_ADMIN can remove admins from groups';
    END IF;
    
    -- Deactivate assignment
    UPDATE public.admin_grupos
    SET activo = FALSE
    WHERE usuario_id = target_usuario_id AND grupo_id = target_grupo_id;
    
    -- Update multi-group status
    UPDATE public.perfiles
    SET es_admin_multi_grupo = (
        SELECT COUNT(*) > 1
        FROM public.admin_grupos
        WHERE usuario_id = target_usuario_id AND activo = TRUE
    )
    WHERE id = target_usuario_id;
    
    -- If no longer admin of any group, downgrade to VISITANTE
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_grupos 
        WHERE usuario_id = target_usuario_id AND activo = TRUE
    ) THEN
        UPDATE public.perfiles
        SET rol = 'VISITANTE', es_admin_multi_grupo = FALSE
        WHERE id = target_usuario_id AND rol != 'SUPER_ADMIN';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.admin_grupos IS 'Many-to-many relationship between users and groups for group-level administration';
COMMENT ON FUNCTION public.is_admin_of_group IS 'Check if current user is admin of a specific group';
COMMENT ON FUNCTION public.get_manageable_groups IS 'Get all groups the current user can manage based on their role';
COMMENT ON FUNCTION public.assign_admin_to_group IS 'Assign a user as admin of a group (SUPER_ADMIN only)';
COMMENT ON FUNCTION public.remove_admin_from_group IS 'Remove a user as admin of a group (SUPER_ADMIN only)';
