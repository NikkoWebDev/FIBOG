/**
 * Script to migrate CSV data to Supabase
 * Usage: node scripts/migrate-to-supabase.js
 * 
 * This script:
 * 1. Connects to Supabase
 * 2. Reads the CSV file
 * 3. Creates grupos with estado_aprobacion = 'aprobado'
 * 4. Creates a SUPER_ADMIN user if specified
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration from environment
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CSV_PATH = join(__dirname, '..', 'STITCH DESIGNS', 'Semilleros, Grupos de Investigación y Grupos Estudiantiles - Facultad De Ingeniería - Base de Datos.csv');

/**
 * Parse CSV handling multiline fields and Windows line endings
 */
function parseCSV(content) {
  // Normalize line endings
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
      if (current.trim()) {
        records.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    records.push(current.trim());
  }
  
  return records;
}

/**
 * Parse a single CSV record into fields
 */
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

/**
 * Clean a field value
 */
function cleanField(value) {
  if (!value) return '';
  return value
    .trim()
    .replace(/^"+|"+$/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize career names
 */
function normalizeCarrera(carrera) {
  if (!carrera) return '';
  
  const corrections = {
    'Ingenería': 'Ingeniería',
    'ingenería': 'ingeniería',
    'INGENERÍA': 'INGENIERÍA',
  };
  
  let result = carrera;
  for (const [wrong, correct] of Object.entries(corrections)) {
    result = result.replace(new RegExp(wrong, 'gi'), correct);
  }
  
  return result;
}

/**
 * Process a record into a grupo object
 */
function processRecord(fields, headers) {
  const record = {};
  headers.forEach((header, idx) => {
    record[header] = fields[idx] || '';
  });
  
  // Parse careers into array
  const carrerasRaw = record['carreras'] || record['carrera_s_'] || '';
  const carreras = normalizeCarrera(carrerasRaw)
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0 && c !== 'y Afines');
  
  // Map CSV fields to database fields
  return {
    tipo: cleanField(record.tipo) || 'Desconocido',
    carreras: carreras,
    nombre: cleanField(record.nombre),
    docente_a_cargo: cleanField(record.docente_a_cargo),
    lider_o_representante: cleanField(record.lider_o_representante),
    email_contacto: cleanField(record['e_mail_de_contacto'] || record.email_contacto),
    vinculacion: cleanField(record.vinculación || record.vinculacion),
    enfoque: cleanField(record.enfoque),
    descripcion: cleanField(record.descripción || record.descripcion),
    actividades: cleanField(record.actividades),
    modalidad: cleanField(record.modalidad),
    horarios_habituales: cleanField(record.horarios_habituales),
    requisitos_ingreso: cleanField(record.requisitos_para_ingresar || record.requisitos_ingreso),
    nivel_academico_recomendado: cleanField(
      record.nivel_academico_recomendado_para_ingresar || 
      record['nivel_academico_recomendado_para_ingresar'] ||
      record.nivel_academico_recomendado
    ),
    redes_sociales: cleanField(record.redes_sociales),
    comentarios_adicionales: cleanField(record.comentarios_adicionales),
    estado_aprobacion: 'aprobado', // All CSV data is pre-approved
  };
}

/**
 * Create a SUPER_ADMIN user
 */
async function createSuperAdmin(email, password, nombre) {
  console.log(`\n👤 Creating SUPER_ADMIN user: ${email}`);
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log(`   ⚠️  User ${email} already exists`);
        
        // Get existing user
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === email);
        
        if (existingUser) {
          // Update profile to SUPER_ADMIN
          const { error: profileError } = await supabase
            .from('perfiles')
            .upsert({
              id: existingUser.id,
              email: email,
              rol: 'SUPER_ADMIN',
              nombre_completo: nombre,
            });
          
          if (profileError) {
            console.error(`   ❌ Error updating profile: ${profileError.message}`);
          } else {
            console.log(`   ✅ Profile updated to SUPER_ADMIN`);
          }
          
          return existingUser.id;
        }
        return null;
      }
      throw authError;
    }
    
    const userId = authData.user.id;
    
    // Create profile with SUPER_ADMIN role
    const { error: profileError } = await supabase
      .from('perfiles')
      .insert({
        id: userId,
        email: email,
        rol: 'SUPER_ADMIN',
        nombre_completo: nombre,
      });
    
    if (profileError) {
      console.error(`   ❌ Error creating profile: ${profileError.message}`);
      return null;
    }
    
    console.log(`   ✅ SUPER_ADMIN created: ${userId}`);
    return userId;
    
  } catch (error) {
    console.error(`   ❌ Error creating SUPER_ADMIN: ${error.message}`);
    return null;
  }
}

/**
 * Insert grupos into Supabase
 */
async function insertGrupos(grupos) {
  console.log(`\n📤 Inserting ${grupos.length} grupos into Supabase...`);
  
  const batchSize = 50;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < grupos.length; i += batchSize) {
    const batch = grupos.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('grupos')
      .insert(batch)
      .select();
    
    if (error) {
      console.error(`   ❌ Batch ${i / batchSize + 1} failed: ${error.message}`);
      errors += batch.length;
    } else {
      inserted += data.length;
      console.log(`   ✅ Batch ${i / batchSize + 1}: ${data.length} grupos inserted`);
    }
  }
  
  console.log(`\n📊 Summary: ${inserted} inserted, ${errors} errors`);
  return { inserted, errors };
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting FIBOG migration to Supabase...\n');
  
  try {
    // Read and parse CSV
    console.log(`📖 Reading CSV from: ${CSV_PATH}`);
    const csvContent = readFileSync(CSV_PATH, 'utf-8');
    const records = parseCSV(csvContent);
    
    console.log(`   Total records: ${records.length}`);
    
    // Skip first 5 lines (empty + headers)
    const headerRecord = records[4];
    const dataRecords = records.slice(5);
    
    const headers = parseRecord(headerRecord).map(h => 
      h.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')
    );
    
    console.log(`   Headers: ${headers.join(', ')}`);
    console.log(`   Data records: ${dataRecords.length}`);
    
    // Process records
    const grupos = [];
    let skipped = 0;
    const validTypes = ['Grupo Estudiantil', 'Grupo de Investigación', 'Semillero'];
    
    for (let i = 0; i < dataRecords.length; i++) {
      const record = dataRecords[i];
      
      if (!record || record.trim().length === 0) {
        skipped++;
        continue;
      }
      
      const startsWithType = validTypes.some(type => record.startsWith(type));
      if (!startsWithType) {
        skipped++;
        continue;
      }
      
      const fields = parseRecord(record);
      
      if (fields.length < 3) {
        skipped++;
        continue;
      }
      
      const grupo = processRecord(fields, headers);
      
      if (grupo.nombre && grupo.nombre.length > 0) {
        grupos.push(grupo);
      } else {
        skipped++;
      }
    }
    
    console.log(`\n📋 Parsed ${grupos.length} valid grupos (skipped ${skipped})`);
    
    // Show sample
    if (grupos.length > 0) {
      console.log(`\n📎 Sample grupo:`);
      console.log(`   - ${grupos[0].nombre} (${grupos[0].tipo})`);
      console.log(`   - Carreras: ${grupos[0].carreras.join(', ')}`);
    }
    
    // Ask for confirmation
    console.log(`\n⚠️  This will insert ${grupos.length} grupos into Supabase.`);
    console.log(`   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n`);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Clear existing grupos (optional - comment out if you want to keep existing)
    console.log('🧹 Clearing existing grupos...');
    const { error: deleteError } = await supabase
      .from('grupos')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.log(`   ⚠️  Could not clear existing grupos: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Existing grupos cleared`);
    }
    
    // Insert grupos
    const result = await insertGrupos(grupos);
    
    // Create SUPER_ADMIN if specified
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL_1;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!FIBOG';
    
    if (superAdminEmail) {
      await createSuperAdmin(superAdminEmail, superAdminPassword, 'Administrador FIBOG');
    }
    
    console.log('\n✨ Migration complete!\n');
    console.log(`📊 Results:`);
    console.log(`   - ${result.inserted} grupos migrated`);
    console.log(`   - ${result.errors} errors`);
    
    if (superAdminEmail) {
      console.log(`\n🔐 SUPER_ADMIN credentials:`);
      console.log(`   Email: ${superAdminEmail}`);
      console.log(`   Password: ${superAdminPassword}`);
      console.log(`   ⚠️  Please change this password after first login!`);
    }
    
  } catch (error) {
    console.error(`\n💥 Migration failed: ${error.message}`);
    process.exit(1);
  }
}

// Run migration
migrate();
