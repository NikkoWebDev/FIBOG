# FIBOG — UNAL Facultad de Ingeniería Bogotá

**Plataforma web para descubrir semilleros, grupos de investigación y comunidades estudiantiles de la Facultad de Ingeniería - Universidad Nacional de Colombia, Sede Bogotá.**

---

## 1. DATOS GENERALES

| Campo | Valor |
|---|---|
| **Nombre del proyecto** | FIBOG (Facultad de Ingeniería BOGotá) |
| **Nombre en código** | Semilleros |
| **Versión** | 1.0.0 |
| **Licencia** | ISC |
| **Tipo de proyecto** | Sitio web estático con panel de administración dinámico |
| **Autor** | Nikko (NikkoWebDev) |
| **Repositorio** | `https://github.com/WebStoreCorporation/FIBOG` |
| **Dominio producción** | `https://fibog.netlify.app` |

---

## 2. ARQUITECTURA GENERAL

```
[Astro SSG] ──Build──> [Static HTML/CSS/JS] ──Deploy──> [Netlify]
     │                                                        │
     ├── src/data/grupos.json (datos estáticos)                ├── netlify/functions/search.js (AI Search)
     ├── src/pages/api/search.ts (API en Astro)               └── Netlify Redirects: /* -> index.html
     │
     └── [Supabase] (Backend dinámico)
          ├── PostgreSQL (grupos, perfiles, solicitudes, admin_grupos, audit_log)
          ├── Auth (Email/Password, JWT, RLS)
          └── Edge Functions (notify-admins)
```

**Stack completo:**
- **Frontend:** Astro 4.x (SSG) + Tailwind CSS 3.x + TypeScript estricto
- **Backend DB:** Supabase (PostgreSQL 17 con RLS + Auth + Edge Functions)
- **Búsqueda IA:** OpenRouter API (`liquid/lfm-2.5-1.2b-instruct:free`)
- **Animaciones:** GSAP 3.12 + ScrollTrigger (vía CDN)
- **Despliegue:** Netlify (estático) con Netlify Functions para búsqueda IA
- **Fuentes:** Google Fonts (Inter, JetBrains Mono, Geist, Material Symbols)

---

## 3. ESTRUCTURA COMPLETA DE ARCHIVOS

```
/home/niko/Proyectos/Semilleros/
├── .astro/
│   ├── settings.json               # Config interna de Astro
│   └── types.d.ts                  # Referencia de tipos Astro
├── .devin/
│   └── config.local.json           # Permisos del agente Devin
├── .env.example                    # Plantilla de variables de entorno
├── .gitignore
├── README.md                       # Documentación principal
├── SETUP.md                        # Guía de configuración y despliegue
├── astro.config.mjs                # Configuración de Astro
├── correo.md                       # Borrador de correo para la facultad
├── info.md                         # ESTE ARCHIVO — documentación completa
├── netlify.toml                    # Configuración de despliegue Netlify
├── package.json                    # Dependencias y scripts
├── tailwind.config.mjs             # Configuración de Tailwind (tema personalizado)
├── tsconfig.json                   # TypeScript estricto
│
├── netlify/
│   └── functions/
│       └── search.js               # Netlify Function: búsqueda con IA
│
├── scripts/
│   ├── parse-csv.js                # Parser CSV -> JSON + tipos TS
│   ├── migrate-to-supabase.js      # Migración CSV -> Supabase
│   ├── merge-and-update-csv.js     # Merge/update CSV en Supabase
│   └── create-admins.js            # Creación de cuentas SUPER_ADMIN
│
├── src/
│   ├── env.d.ts                    # Tipos para variables de entorno
│   │
│   ├── components/
│   │   ├── AISearch.astro          # Barra de búsqueda con IA
│   │   ├── BentoCard.astro         # Tarjeta individual de grupo
│   │   ├── BentoGrid.astro         # Grid de tarjetas con animación fade-in
│   │   ├── FilterBar.astro         # Filtros por tipo y carrera
│   │   ├── Footer.astro            # Pie de página
│   │   ├── GrupoModal.astro        # Modal de detalle de grupo
│   │   └── Navbar.astro            # Navegación dual (desktop + mobile)
│   │
│   ├── data/
│   │   ├── grupos.json             # Datos de 13 grupos (generado por parse-csv)
│   │   └── grupos.types.ts         # Tipos TS + helpers de filtrado (autogenerado)
│   │
│   ├── layouts/
│   │   └── Layout.astro            # Layout base HTML (fonts, GSAP, tema oscuro)
│   │
│   ├── lib/
│   │   ├── supabase.ts             # Cliente Supabase + helpers de roles/permisos
│   │   └── database.types.ts       # Tipos TS generados del schema Supabase
│   │
│   ├── pages/
│   │   ├── index.astro             # Página principal (catálogo + búsqueda + filtros)
│   │   ├── admin.astro             # Panel SUPER_ADMIN (CRUD + métricas + usuarios)
│   │   ├── login.astro             # Inicio de sesión
│   │   ├── registro.astro          # Formulario de postulación de grupos
│   │   ├── lider.astro             # Panel de líder de grupo (ADMIN_GRUPO)
│   │   ├── perfil.astro            # Perfil de usuario
│   │   ├── privacidad.astro        # Política de privacidad
│   │   ├── grupo/
│   │   │   └── [id].astro          # Página de detalle estática por grupo
│   │   └── api/
│   │       └── search.ts           # API route para búsqueda con IA
│   │
│   └── styles/
│       └── global.css              # Estilos globales (glassmorphism, shimmer, noise)
│
├── supabase/
│   ├── .gitignore
│   ├── config.toml                 # Config local de Supabase CLI
│   ├── .temp/cli-latest            # Versión CLI: v2.98.2
│   ├── functions/
│   │   └── notify-admins/
│   │       └── index.ts            # Edge Function: notificar admins al registrarse
│   └── migrations/
│       ├── 20250509000000_initial_schema.sql       # Schema inicial
│       ├── 20250516000000_improve_admin_system.sql  # Sistema multi-admin
│       └── fix_admin_rls.sql                        # Corrección de políticas RLS
```

---

## 4. CONFIGURACIONES

### 4.1 package.json — Scripts

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `astro dev` | Servidor desarrollo en `localhost:4321` |
| `start` | `astro dev` | Igual que dev |
| `build` | `astro build` | Genera sitio estático en `/dist` |
| `preview` | `astro preview` | Previsualiza build producción |
| `astro` | `astro` | CLI de Astro |
| `parse-csv` | `node scripts/parse-csv.js` | Convierte CSV a JSON + tipos TS |
| `migrate` | `node scripts/migrate-to-supabase.js` | Migra CSV a Supabase |
| `supabase:start` | `npx supabase start` | Inicia Supabase local |
| `supabase:stop` | `npx supabase stop` | Detiene Supabase local |
| `supabase:reset` | `npx supabase db reset` | Resetea BD local |

### 4.2 Dependencias

**Producción:**
- `@astrojs/netlify` ^5.5.0 — Adaptador Netlify
- `@astrojs/node` ^8.3.0 — Adaptador Node
- `@astrojs/tailwind` ^5.1.5 — Integración Tailwind
- `@supabase/supabase-js` ^2.105.4 — Cliente Supabase
- `astro` ^4.16.19 — Framework
- `gsap` ^3.15.0 — Animaciones (aunque se usa vía CDN)
- `lucide-react` ^1.14.0 — Iconos (no se usa realmente, se usan Material Symbols)
- `tailwindcss` ^3.4.19 — CSS utility-first

**Desarrollo:**
- `@types/node` ^25.6.2

### 4.3 Variables de Entorno

| Variable | Descripción | ¿Requerida? |
|---|---|---|
| `OPENROUTER_API_KEY` | API Key de OpenRouter | Opcional (fallback sin IA) |
| `OPENROUTER_BASE_URL` | URL base OpenRouter | Default: `https://openrouter.ai/api/v1` |
| `OPENROUTER_MODEL` | Modelo de IA | Default: `liquid/lfm-2.5-1.2b-instruct:free` |
| `PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Sí (para backend dinámico) |
| `PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo server-side) | Sí (para scripts) |
| `SUPER_ADMIN_EMAIL_1` | Email admin 1 (notificaciones) | Opcional |
| `SUPER_ADMIN_EMAIL_2` | Email admin 2 (notificaciones) | Opcional |

### 4.4 astro.config.mjs

```js
output: 'static'           // Generación de sitio estático
integrations: [tailwind()]  // Tailwind CSS
server: { port: 4321, host: true }
```

### 4.5 netlify.toml

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Node version: 20
- Redirect: `/api/search` → `/.netlify/functions/search` (status 200)
- Catch-all redirect: `/*` → `/index.html` (SPA routing)

### 4.6 tsconfig.json

- Extiende: `astro/tsconfigs/strict`
- Strict mode completo (strictNullChecks, noImplicitAny, etc.)
- Paths: `@/*` → `src/*`, `@components/*`, `@layouts/*`, `@data/*`

### 4.7 tailwind.config.mjs — Tema Personalizado "Ingeniería Dinámica"

**Sistema de diseño Glassmorphism 2.0.**

**Colores oscuros (default):**
- `background`: `#131313`
- `primary`: `#85d990` (verde claro)
- `secondary`: `#4edea3` (verde menta)
- `tertiary`: `#4cd7f6` (cian)
- `surface`: `#131313`
- `surface-container`: `#201f1f`
- `surface-container-high`: `#2a2a2a`
- `surface-container-highest`: `#353534`
- `on-surface`: `#e5e2e1`
- `on-surface-variant`: `#bfc9bc`
- `outline-variant`: `#40493f`
- `error`: `#ffb4ab`
- `error-container`: `#93000a`

**Tipografía:**
- `display-lg`: Geist (títulos grandes, 48px/32px mobile)
- `headline-md`: Geist (subtítulos, 24px)
- `body-base`: Inter (cuerpo, 16px)
- `body-sm`: Inter (cuerpo pequeño, 14px)
- `label-mono`: JetBrains Mono (etiquetas, 12px)
- Iconos: Material Symbols Outlined

**Espaciado:**
- `unit`: 4px, `gutter`: 24px
- `margin-mobile`: 16px, `margin-desktop`: 64px
- `container-max`: 1440px

**Bordes:** sm(0.25rem), DEFAULT(0.5rem), md(0.75rem), lg(1rem), xl(1.5rem), full(9999px)
**Backdrop blur glass:** 16px

---

## 5. SISTEMA DE DISEÑO (global.css)

### Clases principales:

| Clase | Propósito |
|---|---|
| `.noise-overlay` | Textura SVG fractal noise (opacidad 0.02) sobre elementos |
| `.glass-card` | Efecto glassmorphism: bg rgba(255,255,255,0.03), backdrop-blur(16px), borde rgba(255,255,255,0.08), hover con transform Y(-2px), borde gradiente con `::after` usando mask-composite |
| `.shimmer` | Animación de brillo deslizante (gradiente de 200%, animación 2s linear) |
| `.glass-button` | Botones pill con gradiente verde, hover scale(1.02) |
| `.gradient-text` | Texto con gradiente `#85d990 → #4edea3` |
| `.bento-card` | Animación fade-in: opacity 0 → 1, translateY(24px) → 0 |
| `.filter-chip.active` | Estado activo de chips de filtro con bg verde 20% |
| `.material-symbols-outlined` | Configuración de variable font (FILL, wght, GRAD, opsz) |

### Modo claro:
- Se activa cuando `<html>` NO tiene clase `dark`
- Variables CSS: `--bg-primary: #fafafa`, `--text-primary: #1a1a1a`
- Glass cards con bg rgba(255,255,255,0.6) y bordes rgba(0,0,0,0.08)
- Scrollbar en tonos grises claros

### Accesibilidad:
- `focus-visible` con outline 2px solid `#85d990`, offset 2px
- `prefers-reduced-motion`: desactiva animaciones (duration 0.01ms)
- `selection: bg-primary/30`

---

## 6. DATOS ESTÁTICOS (grupos.json)

### Metadata:
```json
{
  "total": 13,
  "por_tipo": {
    "Grupo Estudiantil": 1,
    "Grupo de Investigación": 3,
    "Semillero": 9
  },
  "carreras": [
    "Ingeniería Agrícola", "Ingeniería Civil", "Ingeniería Electrica",
    "Ingeniería Electrónica", "Ingeniería Mecatrónica", "Ingeniería Mecánica",
    "Ingeniería Química", "Ingeniería de Sistemas", "Ingeniería y Afines"
  ],
  "actualizado": "2026-05-08T22:14:58.301Z"
}
```

### Los 13 grupos (id, tipo, nombre, carreras):

| # | ID | Tipo | Nombre | Carreras |
|---|---|---|---|---|
| 1 | `unal-1-capitulo-estudiantil-de-ingeni` | Grupo Estudiantil | Capítulo Estudiantil de Ingenieros Químicos (AIChE) | Ing. Química |
| 2 | `unal-2-grupo-de-investigaci-n-ace-air` | Grupo de Investigación | ACE - Aire, Clima y Energía | Ing. Química |
| 3 | `unal-3-semillero-de-cerveza-y-destila` | Semillero | Cerveza y Destilados | Ing. Química |
| 4 | `unal-4-semillero-de-resiliencia-y-san` | Semillero | SIRSA - Resiliencia y Saneamiento Ambiental | Ing. Agrícola, Civil, Química |
| 5 | `unal-5-alife` | Semillero | ALIFE | Ing. Sistemas |
| 6 | `unal-6-c-mulo-bogot` | Semillero | Cúmulo Bogotá (Astronomía) | Ing. y Afines |
| 7 | `unal-7-chem-e-car-unmed-medell-n` | Semillero | Chem E Car - UnMed (MEDELLÍN) | Ing. Química |
| 8 | `unal-8-grupo-de-investigaci-n-en-inge` | Grupo de Investigación | GMUN - Electrónica | Ing. Electrónica |
| 9 | `unal-9-semillero-de-investigaci-n-de-` | Semillero | Estudio de reacciones químicas para dispositivos electromecánicos | Ing. Química |
| 10 | `unal-10-semillero-de-investigacion-en-` | Semillero | Diseño e intensificación de procesos y productos | Ing. Química |
| 11 | `unal-11-semillero-de-investigaci-n-en-` | Semillero | PAVUN - Pavimentos y materiales para carreteras | Ing. Civil |
| 12 | `unal-12-grupo-de-investigaci-n-y-desar` | Grupo de Investigación | GIDA UN - Aeroespacial | Ing. Mecánica, Mecatrónica |
| 13 | `unal-13-lucia-semillero-de-iot-de-bajo` | Semillero | LUCIA - IoT de bajo consumo | Ing. Electrónica, Eléctrica |

### Estructura de cada grupo en JSON:
```typescript
interface Grupo {
  id: string;              // "unal-{index}-{slug}"
  tipo: TipoGrupo;         // "Semillero" | "Grupo de Investigación" | "Grupo Estudiantil"
  carreras: string[];      // Array de carreras
  carrera_str: string;     // String separado por comas
  nombre: string;          // Nombre del grupo
  docente: string;         // Docente a cargo
  lider: string;           // Líder estudiantil
  email: string;           // Email de contacto
  vinculacion: string;     // Estado de vinculación
  enfoque: string;         // Áreas de enfoque
  descripcion: string;     // Descripción detallada
  actividades: string;     // Actividades que realizan
  modalidad: Modalidad;    // "Presencial" | "Virtual" | "Mixta"
  horarios: string;        // Horarios
  requisitos: string;      // Requisitos de ingreso
  nivel_academico: string; // Nivel académico recomendado
  redes: string;           // Redes sociales / contacto
  comentarios: string;     // Comentarios adicionales
}
```

### Tipos TypeScript (grupos.types.ts):

```typescript
export type TipoGrupo = 'Semillero' | 'Grupo de Investigación' | 'Grupo Estudiantil' | 'Desconocido';
export type Modalidad = 'Presencial' | 'Virtual' | 'Mixta';
export type NivelAcademico = 'No requerido (Abierto a todos los niveles)' | 'Intermedio (Con bases en el área)' | 'Avanzado (Requiere experiencia o conocimientos sólidos)';
```

**Helpers de filtrado:**
- `filtrarGrupos(grupos, { tipo?, carrera?, busqueda? })` — Filtra por tipo (case-insensitive), carrera (some match), búsqueda en nombre/enfoque/descripción/docente
- `getCarreraSlug(carrera)` — Normaliza nombre de carrera a slug
- `getTipoSlug(tipo)` — Normaliza tipo a slug
- Constantes: `CARRERAS_DISPONIBLES`, `TIPOS_GRUPO`

---

## 7. COMPONENTES (src/components/)

### 7.1 Layout.astro (layout base)
- HTML lang="es", class="dark" (tema oscuro por defecto)
- Meta tags: charset, viewport, description, theme-color (#131313)
- Carga fuentes: Inter, JetBrains Mono, Geist, Material Symbols (Google Fonts)
- Carga GSAP + ScrollTrigger vía CDN (scripts inline)
- Body: fondo #131313 con patrón de puntos (radial-gradient, size 40px)
- `selection: bg-primary/30`
- Modal container global `<div id="global-modal-container">`
- Inicializa GSAP ScrollTrigger

### 7.2 Navbar.astro (253 líneas)
**Props:** `activePage?: string` (default: 'explorar')

**Desktop (md+):**
- Fixed top, rounded-full, glass effect (bg-surface/60, backdrop-blur-xl)
- Logo: "UNAL | FIBOG" en primary/hover secondary
- Nav links: "Grupos" con active state (border-b secondary)
- Theme toggle (light_mode/dark_mode icon, localStorage)
- Auth section: Botón "Acceder" o menú de usuario con dropdown
- Dropdown: "Mi Grupo" (ADMIN_GRUPO), "Administración" (SUPER_ADMIN), "Mi Perfil", "Cerrar sesión"
- GitHub link (SVG icon)
- Supabase auth: `supabase.auth.getUser()` + `perfiles.rol`

**Mobile (<md):**
- Bottom fixed navbar, rounded-t-3xl, glass effect
- Theme toggle + nav items con iconos + labels

### 7.3 BentoCard.astro (76 líneas)
**Props:** `grupo: Grupo, index?: number`

- Glass card con efecto hover (border primary/50)
- Badge de tipo con color: Semillero=tertiary, Grupo Investigación=primary, Grupo Estudiantil=secondary
- Nombre (hover primary), descripción (line-clamp-2)
- Docente (icono person), Carreras (icono school, max 2)
- Actions: "Ver detalles" link a `/grupo/{id}`, botón email si existe

### 7.4 BentoGrid.astro (57 líneas)
**Props:** `grupos: Grupo[]`

- Fondo con tile pattern (grid 60px, rgba(133,217,144,0.03))
- Grid responsive: 1 columna md:2 lg:3
- Animación fade-in secuencial (cada 100ms) con JS vanilla

### 7.5 FilterBar.astro (73 líneas)
**Props:** `metadata: Metadata, activeTipo?: string, activeCarrera?: string`

- Glass card con filtros
- Chips de tipo: "Todos", "Semillero", "Grupo de Investigación", "Grupo Estudiantil"
- Links generan URLs con query params (`?tipo=...`, `?carrera=...`)
- Select de carrera con navegación por URL
- Contador de resultados: `{total} grupos encontrados`

### 7.6 AISearch.astro (252 líneas)
**Props:** `placeholder?: string`

- Input con gradiente glow (from-primary to-secondary, blur)
- Botón de búsqueda con icono `auto_awesome`
- Estado "thinking": icono psychology, dots animados (bounce), shimmers, tags de análisis
- Estado "results": glass card con gradiente, respuesta formateada, grupos encontrados en grid
- Formateo Markdown: **bold**, *italic*, bullet points, párrafos
- Fallback: indica si es IA o coincidencia de texto
- Llamada a `POST /api/search` con `{ query }`
- Manejo de errores con estado error

### 7.7 GrupoModal.astro (154 líneas)
**Props:** `grupo: Grupo`
**Estado:** No se usa actualmente en index (se usa página `[id].astro` en su lugar)

- Modal full-screen con backdrop blur
- Glass card con detalle en grid de 12 columnas:
  - Enfoque (span 8)
  - Modalidad y horarios (span 4)
  - Actividades (span 6)
  - Requisitos (span 6)
  - Liderazgo y contacto (span 12, full width)
- Botón close, gradientes hover por sección

### 7.8 Footer.astro (38 líneas)
- Logo "UNAL | FIBOG" en secondary
- Links: Privacidad, Contacto (WhatsApp), Documentación, GitHub
- Atribución: "Hecho con ♥ por Nikko para UNAL"
- Copyright: 2025
- Spacer bottom para mobile nav (h-20 md:hidden)

---

## 8. PÁGINAS (src/pages/)

### 8.1 index.astro — Página Principal (143 líneas)

**Ruta:** `/`
**Layout:** Layout + Navbar + Footer
**Componentes:** AISearch, FilterBar, BentoGrid

**Secciones:**
1. Hero: label "Investigación de Vanguardia", título con "Investigación" en primary, CTA "Explorar Grupos"
2. Stats rápidas: Semilleros, Grupos de Investigación, Grupos Estudiantiles, Carreras
3. AI Search
4. FilterBar
5. Resultados con contador y "Limpiar filtros"
6. BentoGrid con grupos filtrados
7. Empty state: icono search_off, mensaje, botón "Ver todos los grupos"

**Filtrado:** URL params `?tipo=`, `?carrera=`, `?q=` usando `filtrarGrupos()`

### 8.2 login.astro — Inicio de Sesión (203 líneas)

**Ruta:** `/login`
**Layout:** Layout (sin Navbar)

- Background con gradientes blur (verde + cian)
- Glass card con logo FIBOG animado
- Formulario: email, password con toggle visibility
- Error message, loading spinner
- Redirección post-login basada en rol: SUPER_ADMIN → `/admin`, ADMIN_GRUPO → `/lider`, otro → `/`
- Link a `/registro` y volver a `/`
- Usa `supabase.auth.signInWithPassword()`

### 8.3 registro.astro — Registro de Grupo (462 líneas)

**Ruta:** `/registro`
**Layout:** Layout (sin Navbar)

- 3-step progress indicator: Información → Revisión → Aprobación
- **Sección 1 - Información del Grupo:** tipo, nombre, carreras, docente, email, enfoque, descripción
- **Sección 2 - Información del Solicitante:** nombre líder, nombre solicitante, email, teléfono, carrera, semestre (select 1-10+)
- **Sección 3 - Información Adicional:** modalidad, horarios, actividades, requisitos, redes, comentarios
- Insert directo a `solicitudes_pendientes` (estado 'pendiente' por defecto)
- Loading state, success/error messages
- Back link a `/`

### 8.4 admin.astro — Panel SUPER_ADMIN (1023 líneas)

**Ruta:** `/admin`
**Layout:** Layout + Navbar + Footer
**Requisito:** Rol = SUPER_ADMIN (redirige a /login o / si no)

**Secciones:**

1. **Header:** "Panel de Control", botón "Nuevo Grupo" (abre modal)

2. **Métricas** (4 columnas):
   - Proyectos Activos (total grupos)
   - Líderes (ADMIN_GRUPO count)
   - Pendientes (solicitudes pendientes)
   - Administradores (SUPER_ADMIN count)

3. **Acciones Rápidas:**
   - Aprobaciones (va a tab pendientes)
   - Exportar Reportes (descarga CSV)

4. **Tabs de Gestión:**
   - **Todos los Grupos:** Search + filter por tipo, grid de tarjetas con Editar/Admins/Eliminar
   - **Solicitudes Pendientes:** Lista de solicitudes con Aprobar/Rechazar
   - **Gestión de Usuarios:** Tabla con usuario, email, rol, fecha registro, botón cambiar rol

5. **Modal Create/Edit Group:** Formulario completo con todos los campos, sanitización de inputs, validación de email, UUID validation

6. **Modal Manage Group Admins:** Select de usuarios + lista de admins actuales con botón remove

**Funciones principales del script:**
- `init()` — Auth check + load stats/grupos/usuarios/pendientes
- `loadStats()` — Consultas paralelas de conteos
- `loadGrupos()` — Fetch + render tarjetas
- `loadUsuarios()` — Fetch + render tabla
- `loadPendientes()` — Fetch pendientes + render lista
- `approveSolicitud(id)` — Crea grupo + actualiza solicitud
- `rejectSolicitud(id)` — Actualiza estado con motivo opcional
- `saveGroup(event)` — Create/Update con sanitización
- `editGroup(id)` — Carga datos en modal
- `deleteGroup(id)` — Confirm + delete
- `changeRole(userId)` — Cicla roles: SUPER_ADMIN → ADMIN_GRUPO → VISITANTE → ...
- `exportData()` — Genera CSV descargable
- `assignAdminToGroup()`, `removeAdminFromGroup()` — RPC calls
- `showNotification(message, type)` — Toast notification animado

### 8.5 lider.astro — Panel ADMIN_GRUPO (460 líneas)

**Ruta:** `/lider`
**Layout:** Layout (sin Navbar)
**Requisito:** Rol = ADMIN_GRUPO

**Estados:**
1. **Loading:** Spinner
2. **No group:** "No tienes un grupo asignado"
3. **Group form:** Dos formularios en cards:
   - Info principal: nombre, docente, email, líder, enfoque, descripción
   - Info adicional: modalidad, horarios, actividades, requisitos, redes, comentarios

**Lógica:** Busca grupo por `id_lider` = `auth.uid()`, actualiza con update. Logout button.

### 8.6 perfil.astro — Perfil de Usuario (207 líneas)

**Ruta:** `/perfil`
**Layout:** Layout + Navbar + Footer

**Panel izquierdo:** Avatar (icono account_circle), nombre, rol, botón logout
**Panel derecho:** 
- Información básica: nombre completo, email (readonly)
- Seguridad: nueva contraseña + confirmación
- Redes sociales: LinkedIn, ResearchGate/ORCID, Twitter/X

**Lógica:** Carga perfil desde Supabase, update `perfiles.nombre_completo`, `auth.updateUser({ password })`

### 8.7 privacidad.astro — Política de Privacidad (113 líneas)

**Ruta:** `/privacidad`
**Layout:** Layout + Navbar + Footer

- "No recolectamos tus datos" con icono shield
- 3 cards: Sin Cookies de Rastreo, Sin Almacenamiento de Datos, Sin Analytics
- Contacto: WhatsApp del desarrollador

### 8.8 grupo/[id].astro — Detalle Estático (210 líneas)

**Ruta:** `/grupo/{id}` (SSG, generado en build)
**getStaticPaths:** Genera páginas para todos los grupos del JSON

**Secciones:**
- Back button, tipo badge, carrera badges
- Título + descripción
- Botones: Contactar (email), Sitio Web (redes)
- Grid de detalle: Enfoque, Modalidad y Horarios, Actividades, Requisitos, Nivel Recomendado, Ubicación
- Sección de líder con avatar, nombre, botón contactar

### 8.9 api/search.ts — API Route de Búsqueda IA (204 líneas)

**Ruta:** `/api/search` (POST)
**Input:** `{ query: string }`
**Output:** `{ answer, grupos, fallback?, isError? }`

**Flujo:**
1. Valida query
2. Si no hay `OPENROUTER_API_KEY` → devuelve fallback (keyword matching)
3. Si hay API key: construye system prompt con contexto de grupos (máx 10), llama a OpenRouter
4. `findRelevantGrupos(query)` — Scored keyword matching con extra weight para nombre y enfoque
5. `generateFallbackResponse(query)` — Si no hay matches, devuelve 3 grupos destacados

**System prompt:** IA especializada en grupos UNAL, instrucciones detalladas, responde en español

---

## 9. NETLIFY FUNCTION (netlify/functions/search.js)

**Ruta:** `/.netlify/functions/search` (redirigido desde `/api/search`)
**Propósito:** Misma funcionalidad que la API route pero para entorno Netlify (CommonJS)

- Maneja CORS manualmente
- OpenRouter API call con context de grupos (top 20)
- Fallback keyword matching
- Modelo: `liquid/lfm-2.5-1.2b-instruct:free`

---

## 10. SCRIPTS

### 10.1 parse-csv.js (386 líneas)
- Lee CSV desde `STITCH DESIGNS/` directorio
- Parser robusto: maneja campos multilínea con quotes, line endings Windows
- Normaliza carreras: "Ingenería" → "Ingeniería", "y afines" → "y Afines"
- Genera IDs: `unal-{index+1}-{slug}`
- Escribe `grupos.json` con metadata + data
- Genera `grupos.types.ts` con interfaces, constantes y helpers

### 10.2 migrate-to-supabase.js (389 líneas)
- Lee CSV, parsea, mapea campos a columnas de BD
- Batch insert de 50 grupos
- Limpia grupos existentes antes de insertar
- Opcional: crea SUPER_ADMIN con `supabase.auth.admin.createUser()`
- Password: `Admin123!FIBOG` (configurable vía env)

### 10.3 merge-and-update-csv.js (201 líneas)
- Compara CSV vs Supabase por nombre (case-insensitive)
- Update si existe (preserva id, id_lider, creado_por, fecha_creacion)
- Insert si es nuevo
- Resumen de actualizados/insertados/errores

### 10.4 create-admins.js (146 líneas)
- Crea 2 cuentas SUPER_ADMIN desde env vars o defaults
- `SUPER_ADMIN_EMAIL_1` y `SUPER_ADMIN_EMAIL_2`
- Password temporal: `FIBOG2024!Admin`
- Upsert: si el usuario ya existe, actualiza perfil a SUPER_ADMIN

---

## 11. SUPABASE — BASE DE DATOS

### 11.1 config.toml

| Parámetro | Valor |
|---|---|
| project_id | "Semilleros" |
| API port | 54321 |
| DB port | 54322 (PostgreSQL 17) |
| Studio port | 54323 |
| Edge Runtime | Deno v2 |
| Auth: JWT expiry | 3600s |
| Auth: signup habilitado | true |
| Auth: email confirmations | false |
| Auth: min password | 6 caracteres |
| Storage file limit | 50MiB |

### 11.2 Enums

```sql
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN_GRUPO', 'VISITANTE');
CREATE TYPE approval_status AS ENUM ('pendiente', 'aprobado', 'rechazado');
CREATE TYPE group_type AS ENUM ('Semillero', 'Grupo de Investigación', 'Grupo Estudiantil');
```

### 11.3 Tablas

#### perfiles (Extiende auth.users)
| Columna | Tipo | Default | Notas |
|---|---|---|---|
| id | UUID PK | | FK → auth.users(id) ON DELETE CASCADE |
| email | TEXT NOT NULL UNIQUE | | |
| rol | user_role | 'VISITANTE' | |
| nombre_completo | TEXT | NULL | |
| telefono | TEXT | NULL | |
| carrera | TEXT | NULL | |
| fecha_registro | TIMESTAMPTZ | NOW() | |
| ultimo_acceso | TIMESTAMPTZ | NULL | |
| es_admin_multi_grupo | BOOLEAN | FALSE | Migración 20250516 |

#### grupos
| Columna | Tipo | Default | Notas |
|---|---|---|---|
| id | UUID PK | gen_random_uuid() | |
| tipo | group_type NOT NULL | | |
| carreras | TEXT[] | | Array de carreras |
| nombre | TEXT NOT NULL | | |
| docente_a_cargo | TEXT | NULL | |
| lider_o_representante | TEXT | NULL | |
| email_contacto | TEXT | NULL | |
| vinculacion | TEXT | NULL | |
| enfoque | TEXT | NULL | |
| descripcion | TEXT | NULL | |
| actividades | TEXT | NULL | |
| modalidad | TEXT | NULL | |
| horarios_habituales | TEXT | NULL | |
| requisitos_ingreso | TEXT | NULL | |
| nivel_academico_recomendado | TEXT | NULL | |
| redes_sociales | TEXT | NULL | |
| comentarios_adicionales | TEXT | NULL | |
| id_lider | UUID | NULL | FK → perfiles(id) |
| estado_aprobacion | approval_status | 'pendiente' | |
| fecha_creacion | TIMESTAMPTZ | NOW() | |
| fecha_actualizacion | TIMESTAMPTZ | NOW() | Trigger update |
| creado_por | UUID | NULL | FK → perfiles(id) |

#### solicitudes_pendientes
| Columna | Tipo | Notas |
|---|---|---|
| id | UUID PK | gen_random_uuid() |
| tipo | group_type NOT NULL | |
| carreras | TEXT[] | |
| nombre | TEXT NOT NULL | |
| docente_a_cargo | TEXT | |
| lider_o_representante | TEXT NOT NULL | |
| email_contacto | TEXT NOT NULL | |
| vinculacion, enfoque, descripcion, actividades | TEXT | |
| modalidad, horarios_habituales | TEXT | |
| requisitos_ingreso, nivel_academico_recomendado | TEXT | |
| redes_sociales, comentarios_adicionales | TEXT | |
| **nombre_solicitante** | TEXT NOT NULL | |
| **email_solicitante** | TEXT NOT NULL | |
| telefono_solicitante, carrera_solicitante | TEXT | |
| semestre_solicitante | TEXT | |
| estado | approval_status | DEFAULT 'pendiente' |
| fecha_solicitud | TIMESTAMPTZ | DEFAULT NOW() |
| fecha_revision | TIMESTAMPTZ | NULL |
| revisado_por | UUID | FK → perfiles(id) |
| comentarios_revision | TEXT | |

#### admin_grupos (Migración 20250516)
| Columna | Tipo | Default | Notas |
|---|---|---|---|
| id | UUID PK | gen_random_uuid() | |
| usuario_id | UUID NOT NULL | | FK → perfiles(id) ON DELETE CASCADE |
| grupo_id | UUID NOT NULL | | FK → grupos(id) ON DELETE CASCADE |
| fecha_asignacion | TIMESTAMPTZ | NOW() | |
| asignado_por | UUID | | FK → perfiles(id) |
| activo | BOOLEAN | TRUE | |
| UNIQUE(usuario_id, grupo_id) | | | |

#### audit_log
| Columna | Tipo |
|---|---|
| id | UUID PK |
| tabla_afectada | TEXT NOT NULL |
| accion | TEXT NOT NULL |
| registro_id | UUID |
| usuario_id | UUID (FK → perfiles) |
| datos_anteriores | JSONB |
| datos_nuevos | JSONB |
| fecha | TIMESTAMPTZ |

### 11.4 Índices

```sql
idx_grupos_estado, idx_grupos_lider, idx_grupos_tipo
idx_solicitudes_estado, idx_solicitudes_email
idx_admin_grupos_usuario, idx_admin_grupos_grupo, idx_admin_grupos_activo
```

### 11.5 Trigger

```sql
CREATE TRIGGER trigger_update_grupos_timestamp
  BEFORE UPDATE ON public.grupos
  FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion();
```

### 11.6 Funciones RPC

| Función | Descripción |
|---|---|
| `get_my_role()` | Retorna el rol del usuario autenticado |
| `is_admin_of_group(group_id UUID)` | Verifica si el usuario es admin de un grupo específico |
| `get_manageable_groups()` | Retorna todos los grupos que el usuario puede gestionar |
| `assign_admin_to_group(target_usuario_id, target_grupo_id)` | Asigna usuario como admin (solo SUPER_ADMIN) |
| `remove_admin_from_group(target_usuario_id, target_grupo_id)` | Remueve admin (solo SUPER_ADMIN) |

### 11.7 RLS — Row Level Security

**Migración inicial (20250509):**
- `perfiles`: SUPER_ADMIN full, usuario puede ver/actualizar propio, público puede insertar
- `grupos`: SUPER_ADMIN full, ADMIN_GRUPO puede gestionar si es líder (id_lider), público ver aprobados
- `solicitudes_pendientes`: SUPER_ADMIN full, público puede insertar
- `audit_log`: solo SUPER_ADMIN

**Migración mejora (20250516):**
- Cambia de `auth.jwt() ->> 'role'` a subquery con `EXISTS (SELECT 1 FROM perfiles WHERE ...)`
- ADMIN_GRUPO gestiona vía `admin_grupos` en lugar de `id_lider`
- Usuarios pueden ver sus propias solicitudes (`users_view_own_applications`)
- Prevención de escalada de roles en perfil update
- `public_insert_profile` ahora requiere `rol = 'VISITANTE'`

**Fix RLS (fix_admin_rls.sql):**
- Lectura pública en `grupos` para que el index funcione sin auth
- SUPER_ADMIN puede insertar/update/delete en grupos
- Usuarios pueden leer todos los perfiles
- Usuarios pueden actualizar su propio perfil
- SUPER_ADMIN puede actualizar cualquier perfil

### 11.8 Edge Function: notify-admins

**Ruta:** `supabase/functions/notify-admins/index.ts`
**Trigger:** Nueva `solicitudes_pendientes` insertada con estado 'pendiente'
**Función:**
1. Obtiene emails de SUPER_ADMIN desde BD + env vars
2. Prepara contenido del email (detalles de solicitud + enlace a /admin)
3. Loggea la notificación (placeholder para integración con Resend/SendGrid/AWS SES)

---

## 12. SISTEMA DE ROLES Y PERMISOS

| Rol | Acceso |
|---|---|
| **SUPER_ADMIN** | Full CRUD en todas las tablas. Panel en `/admin`. Puede asignar/remover admins de grupo. |
| **ADMIN_GRUPO** | Puede editar SOLO los grupos asignados vía `admin_grupos`. Panel en `/lider`. |
| **VISITANTE** | Solo lectura de grupos aprobados. Puede enviar solicitudes de registro en `/registro`. |

---

## 13. FLUJO DE APROBACIÓN

1. **Postulación:** Visitante llena formulario en `/registro`
2. **Inserción:** Se crea registro en `solicitudes_pendientes` con estado 'pendiente'
3. **Notificación:** Edge Function `notify-admins` prepara notificación por email
4. **Revisión:** SUPER_ADMIN revisa en `/admin` → tab "Solicitudes Pendientes"
5. **Aprobación:** 
   - Se crea grupo en tabla `grupos` con `estado_aprobacion = 'aprobado'`
   - Se actualiza solicitud a 'aprobado'
6. **Rechazo:** Se actualiza solicitud a 'rechazado' con motivo opcional

---

## 14. PÁGINAS ADICIONALES Y RUTAS

| Ruta | Archivo | Propósito |
|---|---|---|
| `/` | `index.astro` | Catálogo público |
| `/login` | `login.astro` | Login |
| `/registro` | `registro.astro` | Postular grupo |
| `/admin` | `admin.astro` | Admin panel |
| `/lider` | `lider.astro` | Panel líder |
| `/perfil` | `perfil.astro` | Perfil usuario |
| `/privacidad` | `privacidad.astro` | Privacidad |
| `/grupo/[id]` | `grupo/[id].astro` | Detalle grupo |
| `/api/search` | `api/search.ts` | API búsqueda IA |

---

## 15. TECNOLOGÍAS Y VERSIONES

| Tecnología | Versión | Uso |
|---|---|---|
| Astro | ^4.16.19 | Framework SSG |
| Tailwind CSS | ^3.4.19 | Estilos utilitarios |
| Supabase JS | ^2.105.4 | Cliente BD |
| GSAP | ^3.15.0 | Animaciones (CDN 3.12.2) |
| TypeScript | (Astro strict) | Lenguaje |
| Node.js | 20+ | Runtime |
| PostgreSQL | 17 | Base de datos |
| Deno | 2 | Edge Functions runtime |
| OpenRouter | - | API de IA |
| Netlify | - | Hosting + Functions |

---

## 16. SCRIPTS DE GESTIÓN

| Comando | Descripción |
|---|---|
| `npm run parse-csv` | Convierte CSV → JSON + tipos TS |
| `npm run migrate` | Migra CSV → Supabase (borra + inserta) |
| `node scripts/merge-and-update-csv.js` | Merge/update CSV en Supabase |
| `node scripts/create-admins.js` | Crea cuentas SUPER_ADMIN |
| `npm run dev` | Desarrollo local en :4321 |
| `npm run build` | Build producción en /dist |
| `npm run preview` | Preview del build |
| `npx supabase start` | Inicia Supabase local |
| `npx supabase stop` | Detiene Supabase local |
| `npx supabase db reset` | Resetea BD local |

---

## 17. ESTILOS GLOBALES (global.css ~264 líneas)

**Clases y animaciones principales:**

1. **Noise overlay:** SVG fractal noise SVG filter con opacidad 0.02
2. **Glass card:** backdrop-filter blur(16px), gradient border (::after con mask-composite: exclude), hover con translateY(-2px) y gradiente más intenso
3. **Shimmer:** Gradient linear de 200% animado 2s infinite para loading states
4. **Glass button:** Pill con gradiente verde, hover scale(1.02)
5. **Gradient text:** `background-clip: text` con `#85d990 → #4edea3`
6. **Scrollbar:** Custom 8px (#131313 track, #353534 thumb)
7. **Bento card:** Fade-in con opacity 0 → 1 + translateY
8. **Filter chips:** Active state con bg green 20%
9. **Focus visible:** Outline verde para accesibilidad
10. **Reduced motion:** Desactiva animaciones con `duration: 0.01ms`
11. **Modo claro:** Variables CSS, glass cards claros, scrollbar gris claro

---

## 18. ANOTACIONES FINALES

- El proyecto mezcla **datos estáticos** (grupos.json para el frontend público) con **datos dinámicos** (Supabase para admin). La página de detalle `/grupo/[id]` genera SSG desde el JSON, mientras que el admin trabaja con Supabase en tiempo real.
- La **Netlify Function** (CommonJS) se usa en producción para el AI Search, mientras que la **API route de Astro** (ESM) se usa en desarrollo.
- La **Edge Function** de Supabase `notify-admins` es funcional pero el envío de emails real está pendiente de implementar (placeholder con console.log).
- Las **políticas RLS** han tenido varias iteraciones. La versión final usa subqueries con `EXISTS` y la tabla `admin_grupos` para control de acceso.
- El **diseño** está basado en "Ingeniería Dinámica" de Stitch Designs, con glassmorphism 2.0 y paleta Material Design personalizada.

---

*Documentación generada el 2026-06-03 — contiene el estado completo y absoluto del proyecto FIBOG.*
