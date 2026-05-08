#!/usr/bin/env node
/**
 * CSV Parser for Semilleros UNAL - v2
 * Robust parser handling multiline quoted fields
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const CSV_PATH = join(ROOT_DIR, 'STITCH DESIGNS', 'Semilleros, Grupos de Investigación y Grupos Estudiantiles - Facultad De Ingeniería - Base de Datos.csv');
const OUTPUT_JSON_PATH = join(ROOT_DIR, 'src', 'data', 'grupos.json');
const OUTPUT_TYPES_PATH = join(ROOT_DIR, 'src', 'data', 'grupos.types.ts');

/**
 * Parse CSV content handling multiline quoted fields
 * Splits by newline only when not inside quotes
 */
function splitCSVRecords(content) {
  // Normalize line endings to Unix format first
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const records = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === '\n' && !inQuotes) {
      // End of record
      if (current.trim()) {
        records.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }
  
  // Don't forget the last record
  if (current.trim()) {
    records.push(current.trim());
  }
  
  return records;
}

/**
 * Parse a single CSV record into fields
 */
function parseCSVRecord(record) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < record.length; i++) {
    const char = record[i];
    const nextChar = record[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current.trim());
  return fields;
}

/**
 * Clean and normalize text fields
 */
function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize career names (fix typos like "Ingenería" -> "Ingeniería")
 */
function normalizeCarrera(carrera) {
  if (!carrera) return '';
  return carrera
    .replace(/Ingenería/g, 'Ingeniería')
    .replace(/Ingenieria/g, 'Ingeniería')
    .replace(/ y afines/g, ' y Afines')
    .split('\n')
    .map(c => c.trim())
    .filter(c => c.length > 0)
    .join(', ');
}

/**
 * Extract unique values for filtering
 */
function extractUniqueValues(grupos, field) {
  const values = new Set();
  grupos.forEach(g => {
    if (field === 'carrera') {
      g.carreras.forEach(c => values.add(c));
    } else {
      values.add(g[field]);
    }
  });
  return Array.from(values).filter(v => v && v.length > 0).sort();
}

/**
 * Main parsing function
 */
function parseCSV() {
  console.log('📄 Reading CSV file...');
  
  const csvContent = readFileSync(CSV_PATH, 'utf-8');
  
  // Split into records (handling multiline fields)
  const allRecords = splitCSVRecords(csvContent);
  
  // Skip first 5 lines (empty + headers)
  // Line 5 (index 4) is header
  const headerRecord = allRecords[4];
  const dataRecords = allRecords.slice(5); // Data starts after header
  
  const headers = parseCSVRecord(headerRecord).map(h => 
    cleanText(h).toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')
  );
  
  console.log('📝 Headers found:', headers.length);
  console.log('   Headers:', headers.join(', '));
  
  const grupos = [];
  let skippedCount = 0;
  
  // Process each data record
  for (let i = 0; i < dataRecords.length; i++) {
    const record = dataRecords[i];
    
    // Skip empty records
    if (!record || record.trim().length === 0) {
      skippedCount++;
      continue;
    }
    
    // Skip records that don't start with a valid type
    const validTypes = ['Grupo Estudiantil', 'Grupo de Investigación', 'Semillero'];
    const startsWithType = validTypes.some(type => record.startsWith(type));
    if (!startsWithType) {
      if (i < 20) console.log(`   ⚠️ Record ${i} doesn't start with valid type: ${record.slice(0, 50)}...`);
      skippedCount++;
      continue;
    }
    
    const fields = parseCSVRecord(record);
    
    if (fields.length < 3) {
      console.log(`   ⚠️ Skipping record ${i + 1}: insufficient fields (${fields.length})`);
      skippedCount++;
      continue;
    }
    
    const grupo = processFields(fields, headers, i);
    
    if (grupo && grupo.nombre && grupo.nombre.length > 0) {
      grupos.push(grupo);
    } else {
      console.log(`   ⚠️ Record ${i} has no nombre: ${JSON.stringify(grupo)}`);
    }
  }
  
  console.log(`   Total records: ${dataRecords.length}, Parsed: ${grupos.length}, Skipped: ${skippedCount}`);
  
  console.log(`✅ Parsed ${grupos.length} grupos/semilleros`);
  
  // Generate metadata
  const metadata = {
    total: grupos.length,
    por_tipo: {},
    carreras: extractUniqueValues(grupos, 'carrera'),
    actualizado: new Date().toISOString()
  };
  
  grupos.forEach(g => {
    metadata.por_tipo[g.tipo] = (metadata.por_tipo[g.tipo] || 0) + 1;
  });
  
  console.log('📊 Distribution:', metadata.por_tipo);
  
  // Write JSON
  const output = {
    metadata,
    data: grupos
  };
  
  writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2));
  console.log(`💾 JSON written to: ${OUTPUT_JSON_PATH}`);
  
  // Generate TypeScript types
  generateTypes(metadata.carreras);
  console.log(`💾 Types written to: ${OUTPUT_TYPES_PATH}`);
}

/**
 * Process CSV fields into grupo object
 */
function processFields(fields, headers, index) {
  const record = {};
  headers.forEach((header, idx) => {
    record[header] = fields[idx] || '';
  });
  
  // Normalize and clean
  const carrerasRaw = record['carreras'] || record['carrera_s_'] || '';
  const carreras = normalizeCarrera(carrerasRaw)
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0 && c !== 'y Afines');
  
  const tipo = cleanText(record.tipo) || 'Desconocido';
  const nombre = cleanText(record.nombre);
  
  // Generate unique ID
  const slug = nombre.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  
  return {
    id: `unal-${index + 1}-${slug || 'grupo'}`,
    tipo,
    carreras,
    carrera_str: carreras.join(', '),
    nombre,
    docente: cleanText(record.docente_a_cargo),
    lider: cleanText(record.lider_o_representate),
    email: cleanText(record.e_mail_de_contacto),
    vinculacion: cleanText(record.vinculación),
    enfoque: cleanText(record.enfoque),
    descripcion: cleanText(record.descripción),
    actividades: cleanText(record.actividades),
    modalidad: cleanText(record.modalidad),
    horarios: cleanText(record.horarios_habituales),
    requisitos: cleanText(record.requisitos_para_ingresar),
    nivel_academico: cleanText(record.nivel_academico_recomendado_para_ingresar || record['nivel_academico_recomendado_para_ingresar']),
    redes: cleanText(record.redes_sociales),
    comentarios: cleanText(record.comentarios_adicionales)
  };
}

/**
 * Generate TypeScript types file
 */
function generateTypes(carreras) {
  const tiposGrupo = ['Semillero', 'Grupo de Investigación', 'Grupo Estudiantil', 'Desconocido'];
  const modalidades = ['Presencial', 'Virtual', 'Mixta'];
  const niveles = ['No requerido (Abierto a todos los niveles)', 'Intermedio (Con bases en el área)', 'Avanzado (Requiere experiencia o conocimientos sólidos)'];
  
  const typesContent = `/**
 * Auto-generated TypeScript types for grupos/semilleros data
 * Generated: ${new Date().toISOString()}
 */

export type TipoGrupo = '${tiposGrupo.join("' | '")}';
export type Modalidad = '${modalidades.join("' | '")}';
export type NivelAcademico = '${niveles.join("' | '")}';

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
  ${carreras.map(c => `  '${c}'`).join(',\n')}
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
`;
  
  writeFileSync(OUTPUT_TYPES_PATH, typesContent);
}

// Run parser
console.log('🚀 Starting CSV parser v2...\n');
try {
  parseCSV();
  console.log('\n✨ Done!');
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
