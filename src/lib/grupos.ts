import { createServerClient, supabase } from './supabase.ts';
import type { Database } from './database.types';
import { canonicalizeCarrera, norm } from '../data/grupos.types.ts';
import type { Grupo, Metadata } from '../data/grupos.types';
import localGruposData from '../data/grupos.json';

export type DbGrupo = Database['public']['Tables']['grupos']['Row'];
type CatalogGrupo = Pick<DbGrupo,
  | 'id' | 'tipo' | 'carreras' | 'nombre' | 'docente_a_cargo'
  | 'lider_o_representante' | 'email_contacto' | 'vinculacion' | 'enfoque'
  | 'descripcion' | 'actividades' | 'modalidad' | 'horarios_habituales'
  | 'requisitos_ingreso' | 'nivel_academico_recomendado' | 'redes_sociales'
  | 'comentarios_adicionales' | 'imagen_url'
>;

function text(value: string | null | undefined): string {
  return (value || '').trim();
}

/** Calculates completeness score to pick the most informative duplicate record. */
function getCompletenessScore(group: Grupo): number {
  let score = 0;
  for (const value of Object.values(group)) {
    if (typeof value === 'string') {
      score += value.trim().length;
    } else if (Array.isArray(value)) {
      score += value.length * 10;
    }
  }
  return score;
}

/** Defensive deduplication by canonical name (norm(nombre)). */
export function deduplicateGruposByCanonicalName(grupos: Grupo[]): Grupo[] {
  const map = new Map<string, Grupo>();

  for (const grupo of grupos) {
    const key = norm(grupo.nombre).trim();
    if (!key) {
      map.set(grupo.id, grupo);
      continue;
    }

    const existing = map.get(key);
    if (!existing) {
      map.set(key, grupo);
    } else if (getCompletenessScore(grupo) > getCompletenessScore(existing)) {
      map.set(key, grupo);
    }
  }

  return Array.from(map.values());
}

/** Local JSON fallback loader ensuring zero-downtime resilience without 'any'. */
function getLocalGrupos(): Grupo[] {
  const rawList = (localGruposData as { data?: unknown[] }).data;
  if (!Array.isArray(rawList)) return [];

  const list = (rawList as Grupo[]).map((g) => {
    const carreras = Array.isArray(g.carreras)
      ? Array.from(new Set(g.carreras.flatMap((c) => canonicalizeCarrera(c))))
      : [];
    return {
      ...g,
      carreras,
      carrera_str: carreras.join(', '),
    };
  });

  return deduplicateGruposByCanonicalName(list);
}

function getLocalCatalogFallback(reason?: string): { grupos: Grupo[]; metadata: Metadata; error: string | null } {
  console.warn(`[grupos] Using local grupos.json fallback. Reason: ${reason || 'unknown'}`);
  const grupos = getLocalGrupos();
  const rawMeta = (localGruposData as { metadata?: Partial<Metadata> }).metadata;
  const builtMeta = buildMetadata(grupos);
  return {
    grupos,
    metadata: {
      ...builtMeta,
      actualizado: rawMeta?.actualizado || new Date().toISOString(),
    },
    error: null,
  };
}

function getLocalGrupoByIdFallback(id: string): Grupo | null {
  const grupos = getLocalGrupos();
  const directMatch = grupos.find((g) => g.id === id);
  if (directMatch) return directMatch;

  const rawList = (localGruposData as { data?: unknown[] }).data;
  if (Array.isArray(rawList)) {
    const rawGroup = (rawList as Grupo[]).find((g) => g.id === id);
    if (rawGroup) {
      const canonicalKey = norm(rawGroup.nombre).trim();
      return grupos.find((g) => norm(g.nombre).trim() === canonicalKey) || null;
    }
  }
  return null;
}

/** Mapea fila de Supabase al shape publico que usan cards/detalle/filtros. */
export function mapDbGrupoToPublic(row: CatalogGrupo | null | undefined): Grupo {
  const source: Partial<CatalogGrupo> = row ?? {};
  const raw = Array.isArray(source.carreras) ? source.carreras : [];
  // Limpieza read-side: cada miembro crudo se canoniza y se deduplica el resultado.
  const carreras = Array.from(new Set(
    raw
      .filter((c): c is string => typeof c === 'string')
      .flatMap(c => canonicalizeCarrera(c))
  ));

  return {
    id: source.id ?? '',
    tipo: (source.tipo as Grupo['tipo']) || 'Desconocido',
    carreras,
    carrera_str: carreras.join(', '),
    nombre: text(source.nombre),
    docente: text(source.docente_a_cargo),
    lider: text(source.lider_o_representante),
    email: text(source.email_contacto),
    vinculacion: text(source.vinculacion),
    enfoque: text(source.enfoque),
    descripcion: text(source.descripcion),
    actividades: text(source.actividades),
    modalidad: text(source.modalidad),
    horarios: text(source.horarios_habituales),
    requisitos: text(source.requisitos_ingreso),
    nivel_academico: text(source.nivel_academico_recomendado),
    redes: text(source.redes_sociales),
    comentarios: text(source.comentarios_adicionales),
    imagen_url: text(source.imagen_url) || undefined,
  };
}

export function buildMetadata(grupos: Grupo[]): Metadata {
  const uniqueGrupos = deduplicateGruposByCanonicalName(grupos);
  const por_tipo: Record<string, number> = {};
  const carrerasSet = new Set<string>();

  for (const g of uniqueGrupos) {
    por_tipo[g.tipo] = (por_tipo[g.tipo] || 0) + 1;
    // metadata.carreras siempre sale del catálogo canónico, nunca del crudo.
    for (const c of g.carreras || []) {
      for (const canon of canonicalizeCarrera(c)) carrerasSet.add(canon);
    }
  }

  return {
    total: uniqueGrupos.length,
    por_tipo,
    carreras: Array.from(carrerasSet).sort(),
    actualizado: new Date().toISOString(),
  };
}

function serverClient() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createServerClient(url, key);
}

/** Grupos aprobados para el catalogo publico. */
export async function fetchApprovedGrupos(): Promise<Grupo[]> {
  const { grupos } = await fetchApprovedCatalog();
  return grupos;
}

/** Catalogo + fecha real de ultima edicion en DB con fallback resiliente. */
export async function fetchApprovedCatalog(): Promise<{ grupos: Grupo[]; metadata: Metadata; error: string | null }> {
  try {
    const client = serverClient() || supabase;
    const { data, error } = await client
      .from('grupos')
      .select('id,tipo,carreras,nombre,docente_a_cargo,lider_o_representante,email_contacto,vinculacion,enfoque,descripcion,actividades,modalidad,horarios_habituales,requisitos_ingreso,nivel_academico_recomendado,redes_sociales,comentarios_adicionales,imagen_url,fecha_actualizacion,fecha_creacion')
      .eq('estado_aprobacion', 'aprobado')
      .order('nombre');

    if (error) {
      console.error('fetchApprovedCatalog Supabase error:', error.message);
      return getLocalCatalogFallback(error.message);
    }

    const rows = data || [];
    if (rows.length === 0) {
      return getLocalCatalogFallback('Database returned empty catalogue');
    }

    let latest = '';
    for (const row of rows) {
      const ts = row.fecha_actualizacion || row.fecha_creacion || '';
      if (ts > latest) latest = ts;
    }

    const mappedGrupos = rows.map(mapDbGrupoToPublic);
    const grupos = deduplicateGruposByCanonicalName(mappedGrupos);
    return {
      grupos,
      metadata: {
        ...buildMetadata(grupos),
        actualizado: latest || new Date().toISOString(),
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('fetchApprovedCatalog exception:', message);
    return getLocalCatalogFallback(message);
  }
}

export async function fetchApprovedGrupoById(id: string): Promise<Grupo | null> {
  try {
    const client = serverClient() || supabase;
    const { data, error } = await client
      .from('grupos')
      .select('id,tipo,carreras,nombre,docente_a_cargo,lider_o_representante,email_contacto,vinculacion,enfoque,descripcion,actividades,modalidad,horarios_habituales,requisitos_ingreso,nivel_academico_recomendado,redes_sociales,comentarios_adicionales,imagen_url,fecha_actualizacion,fecha_creacion')
      .eq('id', id)
      .eq('estado_aprobacion', 'aprobado')
      .maybeSingle();

    if (error) {
      console.error('fetchApprovedGrupoById error:', error.message);
      return getLocalGrupoByIdFallback(id);
    }

    if (data) {
      return mapDbGrupoToPublic(data);
    }

    return getLocalGrupoByIdFallback(id);
  } catch (err: unknown) {
    console.error('fetchApprovedGrupoById exception:', err);
    return getLocalGrupoByIdFallback(id);
  }
}
