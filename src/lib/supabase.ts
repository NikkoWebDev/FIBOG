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
