/**
 * Normaliza un enlace web/red social a una URL https válida.
 * Devuelve null si está vacío o no es una URL utilizable
 * (texto libre tipo "Instagram", "Página web", "Whatsapp: 321...").
 */
export function normalizeUrl(value: unknown): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (/\s/.test(raw)) return null;
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname.includes('.')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isHttpUrl(value: unknown): boolean {
  return normalizeUrl(value) !== null;
}
