import type { APIRoute } from 'astro';
import { fetchApprovedGrupos } from '../../lib/grupos';
import type { Grupo } from '../../data/grupos.types';

export const prerender = false;

export const POST: APIRoute = async ({ request, site }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body JSON malformado' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  try {
    const { query, messages } = body;

    // Historial de chat (con contexto) o pregunta suelta (modo legacy)
    const history = normalizeHistory(messages);
    const currentQuery =
      [...history].reverse().find((m) => m.role === 'user')?.content ||
      (typeof query === 'string' ? query.trim() : '');

    if (!currentQuery) {
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
    const relevantGrupos = findRelevantGrupos(currentQuery, grupos);

    // Término demasiado corto: no llamar al proveedor
    const keywords = extractKeywords(currentQuery);
    if (keywords.length === 0) {
      return new Response(
        JSON.stringify({
          answer: 'Término muy corto, prueba con más detalle',
          query: currentQuery,
          grupos: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Identidad: se responde local, sin depender del proveedor de IA.
    if (isIdentityQuestion(currentQuery)) {
      return new Response(
        JSON.stringify({
          answer: 'Soy **Kala AI**, creada por [nikko.dev](https://nikko.dev). Te ayudo a encontrar semilleros y grupos de investigación de la Facultad de Ingeniería UNAL. ¿Qué te interesa?',
          query: currentQuery,
          grupos: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!groqKey && !openRouterKey) {
      return new Response(
        JSON.stringify(generateFallbackResponse(currentQuery, relevantGrupos)),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const referer = site?.origin || request.headers.get('origin') || 'https://semilleros-fibog.vercel.app';

    const gruposContext = grupos
      .map((g) => {
        const extras = [
          g.modalidad ? `modalidad ${g.modalidad}` : '',
          g.horarios ? `horarios ${g.horarios}` : '',
          g.email ? `contacto ${g.email}` : '',
          g.requisitos ? `requisitos: ${g.requisitos}` : '',
        ].filter(Boolean).join(' · ');
        return `- ${g.nombre} (${g.tipo}): ${g.enfoque || g.descripcion || 'Sin descripción'}${extras ? ` [${extras}]` : ''}`;
      })
      .join('\n');

    const systemPrompt = 'Eres Kala AI, el asistente de la Base de Datos de Semilleros de la Facultad de Ingeniería UNAL Bogotá, creada por nikko.dev. Conversas con naturalidad y libertad: respondes sobre semilleros, grupos de investigación, carreras de ingeniería y vida universitaria, y también puedes charlar de otros temas de forma breve. Cuando la pregunta sea sobre grupos, usa la siguiente lista y menciona nombres exactos. Prioriza los grupos cuyo enfoque y actividades coincidan con lo pedido, no solo los que compartan palabras con la pregunta. Responde en español, de forma clara y sin extenderte demasiado. Si te preguntan quién eres, di que eres Kala AI creada por nikko.dev e incluye este enlace en formato markdown: [nikko.dev](https://nikko.dev).';

    const providerMessages =
      history.length > 0
        ? [
            { role: 'system', content: systemPrompt } as ChatMsg,
            { role: 'system', content: `Catálogo actual de grupos (úsalo cuando pregunten por semilleros o grupos):\n${gruposContext}` } as ChatMsg,
            ...history,
          ]
        : [
            { role: 'system', content: systemPrompt } as ChatMsg,
            { role: 'user', content: `Los siguientes son los grupos disponibles:\n${gruposContext}\n\nPregunta del estudiante: ${currentQuery}` } as ChatMsg,
          ];

    const answer = groqKey
      ? await askGroq(groqKey, groqModel, providerMessages)
      : await askOpenRouter(openRouterKey, openRouterBase, openRouterModel, referer, providerMessages);

    if (!answer) {
      return new Response(
        JSON.stringify(generateFallbackResponse(currentQuery, relevantGrupos)),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        answer,
        query: currentQuery,
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

interface ChatMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Historial del chat: solo user/assistant, acotado en turnos y longitud
// para mantener contexto sin disparar costos ni tokens.
function normalizeHistory(messages: unknown): ChatMsg[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m): m is { role: string; content: string } =>
        !!m &&
        typeof m === 'object' &&
        ((m as { role: unknown }).role === 'user' || (m as { role: unknown }).role === 'assistant') &&
        typeof (m as { content: unknown }).content === 'string'
    )
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.trim().slice(0, 1000) }))
    .filter((m) => m.content.length > 0)
    .slice(-10);
}

async function askGroq(apiKey: string, model: string, providerMessages: ChatMsg[]): Promise<string | null> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: providerMessages,
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

async function askOpenRouter(apiKey: string, baseUrl: string, model: string, referer: string, providerMessages: ChatMsg[]): Promise<string | null> {
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
        messages: providerMessages,
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
  const safeQuery = query.replace(/[<>"'&]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;',
  })[c] || c);
  const answer = relevantGrupos.length > 0
    ? `Encontré ${relevantGrupos.length} grupo(s) relacionado(s) con "${safeQuery}": ${relevantGrupos.map(g => g.nombre).join(', ')}. Explora cada grupo para ver sus detalles, enfoques de investigación y carreras afines.`
    : `No encontré grupos específicos relacionados con "${safeQuery}". Te recomiendo explorar todos los grupos disponibles o intentar con otros términos de búsqueda.`;

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
 * Detecta preguntas sobre la identidad del asistente ("quién eres", etc.)
 * para responderlas de forma determinista sin llamar al proveedor.
 */
function isIdentityQuestion(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return (
    /quien eres/.test(normalized) ||
    /who are you/.test(normalized) ||
    /what are you/.test(normalized) ||
    /como te llamas/.test(normalized) ||
    /(cual es|dime) tu nombre/.test(normalized) ||
    /que modelo eres/.test(normalized) ||
    /cual es tu modelo/.test(normalized) ||
    /quien te (creo|hizo|desarrollo)/.test(normalized) ||
    /que es kala/.test(normalized) ||
    /quien es kala/.test(normalized) ||
    /que eres(?!\s+capaz)/.test(normalized)
  );
}

/**
 * Find relevant grupos based on query keywords
 */
const STOPWORDS = new Set([
  'de', 'la', 'el', 'en', 'y', 'e', 'o', 'u', 'que', 'los', 'las', 'un', 'una',
  'con', 'para', 'por', 'del', 'al', 'se', 'su', 'sus', 'lo', 'le', 'les',
  'es', 'son', 'hay', 'esta', 'este', 'estos', 'estas', 'como', 'cual', 'cuales',
  'quien', 'quienes', 'donde', 'cuando', 'porque', 'muy', 'mas', 'pero', 'sobre',
  'entre', 'hasta', 'desde', 'durante', 'sin', 'otro', 'otra', 'tener', 'tiene',
  'tienen', 'quiero', 'busco', 'buscan', 'necesito', 'dime', 'dame', 'quisiera',
  'algo', 'alguna', 'alguno', 'estan', 'estoy', 'hace', 'hacen',
]);

/** Sinónimos: ia <-> inteligencia artificial */
const SYNONYMS: Record<string, string[]> = {
  ia: ['inteligencia', 'artificial'],
  inteligencia: ['ia'],
  artificial: ['ia'],
};

/** Stemming español mínimo (plurales): semilleros->semillero, grupos->grupo */
function stemEs(w: string): string {
  if (w.length > 4 && w.endsWith('es')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s')) return w.slice(0, -1);
  return w;
}

function normText(s: string | null | undefined): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Coincidencia: substring, salvo tokens de <=2 letras que exigen palabra completa
 *  (para que "ia" no case con "ingeniería"). */
function fieldMatch(haystack: string, needle: string): boolean {
  if (!needle) return false;
  if (needle.length <= 2) {
    const safe = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${safe}\\b`).test(haystack);
  }
  return haystack.includes(needle);
}

function extractKeywords(query: string): string[] {
  return normText(query)
    .split(/\s+/)
    .filter(k => k.length >= 2 && !STOPWORDS.has(k));
}

function findRelevantGrupos(query: string, grupos: Grupo[]) {
  const keywords = extractKeywords(query);

  if (keywords.length === 0) return grupos.slice(0, 3);

  const normQuery = normText(query);
  // Intención de tipo: si preguntan por "semilleros", priorizar Semilleros
  const wantsSemillero = /\bsemillero/.test(normQuery);
  const wantsInvestigacion = /investigacion/.test(normQuery);
  const wantsEstudiantil = /estudiantil/.test(normQuery);

  return grupos
    .map(grupo => {
      let score = 0;
      const nombre = normText(grupo.nombre);
      const enfoque = normText(grupo.enfoque);
      const descripcion = normText(grupo.descripcion);
      const actividades = normText(grupo.actividades);
      const resto = `${normText(grupo.carrera_str)} ${normText(grupo.tipo)} ${normText(grupo.docente)} ${normText(grupo.lider)}`;

      for (const keyword of keywords) {
        const variants = [keyword, stemEs(keyword), ...(SYNONYMS[keyword] || [])];
        const inNombre = variants.some((v) => fieldMatch(nombre, v));
        const inEnfoque = variants.some((v) => fieldMatch(enfoque, v));
        const inDesc = variants.some((v) => fieldMatch(descripcion, v));
        const inAct = variants.some((v) => fieldMatch(actividades, v));
        const inResto = variants.some((v) => fieldMatch(resto, v));
        if (!inNombre && !inEnfoque && !inDesc && !inAct && !inResto) continue;
        score += 1;
        if (inNombre) score += 3;
        if (inEnfoque) score += 2;
        if (inDesc) score += 1;
        if (inAct) score += 1;
      }

      const tipoN = normText(grupo.tipo);
      if (wantsSemillero && tipoN.includes('semillero')) score += 3;
      if (wantsInvestigacion && tipoN.includes('investigacion')) score += 3;
      if (wantsEstudiantil && tipoN.includes('estudiantil')) score += 3;

      return { grupo, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.grupo);
}
