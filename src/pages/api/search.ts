import type { APIRoute } from 'astro';
import gruposData from '../../data/grupos.json';

export const prerender = false;

const { data: grupos } = gruposData;

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

    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    const baseUrl = import.meta.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    const model = import.meta.env.OPENROUTER_MODEL || 'liquid/lfm-2.5-1.2b-instruct:free';

    // Always compute keyword matches so we can enrich the response or fall back
    const relevantGrupos = findRelevantGrupos(query);

    if (!apiKey) {
      return new Response(
        JSON.stringify(generateFallbackResponse(query, relevantGrupos)),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const referer = site?.origin || request.headers.get('origin') || 'https://semilleros-fibog.vercel.app';

    const gruposContext = grupos
      .map(g => `- ${g.nombre} (${g.tipo}): ${g.enfoque || g.descripcion || 'Sin descripción'}`)
      .join('\n');

    const systemPrompt = 'Eres un asistente que ayuda a estudiantes a encontrar semilleros de investigación en la Facultad de Ingeniería UNAL Bogotá. Responde de forma breve y útil en español.';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': referer,
        'X-OpenRouter-Title': 'Semilleros FIBOG',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Los siguientes son los grupos disponibles:\n${gruposContext}\n\nPregunta del estudiante: ${query}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status, await response.text());
      return new Response(
        JSON.stringify(generateFallbackResponse(query, relevantGrupos)),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const answer = aiData.choices?.[0]?.message?.content?.trim();

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

function generateFallbackResponse(query: string, relevantGrupos: typeof grupos) {
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
function findRelevantGrupos(query: string) {
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);

  if (keywords.length === 0) return grupos.slice(0, 3);

  return grupos
    .map(grupo => {
      let score = 0;
      const searchable = [
        grupo.nombre,
        grupo.enfoque,
        grupo.descripcion,
        grupo.carrera_str,
        grupo.tipo
      ].join(' ').toLowerCase();

      keywords.forEach(keyword => {
        if (searchable.includes(keyword)) {
          score += 1;
          // Extra points for title matches
          if (grupo.nombre.toLowerCase().includes(keyword)) score += 3;
          if (grupo.enfoque.toLowerCase().includes(keyword)) score += 2;
          if (grupo.descripcion.toLowerCase().includes(keyword)) score += 1;
        }
      });

      return { grupo, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.grupo);
}
