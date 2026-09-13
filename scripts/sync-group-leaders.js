#!/usr/bin/env node
/**
 * Crea/reset cuentas ADMIN_GRUPO por email_contacto de cada grupo.
 * Usage: node scripts/sync-group-leaders.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env opcional si ya hay vars en el entorno
  }
}

loadEnv();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.LEADER_TEMP_PASSWORD || 'Claveparacambiar123';

if (!supabaseUrl || !serviceKey) {
  console.error('Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findAuthUserByEmail(email) {
  // listUsers no filtra por email; paginamos lo necesario
  let page = 1;
  while (page <= 20) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
  return null;
}

async function ensureLeader({ grupoId, email, nombre }) {
  const cleanEmail = email.trim().toLowerCase();
  const displayName = (nombre || '').trim() || `Lider ${cleanEmail}`;

  let user = await findAuthUserByEmail(cleanEmail);

  if (!user) {
    const { data, error } = await sb.auth.admin.createUser({
      email: cleanEmail,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nombre_completo: displayName },
    });
    if (error) throw error;
    user = data.user;
    console.log(`  + auth creado: ${cleanEmail}`);
  } else {
    const { error } = await sb.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { ...(user.user_metadata || {}), nombre_completo: displayName },
    });
    if (error) throw error;
    console.log(`  ~ auth reset password: ${cleanEmail}`);
  }

  const { error: profileError } = await sb.from('perfiles').upsert(
    {
      id: user.id,
      email: cleanEmail,
      rol: 'ADMIN_GRUPO',
      nombre_completo: displayName,
    },
    { onConflict: 'id' }
  );
  if (profileError) throw profileError;

  const { error: groupError } = await sb
    .from('grupos')
    .update({ id_lider: user.id })
    .eq('id', grupoId);
  if (groupError) throw groupError;

  // admin_grupos puede no existir en el schema desplegado; id_lider basta para /lider
  const { error: assignError } = await sb.from('admin_grupos').upsert(
    {
      usuario_id: user.id,
      grupo_id: grupoId,
      activo: true,
      asignado_por: user.id,
    },
    { onConflict: 'usuario_id,grupo_id', ignoreDuplicates: false }
  );
  if (assignError && !/Could not find the table|schema cache|PGRST/.test(assignError.message || '')) {
    throw assignError;
  }

  return user.id;
}

async function main() {
  console.log('Sync lideres por email_contacto...');
  console.log(`Password temporal: ${PASSWORD}`);

  const { data: grupos, error } = await sb
    .from('grupos')
    .select('id, nombre, email_contacto, lider_o_representante, estado_aprobacion')
    .order('nombre');

  if (error) throw error;

  const targets = (grupos || []).filter((g) => g.email_contacto && String(g.email_contacto).includes('@'));
  console.log(`Grupos con email: ${targets.length}/${grupos.length}`);

  const results = [];
  for (const g of targets) {
    console.log(`\n> ${g.nombre}`);
    try {
      const userId = await ensureLeader({
        grupoId: g.id,
        email: g.email_contacto,
        nombre: g.lider_o_representante || g.nombre,
      });
      results.push({ nombre: g.nombre, email: g.email_contacto, ok: true, userId });
    } catch (err) {
      console.error(`  x ${err.message || err}`);
      results.push({ nombre: g.nombre, email: g.email_contacto, ok: false, error: err.message });
    }
  }

  console.log('\nResumen');
  for (const r of results) {
    console.log(`${r.ok ? 'OK' : 'FAIL'} ${r.email} :: ${r.nombre}`);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
