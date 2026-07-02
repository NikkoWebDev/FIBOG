# CLAUDE.md — Semilleros UNAL (FIBOG)

Catálogo web de semilleros, grupos de investigación y comunidades estudiantiles de la Facultad de Ingeniería - Universidad Nacional de Colombia (Bogotá).

## Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Astro (SSG) | ^4.16.19 |
| Estilos | Tailwind CSS | ^3.4.19 |
| Lenguaje | TypeScript (strict) | via Astro |
| Backend | Supabase (PostgreSQL 17) | @supabase/supabase-js ^2.105.4 |
| IA Search | OpenRouter API | liquid/lfm-2.5-1.2b-instruct:free |
| Animaciones | GSAP + ScrollTrigger | CDN v3.12.2 |
| Iconos | Material Symbols Outlined | Google Fonts |
| Hosting | Netlify (static + functions) | Node 20 |

## Comandos

```bash
npm run dev          # Desarrollo en http://localhost:4321
npm run build        # Build de producción
npm run preview      # Preview del build
npx astro check      # Type checking
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes Astro reutilizables
│   ├── Navbar.astro     # Navegación desktop (floating) + mobile (bottom)
│   ├── AISearch.astro   # Barra de búsqueda IA con OpenRouter
│   ├── BentoCard.astro  # Tarjeta individual de grupo
│   ├── BentoGrid.astro  # Grid responsivo con animación fade-in
│   ├── FilterBar.astro  # Filtros por tipo y carrera
│   ├── Footer.astro     # Footer con enlaces
│   └── GrupoModal.astro # Modal detalle (no usado actualmente)
├── data/
│   ├── grupos.json      # Datos estáticos: 13 grupos
│   └── grupos.types.ts  # Tipos TS + helpers de filtrado
├── layouts/
│   └── Layout.astro     # Layout base HTML
├── lib/
│   ├── supabase.ts      # Cliente Supabase + helpers de roles
│   └── database.types.ts # Tipos generados de la DB
├── pages/
│   ├── index.astro      # Página principal: hero, IA search, filtros, grid
│   ├── login.astro      # Login con redirect por rol
│   ├── registro.astro   # Formulario de registro de grupos (3 pasos)
│   ├── admin.astro      # Panel SUPER_ADMIN (1023 líneas)
│   ├── lider.astro      # Panel ADMIN_GRUPO
│   ├── perfil.astro     # Perfil de usuario
│   ├── privacidad.astro # Política de privacidad
│   ├── grupo/[id].astro # Detalle SSG de grupo
│   └── api/search.ts    # API route para búsqueda IA
├── styles/
│   └── global.css       # Estilos globales, glassmorphism, light/dark mode
└── env.d.ts             # Definición de tipos de env vars
```

## Identidad Visual UNAL

El sitio usa el **kit de diseño oficial UNAL** (Extraído de `gestionapp.unal.edu.co/cdn/doc/`):

### Paleta de Colores (Light Mode)

| Rol | Hex | Uso |
|-----|-----|-----|
| **Primary** | `#677d29` | Verde oliva UNAL, botones principales |
| Primary Light | `#94b43b` | Hover states |
| Primary Lighter | `#a9c362`, `#c0d881` | Superficies sutiles |
| **Secondary** | `#284d21` | Verde oscuro, acentos fuertes |
| **Tertiary Blue** | `#00566f` | Azul institucional, links |
| Tertiary Blue Light | `#0082a9`, `#2ba6cb` | Info states |
| **Neutral** | `#3d4041` | Texto principal |
| Neutral Light | `#787b7d`, `#a2a3a4` | Texto secundario |
| Neutral Lighter | `#cccccc`, `#dcdcdc` | Bordes, dividers |
| **Success** | `#1a784b` | Estados de éxito |
| **Danger** | `#aa0c00` | Errores |
| **Warning** | `#8c6800` | Advertencias |

### Paleta Dark Mode (Invertida)

| Rol | Hex |
|-----|-----|
| Background | `#151717` (neutral-10) |
| Surface | `#242627` (neutral-20) |
| Surface High | `#3d4041` (neutral-40) |
| Text Primary | `#ffffff` (neutral-0) |
| Text Secondary | `#a2a3a4` (neutral-60) |
| Primary (invertido) | `#c0d881` (primary-80) |
| Tertiary Blue (invertido) | `#4fc5e9` (tertiary-blue-40) |

### Tipografía

- **Cuerpo:** Ancizar Sans (fuente oficial UNAL)
- **Fallbacks:** system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
- **Monospace:** SFMono-Regular, Menlo, Monaco, Consolas, monospace

### Elementos de Marca

- **Escudo UNAL:** `https://identidad.unal.edu.co/fileadmin/templates/images/escudoUnal.png`
- **Logosímbolo:** Disponible en la guía de identidad
- **Marca Nominativa:** "Universidad Nacional de Colombia"
- **Tipografía institucional:** Ancízar Sans

### Fuentes de Datos del Design System

- CSS Kit: `https://gestionapp.unal.edu.co/cdn/kitUnal/12112024/css/kitUnal.min.css`
- Tema: `https://gestionapp.unal.edu.co/cdn/kitUnal/12112024/css/themes/main.min.css`
- Guía visual: `https://identidad.unal.edu.co/`
- Kit apps: `https://gestionapp.unal.edu.co/cdn/doc/`

## Roles y Permisos

| Rol | Panel | Permisos |
|-----|-------|----------|
| `SUPER_ADMIN` | `/admin` | CRUD completo, aprobar solicitudes, gestionar usuarios |
| `ADMIN_GRUPO` | `/lider` | Editar datos de su grupo asignado |
| `VISITANTE` | `/` | Ver grupos aprobados, enviar solicitud de registro |

## Base de Datos (Supabase)

### Tablas

- `perfiles` — Perfiles de usuario (extiende auth.users)
- `grupos` — Grupos de investigación (con workflow de aprobación)
- `solicitudes_pendientes` — Solicitudes de registro pendientes
- `admin_grupos` — Relación many-to-many usuario-grupo admin
- `audit_log` — Registro de auditoría de acciones admin

### Funciones RPC

- `get_my_role()` — Obtiene el rol del usuario actual
- `is_admin_of_group(uuid)` — Verifica si es admin de un grupo
- `get_manageable_groups()` — Lista grupos que puede gestionar
- `assign_admin_to_group(user_id, group_id)` — Asigna admin
- `remove_admin_from_group(user_id, group_id)` — Remueve admin

## Variables de Entorno

```env
# OpenRouter (IA Search)
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=liquid/lfm-2.5-1.2b-instruct:free

# Supabase
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin
ADMIN_EMAIL_1=
ADMIN_EMAIL_2=
```

## Deploy

- **Plataforma:** Netlify (estático + serverless functions)
- **Build:** `npm run build` → `dist/`
- **Redirects:** `/api/search` → `/.netlify/functions/search`
- **Dominio objetivo:** `.unal.edu.co`

## Plantilla Web Institucional UNAL

El sitio **debe** seguir la plantilla web oficial con 5 áreas obligatorias:

### 1. Cabezote (Header)
- Escudo UNAL → enlaza a unal.edu.co
- Texto "UNIVERSIDAD NACIONAL DE COLOMBIA"
- URL del sitio: `subdominio.unal.edu.co`
- Menú de perfiles (Aspirantes, Estudiantes, Egresados, Docentes, Administrativos)
- Menú principal (máx 6 items primer nivel)
- Buscador nacional
- Escudo de Colombia
- Iconos redes sociales (máx 4)
- Menú de idioma

### 2. Panel de Accesibilidad
- Flotante: tamaño de letra, contrastes, invertir colores

### 3. Pestaña de Servicios
- Correo institucional, DNINFOA, Bibliotecas, Convocatorias, Identidad UNAL

### 4. Contenido
- Breadcrumb obligatorio en páginas internas
- Layout flexible según nivel (nacional/sede/facultad)

### 5. Pie de Página (Footer)
- Menú Gobierno en Línea (Régimen Legal, Contratación, etc.)
- Información nacional obligatoria
- Contacto del responsable
- © Copyright + "Algunos derechos reservados"
- Enlaces: Orgullo UNAL, Agencia UNAL, Colombia

### Paleta Oficial UNAL

| Color | Hex | Uso |
|-------|-----|-----|
| Institucional | `#94B43B` | Color principal |
| Alterno | `#A61C31` | Acentos, errores |
| Verde oscuro | `#466B3F` | Complementario |
| Rojo oscuro | `#76232F` | Complementario |
| Gris oscuro | `#565A5C` | Texto secundario |
| Gris claro | `#B1B2B0` | Bordes |

### Tipografía
- **Cuerpo**: Ancizar Sans
- **Títulos**: Ancizar Sans Bold/Extrabold
- **Serif**: Ancizar Serif (citas)

### Fuentes de Datos
- Guía web: `https://identidad.unal.edu.co/guia-web/`
- Plantilla: `https://identidad.unal.edu.co/guia-web/b-directrices-y-especificaciones/b3-uso-de-plantilla-web/`
- Kit apps: `https://gestionapp.unal.edu.co/cdn/doc/`
- CSS Kit: `https://gestionapp.unal.edu.co/cdn/kitUnal/12112024/css/kitUnal.min.css`
- Tema: `https://gestionapp.unal.edu.co/cdn/kitUnal/12112024/css/themes/main.min.css`
- Imágenes plantilla: `src/data/unal-templates/` (descargadas)

## Notas de Desarrollo

- El proyecto usa dark mode por defecto (`class="dark"` en `<html>`)
- GSAP carga por CDN (no npm) para animaciones
- `GrupoModal.astro` existe pero no se usa (reemplazado por `/grupo/[id]`)
- `admin.astro` fue refactorizado: 1023→717 líneas (8 componentes en `src/components/admin/`)
- Los datos en `grupos.json` son estáticos; la DB es la fuente para producción
- La búsqueda IA usa OpenRouter con un modelo pequeño y gratuito
- Las imágenes de la plantilla UNAL están en `src/data/unal-templates/`
- El design system de gestiónapp requiere autenticación UNAL para acceder a componentes
