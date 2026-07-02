# Presentación: Semilleros FIBOG — Cumplimiento Plantilla UNAL

## Resumen Ejecutivo

El sitio **Semilleros FIBOG** es un catálogo web de semilleros, grupos de investigación y comunidades estudiantiles de la Facultad de Ingeniería - Universidad Nacional de Colombia (Bogotá).

**Estado**: Implementado según plantilla web institucional UNAL.

## Arquitectura Técnica

| Componente | Tecnología | Función |
|------------|------------|---------|
| Frontend | Astro 4.x | Framework estático |
| CMS | Supabase | Gestión de contenido |
| Base de datos | PostgreSQL 17 | Almacenamiento |
| Estilos | Tailwind CSS | Diseño responsive |
| Hosting | Netlify | Despliegue |

## Cumplimiento Plantilla UNAL

### ✅ Cabezote (Header)

- **Escudo UNAL**: Enlaza a unal.edu.co
- **Título**: "UNIVERSIDAD NACIONAL DE COLOMBIA"
- **URL del sitio**: semilleros.fibog.unal.edu.co
- **Menú de perfiles**: 5 tipos (Aspirantes, Estudiantes, Egresados, Docentes, Administrativos)
- **Menú principal**: 5 items (máximo 6 permitidos)
- **Buscador nacional**: Implementado
- **Escudo de Colombia**: Presente
- **Redes sociales**: 4 íconos (Web, Instagram, YouTube, Twitter/X)
- **Menú de idioma**: ES | EN

### ✅ Panel de Accesibilidad

- **Tamaño de letra**: Incrementos del 10%, hasta 200%
- **Contraste**: 3 modos (Normal, Alto, Bajo)
- **Invertir colores**: Filtro CSS
- **Restablecer**: Botón de restablecimiento

### ✅ Pestaña de Servicios

- **Correo institucional**: Primer elemento
- **DNINFOA - SIA**: Presente
- **Bibliotecas**: Presente
- **Convocatorias**: Presente
- **Identidad UNAL**: Presente

### ✅ Contenido

- **Breadcrumb**: En todas las páginas internas
- **Inicio**: Enlaza al home del sitio
- **Comunicación uniforme**: Colores consistentes
- **Responsive**: Mobile-first

### ✅ Pie de Página (Footer)

- **Gobierno en Línea**: 5 enlaces obligatorios (no modificables)
- **Información nacional**: 4 enlaces
- **Contacto**: Dirección, teléfono, correo
- **Acerca de este sitio**: Créditos
- **Actualización**: Fecha automática
- **Copyright**: © 2014
- **Derechos**: "Algunos derechos reservados"
- **Enlaces institucionales**: 4 íconos
- **Escudo UNAL**: Presente

## CMS: Supabase

El sitio utiliza **Supabase** como gestor de contenidos (CMS) headless:

- **Panel de administración**: Interfaz web para gestión de contenido
- **Autenticación**: Login seguro con email/contraseña
- **Control de acceso**: Roles SUPER_ADMIN, ADMIN_GRUPO, VISITANTE
- **Base de datos**: PostgreSQL con Row Level Security
- **Actualización sin código**: Panel web para administradores

## Funcionalidades Principales

1. **Catálogo de grupos**: 13 grupos de investigación con información detallada
2. **Búsqueda IA**: Búsqueda semántica con OpenRouter API
3. **Registro de grupos**: Formulario de 3 pasos
4. **Panel de administración**: Gestión de grupos, solicitudes, usuarios
5. **Panel de líder**: Edición de grupos asignados
6. **Perfiles de usuario**: Información personal y roles

## Seguridad

- **Row Level Security**: Políticas a nivel de base de datos
- **Autenticación**: Supabase Auth
- **Control de acceso**: Roles y permisos
- **HTTPS**: Certificado SSL automático

## Rendimiento

- **Build time**: ~3 segundos
- **Páginas generadas**: 20
- **Tamaño**: Optimizado para carga rápida
- **CDN**: Netlify Edge Network

## Próximos Pasos

1. **Revisión institucional**: Presentar a la DNED
2. **Configuración de dominio**: .unal.edu.co
3. **Contenido real**: Cargar datos de grupos
4. **Capacitación**: Entrenar administradores

## Contacto

- **Desarrollador**: Facultad de Ingeniería - UNAL Bogotá
- **Correo**: semilleros.fibog@unal.edu.co
- **URL**: semilleros.fibog.unal.edu.co

---

**Documento preparado para revisión institucional.**
