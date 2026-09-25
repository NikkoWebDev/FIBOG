import { createServerClient, supabase } from './supabase';
import type { Database } from './database.types';
import type { Grupo, Metadata } from '../data/grupos.types';

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

/** Mapea fila de Supabase al shape publico que usan cards/detalle/filtros. */
export function mapDbGrupoToPublic(row: CatalogGrupo): Grupo {
  const carreras = Array.isArray(row.carreras) ? row.carreras.filter(Boolean) : [];

  return {
    id: row.id,
    tipo: (row.tipo as Grupo['tipo']) || 'Desconocido',
    carreras,
    carrera_str: carreras.join(', '),
    nombre: text(row.nombre),
    docente: text(row.docente_a_cargo),
    lider: text(row.lider_o_representante),
    email: text(row.email_contacto),
    vinculacion: text(row.vinculacion),
    enfoque: text(row.enfoque),
    descripcion: text(row.descripcion),
    actividades: text(row.actividades),
    modalidad: text(row.modalidad),
    horarios: text(row.horarios_habituales),
    requisitos: text(row.requisitos_ingreso),
    nivel_academico: text(row.nivel_academico_recomendado),
    redes: text(row.redes_sociales),
    comentarios: text(row.comentarios_adicionales),
    imagen_url: text(row.imagen_url) || undefined,
  };
}

export function buildMetadata(grupos: Grupo[]): Metadata {
  const por_tipo: Record<string, number> = {};
  const carrerasSet = new Set<string>();

  for (const g of grupos) {
    por_tipo[g.tipo] = (por_tipo[g.tipo] || 0) + 1;
    g.carreras.forEach((c) => carrerasSet.add(c));
  }

  return {
    total: grupos.length,
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

/** Catalogo + fecha real de ultima edicion en DB. */
export async function fetchApprovedCatalog(): Promise<{ grupos: Grupo[]; metadata: Metadata; error: string | null }> {
  const client = serverClient() || supabase;
  const { data, error } = await client
    .from('grupos')
    .select('id,tipo,carreras,nombre,docente_a_cargo,lider_o_representante,email_contacto,vinculacion,enfoque,descripcion,actividades,modalidad,horarios_habituales,requisitos_ingreso,nivel_academico_recomendado,redes_sociales,comentarios_adicionales,imagen_url,fecha_actualizacion,fecha_creacion')
    .eq('estado_aprobacion', 'aprobado')
    .order('nombre');

  if (error) {
    console.error('fetchApprovedCatalog:', error.message);
    return { grupos: [], metadata: buildMetadata([]), error: error.message };
  }

  const rows = data || [];
  let latest = '';
  for (const row of rows) {
    const ts = row.fecha_actualizacion || row.fecha_creacion || '';
    if (ts > latest) latest = ts;
  }

  const grupos = rows.map(mapDbGrupoToPublic);
  return {
    grupos,
    metadata: {
      ...buildMetadata(grupos),
      actualizado: latest || new Date().toISOString(),
    },
    error: null,
  };
}

export async function fetchApprovedGrupoById(id: string): Promise<Grupo | null> {
  const client = serverClient() || supabase;
  const { data, error } = await client
    .from('grupos')
    .select('id,tipo,carreras,nombre,docente_a_cargo,lider_o_representante,email_contacto,vinculacion,enfoque,descripcion,actividades,modalidad,horarios_habituales,requisitos_ingreso,nivel_academico_recomendado,redes_sociales,comentarios_adicionales,imagen_url,fecha_actualizacion,fecha_creacion')
    .eq('id', id)
    .eq('estado_aprobacion', 'aprobado')
    .maybeSingle();

  if (error) {
    console.error('fetchApprovedGrupoById:', error.message);
    return null;
  }

  return data ? mapDbGrupoToPublic(data) : null;
}
