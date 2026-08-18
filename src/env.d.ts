/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_BASE_URL: string;
  readonly OPENROUTER_MODEL: string;
  readonly PUBLIC_API_URL: string;

  // Supabase
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;

  // Email (Resend)
  readonly RESEND_API_KEY: string | undefined;
  readonly RESEND_FROM_EMAIL: string | undefined;

  // Admin notification emails
  readonly ADMIN_EMAIL_1: string | undefined;
  readonly ADMIN_EMAIL_2: string | undefined;
  readonly SUPER_ADMIN_EMAIL_1: string | undefined;
  readonly SUPER_ADMIN_EMAIL_2: string | undefined;

  // Public site URL
  readonly SITE_URL: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
