import type { APIRoute } from 'astro';

export const prerender = false;

const HOST = 'semilleros.nikko.dev';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
// Fallback: la key vive también en public/<key>.txt (address file estándar IndexNow).
const FALLBACK_KEY = 'bf8b82d1f049e5951416121ab06543bd3cbbb53603ca8e36a43b55479b80dd7b';

const getKey = (): string => import.meta.env.PUBLIC_INDEXNOW_KEY ?? FALLBACK_KEY;

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Reenvía las URLs (solo mismo dominio) a api.indexnow.org. IndexNow responde
// 200/202 al aceptar; devolvemos 202 si el upstream aceptó, 502 si falló.
const forward = async (urlList: string[]): Promise<Response> => {
  const key = getKey();
  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key,
      keyLocation: `https://${HOST}/${key}.txt`,
      urlList,
    }),
  });
  return json({ upstream: res.status, count: urlList.length }, res.ok || res.status === 202 ? 202 : 502);
};

const sanitize = (urls: string[]): string[] =>
  urls.filter((u): u is string => typeof u === 'string' && u.startsWith(`https://${HOST}/`));

// POST /api/indexnow — body { key?, urlList: string[] }
export const POST: APIRoute = async ({ request }) => {
  let body: { key?: string; urlList?: string[] };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body JSON malformado' }, 400);
  }

  if (body.key !== undefined && body.key !== getKey()) {
    return json({ error: 'Key inválida' }, 400);
  }

  const urlList = sanitize(body.urlList ?? []);
  if (urlList.length === 0) {
    return json({ error: 'urlList vacío o fuera de dominio' }, 400);
  }

  return forward(urlList);
};

// GET /api/indexnow?key=<key>&urlList=<u1,u2> — ping rápido por querystring.
export const GET: APIRoute = async ({ url: pageUrl }) => {
  if (pageUrl.searchParams.get('key') !== getKey()) {
    return json({ error: 'Key inválida' }, 400);
  }

  const urlList = sanitize((pageUrl.searchParams.get('urlList') ?? '').split(','));
  if (urlList.length === 0) {
    return json({ error: 'urlList vacío o fuera de dominio' }, 400);
  }

  return forward(urlList);
};
