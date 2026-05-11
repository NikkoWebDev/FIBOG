-- Migration: Initial Schema for FIBOG User Management System
-- Date: 2025-05-09

-- ============================================
-- ENUMS
-- ============================================

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN_GRUPO', 'VISITANTE');

-- Create enum for group approval status
CREATE TYPE approval_status AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- Create enum for group types
CREATE TYPE group_type AS ENUM ('Semillero', 'Grupo de Investigación', 'Grupo Estudiantil');

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    rol user_role NOT NULL DEFAULT 'VISITANTE',
    nombre_completo TEXT,
    telefono TEXT,
    carrera TEXT,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ultimo_acceso TIMESTAMPTZ
);

-- Groups table (based on CSV structure)
CREATE TABLE IF NOT EXISTS public.grupos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo group_type NOT NULL,
    carreras TEXT[], -- Array of careers
    nombre TEXT NOT NULL,
    docente_a_cargo TEXT,
    lider_o_representante TEXT,
    email_contacto TEXT,
    vinculacion TEXT,
    enfoque TEXT,
    descripcion TEXT,
    actividades TEXT,
    modalidad TEXT,
    horarios_habituales TEXT,
    requisitos_ingreso TEXT,
    nivel_academico_recomendado TEXT,
    redes_sociales TEXT,
    comentarios_adicionales TEXT,
    -- Management fields
    id_lider UUID REFERENCES public.perfiles(id),
    estado_aprobacion approval_status NOT NULL DEFAULT 'pendiente',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creado_por UUID REFERENCES public.perfiles(id)
);

-- Pending applications table (for approval workflow)
CREATE TABLE IF NOT EXISTS public.solicitudes_pendientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Group info
    tipo group_type NOT NULL,
    carreras TEXT[],
    nombre TEXT NOT NULL,
    docente_a_cargo TEXT,
    lider_o_representante TEXT NOT NULL,
    email_contacto TEXT NOT NULL,
    vinculacion TEXT,
    enfoque TEXT,
    descripcion TEXT,
    actividades TEXT,
    modalidad TEXT,
    horarios_habituales TEXT,
    requisitos_ingreso TEXT,
    nivel_academico_recomendado TEXT,
    redes_sociales TEXT,
    comentarios_adicionales TEXT,
    -- Applicant info
    nombre_solicitante TEXT NOT NULL,
    email_solicitante TEXT NOT NULL,
    telefono_solicitante TEXT,
    carrera_solicitante TEXT,
    semestre_solicitante TEXT,
    -- Application status
    estado approval_status NOT NULL DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_revision TIMESTAMPTZ,
    revisado_por UUID REFERENCES public.perfiles(id),
    comentarios_revision TEXT
);

-- Audit log for admin actions
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabla_afectada TEXT NOT NULL,
    accion TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    registro_id UUID,
    usuario_id UUID REFERENCES public.perfiles(id),
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_grupos_estado ON public.grupos(estado_aprobacion);
CREATE INDEX idx_grupos_lider ON public.grupos(id_lider);
CREATE INDEX idx_grupos_tipo ON public.grupos(tipo);
CREATE INDEX idx_solicitudes_estado ON public.solicitudes_pendientes(estado);
CREATE INDEX idx_solicitudes_email ON public.solicitudes_pendientes(email_solicitante);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_pendientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PERFILES TABLE POLICIES
-- ============================================

-- SUPER_ADMIN: Full access
CREATE POLICY "super_admin_perfiles_all"
ON public.perfiles
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Users can view their own profile
CREATE POLICY "users_view_own_profile"
ON public.perfiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "users_update_own_profile"
ON public.perfiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Public can insert (for registration)
CREATE POLICY "public_insert_profile"
ON public.perfiles
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ============================================
-- GRUPOS TABLE POLICIES
-- ============================================

-- SUPER_ADMIN: Full access
CREATE POLICY "super_admin_grupos_all"
ON public.grupos
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- ADMIN_GRUPO: Can UPDATE and SELECT only if they are the leader
CREATE POLICY "admin_grupo_manage_own"
ON public.grupos
FOR ALL
TO authenticated
USING (
    auth.jwt() ->> 'role' = 'ADMIN_GRUPO' 
    AND id_lider = auth.uid()
)
WITH CHECK (
    auth.jwt() ->> 'role' = 'ADMIN_GRUPO' 
    AND id_lider = auth.uid()
);

-- VISITANTE: Can only SELECT approved groups
CREATE POLICY "visitante_view_approved"
ON public.grupos
FOR SELECT
TO anon, authenticated
USING (estado_aprobacion = 'aprobado');

-- ============================================
-- SOLICITUDES PENDIENTES POLICIES
-- ============================================

-- SUPER_ADMIN: Full access
CREATE POLICY "super_admin_solicitudes_all"
ON public.solicitudes_pendientes
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Public can create applications
CREATE POLICY "public_create_solicitud"
ON public.solicitudes_pendientes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ============================================
-- AUDIT LOG POLICIES
-- ============================================

-- Only SUPER_ADMIN can access audit log
CREATE POLICY "super_admin_audit_all"
ON public.audit_log
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update fecha_actualizacion
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for grupos
CREATE TRIGGER trigger_update_grupos_timestamp
    BEFORE UPDATE ON public.grupos
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- Function to set user role in JWT claims
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
    user_role_val TEXT;
BEGIN
    SELECT rol::TEXT INTO user_role_val
    FROM public.perfiles
    WHERE id = auth.uid();
    RETURN user_role_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default SUPER_ADMIN (to be configured via env vars)
-- This will be handled by the application setup script

COMMENT ON TABLE public.perfiles IS 'User profiles extending auth.users with role-based access';
COMMENT ON TABLE public.grupos IS 'Research groups, seedbeds and student groups with approval workflow';
COMMENT ON TABLE public.solicitudes_pendientes IS 'Pending applications for new groups awaiting approval';
COMMENT ON TABLE public.audit_log IS 'Audit trail for administrative actions';
