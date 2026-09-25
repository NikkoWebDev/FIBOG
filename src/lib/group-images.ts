import { supabase } from './supabase';

const BUCKET = 'imagenes-grupos';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

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

/**
 * Valida un archivo antes de subirlo. Devuelve el mensaje de error
 * o null si es válido. Acepta extensión conocida cuando el navegador
 * no reporta MIME (algunos Android/HEIC reportan type vacío).
 */
export function validateImageFile(file: File): string | null {
  const nameExt = (file.name.split('.').pop() || '').toLowerCase();
  const mimeOk = ALLOWED.has(file.type);
  if (!mimeOk) {
    if (!file.type && ALLOWED_EXT.has(nameExt)) {
      // type vacío pero extensión de imagen conocida: se valida por tamaño
    } else {
      return 'Formato no soportado. Use JPG, PNG, WEBP o GIF.';
    }
  }
  if (file.size > MAX_BYTES) {
    return 'La imagen supera el máximo de 5 MB.';
  }
  if (file.size === 0) {
    return 'El archivo está vacío.';
  }
  return null;
}

export async function uploadGroupImage(file: File, nombreGrupo: string): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const ext = EXT_BY_MIME[file.type] || (ALLOWED_EXT.has((file.name.split('.').pop() || '').toLowerCase()) ? (file.name.split('.').pop() || 'jpg').toLowerCase() : 'jpg');
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${slugify(nombreGrupo)}-${Date.now()}-${rand}.${ext}`;

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
