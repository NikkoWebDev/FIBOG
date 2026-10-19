import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Sitemap serverless: se genera en runtime con el catalogo vivo de Supabase.
// No se usa @astrojs/sitemap para evitar dependencias nuevas.
export const prerender = false;

const SITE_URL = 'https://semilleros.nikko.dev';

interface SitemapGrupoRow {
  id: string;
  nombre: string;
  fecha_actualizacion: string | null;
  fecha_creacion: string | null;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoDate(value: string | null | undefined, fallback: string): string {
  const ts = value || fallback;
  const date = new Date(ts);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function urlEntry(loc: string, lastmod: string): string {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    '    <changefreq>weekly</changefreq>',
    '    <priority>0.7</priority>',
    '  </url>',
  ].join('\n');
}

function buildXml(entries: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].join('\n');
}

async function fetchGruposForSitemap(): Promise<SitemapGrupoRow[] | null> {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client
    .from('grupos')
    .select('id,nombre,fecha_actualizacion,fecha_creacion')
    .eq('estado_aprobacion', 'aprobado')
    .order('nombre');

  if (error) {
    console.error('sitemap.xml: fetch de grupos fallo:', error.message);
    return null;
  }

  return (data ?? []) as SitemapGrupoRow[];
}

export const HEAD: APIRoute = () =>
  new Response(null, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });

export const GET: APIRoute = async () => {
  const now = new Date().toISOString();

  const staticEntries = [
    { loc: `${SITE_URL}/`, lastmod: now },
    { loc: `${SITE_URL}/registro`, lastmod: now },
    { loc: `${SITE_URL}/privacidad`, lastmod: now },
  ].map(({ loc, lastmod }) => urlEntry(loc, lastmod));

  const grupos = await fetchGruposForSitemap();

  // Fallback: si la DB falla, el sitemap sigue sirviendo las paginas estaticas.
  const grupoEntries = (grupos ?? []).map((grupo) =>
    urlEntry(
      `${SITE_URL}/grupo/${encodeURIComponent(grupo.id)}`,
      isoDate(grupo.fecha_actualizacion, isoDate(grupo.fecha_creacion, now)),
    ),
  );

  return new Response(buildXml([...staticEntries, ...grupoEntries]), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
