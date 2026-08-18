# Rediseño con Identidad Visual FIBOG

## Resumen

Rediseño completo del sitio web de semilleros replicando la identidad visual de la Facultad de Ingeniería UNAL (ingenieria.bogota.unal.edu.co), incluyendo cabezote, footer, colores, tipografía y acceso a dashboards.

## Metodología

1. **Captura automatizada** con Playwright de ambas webs:
   - Sitio real FIBOG: `https://ingenieria.bogota.unal.edu.co/es/`
   - Sitio actual del proyecto: `http://localhost:4321/`
2. **Extracción de tokens** de diseño: colores medidos por píxel, HTML/CSS del header y footer reales
3. **Implementación** Tailwind CSS replicando fielmente la estructura y paleta

## Paleta de Colores FIBOG

| Rol | Hex | Uso |
|-----|-----|-----|
| Cabezote superior | `#666666` | Barra de perfiles + social |
| Cabezote principal | `#5B5B5B` | URL del sitio + nav principal |
| Tile escudo | `#3F403F` | Fondo del escudo UNAL (más oscuro) |
| Footer principal | `#222222` | Sección oscura del footer |
| Footer inferior | `#666666` | Gobierno en línea + copyright |
| Navy | `#192950` | Botones principales, badges, accents |
| Navy oscuro | `#0D2B53` | Variación del navy |
| Azul | `#2A5073` | Hover states, tricolor |
| Teal | `#088577` | CTA, links, badges |
| Teal claro | `#0CA694` | Hover del teal |
| Lime | `#94B43B` | Iconos del nav, acentos |
| Lime claro | `#AFC931` | Social bar, tricolor |
| Texto | `#222222` | Texto principal |
| Texto secundario | `#5B5B5B` | Texto secundario |
| Bordes | `#DCDCDC` | Dividers, borders |
| Fondo claro | `#F1F1F1` | Hero, filter bg |

## Assets Descargados

| Archivo | Origen |
|---------|--------|
| `public/images/escudoUnal-white.svg` | ingenieria.bogota.unal.edu.co/wp-content/uploads/2024/09/escudoUnal.svg |
| `public/images/sealColombia.png` | ingenieria.bogota.unal.edu.co/wp-content/uploads/2024/09/sealColombia.png |

## Estructura del Header (UnalHeader.astro)

Réplica exacta del cabezote de ingeniería.bogota.unal.edu.co:

### Desktop
```
┌─────────────────────────────────────────────────────────────────┐
│ [ESCUDO]  │ Aspirantes  Estudiantes  Egresados  Docentes  Admin│ × f X 📷 📷  🌐 ES │
│  (tile    │ semilleros.ingenieria.bogota.unal.edu.co  🔍 Buscar │ 🇨🇴                │
│  #3F403F) │ ● LA FACULTAD ● PROGRAMAS ● INVESTIGACIÓN ● EXT... │ SEDES ▾           │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile
```
┌──────────────────────────────────────┐
│ [ESCUDO] UNIVERSIDAD NACIONAL  🇨🇴 ≡ │
│          DE COLOMBIA                 │
└──────────────────────────────────────┘
```

### Menú Principal (desktop)
Items con enlaces reales FIBOG:
- **La Facultad**: Facultad de Ingeniería UNAL, Decanatura, Vicedecanatura Académica, Vicedecanatura de Investigación y Extensión, Departamentos, Áreas Curriculares, Secretaría de Facultad, Unidad Administrativa, Preguntas Frecuentes
- **Programas**: Programas Académicos
- **Investigación**: Grupos de investigación – Hermes, Laboratorios Facultad, Semilleros y Grupos (este sitio)
- **Extensión**: Instituto de Extensión e Investigación
- **Internacionalización**: Programa de Relaciones Internacionales
- **Bienestar**: Dirección de bienestar

### Acceso a Dashboards
Integrado en el header:
- **Icono de usuario** en la barra superior (#666) → muestra "Acceder" cuando no autenticado
- **Dropdown** con rol del usuario cuando autenticado: Panel de mi grupo (ADMIN_GRUPO), Administración (SUPER_ADMIN), Mi perfil, Cerrar sesión
- **Mobile**: botón "ACCEDER" en teal (#088577) al inicio del menú

## Estructura del Footer (UnalFooter.astro)

Réplica exacta del footer de ingenieria.bogota.unal.edu.co:

```
┌─────────────────────────────────────────────────────────────────┐
│ [Facebook] [Instagram] [YouTube] [X] [LinkedIn] [Ing. y Nación]│
│ (social bar: #2a5073 / #afc931 / #0ca694 / #222 / #afc931 / #2a5073) │
├─────────────────────────────────────────────────────────────────┤
│                           🔍 Buscar en Fibog  [Buscar]         │
│ ─────────────────────────────────────────────────────────────── │
│ NAVEGAR POR LA    │ ENLACES RÁPIDOS      │ APLICATIVOS         │
│ FACULTAD          │                      │                     │
│ Decanatura        │ Preguntas frecuentes │ Ticket Fibog        │
│ Vicedecanatura    │ Comunidad Fibog      │ Cupo Fibog          │
│ Dirección bien... │ Eventos académicos   │ Admisiones Posgrados│
│ Departamentos     │ Noticias             │ Concurso Docente    │
│ Secretaría        │ Tratamiento de Datos │ Gestión Aulas TIC   │
│ Unidad Admin.     │                      │ SEFI                │
│ PRI               │                      │ Quanticom Valley    │
├─────────────────────────────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ (tricolor: teal #0ca694 + lime #afc931 + azul #2a5073)         │
├─────────────────────────────────────────────────────────────────┤
│ Régimen Legal │ Talento Humano │ Correo institucional │ Mapa   │
│ Contratación  │ Ofertas Empleo │ Redes Sociales       │ FAQ    │
│ Rendición     │ Concurso Doc.  │ Quejas y reclamos    │ Atención│
│ Pago Virtual  │ Control Interno│ Encuesta             │ Contáct.│
│ Calidad       │ Buzón notif.   │ Estadísticas         │ Glosario│
│               │                │                      │        │
│ Contacto página web:           │ © Copyright 2026     │        │
│ Carrera 30 No 45A-03           │ Algunos derechos     │        │
│ Edif. CADE - Oficina 103       │ untic_fibog@unal.edu │        │
│ Bogotá D.C., Colombia          │ Acerca de este sitio │        │
│ (+57) 601 3165000              │ Actualización: fecha │        │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes Modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/unal/UnalHeader.astro` | Reescritura completa: cabezote FIBOG + auth |
| `src/components/unal/UnalFooter.astro` | Reescritura completa: footer FIBOG |
| `src/components/unal/AccessibilityPanel.astro` | Colores FIBOG (#192950) |
| `src/components/unal/ServicesTab.astro` | Colores FIBOG (#088577) |
| `src/components/unal/Breadcrumb.astro` | Sin cambios (ya era neutro) |
| `src/layouts/Layout.astro` | theme-color #5b5b5b, body bg white |
| `src/pages/index.astro` | Hero + stats + catálogo con identidad FIBOG |
| `src/pages/login.astro` | Card login con navy/teal FIBOG |
| `src/components/AISearch.astro` | Colores FIBOG (navy, teal) |
| `src/components/FilterBar.astro` | Chips FIBOG (navy active) |
| `src/components/BentoCard.astro` | Badges FIBOG (teal/navy/lime) |
| `src/styles/global.css` | Tokens FIBOG (navy, teal, borders) |

## Responsive Android

- **Mobile header**: Escudo + UNIVERSIDAD NACIONAL DE COLOMBIA + hamburger
- **Mobile menu**: Full-screen overlay con accordion, búsqueda, ACCEDER, menú items, sedes, perfiles, social
- **Mobile hero**: Botones stacked, stats wrap
- **Mobile cards**: 1 columna
- **Mobile footer**: Social bar 2x3 grid, columnas stacked, links stacked

## Verificación

```bash
npm run build          # Verifica que compila sin errores
npm run dev            # Desarrollo en http://localhost:4321
```

### Playwright (verificación visual)
```bash
python3 /tmp/opencode/captures/verify.py
```
Genera screenshots en `/tmp/opencode/captures/`:
- `new-home-desktop.png` — Home desktop 1440x900
- `new-home-desktop-full.png` — Home desktop full page
- `new-login-desktop.png` — Login desktop
- `new-home-mobile.png` — Home mobile 390x844
- `new-home-mobile-menu.png` — Menú móvil abierto

## Flujo de Autenticación

1. **No autenticado**: Icono persona en barra superior → click → redirige a `/login`
2. **Login** (`/login`): Formulario correo @unal.edu.co + contraseña → Supabase auth
3. **Post-login**: Redirect por rol:
   - `SUPER_ADMIN` → `/admin`
   - `ADMIN_GRUPO` → `/lider`
   - Otro → `/`
4. **Autenticado**: Icono persona muestra dropdown con:
   - Panel de mi grupo (si es ADMIN_GRUPO o SUPER_ADMIN)
   - Administración (si es SUPER_ADMIN)
   - Mi perfil
   - Cerrar sesión
5. **Mobile**: Mismo flujo con botón ACCEDER / menú de usuario

## Notas de Desarrollo

- El header replica fielmente la estructura WordPress Kadence del sitio FIBOG real
- Los colores fueron medidos por píxel del screenshot real (1440x900)
- Los enlaces del menú apuntan a URLs reales de ingenieria.bogota.unal.edu.co
- El footer incluye las 6 redes sociales de FIBOG (Facebook, Instagram, YouTube, X, LinkedIn, Ingeniería y Nación)
- La barra social usa los colores oficiales de cada plataforma
- El tricolor (teal + lime + azul) separa el footer principal del strip inferior
