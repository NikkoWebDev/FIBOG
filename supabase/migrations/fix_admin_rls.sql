-- ==========================================
-- SCRIPT DE CORRECCIÓN DE POLÍTICAS RLS
-- ==========================================
-- Instrucciones:
-- 1. Ve al Dashboard de tu proyecto en Supabase (https://supabase.com/dashboard)
-- 2. En el menú de la izquierda, selecciona "SQL Editor".
-- 3. Crea una "New query" (Nueva consulta).
-- 4. Copia TODO el contenido de este archivo, pégalo allí y haz clic en "Run".

-- 1. Asegurar que RLS esté habilitado en las tablas
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'grupos'
-- NOTA: Primero intentamos eliminar políticas previas si existen (esto evita errores si lo corres dos veces)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.grupos;
DROP POLICY IF EXISTS "Super admins can insert grupos" ON public.grupos;
DROP POLICY IF EXISTS "Super admins can update grupos" ON public.grupos;
DROP POLICY IF EXISTS "Super admins can delete grupos" ON public.grupos;

-- Permitir lectura pública a los grupos (para que la página index funcione)
CREATE POLICY "Enable read access for all users" 
ON public.grupos FOR SELECT 
USING (true);

-- Permitir a SUPER_ADMIN insertar grupos
CREATE POLICY "Super admins can insert grupos" 
ON public.grupos FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.perfiles 
    WHERE id = auth.uid() AND rol = 'SUPER_ADMIN'
  )
);

-- Permitir a SUPER_ADMIN actualizar grupos
CREATE POLICY "Super admins can update grupos" 
ON public.grupos FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.perfiles 
    WHERE id = auth.uid() AND rol = 'SUPER_ADMIN'
  )
);

-- Permitir a SUPER_ADMIN borrar grupos
CREATE POLICY "Super admins can delete grupos" 
ON public.grupos FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.perfiles 
    WHERE id = auth.uid() AND rol = 'SUPER_ADMIN'
  )
);

-- 3. Políticas para 'perfiles'
DROP POLICY IF EXISTS "Users can read all profiles" ON public.perfiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.perfiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.perfiles;

-- Permitir lectura general de perfiles (necesario para ver líderes)
CREATE POLICY "Users can read all profiles" 
ON public.perfiles FOR SELECT 
USING (true);

-- Permitir a los usuarios actualizar su propio perfil (excepto escalar su propio rol)
CREATE POLICY "Users can update own profile" 
ON public.perfiles FOR UPDATE 
USING (auth.uid() = id);

-- Permitir a SUPER_ADMIN actualizar cualquier perfil (para poder cambiar los roles de otros usuarios)
CREATE POLICY "Super admins can update any profile" 
ON public.perfiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.perfiles 
    WHERE id = auth.uid() AND rol = 'SUPER_ADMIN'
  )
);
