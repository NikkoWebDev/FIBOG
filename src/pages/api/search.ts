import type { APIRoute } from 'astro';
import gruposData from '../../data/grupos.json';

const { data: grupos } = gruposData;

// OpenRouter configuration - read from environment
const getEnv = (key: string): string | undefined => {
  // Astro runtime
  if (typeof import.meta.env !== 'undefined') {
    return import.meta.env[key];
  }
  // Node runtime
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const OPENROUTER_API_KEY = getEnv('OPENROUTER_API_KEY');
const OPENROUTER_BASE_URL = getEnv('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = getEnv('OPENROUTER_MODEL') || 'liquid/lfm-2.5-1.2b-instruct:free';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if API key is configured
    if (!OPENROUTER_API_KEY) {
      // Fallback: return mock response based on keyword matching
      return new Response(
        JSON.stringify(generateFallbackResponse(query)),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare context from grupos data
    const gruposContext = grupos.slice(0, 10).map(g => ({
      nombre: g.nombre,
      tipo: g.tipo,
      carreras: g.carreras,
      enfoque: g.enfoque.slice(0, 100),
      descripcion: g.descripcion.slice(0, 150)
    }));

    // System prompt for the AI
    const systemPrompt = `Eres un asistente experto en grupos de investigación, semilleros y comunidades estudiantiles de la Facultad de Ingeniería de la Universidad Nacional de Colombia (UNAL).

Tu objetivo es ayudar a estudiantes a encontrar grupos de investigación relevantes para sus intereses académicos y profesionales.

Contexto de grupos disponibles:
${JSON.stringify(gruposContext, null, 2)}

Instrucciones:
1. Analiza la pregunta del estudiante y recomienda grupos relevantes
2. Explica por qué esos grupos son adecuados para sus intereses
3. Proporciona información práctica: tipo de grupo, carreras afines, requisitos si los hay
4. Mantén un tono profesional pero cercano, inspirador e informativo
5. Si no hay grupos específicos para el área, sugiere alternativas relacionadas
6. Debes dejar una recomendacion muy humana que conecte con el estudiante, motivándolo a explorar y participar en la comunidad de investigación de la UNAL.
7. Nunca des respuestas vagas o genéricas. Si no tienes información suficiente, sé honesto y sugiere cómo el estudiante puede obtener más información (contactar a la facultad, revisar la página web, etc.)
8. No puedes dar informacion sobre otros temas, solo sobre los grupos de investigación, semilleros y comunidades estudiantiles de la Facultad de Ingeniería de la UNAL.

Responde en español de forma concisa pero completa.`;

    // Call OpenRouter API
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ingenieria-dinamica.unal.edu.co',
        'X-Title': 'Ingeniería Dinámica - Semilleros UNAL'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);
      
      // Fallback response
      return new Response(
        JSON.stringify(generateFallbackResponse(query)),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const answer = aiResponse.choices?.[0]?.message?.content || '';

    // Find relevant grupos based on the query
    const relevantGrupos = findRelevantGrupos(query);

    return new Response(
      JSON.stringify({
        answer,
        grupos: relevantGrupos.map(g => ({
          id: g.id,
          nombre: g.nombre,
          tipo: g.tipo,
          carreras: g.carreras
        })),
        query
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search API error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        ...generateFallbackResponse(''),
        isError: true
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Find relevant grupos based on query keywords
 */
function findRelevantGrupos(query: string) {
  const keywords = query.toLowerCase().split(/\s+/);
  
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
          if (grupo.nombre.toLowerCase().includes(keyword)) score += 2;
          if (grupo.enfoque.toLowerCase().includes(keyword)) score += 1.5;
        }
      });
      
      return { grupo, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.grupo);
}

/**
 * Generate fallback response when AI is unavailable
 */
function generateFallbackResponse(query: string) {
  const relevantGrupos = findRelevantGrupos(query || 'investigación');
  
  if (relevantGrupos.length === 0) {
    return {
      answer: `No encontré grupos específicos relacionados con "${query}". Te recomiendo explorar todos los grupos disponibles o contactar directamente con la Facultad de Ingeniería para más información.`,
      grupos: grupos.slice(0, 3).map(g => ({
        id: g.id,
        nombre: g.nombre,
        tipo: g.tipo,
        carreras: g.carreras
      })),
      fallback: true
    };
  }
  
  const grupoNames = relevantGrupos.map(g => g.nombre).join(', ');
  
  return {
    answer: `Basándome en tu interés en "${query}", te recomiendo explorar estos grupos: ${grupoNames}. Estos grupos trabajan en áreas relacionadas y podrían ser de tu interés según sus enfoques de investigación y las carreras afines.`,
    grupos: relevantGrupos.map(g => ({
      id: g.id,
      nombre: g.nombre,
      tipo: g.tipo,
      carreras: g.carreras
    })),
    fallback: true
  };
}
