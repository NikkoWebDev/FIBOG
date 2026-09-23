import type { APIRoute } from 'astro';
import { fetchApprovedGrupos } from '../../lib/grupos';
import type { Grupo } from '../../data/grupos.types';

export const prerender = false;

export const POST: APIRoute = async ({ request, site }) => {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const grupos = await fetchApprovedGrupos();

    // Proveedor IA: Groq primero, OpenRouter como alternativa legacy.
    const groqKey = import.meta.env.GROQ_API_KEY;
    const groqModel = import.meta.env.GROQ_MODEL || 'openai/gpt-oss-20b';
    const openRouterKey = import.meta.env.OPENROUTER_API_KEY;
    const openRouterBase = import.meta.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    const openRouterModel = import.meta.env.OPENROUTER_MODEL || 'liquid/lfm-2.5-1.2b-instruct:free';

    // Always compute keyword matches so we can enrich the response or fall back
    const relevantGrupos = findRelevantGrupos(query, grupos);

    if (!groqKey && !openRouterKey) {
      return new Response(
        JSON.stringify(generateFallbackResponse(query, relevantGrupos)),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const referer = site?.origin || request.headers.get('origin') || 'https://semilleros-fibog.vercel.app';

    const gruposContext = grupos
      .map(g => `- ${g.nombre} (${g.tipo}): ${g.enfoque || g.descripcion || 'Sin descripción'}`)
      .join('\n');

    const systemPrompt = 'Eres un asistente que ayuda a estudiantes a encontrar semilleros de investigación en la Facultad de Ingeniería UNAL Bogotá. Responde de forma breve y útil en español. Menciona nombres exactos de grupos de la lista cuando sean relevantes.';

    const userContent = `Los siguientes son los grupos disponibles:\n${gruposContext}\n\nPregunta del estudiante: ${query}`;

    const answer = groqKey
      ? await askGroq(groqKey, groqModel, systemPrompt, userContent)
      : await askOpenRouter(openRouterKey, openRouterBase, openRouterModel, referer, systemPrompt, userContent);

    if (!answer) {
      return new Response(
        JSON.stringify(generateFallbackResponse(query, relevantGrupos)),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        answer,
        query,
        grupos: relevantGrupos.map(g => ({
          id: g.id,
          nombre: g.nombre,
          tipo: g.tipo,
          carreras: g.carreras
        }))
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        answer: 'Ocurrió un error al buscar. Intenta de nuevo.',
        query: '',
        grupos: [],
        fallback: true
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

async function askGroq(apiKey: string, model: string, system: string, user: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, (await response.text()).slice(0, 300));
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Groq request failed:', error);
    return null;
  }
}

async function askOpenRouter(apiKey: string, baseUrl: string, model: string, referer: string, system: string, user: string): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': referer,
        'X-Title': 'Base de Datos Ingenieria',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status, (await response.text()).slice(0, 300));
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('OpenRouter request failed:', error);
    return null;
  }
}

function generateFallbackResponse(query: string, relevantGrupos: Grupo[]) {
  const answer = relevantGrupos.length > 0
    ? `Encontré ${relevantGrupos.length} grupo(s) relacionado(s) con "${query}": ${relevantGrupos.map(g => g.nombre).join(', ')}. Explora cada grupo para ver sus detalles, enfoques de investigación y carreras afines.`
    : `No encontré grupos específicos relacionados con "${query}". Te recomiendo explorar todos los grupos disponibles o intentar con otros términos de búsqueda.`;

  return {
    answer,
    query,
    fallback: true,
    grupos: relevantGrupos.map(g => ({
      id: g.id,
      nombre: g.nombre,
      tipo: g.tipo,
      carreras: g.carreras
    }))
  };
}

/**
 * Find relevant grupos based on query keywords
 */
function findRelevantGrupos(query: string, grupos: Grupo[]) {
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);

  if (keywords.length === 0) return grupos.slice(0, 3);

  return grupos
    .map(grupo => {
      let score = 0;
      const nombre = (grupo.nombre || '').toLowerCase();
      const enfoque = (grupo.enfoque || '').toLowerCase();
      const descripcion = (grupo.descripcion || '').toLowerCase();
      const searchable = `${nombre} ${enfoque} ${descripcion} ${(grupo.carrera_str || '').toLowerCase()} ${(grupo.tipo || '').toLowerCase()}`;

      for (const keyword of keywords) {
        if (!searchable.includes(keyword)) continue;
        score += 1;
        if (nombre.includes(keyword)) score += 3;
        if (enfoque.includes(keyword)) score += 2;
        if (descripcion.includes(keyword)) score += 1;
      }

      return { grupo, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.grupo);
}
