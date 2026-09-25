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
  'Ingeniería Electrica',
  'Ingeniería Electrónica',
  'Ingeniería Mecatrónica',
  'Ingeniería Mecánica',
  'Ingeniería Química',
  'Ingeniería de Sistemas',
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
    .replace(/s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function norm(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function filtrarGrupos(
  grupos: Grupo[],
  filtros: { tipo?: string; carrera?: string; busqueda?: string }
): Grupo[] {
  return grupos.filter(g => {
    if (filtros.tipo && !norm(g.tipo).includes(norm(filtros.tipo))) {
      return false;
    }
    if (filtros.carrera) {
      const carrera = norm(filtros.carrera);
      if (!g.carreras.some(c => norm(c).includes(carrera))) {
        return false;
      }
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
