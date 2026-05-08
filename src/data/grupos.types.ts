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

export function filtrarGrupos(
  grupos: Grupo[],
  filtros: { tipo?: string; carrera?: string; busqueda?: string }
): Grupo[] {
  return grupos.filter(g => {
    if (filtros.tipo && !g.tipo.toLowerCase().includes(filtros.tipo.toLowerCase())) {
      return false;
    }
    if (filtros.carrera && !g.carreras.some(c => 
      c.toLowerCase().includes(filtros.carrera.toLowerCase())
    )) {
      return false;
    }
    if (filtros.busqueda) {
      const search = filtros.busqueda.toLowerCase();
      const match = 
        g.nombre.toLowerCase().includes(search) ||
        g.enfoque.toLowerCase().includes(search) ||
        g.descripcion.toLowerCase().includes(search) ||
        g.docente.toLowerCase().includes(search);
      if (!match) return false;
    }
    return true;
  });
}
