import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment (.env)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Path to the source CSV (the one with the accurate info)
const RAW_CSV_PATH = join(__dirname, '..', 'STITCH DESIGNS', 'Semilleros, Grupos de Investigación y Grupos Estudiantiles - Facultad De Ingeniería - Base de Datos.csv');

// We use the headers from the normalized CSV to guide our object building
const NORMALIZED_HEADERS = [
  'tipo', 'carreras', 'nombre', 'docente_a_cargo', 'lider_o_representante', 
  'email_contacto', 'vinculacion', 'enfoque', 'descripcion', 'actividades', 
  'modalidad', 'horarios_habituales', 'requisitos_ingreso', 'nivel_academico_recomendado', 
  'redes_sociales', 'comentarios_adicionales'
];

function parseCSV(content) {
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
      if (current.trim()) records.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) records.push(current.trim());
  return records;
}

function parseRecord(record) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < record.length; i++) {
    const char = record[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(cleanField(current));
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(cleanField(current));
  return fields;
}

function cleanField(value) {
  if (!value) return '';
  return value.trim().replace(/^"+|"+$/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeCarrera(carrera) {
  if (!carrera) return '';
  const corrections = { 'Ingenería': 'Ingeniería', 'ingenería': 'ingeniería', 'INGENERÍA': 'INGENIERÍA' };
  let result = carrera;
  for (const [wrong, correct] of Object.entries(corrections)) {
    result = result.replace(new RegExp(wrong, 'gi'), correct);
  }
  return result;
}

const DRY_RUN = process.argv.includes('--dry-run');

// Solo estas columnas se pueden actualizar; el resto se preserva siempre
const UPDATABLE = [
  'tipo', 'carreras', 'nombre', 'docente_a_cargo', 'lider_o_representante',
  'email_contacto', 'vinculacion', 'enfoque', 'descripcion', 'actividades',
  'modalidad', 'horarios_habituales', 'requisitos_ingreso', 'nivel_academico_recomendado',
  'redes_sociales', 'comentarios_adicionales', 'fecha_actualizacion'
];

function normStr(v) {
  return String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

function pickUpdatable(grupo) {
  const out = {};
  for (const k of UPDATABLE) {
    if (k in grupo) out[k] = grupo[k];
  }
  return out;
}

function diffPayload(existing, next) {
  const changes = {};
  for (const [k, v] of Object.entries(next)) {
    if (JSON.stringify(existing[k] ?? null) !== JSON.stringify(v ?? null)) {
      changes[k] = { from: existing[k] ?? null, to: v ?? null };
    }
  }
  return changes;
}

async function runMerge() {
  console.log('🚀 Iniciando fusión y actualización de base de datos...');

  // 1. Read Raw CSV
  const csvContent = readFileSync(RAW_CSV_PATH, 'utf-8');
  const records = parseCSV(csvContent);
  const dataRecords = records.slice(5); // Skip 4 empty lines + 1 header line

  const gruposFromCSV = [];
  
  for (const record of dataRecords) {
    if (!record || record.trim().length === 0) continue;
    const fields = parseRecord(record);
    if (fields.length < 3) continue;

    const carrerasRaw = fields[1] || '';
    const carreras = normalizeCarrera(carrerasRaw).split(',').map(c => c.trim()).filter(c => c.length > 0 && c !== 'y Afines');

    // Mapeo basado en el orden del CSV crudo:
    // 0: TIPO, 1: CARRERA(S), 2: NOMBRE, 3: DOCENTE A CARGO, 4: LIDER O REPRESENTATE, 
    // 5: E-MAIL DE CONTACTO, 6: VINCULACIÓN, 7: ENFOQUE, 8: DESCRIPCIÓN, 9: ACTIVIDADES, 
    // 10: MODALIDAD, 11: HORARIOS HABITUALES, 12: REQUISITOS PARA INGRESAR, 13: NIVEL ACADEMICO RECOMENDADO, 14: REDES SOCIALES, 15: COMENTARIOS ADICIONALES
    
    // Some lines might not have 15 elements if they are missing trailing commas, so we fall back to ''
    const getField = (idx) => fields[idx] ? cleanField(fields[idx]) : '';

    const grupo = {
      tipo: getField(0) || 'Desconocido',
      carreras: carreras,
      nombre: getField(2),
      docente_a_cargo: getField(3),
      lider_o_representante: getField(4),
      email_contacto: getField(5),
      vinculacion: getField(6),
      enfoque: getField(7),
      descripcion: getField(8),
      actividades: getField(9),
      modalidad: getField(10),
      horarios_habituales: getField(11),
      requisitos_ingreso: getField(12),
      nivel_academico_recomendado: getField(13),
      // Mapeando redes y comentarios si existen en el CSV crudo, asumiendo columnas 14 y 15
      redes_sociales: getField(14),
      comentarios_adicionales: getField(15),
      estado_aprobacion: 'aprobado'
    };

    if (grupo.nombre) {
      gruposFromCSV.push(grupo);
    }
  }

  console.log(`✅ Procesados ${gruposFromCSV.length} grupos del CSV original.`);

  // 2. Fetch existing groups from Supabase (paginado hasta cubrir todos)
  console.log('📡 Obteniendo grupos actuales de Supabase...');
  const existingGrupos = [];
  const PAGE = 1000;
  let from = 0;
  for (;;) {
    const { data, error: fetchError } = await supabase
      .from('grupos')
      .select('*')
      .range(from, from + PAGE - 1);
    if (fetchError) {
      console.error('❌ Error al obtener grupos:', fetchError.message);
      process.exit(1);
    }
    existingGrupos.push(...(data || []));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`✅ Se encontraron ${existingGrupos.length} grupos existentes en Supabase.`);

  // 3. Upsert Logic (Update if exists, Insert if not)
  if (DRY_RUN) console.log('🔍 DRY-RUN: solo se imprime el diff, no se escribe nada.');
  let updatedCount = 0;
  let insertedCount = 0;
  let errorCount = 0;

  // Indice por id y por nombre+email normalizados
  const byId = new Map(existingGrupos.filter(g => g.id).map(g => [String(g.id), g]));
  const byNameEmail = new Map(
    existingGrupos.map(g => [`${normStr(g.nombre)}||${normStr(g.email_contacto)}`, g])
  );

  for (const csvGrupo of gruposFromCSV) {
    // Match por id si el CSV lo trae, si no por nombre normalizado + email
    const existing = (csvGrupo.id && byId.get(String(csvGrupo.id)))
      || byNameEmail.get(`${normStr(csvGrupo.nombre)}||${normStr(csvGrupo.email_contacto)}`);

    if (existing) {
      // Solo columnas de la whitelist; nunca se tocan
      // estado_aprobacion, imagen_url, id_lider, creado_por ni fecha_creacion
      const updatePayload = {
        ...pickUpdatable(csvGrupo),
        fecha_actualizacion: new Date().toISOString()
      };
      const changes = diffPayload(existing, updatePayload);
      if (Object.keys(changes).length === 0) continue;

      if (DRY_RUN) {
        console.log(`~ '${csvGrupo.nombre}':`, JSON.stringify(changes).slice(0, 500));
        updatedCount++;
        continue;
      }
      const { error } = await supabase.from('grupos').update(updatePayload).eq('id', existing.id);
      
      if (error) {
        console.error(`❌ Error actualizando '${csvGrupo.nombre}':`, error.message);
        errorCount++;
      } else {
        updatedCount++;
      }
    } else {
      // Insert new record
      const insertPayload = {
        ...pickUpdatable(csvGrupo),
        estado_aprobacion: 'aprobado',
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      };

      if (DRY_RUN) {
        console.log(`+ '${csvGrupo.nombre}' (nuevo)`);
        insertedCount++;
        continue;
      }
      const { error } = await supabase.from('grupos').insert(insertPayload);
      
      if (error) {
        console.error(`❌ Error insertando '${csvGrupo.nombre}':`, error.message);
        errorCount++;
      } else {
        insertedCount++;
      }
    }
  }

  console.log('\n🎉 ¡Proceso Finalizado!');
  console.log(`📊 Resumen:`);
  console.log(`   - 🔄 Grupos Actualizados: ${updatedCount} (Se conservaron sus usuarios/líderes vinculados)`);
  console.log(`   - ➕ Grupos Nuevos Insertados: ${insertedCount}`);
  console.log(`   - ❌ Errores: ${errorCount}`);
}

runMerge();
