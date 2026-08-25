import type { APIRoute } from 'astro';
import { createServerClient } from '../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Config faltante' }), { status: 500 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return new Response(JSON.stringify({ error: 'No auth' }), { status: 401 });

  // verificar usuario con anon
  const anonClient = createServerClient(supabaseUrl, anonKey);
  const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
  if (authErr || !user) return new Response(JSON.stringify({ error: 'Auth invalida' }), { status: 401 });

  const serviceClient = createServerClient(supabaseUrl, serviceKey);
  const { data: perfil } = await serviceClient.from('perfiles').select('rol').eq('id', user.id).single();
  if (!perfil || perfil.rol !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const { data, error } = await serviceClient
    .from('solicitudes_pendientes')
    .select('*')
    .eq('estado', 'pendiente')
    .order('fecha_solicitud', { ascending: false });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } });
};
