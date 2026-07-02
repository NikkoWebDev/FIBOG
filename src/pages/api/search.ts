import type { APIRoute } from 'astro';
import gruposData from '../../data/grupos.json';

const { data: grupos } = gruposData;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Always use keyword matching (reliable fallback)
    const relevantGrupos = findRelevantGrupos(query);
    
    const answer = relevantGrupos.length > 0
      ? `Encontré ${relevantGrupos.length} grupo(s) relacionado(s) con "${query}": ${relevantGrupos.map(g => g.nombre).join(', ')}. Explora cada grupo para ver sus detalles, enfoques de investigación y carreras afines.`
      : `No encontré grupos específicos relacionados con "${query}". Te recomiendo explorar todos los grupos disponibles o intentar con otros términos de búsqueda.`;

    return new Response(
      JSON.stringify({
        answer,
        grupos: relevantGrupos.map(g => ({
          id: g.id,
          nombre: g.nombre,
          tipo: g.tipo,
          carreras: g.carreras
        })),
        query,
        fallback: true
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search API error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        answer: 'Ocurrió un error al buscar. Intenta de nuevo.',
        grupos: [],
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
