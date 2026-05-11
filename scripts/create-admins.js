#!/usr/bin/env node
/**
 * Script para crear 2 cuentas de SUPER_ADMIN
 * Usage: node scripts/create-admins.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAILS = [
  process.env.SUPER_ADMIN_EMAIL_1 || 'admin1@unal.edu.co',
  process.env.SUPER_ADMIN_EMAIL_2 || 'admin2@unal.edu.co'
];

const TEMP_PASSWORD = 'FIBOG2024!Admin'; // Cambiar después del primer login

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('   Asegúrate de tener PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSuperAdmin(email, password, name) {
  console.log(`\n👤 Creando Super Admin: ${email}`);
  
  try {
    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: { nombre_completo: name }
    });

    if (authError) {
      if (authError.message.includes('already exists') || authError.message.includes('already registered')) {
        console.log(`   ⚠️  Usuario ya existe, actualizando a SUPER_ADMIN...`);
        
        // Buscar usuario existente
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
          // Actualizar a SUPER_ADMIN
          const { error: profileError } = await supabase
            .from('perfiles')
            .upsert({
              id: existingUser.id,
              email: email,
              rol: 'SUPER_ADMIN',
              nombre_completo: name,
              activo: true,
            }, { onConflict: 'id' });
          
          if (profileError) {
            console.error(`   ❌ Error actualizando perfil: ${profileError.message}`);
            return null;
          }
          
          console.log(`   ✅ Perfil actualizado a SUPER_ADMIN`);
          console.log(`   📧 Email: ${email}`);
          console.log(`   🔑 ID: ${existingUser.id}`);
          return existingUser.id;
        }
        return null;
      }
      throw authError;
    }

    const userId = authData.user.id;
    
    // 2. Crear perfil con rol SUPER_ADMIN
    const { error: profileError } = await supabase
      .from('perfiles')
      .insert({
        id: userId,
        email: email,
        rol: 'SUPER_ADMIN',
        nombre_completo: name,
      });

    if (profileError) {
      console.error(`   ❌ Error creando perfil: ${profileError.message}`);
      return null;
    }

    console.log(`   ✅ SUPER_ADMIN creado exitosamente`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 ID: ${userId}`);
    console.log(`   🔒 Password temporal: ${password}`);
    
    return userId;

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Creando 2 cuentas de SUPER_ADMIN...\n');
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  
  const results = [];
  
  for (let i = 0; i < ADMIN_EMAILS.length; i++) {
    const email = ADMIN_EMAILS[i];
    const name = `Administrador FIBOG ${i + 1}`;
    const userId = await createSuperAdmin(email, TEMP_PASSWORD, name);
    results.push({ email, userId, success: !!userId });
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN');
  console.log('='.repeat(50));
  
  let successCount = 0;
  results.forEach((result, i) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} Admin ${i + 1}: ${result.email}`);
    if (result.success) successCount++;
  });
  
  console.log(`\n✨ ${successCount}/${ADMIN_EMAILS.length} admins creados/actualizados`);
  
  if (successCount > 0) {
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   Cambia la contraseña temporal después del primer login:');
    console.log(`   Password temporal: ${TEMP_PASSWORD}`);
    console.log('\n📝 URLs de acceso:');
    console.log('   Login: https://fibog.netlify.app/login');
    console.log('   Panel Admin: https://fibog.netlify.app/admin');
  }
}

main();
