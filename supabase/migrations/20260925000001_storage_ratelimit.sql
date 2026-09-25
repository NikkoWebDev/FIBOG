-- Migration: storage server-side + rate limits para /api/notify
-- Fecha: 2026-09-25

-- Parte A: endurecer subida anonima al bucket imagenes-grupos en servidor:
-- el front ya valida pero es burlable por consola.
DROP POLICY IF EXISTS "anon_upload_imagenes_grupos" ON storage.objects;
CREATE POLICY "anon_upload_imagenes_grupos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'imagenes-grupos'
  AND (metadata ->> 'mimetype') IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')
  AND COALESCE((metadata ->> 'size')::bigint, 0) <= 5242880
);

-- Parte B: ventanas de rate-limit, solo service_role la usa desde /api/notify.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Sin policies de lectura/escritura para anon/authenticated: por defecto deniega.
-- Solo service_role (bypassa RLS) la usa.
