-- Migration: impedir que lideres cambien estado/id_lider/creado_por + limpieza
-- Fecha: 2026-09-25
-- Contexto: `lider_update_own` permite UPDATE de cualquier columna (el WITH CHECK
-- no restringe columnas). Un lider podria auto-aprobarse o reasignar el grupo.
-- El front filtra columnas pero es burlable por consola.

-- Helper reutilizable (bypassa RLS de forma segura)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'SUPER_ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Trigger: solo SUPER_ADMIN toca moderación
CREATE OR REPLACE FUNCTION public.protect_grupos_moderation()
RETURNS TRIGGER AS $$
BEGIN
  IF public.is_super_admin() THEN
    RETURN NEW;
  END IF;
  IF OLD.estado_aprobacion IS DISTINCT FROM NEW.estado_aprobacion
     OR OLD.id_lider IS DISTINCT FROM NEW.id_lider
     OR OLD.creado_por IS DISTINCT FROM NEW.creado_por THEN
    RAISE EXCEPTION 'Solo un administrador puede cambiar el estado o el lider del grupo';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_grupos_moderation ON public.grupos;
CREATE TRIGGER trg_protect_grupos_moderation
  BEFORE UPDATE ON public.grupos
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_grupos_moderation();

-- Limpieza: policy redundante (ya cubierta por super_admin_admin_grupos_all FOR ALL)
DROP POLICY IF EXISTS "super_admin_group_assignments" ON public.admin_grupos;
