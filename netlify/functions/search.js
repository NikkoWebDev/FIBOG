// Netlify Function for AI Search
const gruposData = require('../../src/data/grupos.json');

const { data: grupos } = gruposData;

// OpenRouter configuration from environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'liquid/lfm-2.5-1.2b-instruct:free';

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ error: 'Query is required' }),
      };
    }

    // If no API key, return fallback response
    if (!OPENROUTER_API_KEY) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify(generateFallbackResponse(query)),
      };
    }

    // Create context from grupos data
    const gruposContext = grupos.slice(0, 20).map(g => 
      `- ${g.nombre} (${g.tipo}): ${g.enfoque || 'Sin descripción'}`
    ).join('\n');

    const systemPrompt = `Eres un asistente experto en grupos de investigación, semilleros y comunidades estudiantiles de la Facultad de Ingeniería de la Universidad Nacional de Colombia.

DATOS DISPONIBLES:
${gruposContext}

INSTRUCCIONES:
- Responde en español
- Sé conciso y directo
- Si encuentras grupos relevantes, menciónalos
- Si no hay coincidencias claras, sugiere alternativas relacionadas`;

    // Call OpenRouter API
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://fibog.netlify.app',
        'X-Title': 'FIBOG UNAL',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const aiData = await response.json();
    const answer = aiData.choices?.[0]?.message?.content || '';

    // Find matching grupos based on keywords
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 3);
    const matchingGrupos = grupos.filter(g => {
      const text = `${g.nombre} ${g.enfoque} ${g.descripcion}`.toLowerCase();
      return keywords.some(kw => text.includes(kw));
    }).slice(0, 5);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        answer,
        grupos: matchingGrupos.map(g => ({ id: g.id, nombre: g.nombre, tipo: g.tipo })),
        isAI: true,
      }),
    };

  } catch (error) {
    console.error('Search error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        ...generateFallbackResponse(''),
        isError: true,
      }),
    };
  }
};

function generateFallbackResponse(query) {
  const searchLower = query.toLowerCase();
  
  // Simple keyword matching
  const matches = grupos.filter(g => {
    const text = `${g.nombre} ${g.enfoque} ${g.carrera_str}`.toLowerCase();
    return searchLower.split(/\s+/).filter(k => k.length > 3).some(k => text.includes(k));
  }).slice(0, 5);

  if (matches.length > 0) {
    return {
      answer: `Encontré ${matches.length} grupo(s) relacionado(s) con tu búsqueda. Estos son los más relevantes:`,
      grupos: matches.map(g => ({ id: g.id, nombre: g.nombre, tipo: g.tipo })),
      isFallback: true,
    };
  }

  // Return some featured grupos
  const featured = grupos.slice(0, 5);
  return {
    answer: 'Estos son algunos grupos destacados de la Facultad de Ingeniería:',
    grupos: featured.map(g => ({ id: g.id, nombre: g.nombre, tipo: g.tipo })),
    isFallback: true,
  };
}
