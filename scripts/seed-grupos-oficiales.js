/**
 * Seed de grupos oficiales DIB-UNAL desde `nuevos-grupos-dib.json`.
 *
 * - Inserta en public.grupos como estado_aprobacion='aprobado' con uuid autogenerado.
 * - Dedupe contra existentes por nombre normalizado (idempotente).
 * - Los registros "espejo" (mismo grupo en otra sede) se conservan: la clave
 *   intra-lote es norm(nombre)|norm(sede); contra la DB previa es norm(nombre).
 * - La tabla NO tiene columna `sede` (se sondea una fila): la sede viaja como
 *   prefijo "[Sede X] " en comentarios_adicionales.
 * - Regenera src/data/grupos.json como espejo de los aprobados en DB
 *   (shape legacy: docente/lider/horarios/...; carreras canonizadas read-side).
 *
 * Uso: set -a && source .env && set +a && node scripts/seed-grupos-oficiales.js
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  try {
    const raw = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch { /* .env opcional en CI */ }
}
loadEnv();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Faltan PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceKey);

const INPUT_PATH = join(__dirname, '..', 'nuevos-grupos-dib.json');
const MIRROR_PATH = join(__dirname, '..', 'src', 'data', 'grupos.json');
const BATCH_SIZE = 50;

/**
 * Duplicados conocidos cuyo nombre en la fuente NO matchea al de la DB por
 * norm(nombre): el semillero ALIFE (id unal-5-alife) ya existe como "ALIFE".
 */
const DUPLICADOS_CONOCIDOS = new Set([
  'alife: grupo de investigacion en vida artificial',
]);

/** lowercase, sin tildes, colapsa whitespace; quita sufijo sede del id/nombre. */
function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Clave de dedupe: quita el sufijo "- sede" cuando el nombre lo arrastra. */
function dedupeKey(nombre, sede) {
  let k = norm(nombre);
  const sedeNorm = norm(sede);
  if (sedeNorm) k = k.replace(new RegExp(`\\s*[-–—]\\s*${sedeNorm}$`), '');
  return k;
}

function clean(value) {
  const v = (value === null || value === undefined ? '' : String(value)).trim();
  if (!v || v === '-') return null;
  return v;
}

// ---------------------------------------------------------------------------
// Canonización de carreras: espejo mínimo de src/data/grupos.types.ts (read-side)
// ---------------------------------------------------------------------------
const CANONICAL_CARRERAS = [
  'Ingeniería Agrícola', 'Ingeniería Civil', 'Ingeniería Eléctrica',
  'Ingeniería Electrónica', 'Ingeniería Industrial', 'Ingeniería Mecánica',
  'Ingeniería Mecatrónica', 'Ingeniería Química', 'Ingeniería de Sistemas',
  'Ingeniería y Afines', 'Ciencias Naturales', 'Toda la Universidad',
  'Otras carreras',
];
const canonicalIndex = {};
for (const c of CANONICAL_CARRERAS) canonicalIndex[norm(c)] = c;
const CARRERA_ALIASES = {
  ...canonicalIndex,
  'ingeniera electronica': 'Ingeniería Electrónica',
  'ingenieria electrica': 'Ingeniería Eléctrica',
  'ingenieria mecanica': 'Ingeniería Mecánica',
  'ingenieria mecatronica': 'Ingeniería Mecatrónica',
  'ingenieria agronomica': 'Ingeniería Agrícola',
  'ingenieria de sistemas y computacion': 'Ingeniería de Sistemas',
  'ingenieria y afines': 'Ingeniería y Afines',
  'toda la sede': 'Toda la Universidad',
  'todas las carreras': 'Toda la Universidad',
  'cualquier carreta': 'Toda la Universidad',
  'cualquier carrera': 'Toda la Universidad',
  'principalmente todas las ingenierias': 'Ingeniería y Afines',
  'economia': 'Otras carreras',
  'psicologia': 'Otras carreras',
  'trabajo social': 'Otras carreras',
  'licenciaturas': 'Otras carreras',
  'administracion de empresas': 'Otras carreras',
};

function canonicalizeCarrera(raw) {
  const key = norm(raw).replace(/[.,;:]+$/, '').trim();
  if (!key) return [];
  const direct = CARRERA_ALIASES[key];
  if (direct) return [direct];
  return ['Otras carreras'];
}

function canonCarreras(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || '').split(',');
  return Array.from(new Set(list.flatMap((c) => canonicalizeCarrera(c))));
}

// ---------------------------------------------------------------------------
// Transformación de registro nuevo -> fila DB
// ---------------------------------------------------------------------------
function toDbRow(g, sedeColumn) {
  const sede = clean(g.sede);
  const comentarioBase = clean(g.comentarios);
  let comentarios = comentarioBase;
  if (!sedeColumn && sede) {
    const prefijo = `[Sede ${sede}]`;
    comentarios = comentarioBase ? `${prefijo} ${comentarioBase}` : prefijo;
  }
  const row = {
    tipo: clean(g.tipo) || 'Grupo de Investigación',
    carreras: Array.isArray(g.carreras)
      ? g.carreras.map((c) => String(c).trim()).filter(Boolean)
      : String(g.carreras || '').split(',').map((c) => c.trim()).filter(Boolean),
    nombre: String(g.nombre || '').trim(),
    docente_a_cargo: clean(g.docente),
    lider_o_representante: clean(g.lider),
    email_contacto: clean(g.email),
    vinculacion: clean(g.vinculacion),
    enfoque: clean(g.enfoque),
    descripcion: clean(g.descripcion),
    actividades: clean(g.actividades),
    modalidad: clean(g.modalidad),
    horarios_habituales: clean(g.horarios),
    requisitos_ingreso: clean(g.requisitos),
    nivel_academico_recomendado: clean(g.nivel_academico),
    redes_sociales: clean(g.redes),
    comentarios_adicionales: comentarios,
    estado_aprobacion: 'aprobado',
  };
  if (sedeColumn && sede) row.sede = sede;
  return row;
}

/** Sondea si la tabla expone columna `sede` (no está en las migrations). */
async function hasSedeColumn() {
  const { data, error } = await supabase.from('grupos').select('*').limit(1);
  if (error) throw new Error(`select sondeo: ${error.message}`);
  return data && data.length > 0 ? Object.prototype.hasOwnProperty.call(data[0], 'sede') : false;
}

async function main() {
  console.log('Seed de grupos oficiales DIB-UNAL...\n');

  const raw = readFileSync(INPUT_PATH, 'utf-8');
  const fuente = JSON.parse(raw);
  console.log(`Fuente: ${INPUT_PATH} (${fuente.length} registros)`);

  const sedeColumn = await hasSedeColumn();
  console.log(`Columna sede en DB: ${sedeColumn ? 'sí (se usa columna)' : 'no (prefijo en comentarios_adicionales)'}`);

  const { data: existing, error: selError } = await supabase
    .from('grupos')
    .select('id,nombre');
  if (selError) {
    console.error('ERROR select existentes:', selError.message);
    process.exit(1);
  }
  const existingNames = new Set((existing || []).map((g) => dedupeKey(g.nombre)));
  console.log(`Existentes en DB: ${(existing || []).length} (índice de dedupe: ${existingNames.size} nombres únicos)`);

  const inserts = [];
  const skippedDb = [];
  const skippedIntra = [];
  const batchNames = new Set();

  for (const g of fuente) {
    const nombre = String(g.nombre || '').trim();
    if (!nombre) continue;
    const key = dedupeKey(nombre, g.sede);
    const keySede = `${key}|${norm(g.sede)}`;
    if (existingNames.has(key) || DUPLICADOS_CONOCIDOS.has(norm(nombre))) {
      skippedDb.push(`${nombre} [sede ${clean(g.sede) || 'n/d'}]`);
      continue;
    }
    if (batchNames.has(keySede)) {
      skippedIntra.push(`${nombre} [sede ${clean(g.sede) || 'n/d'}]`);
      continue;
    }
    batchNames.add(keySede);
    inserts.push(toDbRow(g, sedeColumn));
  }

  console.log(`\nA insertar: ${inserts.length}. Skip vs DB: ${skippedDb.length}. Skip intra-lote (nombre+sede repetido): ${skippedIntra.length}`);
  if (skippedDb.length) {
    console.log('Skipped (nombre ya existente en DB):');
    for (const n of skippedDb) console.log('  -', n);
  }
  if (skippedIntra.length) {
    console.log('Skipped (duplicado interno nombre+sede):');
    for (const n of skippedIntra) console.log('  -', n);
  }

  let inserted = 0;
  for (let i = 0; i < inserts.length; i += BATCH_SIZE) {
    const batch = inserts.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from('grupos').insert(batch).select('id,nombre');
    if (error) {
      console.error(`ERROR batch ${i / BATCH_SIZE + 1}: ${error.message}`);
      process.exit(1);
    }
    inserted += (data || []).length;
    console.log(`  batch ${i / BATCH_SIZE + 1}: ${(data || []).length} insertados`);
  }

  // -------------------------------------------------------------------------
  // Verificación post-merge
  // -------------------------------------------------------------------------
  const { count: totalAprobados, error: cErr } = await supabase
    .from('grupos').select('id', { count: 'exact', head: true })
    .eq('estado_aprobacion', 'aprobado');
  if (cErr) throw new Error(`count aprobados: ${cErr.message}`);

  async function countConCarrera(carrera) {
    const { count, error } = await supabase
      .from('grupos').select('id', { count: 'exact', head: true })
      .eq('estado_aprobacion', 'aprobado')
      .contains('carreras', [carrera]);
    if (error) throw new Error(`count ${carrera}: ${error.message}`);
    return count;
  }
  const countCN = await countConCarrera('Ciencias Naturales');
  const countIdS = await countConCarrera('Ingeniería de Sistemas');

  // distinct unnest(carreras) equivalente, calculado cliente-side
  const { data: todos, error: tErr } = await supabase
    .from('grupos').select('carreras').eq('estado_aprobacion', 'aprobado');
  if (tErr) throw new Error(`select carreras: ${tErr.message}`);
  const distinctSet = new Set();
  for (const g of todos || []) for (const c of g.carreras || []) distinctSet.add(c);
  const distinctSorted = Array.from(distinctSet).sort((a, b) => a.localeCompare(b, 'es'));
  const sucias = distinctSorted.filter((c) => /cualquier carreta|toda la sede|todas las carreras/i.test(c));

  // -------------------------------------------------------------------------
  // Mirror src/data/grupos.json (shape legacy, carreras canonizadas)
  // -------------------------------------------------------------------------
  const { data: aprobados, error: apErr } = await supabase
    .from('grupos')
    .select('id,tipo,carreras,nombre,docente_a_cargo,lider_o_representante,email_contacto,vinculacion,enfoque,descripcion,actividades,modalidad,horarios_habituales,requisitos_ingreso,nivel_academico_recomendado,redes_sociales,comentarios_adicionales,imagen_url')
    .eq('estado_aprobacion', 'aprobado')
    .order('nombre');
  if (apErr) throw new Error(`select mirror: ${apErr.message}`);

  const data = (aprobados || []).map((r) => {
    const carreras = canonCarreras(r.carreras);
    const item = {
      id: r.id,
      tipo: r.tipo,
      carreras,
      carrera_str: carreras.join(', '),
      nombre: r.nombre || '',
      docente: r.docente_a_cargo || '',
      lider: r.lider_o_representante || '',
      email: r.email_contacto || '',
      vinculacion: r.vinculacion || '',
      enfoque: r.enfoque || '',
      descripcion: r.descripcion || '',
      actividades: r.actividades || '',
      modalidad: r.modalidad || '',
      horarios: r.horarios_habituales || '',
      requisitos: r.requisitos_ingreso || '',
      nivel_academico: r.nivel_academico_recomendado || '',
      redes: r.redes_sociales || '',
      comentarios: r.comentarios_adicionales || '',
    };
    if (r.imagen_url) item.imagen_url = r.imagen_url;
    return item;
  });

  const porTipo = {};
  const carrerasSet = new Set();
  for (const g of data) {
    porTipo[g.tipo] = (porTipo[g.tipo] || 0) + 1;
    for (const c of g.carreras) carrerasSet.add(c);
  }

  const hoy = new Date();
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mirror = {
    metadata: {
      total: data.length,
      por_tipo: porTipo,
      carreras: Array.from(carrerasSet).sort((a, b) => a.localeCompare(b, 'es')),
      actualizado: hoy.toISOString(),
      ultima_actualizacion: hoy.toISOString().slice(0, 10),
      ultima_actualizacion_texto: `${hoy.getDate()} de ${MESES[hoy.getMonth()]} de ${hoy.getFullYear()}`,
    },
    data,
  };
  writeFileSync(MIRROR_PATH, JSON.stringify(mirror, null, 2) + '\n');

  // -------------------------------------------------------------------------
  // Reporte
  // -------------------------------------------------------------------------
  console.log('\n===== REPORTE =====');
  console.log(`inserted: ${inserted}`);
  console.log(`skipped vs DB (nombre existente): ${skippedDb.length}`);
  console.log(`skipped intra-lote (nombre+sede): ${skippedIntra.length}`);
  console.log(`total aprobados tras merge: ${totalAprobados} (esperado ${(existing || []).length + inserted})`);
  console.log(`grupos con carreras conteniendo 'Ciencias Naturales': ${countCN}`);
  console.log(`grupos con carreras conteniendo 'Ingeniería de Sistemas': ${countIdS}`);
  console.log(`distinct unnest(carreras) (${distinctSorted.length}): ${distinctSorted.join(' | ')}`);
  console.log(`valores sucios legacy en DB ('cualquier carreta' etc.): ${sucias.length ? sucias.join(' | ') : 'ninguno'}`);
  console.log(`mirror escrito: ${MIRROR_PATH}`);
  console.log(`mirror total: ${mirror.metadata.total}, carreras: ${mirror.metadata.carreras.join(' | ')}`);

  if (totalAprobados !== (existing || []).length + inserted) {
    console.error('VERIFICACIÓN FALLÓ: total aprobados != previos + inserted');
    process.exit(1);
  }
  console.log('\nOK');
}

main().catch((e) => {
  console.error('FALLO:', e.message);
  process.exit(1);
});
