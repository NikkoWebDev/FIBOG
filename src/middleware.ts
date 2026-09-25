import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from './lib/supabase';

const PROTECTED_ROUTES = ['/admin', '/lider', '/perfil'];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (!isProtectedRoute(pathname)) {
    return next();
  }

  const accessToken = context.cookies.get('sb-access-token')?.value;
  const refreshToken = context.cookies.get('sb-refresh-token')?.value;

  if (!accessToken || !refreshToken) {
    return context.redirect('/login');
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Middleware: faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY');
    return context.redirect('/login');
  }

  const serverClient = createServerClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await serverClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    return context.redirect('/login');
  }

  const user = data.session.user;

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isLiderRoute = pathname === '/lider' || pathname.startsWith('/lider/');

  if (isAdminRoute || isLiderRoute) {
    const { data: profile, error: roleError } = await serverClient
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (roleError || !profile) {
      return context.redirect('/login');
    }

    const role = (profile as { rol: string }).rol;

    if (isAdminRoute) {
      if (role !== 'SUPER_ADMIN') {
        return context.redirect(role === 'ADMIN_GRUPO' ? '/lider' : '/');
      }
    }

    if (isLiderRoute) {
      if (role !== 'ADMIN_GRUPO' && role !== 'SUPER_ADMIN') {
        return context.redirect('/');
      }
    }
  }

  return next();
});
