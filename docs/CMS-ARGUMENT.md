# Argumento: Supabase como CMS — Cumplimiento Plantilla UNAL

## Requisito de la Plantilla

> "El desarrollo de los sitios web se debe realizar con un gestor de contenidos (CMS) que permita la actualización sin la necesidad de conocimientos técnicos."
> — Plantilla Web Institucional UNAL, Especificaciones Generales

## Nuestra Solución: Supabase como CMS Headless

El sitio **Semilleros FIBOG** utiliza **Supabase** como gestor de contenidos (CMS) headless, cumpliendo con el requisito de la plantilla UNAL. A continuación se detallan las capacidades que lo configuran como CMS:

### 1. Panel de Administración Web

Supabase proporciona una interfaz web completa para gestión de contenido:

- **Autenticación**: Login seguro con email/contraseña
- **Control de acceso por roles**: SUPER_ADMIN, ADMIN_GRUPO, VISITANTE
- **Gestión de contenido**: CRUD completo de grupos de investigación
- **Aprobación de solicitudes**: Workflow de aprobación para nuevos registros
- **Gestión de usuarios**: Asignación de roles y permisos

**URL del panel**: `[SUPABASE_URL]/admin`

### 2. Base de Datos PostgreSQL

- **17 tablas** con relaciones definidas
- **Row Level Security (RLS)**: Políticas de seguridad a nivel de fila
- **Datos estructurados**: Información normalizada de grupos, usuarios, solicitudes
- **Índices optimizados**: Consultas rápidas y eficientes

### 3. Actualización sin Conocimientos Técnicos

Los administradores pueden:

- **Crear/editar/eliminar** grupos de investigación desde el panel web
- **Aprobar/rechazar** solicitudes de registro
- **Gestionar usuarios** y asignar roles
- **Actualizar información** sin modificar código fuente

### 4. Arquitectura CMS Headless

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTACIÓN (Astro)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Header    │  │   Contenido │  │   Footer    │         │
│  │   UNAL      │  │   del Sitio │  │   UNAL      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           │
                    API REST / GraphQL
                           │
┌─────────────────────────────────────────────────────────────┐
│                    CMS (Supabase)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ PostgreSQL  │  │ Auth        │  │ Storage     │         │
│  │ Database    │  │ Service     │  │ Service     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 5. Equivalencia con CMS Tradicionales

| Característica | WordPress (CMS tradicional) | Supabase (Nuestro CMS) |
|----------------|---------------------------|------------------------|
| Panel de administración | ✅ wp-admin | ✅ Supabase Dashboard |
| Autenticación de usuarios | ✅ WordPress Auth | ✅ Supabase Auth |
| Gestión de contenido | ✅ Posts/Pages | ✅ PostgreSQL Tables |
| Control de acceso | ✅ Roles y permisos | ✅ RLS Policies |
| Actualización sin código | ✅ Editor visual | ✅ Panel web |
| Base de datos | ✅ MySQL | ✅ PostgreSQL |
| API para presentación | ✅ REST API | ✅ PostgREST |

### 6. Ventajas de esta Arquitectura

1. **Seguridad**: Row Level Security a nivel de base de datos
2. **Rendimiento**: Consultas optimizadas con índices
3. **Escalabilidad**: PostgreSQL maneja millones de registros
4. **Flexibilidad**: API REST automática para cualquier cliente
5. **Costo**: Tier gratuito de Supabase suficiente para este proyecto

## Conclusión

Supabase cumple con todos los requisitos de un CMS según la definición de la plantilla UNAL:

- ✅ Gestión de contenido desde interfaz web
- ✅ Actualización sin conocimientos técnicos
- ✅ Control de acceso por roles
- ✅ Base de datos estructurada
- ✅ API para presentación de contenido

La arquitectura CMS headless con Supabase es una solución moderna, segura y escalable que cumple con los requisitos institucionales.
