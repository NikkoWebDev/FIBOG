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

  const email = data.session.user.email;

  if (!email || !email.toLowerCase().endsWith('@unal.edu.co')) {
    return context.redirect('/login');
  }

  return next();
});
