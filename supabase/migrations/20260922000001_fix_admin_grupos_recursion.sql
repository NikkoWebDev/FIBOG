-- Migration: eliminar recursion infinita en RLS de admin_grupos
-- Fecha: 2026-09-22
-- Contexto: la policy `lider_view_group_admins` (creada en la migracion
-- 20260922000000) consulta a `admin_grupos` dentro de su propia definicion
-- (EXISTS sobre admin_grupos para evaluar acceso a admin_grupos).
-- Postgres aplica RLS de forma recursiva y eso genera
-- "infinite recursion detected in policy": CUALQUIER select sobre
-- admin_grupos falla, y como `lider_select_own` / `lider_update_own` de
-- `grupos` dependen de esa tabla, los lideres dejan de ver su grupo
-- ("No tienes un grupo asignado" en /lider).
--
-- Fix: eliminar la policy autorreferenciada. Los lideres siguen viendo sus
-- propias asignaciones via `users_view_own_admin_assignments`; el listado
-- de co-admins solo lo usa /admin como SUPER_ADMIN (acceso total).

DROP POLICY IF EXISTS "lider_view_group_admins" ON public.admin_grupos;
DROP POLICY IF EXISTS "admin_grupo_view_group_admins" ON public.admin_grupos;
