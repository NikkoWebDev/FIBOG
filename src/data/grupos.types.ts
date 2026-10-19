/**
 * Auto-generated TypeScript types for grupos/semilleros data
 * Generated: 2026-05-08T22:14:58.303Z
 */

export type TipoGrupo = 'Semillero' | 'Grupo de Investigación' | 'Grupo Estudiantil' | 'Desconocido';
export type Modalidad = 'Presencial' | 'Virtual' | 'Mixta';
export type NivelAcademico = 'No requerido (Abierto a todos los niveles)' | 'Intermedio (Con bases en el área)' | 'Avanzado (Requiere experiencia o conocimientos sólidos)';

export interface Grupo {
  id: string;
  tipo: TipoGrupo;
  carreras: string[];
  carrera_str: string;
  nombre: string;
  docente: string;
  lider: string;
  email: string;
  vinculacion: string;
  enfoque: string;
  descripcion: string;
  actividades: string;
  modalidad: Modalidad | string;
  horarios: string;
  requisitos: string;
  nivel_academico: NivelAcademico | string;
  redes: string;
  comentarios: string;
  imagen_url?: string;
}

export interface Metadata {
  total: number;
  por_tipo: Record<string, number>;
  carreras: string[];
  actualizado: string;
}

export interface GruposData {
  metadata: Metadata;
  data: Grupo[];
}

// Career filtering
export const CARRERAS_DISPONIBLES = [
    'Ingeniería Agrícola',
  'Ingeniería Civil',
  'Ingeniería Eléctrica',
  'Ingeniería Electrónica',
  'Ingeniería Mecatrónica',
  'Ingeniería Mecánica',
  'Ingeniería Química',
  'Ingeniería de Sistemas',
  'Ingeniería Industrial',
  'Ingeniería y Afines'
] as const;

// Type filtering
export const TIPOS_GRUPO = [
  'Semillero',
  'Grupo de Investigación',
  'Grupo Estudiantil'
] as const;

// Helper functions
export function getCarreraSlug(carrera: string): string {
  return carrera.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getTipoSlug(tipo: string): string {
  return tipo.toLowerCase()
    .replace(/grupo de /g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function norm(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ---------------------------------------------------------------------------
// Canonicalización de carreras (read-side contra la data sucia real de Supabase)
// ---------------------------------------------------------------------------

/** Catálogo cerrado de carreras/buckets que puede mostrar el filtro. */
export const CANONICAL_CARRERAS = [
  'Ingeniería Agrícola',
  'Ingeniería Civil',
  'Ingeniería Eléctrica',
  'Ingeniería Electrónica',
  'Ingeniería Industrial',
  'Ingeniería Mecánica',
  'Ingeniería Mecatrónica',
  'Ingeniería Química',
  'Ingeniería de Sistemas',
  'Ingeniería y Afines',
  'Ciencias Naturales',
  'Toda la Universidad',
  'Otras carreras'
] as const;

export type CanonicalCarrera = (typeof CANONICAL_CARRERAS)[number];

/** Bucket multidisciplinar: el grupo aparece en cualquier filtro de carrera. */
const BUCKET_UNIVERSIDAD: CanonicalCarrera = 'Toda la Universidad';
/** Bucket de carreras ajenas/no catalogadas: solo matchea al filtrar por él. */
const BUCKET_OTRAS: CanonicalCarrera = 'Otras carreras';

/**
 * Mapa norm(alias) -> canónico. Las claves ya vienen normalizadas (sin tildes,
 * minúsculas), así que 'Ingeniería Civil', 'INGENIERÍA CIVIL' e
 * 'ingenieria civil' caen en la misma entrada.
 */
const canonicalIndex: Record<string, CanonicalCarrera> = {};
for (const c of CANONICAL_CARRERAS) canonicalIndex[norm(c)] = c;

export const CARRERA_ALIASES: Record<string, CanonicalCarrera> = {
  ...canonicalIndex,
  // Typos observados en la DB
  'ingeniera electronica': 'Ingeniería Electrónica',
  'ingenieria electrica': 'Ingeniería Eléctrica',
  'ingenieria mecanica': 'Ingeniería Mecánica',
  'ingenieria mecatronica': 'Ingeniería Mecatrónica',
  // Decisión consciente: 'agronómica' -> Agrícola para no abrir una opción de 1 registro.
  'ingenieria agronomica': 'Ingeniería Agrícola',
  'ingenieria de sistemas y computacion': 'Ingeniería de Sistemas',
  'ingenieria y afines': 'Ingeniería y Afines',
  // Free text de sede/universidad -> bucket multidisciplinar
  'toda la sede': BUCKET_UNIVERSIDAD,
  'todas las carreras': BUCKET_UNIVERSIDAD,
  'cualquier carreta': BUCKET_UNIVERSIDAD,
  'cualquier carrera': BUCKET_UNIVERSIDAD,
  'principalmente todas las ingenierias': 'Ingeniería y Afines',
  // Carreras ajenas a la facultad -> bucket 'Otras carreras'
  'economia': BUCKET_OTRAS,
  'psicologia': BUCKET_OTRAS,
  'trabajo social': BUCKET_OTRAS,
  'licenciaturas': BUCKET_OTRAS,
  'administracion de empresas': BUCKET_OTRAS
};

/** Alias cortos que expanden a más de una canónica (p. ej. "MECÁNICA Y MECATRÓNICA."). */
const CARRERA_MULTI_ALIASES: Record<string, readonly CanonicalCarrera[]> = {
  'mecanica y mecatronica': ['Ingeniería Mecánica', 'Ingeniería Mecatrónica']
};

/**
 * Convierte el texto crudo de carrera en 1..N canónicas:
 * alias/typos -> canónico, concatenadas -> se despliegan, free text -> bucket,
 * desconocidos -> 'Otras carreras' (evita opciones de 1 registro en el select).
 */
export function canonicalizeCarrera(raw: string): CanonicalCarrera[] {
  const key = norm(raw).replace(/\s+/g, ' ').replace(/[.,;:]+$/, '').trim();
  if (!key) return [];

  const direct = CARRERA_ALIASES[key];
  if (direct) return [direct];

  const multi = CARRERA_MULTI_ALIASES[key];
  if (multi) return [...multi];

  // Concatenadas: despliega cada canónico conocido que aparezca en el string.
  const hits = CANONICAL_CARRERAS.filter(c => key.includes(norm(c)));
  if (hits.length > 0) return [...hits];

  return [BUCKET_OTRAS];
}

/**
 * Igualdad canónica: true si alguna carrera del grupo (canonizada) es igual al
 * parámetro normalizado, o si el grupo es multidisciplinar ('Toda la Universidad').
 */
export function matchesCarrera(grupo: Grupo, carreraNorn: string): boolean {
  const target = norm(carreraNorn);
  if (!target) return true;

  const propias = (grupo.carreras || []).flatMap(c => canonicalizeCarrera(c));
  if (propias.includes(BUCKET_UNIVERSIDAD)) return true;
  return propias.some(c => norm(c) === target);
}

/** Sobrenombres cortos para las opciones del select de carreras. */
const CARRERA_SHORT_LABELS: Record<string, string> = {
  'Ingeniería de Sistemas': 'Sistemas',
  'Ingeniería Civil': 'Civil',
  'Ingeniería Química': 'Química',
  'Ingeniería Mecánica': 'Mecánica',
  'Ingeniería Mecatrónica': 'Mecatrónica',
  'Ingeniería Eléctrica': 'Eléctrica',
  'Ingeniería Electrónica': 'Electrónica',
  'Ingeniería Agrícola': 'Agrícola',
  'Ingeniería Industrial': 'Industrial',
  'Ingeniería y Afines': 'Ing. y Afines',
  'Ciencias Naturales': 'Ciencias Nat.',
  'Toda la Universidad': 'Multidisciplinar',
  'Otras carreras': 'Otras'
};

export function careerLabelShort(canonical: string): string {
  return CARRERA_SHORT_LABELS[canonical] || canonical;
}

export function filtrarGrupos(
  grupos: Grupo[],
  filtros: { tipo?: string; carrera?: string; busqueda?: string }
): Grupo[] {
  // Acepta alias/typos legacy (URLs viejas) canonicalizando el parámetro.
  const carreras = filtros.carrera ? canonicalizeCarrera(filtros.carrera).map(norm) : [];

  return grupos.filter(g => {
    if (filtros.tipo && !norm(g.tipo).includes(norm(filtros.tipo))) {
      return false;
    }
    if (carreras.length > 0 && !carreras.some(c => matchesCarrera(g, c))) {
      return false;
    }
    if (filtros.busqueda) {
      const search = norm(filtros.busqueda);
      const match =
        norm(g.nombre || '').includes(search) ||
        norm(g.enfoque || '').includes(search) ||
        norm(g.descripcion || '').includes(search) ||
        norm(g.docente || '').includes(search) ||
        norm(g.lider || '').includes(search);
      if (!match) return false;
    }
    return true;
  });
}
