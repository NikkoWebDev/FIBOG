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
  typeof email === 'string' && email.trim().toLowerCase().endsWith('@unal.edu.co');

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as Partial<SolicitudInsert>;

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

    // Lista blanca: nunca insertar el body crudo (evita columnas inventadas
    // e imagen_url externas al bucket).
    const insertData = {
      tipo: body.tipo,
      carreras: body.carreras,
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
        JSON.stringify({ error: insertError.message || 'Error al guardar la solicitud' }),
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
          warning: `Solicitud guardada, pero Resend rechazo el correo: ${emailError.message || 'error desconocido'}`,
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
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
