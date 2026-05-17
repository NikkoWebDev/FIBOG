import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Validate that real Supabase credentials are configured (not placeholders)
if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
  console.error(
    '❌ SUPABASE ERROR: PUBLIC_SUPABASE_URL is not configured correctly.\n' +
    'Current value:', supabaseUrl, '\n' +
    'Set the correct Supabase URL in your .env file or Netlify environment variables.'
  );
}
if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
  console.error(
    '❌ SUPABASE ERROR: PUBLIC_SUPABASE_ANON_KEY is not configured correctly.\n' +
    'Set the correct Supabase anon key in your .env file or Netlify environment variables.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Server-side client (for API routes)
export const createServerClient = (url: string, key: string) => {
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Helper function to get user role
export async function getUserRole() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
    
  return profile?.rol || 'VISITANTE';
}

// Helper to check if user is SUPER_ADMIN
export async function isSuperAdmin() {
  const role = await getUserRole();
  return role === 'SUPER_ADMIN';
}

// Helper to check if user is ADMIN_GRUPO
export async function isAdminGrupo() {
  const role = await getUserRole();
  return role === 'ADMIN_GRUPO';
}

// Helper to check if user is LIDER_GRUPO
export async function isLiderGrupo() {
  const role = await getUserRole();
  return role === 'LIDER_GRUPO';
}

// Helper to check if user can manage a specific group
export async function canManageGroup(groupId: string) {
  const role = await getUserRole();
  if (role === 'SUPER_ADMIN') return true;
  
  if (role === 'ADMIN_GRUPO') {
    const { data, error } = await supabase
      .from('admin_grupos')
      .select('*')
      .eq('usuario_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('grupo_id', groupId)
      .eq('activo', true)
      .single();
    return !error && data;
  }
  
  if (role === 'LIDER_GRUPO') {
    const { data, error } = await supabase
      .from('grupos')
      .select('id_lider')
      .eq('id', groupId)
      .single();
    return !error && data?.id_lider === (await supabase.auth.getUser()).data.user?.id;
  }
  
  return false;
}

// Helper to get all groups a user can manage
export async function getManageableGroups() {
  const { data, error } = await supabase.rpc('get_manageable_groups');
  if (error) {
    console.error('Error getting manageable groups:', error);
    return [];
  }
  return data;
}

// Helper to assign admin to group (SUPER_ADMIN only)
export async function assignAdminToGroup(usuarioId: string, grupoId: string) {
  const { data, error } = await supabase.rpc('assign_admin_to_group', {
    target_usuario_id: usuarioId,
    target_grupo_id: grupoId
  });
  if (error) {
    console.error('Error assigning admin to group:', error);
    return { success: false, error };
  }
  return { success: true, data };
}

// Helper to remove admin from group (SUPER_ADMIN only)
export async function removeAdminFromGroup(usuarioId: string, grupoId: string) {
  const { data, error } = await supabase.rpc('remove_admin_from_group', {
    target_usuario_id: usuarioId,
    target_grupo_id: grupoId
  });
  if (error) {
    console.error('Error removing admin from group:', error);
    return { success: false, error };
  }
  return { success: true, data };
}

// Helper to get group admins
export async function getGroupAdmins(grupoId: string) {
  const { data, error } = await supabase
    .from('admin_grupos')
    .select(`
      *,
      perfiles (
        id,
        nombre_completo,
        email,
        rol
      )
    `)
    .eq('grupo_id', grupoId)
    .eq('activo', true);
  
  if (error) {
    console.error('Error getting group admins:', error);
    return [];
  }
  return data;
}

// Helper to get user's admin assignments
export async function getUserAdminAssignments(usuarioId: string) {
  const { data, error } = await supabase
    .from('admin_grupos')
    .select(`
      *,
      grupos (
        id,
        nombre,
        tipo
      )
    `)
    .eq('usuario_id', usuarioId)
    .eq('activo', true);
  
  if (error) {
    console.error('Error getting user admin assignments:', error);
    return [];
  }
  return data;
}
