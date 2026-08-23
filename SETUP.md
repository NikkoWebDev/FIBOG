# FIBOG - Sistema de Gestión de Semilleros UNAL

Sistema completo de gestión de semilleros, grupos de investigación y grupos estudiantiles de la Facultad de Ingeniería - Universidad Nacional de Colombia.

## 🏗️ Arquitectura

- **Frontend**: Astro 4.x + Tailwind CSS + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **AI Search**: OpenRouter API (free tier)
- **Despliegue**: Vercel

## 📋 Requisitos Previos

- Node.js 20+
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Vercel](https://vercel.com) (opcional)
- API Key de [OpenRouter](https://openrouter.ai) (opcional, para búsqueda IA)

## 🚀 Configuración Inicial

### 1. Configurar Variables de Entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Supabase (obtenidas del dashboard de Supabase)
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# OpenRouter (opcional)
OPENROUTER_API_KEY=tu-api-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=liquid/lfm-2.5-1.2b-instruct:free

# Admin emails (para notificaciones)
ADMIN_EMAIL_1=bgallo@unal.edu.co
ADMIN_EMAIL_2=aiche_fibog@unal.edu.co
```

### 2. Configurar Supabase

#### 2.1 Crear Proyecto

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Crea un nuevo proyecto
3. Guarda la URL y las API keys

#### 2.2 Ejecutar Migraciones

Ve al SQL Editor de Supabase y ejecuta el archivo:

```bash
/supabase/migrations/20250509000000_initial_schema.sql
```

Despues ejecuta tambien:

```bash
/supabase/migrations/20250818000000_add_imagen_url.sql
```

Esto agrega la URL de imagen y crea el bucket publico `imagenes-grupos`.

Esto creará:
- Tipos ENUM (user_role, approval_status, group_type)
- Tablas (perfiles, grupos, solicitudes_pendientes, audit_log)
- Políticas RLS (Row Level Security)
- Funciones y triggers

#### 2.3 Habilitar Auth Providers

En Authentication > Providers, habilita:
- **Email** (con confirmación de email opcional)

### 3. Migrar Datos del CSV

Para poblar la base de datos con los grupos existentes:

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
export PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
export ADMIN_EMAIL_1=bgallo@unal.edu.co
export SUPER_ADMIN_PASSWORD=TuPassword123!

# Ejecutar migración
node scripts/migrate-to-supabase.js
```

Esto:
- Lee el CSV de grupos
- Inserta todos los grupos con estado "aprobado"
- Crea un usuario SUPER_ADMIN

### 4. Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:4321`

### 5. Despliegue en Vercel

URL actual: https://semilleros-fibog-fxl7tbf2f-nikkowebdevs-projects.vercel.app

#### 5.1 Configurar Build

En Vercel, configura:
- **Build command**: `npm run build`
- **Output**: `.vercel/output` (adapter serverless)

#### 5.2 Variables de Entorno en Vercel

En Project > Settings > Environment Variables, agrega:

```
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENROUTER_API_KEY
OPENROUTER_BASE_URL
OPENROUTER_MODEL
RESEND_API_KEY
RESEND_FROM_EMAIL
ADMIN_EMAIL_1
ADMIN_EMAIL_2
SITE_URL
```

#### 5.3 API Routes Serverless (para IA y notificaciones)

Las API routes `src/pages/api/search.ts` (búsqueda IA) y `src/pages/api/notify.ts` (notificación por email con Resend) ya están configuradas como funciones serverless de Vercel.

## 🔐 Sistema de Roles

### SUPER_ADMIN
- Acceso total a todas las tablas
- Puede aprobar/rechazar solicitudes
- Puede crear usuarios
- Puede ver audit logs

### ADMIN_GRUPO
- Puede editar SOLO su grupo asignado
- Puede ver su grupo
- No puede crear ni eliminar grupos

### VISITANTE
- Solo puede ver grupos aprobados
- Puede enviar solicitudes de registro
- Puede usar el buscador

## 📧 Flujo de Aprobación

1. **Postulación**: Visitante llena formulario en `/registro`
2. **Notificación**: Se envía email a SUPER_ADMINs vía API route `/api/notify` (Resend)
3. **Revisión**: Super admin revisa en `/admin`
4. **Aprobación**:
   - Se crea cuenta de usuario
   - Se crea el grupo vinculado al usuario
   - Se notifica al solicitante

## 🎨 Sistema de Diseño (Stitch Designs)

El proyecto utiliza el sistema de diseño **"Ingeniería Dinámica"** con:

- **Estilo**: Glassmorphism 2.0
- **Colores**: Paleta dark mode con acentos verdes/cyan
- **Tipografía**: Geist (display), Inter (body), JetBrains Mono (labels)
- **Bordes**: Bordes con gradiente para efecto cristalino
- **Blur**: backdrop-blur de 16px

### Tokens de Color Principales

```
background: #131313
primary: #85d990
secondary: #4edea3
tertiary: #4cd7f6
surface: #201f1f (con 60% opacidad)
```

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes UI
│   ├── Navbar.astro
│   ├── AISearch.astro
│   ├── BentoGrid.astro
│   └── ...
├── layouts/            # Layouts de página
├── lib/                # Utilidades y cliente Supabase
│   ├── supabase.ts
│   └── database.types.ts
├── pages/              # Rutas
│   ├── index.astro     # Explorador público
│   ├── login.astro     # Inicio de sesión
│   ├── registro.astro  # Formulario de postulación
│   ├── admin.astro     # Panel Super Admin
│   ├── lider.astro     # Panel de Líder
│   ├── mapa.astro      # Mapa de grupos
│   └── privacidad.astro
├── styles/             # Estilos globales
supabase/
└── migrations/         # Migraciones SQL
vercel.json             # Configuración de Vercel
scripts/
└── migrate-to-supabase.js  # Script de migración
```

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview

# Migrar datos
node scripts/migrate-to-supabase.js

# Generar tipos de Supabase (si tienes CLI)
supabase gen types typescript --project-id your-project-id > src/lib/database.types.ts
```

## 🐛 Solución de Problemas

### Error: "Invalid API key"
Verifica que las variables de entorno estén correctamente configuradas.

### Error: "row-level security policy"
Verifica que las políticas RLS estén correctamente aplicadas en Supabase.

### Error: "permission denied for table"
Asegúrate de usar el Service Role Key para operaciones administrativas.

## 📝 Notas Importantes

1. **Seguridad**: Nunca expongas el `SUPABASE_SERVICE_ROLE_KEY` en el frontend.
2. **Emails**: Las notificaciones se envían con Resend (free tier, 3,000 emails/mes; requiere dominio verificado).
3. **Dominios**: Configura los dominios permitidos en Supabase Auth settings.
4. **Backup**: Realiza backups periódicos de tu base de datos.

## 🙏 Créditos

- **Diseño**: Stitch Designs (Glassmorphism 2.0)
- **Desarrollo**: Nikko para UNAL
- **Facultad de Ingeniería - Universidad Nacional de Colombia**

## 📄 Licencia

Proyecto interno de la Universidad Nacional de Colombia.
