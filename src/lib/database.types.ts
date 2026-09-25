export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: {
          carrera: string | null
          email: string
          es_admin_multi_grupo: boolean | null
          fecha_registro: string
          id: string
          nombre_completo: string | null
          rol: Database["public"]["Enums"]["user_role"]
          telefono: string | null
          ultimo_acceso: string | null
        }
        Insert: {
          carrera?: string | null
          email: string
          es_admin_multi_grupo?: boolean | null
          fecha_registro?: string
          id: string
          nombre_completo?: string | null
          rol?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          ultimo_acceso?: string | null
        }
        Update: {
          carrera?: string | null
          email?: string
          es_admin_multi_grupo?: boolean | null
          fecha_registro?: string
          id?: string
          nombre_completo?: string | null
          rol?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          ultimo_acceso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          actividades: string | null
          carreras: string[] | null
          comentarios_adicionales: string | null
          creado_por: string | null
          descripcion: string | null
          docente_a_cargo: string | null
          email_contacto: string | null
          enfoque: string | null
          estado_aprobacion: Database["public"]["Enums"]["approval_status"]
          fecha_actualizacion: string
          fecha_creacion: string
          horarios_habituales: string | null
          id: string
          id_lider: string | null
          imagen_url: string | null
          lider_o_representante: string | null
          modalidad: string | null
          nivel_academico_recomendado: string | null
          nombre: string
          redes_sociales: string | null
          requisitos_ingreso: string | null
          tipo: Database["public"]["Enums"]["group_type"]
          vinculacion: string | null
        }
        Insert: {
          actividades?: string | null
          carreras?: string[] | null
          comentarios_adicionales?: string | null
          creado_por?: string | null
          descripcion?: string | null
          docente_a_cargo?: string | null
          email_contacto?: string | null
          enfoque?: string | null
          estado_aprobacion?: Database["public"]["Enums"]["approval_status"]
          fecha_actualizacion?: string
          fecha_creacion?: string
          horarios_habituales?: string | null
          id?: string
          id_lider?: string | null
          imagen_url?: string | null
          lider_o_representante?: string | null
          modalidad?: string | null
          nivel_academico_recomendado?: string | null
          nombre: string
          redes_sociales?: string | null
          requisitos_ingreso?: string | null
          tipo: Database["public"]["Enums"]["group_type"]
          vinculacion?: string | null
        }
        Update: {
          actividades?: string | null
          carreras?: string[] | null
          comentarios_adicionales?: string | null
          creado_por?: string | null
          descripcion?: string | null
          docente_a_cargo?: string | null
          email_contacto?: string | null
          enfoque?: string | null
          estado_aprobacion?: Database["public"]["Enums"]["approval_status"]
          fecha_actualizacion?: string
          fecha_creacion?: string
          horarios_habituales?: string | null
          id?: string
          id_lider?: string | null
          imagen_url?: string | null
          lider_o_representante?: string | null
          modalidad?: string | null
          nivel_academico_recomendado?: string | null
          nombre?: string
          redes_sociales?: string | null
          requisitos_ingreso?: string | null
          tipo?: Database["public"]["Enums"]["group_type"]
          vinculacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grupos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_id_lider_fkey"
            columns: ["id_lider"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_pendientes: {
        Row: {
          actividades: string | null
          carrera_solicitante: string | null
          carreras: string[] | null
          comentarios_adicionales: string | null
          comentarios_revision: string | null
          imagen_url: string | null
          descripcion: string | null
          docente_a_cargo: string | null
          email_contacto: string
          email_solicitante: string
          enfoque: string | null
          estado: Database["public"]["Enums"]["approval_status"]
          fecha_revision: string | null
          fecha_solicitud: string
          horarios_habituales: string | null
          id: string
          lider_o_representante: string
          modalidad: string | null
          nivel_academico_recomendado: string | null
          nombre: string
          nombre_solicitante: string
          redes_sociales: string | null
          requisitos_ingreso: string | null
          revisado_por: string | null
          semestre_solicitante: string | null
          telefono_solicitante: string | null
          tipo: Database["public"]["Enums"]["group_type"]
          vinculacion: string | null
        }
        Insert: {
          actividades?: string | null
          carrera_solicitante?: string | null
          carreras?: string[] | null
          comentarios_adicionales?: string | null
          comentarios_revision?: string | null
          imagen_url?: string | null
          descripcion?: string | null
          docente_a_cargo?: string | null
          email_contacto: string
          email_solicitante: string
          enfoque?: string | null
          estado?: Database["public"]["Enums"]["approval_status"]
          fecha_revision?: string | null
          fecha_solicitud?: string
          horarios_habituales?: string | null
          id?: string
          lider_o_representante: string
          modalidad?: string | null
          nivel_academico_recomendado?: string | null
          nombre: string
          nombre_solicitante: string
          redes_sociales?: string | null
          requisitos_ingreso?: string | null
          revisado_por?: string | null
          semestre_solicitante?: string | null
          telefono_solicitante?: string | null
          tipo: Database["public"]["Enums"]["group_type"]
          vinculacion?: string | null
        }
        Update: {
          actividades?: string | null
          carrera_solicitante?: string | null
          carreras?: string[] | null
          comentarios_adicionales?: string | null
          comentarios_revision?: string | null
          imagen_url?: string | null
          descripcion?: string | null
          docente_a_cargo?: string | null
          email_contacto?: string
          email_solicitante?: string
          enfoque?: string | null
          estado?: Database["public"]["Enums"]["approval_status"]
          fecha_revision?: string | null
          fecha_solicitud?: string
          horarios_habituales?: string | null
          id?: string
          lider_o_representante?: string
          modalidad?: string | null
          nivel_academico_recomendado?: string | null
          nombre?: string
          nombre_solicitante?: string
          redes_sociales?: string | null
          requisitos_ingreso?: string | null
          revisado_por?: string | null
          semestre_solicitante?: string | null
          telefono_solicitante?: string | null
          tipo?: Database["public"]["Enums"]["group_type"]
          vinculacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_pendientes_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_grupos: {
        Row: {
          activo: boolean
          asignado_por: string | null
          fecha_asignacion: string
          grupo_id: string
          id: string
          usuario_id: string
        }
        Insert: {
          activo?: boolean
          asignado_por?: string | null
          fecha_asignacion?: string
          grupo_id: string
          id?: string
          usuario_id: string
        }
        Update: {
          activo?: boolean
          asignado_por?: string | null
          fecha_asignacion?: string
          grupo_id?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_grupos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_grupos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_grupos_asignado_por_fkey"
            columns: ["asignado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          accion: string
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          fecha: string
          id: string
          registro_id: string | null
          tabla_afectada: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          fecha?: string
          id?: string
          registro_id?: string | null
          tabla_afectada: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          fecha?: string
          id?: string
          registro_id?: string | null
          tabla_afectada?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          key: string
          count: number
          window_start: string
        }
        Insert: {
          key: string
          count?: number
          window_start?: string
        }
        Update: {
          key?: string
          count?: number
          window_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin_of_group: {
        Args: { group_id: string }
        Returns: boolean
      }
      get_manageable_groups: {
        Args: Record<PropertyKey, never>
        Returns: {
          grupo_id: string
          grupo_nombre: string
          tipo: string
        }[]
      }
      assign_admin_to_group: {
        Args: {
          target_usuario_id: string
          target_grupo_id: string
          asignado_por_uuid?: string
        }
        Returns: boolean
      }
      remove_admin_from_group: {
        Args: { target_usuario_id: string; target_grupo_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      approval_status: "pendiente" | "aprobado" | "rechazado"
      group_type: "Semillero" | "Grupo de Investigación" | "Grupo Estudiantil"
      user_role: "SUPER_ADMIN" | "ADMIN_GRUPO" | "VISITANTE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
