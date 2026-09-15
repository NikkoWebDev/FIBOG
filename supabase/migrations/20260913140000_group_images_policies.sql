-- Permitir reemplazo/borrado de imagenes por usuarios autenticados (admin/lider)
DROP POLICY IF EXISTS "auth_update_imagenes_grupos" ON storage.objects;
CREATE POLICY "auth_update_imagenes_grupos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'imagenes-grupos')
WITH CHECK (bucket_id = 'imagenes-grupos');

DROP POLICY IF EXISTS "auth_delete_imagenes_grupos" ON storage.objects;
CREATE POLICY "auth_delete_imagenes_grupos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'imagenes-grupos');
