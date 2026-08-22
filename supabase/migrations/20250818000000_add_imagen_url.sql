-- Imagen opcional para solicitudes de grupos y grupos aprobados
ALTER TABLE public.solicitudes_pendientes ADD COLUMN IF NOT EXISTS imagen_url TEXT;
ALTER TABLE public.grupos ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Bucket publico para imagenes de grupos
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagenes-grupos', 'imagenes-grupos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_imagenes_grupos" ON storage.objects;
CREATE POLICY "public_read_imagenes_grupos"
ON storage.objects FOR SELECT
USING (bucket_id = 'imagenes-grupos');

DROP POLICY IF EXISTS "anon_upload_imagenes_grupos" ON storage.objects;
CREATE POLICY "anon_upload_imagenes_grupos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'imagenes-grupos');
