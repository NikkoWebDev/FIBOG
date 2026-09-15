import { supabase } from './supabase';

const BUCKET = 'imagenes-grupos';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function slugify(value: string): string {
  return String(value || 'grupo')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'grupo';
}

export function extractStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length).split('?')[0]);
}

export async function uploadGroupImage(file: File, nombreGrupo: string): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new Error('Formato no soportado. Use JPG, PNG, WEBP o GIF.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('La imagen supera el maximo de 5 MB.');
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${slugify(nombreGrupo)}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
    cacheControl: '3600',
  });
  if (error) throw new Error('No se pudo subir la imagen: ' + error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeGroupImage(publicUrl: string | null | undefined): Promise<void> {
  const path = extractStoragePath(publicUrl);
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    // No tumbar el flujo si el archivo ya no existe
    console.warn('removeGroupImage:', error.message);
  }
}
