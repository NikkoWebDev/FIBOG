import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { createServerClient } from '../../lib/supabase';

export const prerender = false;

type MailBody = {
  mode?: 'masivo' | 'normal';
  subject?: string;
  message?: string;
  to?: string | string[];
  html?: boolean;
};

function parseRecipients(to: MailBody['to']): string[] {
  if (!to) return [];
  if (Array.isArray(to)) {
    return to.map((e) => String(e).trim().toLowerCase()).filter(Boolean);
  }
  return String(to)
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'));
}

async function requireSuperAdmin(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return { error: 'No autorizado', status: 401 as const };

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return { error: 'Configuracion incompleta del servidor', status: 500 as const };
  }

  const userClient = createServerClient(supabaseUrl, anonKey);
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) {
    return { error: 'Sesion invalida', status: 401 as const };
  }

  const adminClient = createServerClient(supabaseUrl, serviceKey);
  const { data: profile } = await adminClient
    .from('perfiles')
    .select('rol, email')
    .eq('id', userData.user.id)
    .single();

  if (profile?.rol !== 'SUPER_ADMIN') {
    return { error: 'Solo SUPER_ADMIN', status: 403 as const };
  }

  return { adminClient, user: userData.user, profile };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const auth = await requireSuperAdmin(request);
    if ('error' in auth && auth.error) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = (await request.json()) as MailBody;
    const mode = body.mode === 'normal' ? 'normal' : 'masivo';
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();

    if (!subject || !message) {
      return new Response(JSON.stringify({ error: 'Asunto y mensaje son obligatorios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let recipients: string[] = [];

    if (mode === 'masivo') {
      const { data: grupos, error } = await auth.adminClient!
        .from('grupos')
        .select('email_contacto')
        .eq('estado_aprobacion', 'aprobado');

      if (error) throw error;

      recipients = Array.from(
        new Set(
          (grupos || [])
            .map((g) => (g.email_contacto || '').trim().toLowerCase())
            .filter((e) => e.includes('@'))
        )
      );
    } else {
      recipients = parseRecipients(body.to);
      if (recipients.length === 0) {
        return new Response(JSON.stringify({ error: 'Indique al menos un destinatario' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay destinatarios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = import.meta.env.RESEND_API_KEY;
    const fromEmail = import.meta.env.RESEND_FROM_EMAIL || 'correo nikko.dev <noreply@nikko.dev>';

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          error: 'RESEND_API_KEY no configurada',
          preview: { from: fromEmail, to: recipients, subject, message },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    const chunkSize = 40;
    const sent: string[] = [];
    const failed: { email: string; error: string }[] = [];

    for (let i = 0; i < recipients.length; i += chunkSize) {
      const chunk = recipients.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map(async (email) => {
          const payload = body.html
            ? { from: fromEmail, to: [email], subject, html: message }
            : { from: fromEmail, to: [email], subject, text: message };

          const { error } = await resend.emails.send(payload as any);
          if (error) {
            failed.push({ email, error: error.message || 'error' });
          } else {
            sent.push(email);
          }
        })
      );
      void results;
    }

    return new Response(
      JSON.stringify({
        success: failed.length === 0,
        mode,
        from: fromEmail,
        total: recipients.length,
        sent: sent.length,
        failed,
        message: `Enviados ${sent.length}/${recipients.length} desde correo nikko.dev`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('admin-mail error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
