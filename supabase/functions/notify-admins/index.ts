// Supabase Edge Function: notify-admins
// Triggered when a new solicitud_pendiente is inserted
// Sends email notifications to SUPER_ADMIN users

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the request body (webhook payload)
    const { record } = await req.json();
    
    if (!record || record.estado !== 'pendiente') {
      return new Response(
        JSON.stringify({ message: 'No action needed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get SUPER_ADMIN email addresses
    const { data: admins, error: adminsError } = await supabaseClient
      .from('perfiles')
      .select('email')
      .eq('rol', 'SUPER_ADMIN');

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
      throw adminsError;
    }

    // Also check environment variables for admin emails
    const envAdmin1 = Deno.env.get('SUPER_ADMIN_EMAIL_1');
    const envAdmin2 = Deno.env.get('SUPER_ADMIN_EMAIL_2');

    const adminEmails = new Set<string>();
    
    // Add from database
    admins?.forEach(admin => {
      if (admin.email) adminEmails.add(admin.email);
    });
    
    // Add from environment
    if (envAdmin1) adminEmails.add(envAdmin1);
    if (envAdmin2) adminEmails.add(envAdmin2);

    if (adminEmails.size === 0) {
      console.log('No admin emails configured');
      return new Response(
        JSON.stringify({ message: 'No admin emails configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare email content
    const emailSubject = `Nueva solicitud: ${record.nombre}`;
    const emailBody = `
Nueva solicitud de registro de grupo

Detalles de la solicitud:
------------------------
Tipo: ${record.tipo}
Nombre: ${record.nombre}
Enfoque: ${record.enfoque || 'No especificado'}

Solicitante:
-----------
Nombre: ${record.nombre_solicitante}
Email: ${record.email_solicitante}
Teléfono: ${record.telefono_solicitante || 'No especificado'}
Carrera: ${record.carrera_solicitante || 'No especificada'}
Semestre: ${record.semestre_solicitante || 'No especificado'}

Fecha de solicitud: ${new Date(record.fecha_solicitud).toLocaleString('es-CO')}

Acciones:
--------
Revisar solicitud: ${Deno.env.get('SITE_URL') || 'https://fibog.vercel.app'}/admin

---
Este es un mensaje automático del sistema FIBOG UNAL.
    `;

    // Send emails using Supabase Auth API or external service
    // For now, we log the email content (in production, integrate with Resend, SendGrid, etc.)
    console.log(`Sending notification to ${adminEmails.size} admins:`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`Body: ${emailBody}`);

    // Example: Using a hypothetical email service
    // const emailResults = await Promise.all(
    //   Array.from(adminEmails).map(email => 
    //     sendEmail(email, emailSubject, emailBody)
    //   )
    // );

    // For now, return success
    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification prepared for ${adminEmails.size} administrators`,
        admins: Array.from(adminEmails),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in notify-admins function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Helper function to send email (placeholder for actual implementation)
async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  // Implement with your email provider:
  // - Resend: https://resend.com
  // - SendGrid: https://sendgrid.com
  // - AWS SES
  // - etc.
  
  // Example with fetch to an email API:
  // const response = await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     from: 'FIBOG UNAL <noreply@fibog.unal.edu.co>',
  //     to,
  //     subject,
  //     text: body,
  //   }),
  // });
  
  // return response.ok;
  
  console.log(`Email to ${to}: ${subject}`);
  return true;
}
