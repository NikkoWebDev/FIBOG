import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { createServerClient } from '../../lib/supabase';
import { extractStoragePath } from '../../lib/group-images';
import { normalizeUrl } from '../../lib/urls';
import type { Database } from '../../lib/database.types';

export const prerender = false;

type SolicitudInsert = Database['public']['Tables']['solicitudes_pendientes']['Insert'];

const REQUIRED_FIELDS: (keyof SolicitudInsert)[] = [
  'tipo',
  'nombre',
  'lider_o_representante',
  'email_contacto',
  'nombre_solicitante',
  'email_solicitante',
];

const isUnalEmail = (email: string): boolean =>
  typeof email === 'string' && /^[a-z0-9._%+-]+@unal\.edu\.co$/i.test(email.trim());

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const body = (await request.json()) as Partial<SolicitudInsert> & { website?: unknown };

    // Honeypot: los bots rellenan `website`; responder exito falso sin insertar
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return new Response(
        JSON.stringify({ success: true, message: 'Solicitud enviada exitosamente.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Required fields validation
    const missingFields = REQUIRED_FIELDS.filter((field) => {
      const value = body[field];
      return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          error: `Campos requeridos faltantes o vacíos: ${missingFields.join(', ')}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Email domain validation
    if (!isUnalEmail(body.email_solicitante!) || !isUnalEmail(body.email_contacto!)) {
      return new Response(
        JSON.stringify({
          error: 'El email del solicitante y el email de contacto deben ser cuentas @unal.edu.co',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const TIPOS_VALIDOS = ['Semillero', 'Grupo de Investigación', 'Grupo Estudiantil'];
    let tipo = typeof body.tipo === 'string' ? body.tipo.trim() : '';
    if (tipo === 'Grupo de Investigacion') tipo = 'Grupo de Investigación';
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return new Response(
        JSON.stringify({ error: 'Tipo inválido. Debe ser: Semillero, Grupo de Investigación o Grupo Estudiantil' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let carreras = (body as any).carreras as unknown;
    if (typeof carreras === 'string') {
      carreras = carreras.split(',').map((c) => c.trim()).filter(Boolean);
    }
    if (!Array.isArray(carreras) || carreras.length === 0 || !carreras.every((c) => typeof c === 'string' && c.trim())) {
      return new Response(
        JSON.stringify({ error: 'Carreras debe ser un array no-vacío de strings' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tooLong = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > max;
    if (tooLong(body.nombre, 200)) {
      return new Response(
        JSON.stringify({ error: 'El nombre no puede exceder 200 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const textFields = [
      'lider_o_representante', 'email_contacto', 'nombre_solicitante', 'email_solicitante',
      'docente_a_cargo', 'vinculacion', 'enfoque', 'descripcion', 'actividades',
      'modalidad', 'horarios_habituales', 'requisitos_ingreso', 'nivel_academico_recomendado',
      'redes_sociales', 'comentarios_adicionales', 'telefono_solicitante',
      'carrera_solicitante', 'semestre_solicitante',
    ] as const;
    for (const f of textFields) {
      if (tooLong((body as any)[f], 2000)) {
        return new Response(
          JSON.stringify({ error: `El campo ${f} no puede exceder 2000 caracteres` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Web/red social: opcional, pero si trae algo debe ser URL válida
    let redesSociales: string | null = null;
    if (body.redes_sociales) {
      redesSociales = normalizeUrl(body.redes_sociales);
      if (!redesSociales) {
        return new Response(
          JSON.stringify({
            error: 'El enlace web no es válido. Use una URL completa (ej: https://instagram.com/tu-grupo) o déjelo vacío.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Imagen: solo se aceptan archivos del bucket propio (no URLs externas arbitrarias)
    const imagenUrl =
      body.imagen_url && extractStoragePath(String(body.imagen_url)) ? String(body.imagen_url) : null;

    // Insert into Supabase using service role key
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY or PUBLIC_SUPABASE_URL');
      return new Response(
        JSON.stringify({ error: 'Error de configuración del servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const serverClient = createServerClient(supabaseUrl, serviceRoleKey);

    // Rate-limit: 10 solicitudes/hora por IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = (forwarded?.split(',')[0]?.trim() || clientAddress || 'unknown');
    const rateKey = `notify:${ip}`;
    const WINDOW_MS = 60 * 60 * 1000;

    const { data: bucket, error: rateError } = await serverClient
      .from('rate_limits')
      .select('key, count, window_start')
      .eq('key', rateKey)
      .maybeSingle();

    if (rateError) {
      console.error('Error checking rate limit:', rateError);
    } else if (!bucket) {
      await serverClient.from('rate_limits').insert({ key: rateKey, count: 1 });
    } else if (Date.now() - new Date(bucket.window_start).getTime() > WINDOW_MS) {
      await serverClient
        .from('rate_limits')
        .update({ count: 1, window_start: new Date().toISOString() })
        .eq('key', rateKey);
    } else {
      const next = bucket.count + 1;
      await serverClient
        .from('rate_limits')
        .update({ count: next })
        .eq('key', rateKey);
      if (next > 10) {
        return new Response(
          JSON.stringify({ error: 'Demasiadas solicitudes, intenta en una hora' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Lista blanca: nunca insertar el body crudo (evita columnas inventadas
    // e imagen_url externas al bucket).
    const insertData = {
      tipo,
      carreras: carreras as string[],
      nombre: body.nombre,
      docente_a_cargo: body.docente_a_cargo ?? null,
      lider_o_representante: body.lider_o_representante,
      email_contacto: body.email_contacto,
      vinculacion: body.vinculacion ?? null,
      enfoque: body.enfoque ?? null,
      descripcion: body.descripcion ?? null,
      actividades: body.actividades ?? null,
      modalidad: body.modalidad ?? null,
      horarios_habituales: body.horarios_habituales ?? null,
      requisitos_ingreso: body.requisitos_ingreso ?? null,
      nivel_academico_recomendado: body.nivel_academico_recomendado ?? null,
      redes_sociales: redesSociales,
      comentarios_adicionales: body.comentarios_adicionales ?? null,
      nombre_solicitante: body.nombre_solicitante,
      email_solicitante: body.email_solicitante,
      telefono_solicitante: body.telefono_solicitante ?? null,
      carrera_solicitante: body.carrera_solicitante ?? null,
      semestre_solicitante: body.semestre_solicitante ?? null,
      imagen_url: imagenUrl,
      estado: 'pendiente' as const,
      fecha_solicitud: new Date().toISOString(),
    } as SolicitudInsert;

    const { data: insertedRows, error: insertError } = await serverClient
      .from('solicitudes_pendientes')
      .insert(insertData)
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting solicitud:', insertError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar la solicitud' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Collect admin emails
    const { data: admins, error: adminsError } = await serverClient
      .from('perfiles')
      .select('email')
      .eq('rol', 'SUPER_ADMIN');

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
    }

    const adminEmails = new Set<string>();

    admins?.forEach((admin) => {
      if (admin.email) adminEmails.add(admin.email.trim().toLowerCase());
    });

    [
      import.meta.env.ADMIN_EMAIL_1,
      import.meta.env.ADMIN_EMAIL_2,
      import.meta.env.SUPER_ADMIN_EMAIL_1,
      import.meta.env.SUPER_ADMIN_EMAIL_2,
    ].forEach((email) => {
      if (typeof email === 'string' && email.trim()) {
        adminEmails.add(email.trim().toLowerCase());
      }
    });

    const siteUrl = import.meta.env.SITE_URL || 'https://semilleros-fibog.vercel.app';
    const fromEmail = import.meta.env.RESEND_FROM_EMAIL || 'Base de Datos Ingenieria <noreply@nikko.dev>';
    const nombre = String(body.nombre).trim();

    const emailSubject = `Nueva solicitud: ${nombre}`;
    const emailBody = `
Nueva solicitud de registro de grupo

Detalles de la solicitud:
------------------------
Tipo: ${body.tipo}
Nombre: ${nombre}
Enfoque: ${body.enfoque || 'No especificado'}

Solicitante:
-----------
Nombre: ${body.nombre_solicitante}
Email: ${body.email_solicitante}
Teléfono: ${body.telefono_solicitante || 'No especificado'}
Carrera: ${body.carrera_solicitante || 'No especificada'}
Semestre: ${body.semestre_solicitante || 'No especificado'}

Fecha de solicitud: ${new Date().toLocaleString('es-CO')}

Acciones:
--------
Revisar solicitud: ${siteUrl}/admin

---
Este es un mensaje automático del sistema Base de Datos Ingenieria.
    `.trim();

    const resendApiKey = import.meta.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.log('RESEND_API_KEY no configurado. Contenido del email:');
      console.log('Para:', Array.from(adminEmails).join(', ') || 'Sin destinatarios');
      console.log('Asunto:', emailSubject);
      console.log('Cuerpo:', emailBody);

      return new Response(
        JSON.stringify({
          success: true,
          id: insertedRows?.id,
          message: 'Solicitud recibida. Notificación por email no enviada (sin configurar).',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (adminEmails.size === 0) {
      console.log('No hay emails de administradores configurados. Contenido del email:');
      console.log('Asunto:', emailSubject);
      console.log('Cuerpo:', emailBody);

      return new Response(
        JSON.stringify({
          success: true,
          id: insertedRows?.id,
          message: 'Solicitud recibida, pero no hay administradores configurados para notificar.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: Array.from(adminEmails),
      subject: emailSubject,
      text: emailBody,
      replyTo: String(body.email_solicitante).trim(),
    });

    if (emailError) {
      console.error('Error enviando email con Resend:', emailError);
      return new Response(
        JSON.stringify({
          success: true,
          id: insertedRows?.id,
          warning: 'Solicitud guardada, notificación por email pendiente.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: insertedRows?.id,
        message: 'Solicitud enviada exitosamente.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Notify API error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
