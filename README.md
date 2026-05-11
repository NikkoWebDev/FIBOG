<div align="center">

# UNAL | FIBOG

### Facultad de Ingenieria BOGota

**Plataforma web para descubrir semilleros, grupos de investigacion y comunidades estudiantiles de la Facultad de Ingenieria - Universidad Nacional de Colombia, Sede Bogota.**

[![Astro](https://img.shields.io/badge/Astro-4.x-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Netlify](https://img.shields.io/badge/Netlify-Deploy-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://www.netlify.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-green?style=for-the-badge)](https://opensource.org/licenses/ISC)

</div>

---

## Tabla de Contenidos

- [Descripcion](#descripcion)
- [Caracteristicas](#caracteristicas)
- [Tecnologias](#tecnologias)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalacion y Uso](#instalacion-y-uso)
- [Variables de Entorno](#variables-de-entorno)
- [Scripts Disponibles](#scripts-disponibles)
- [Datos](#datos)
- [Despliegue](#despliegue)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Descripcion

**FIBOG** es una plataforma web estatica construida con [Astro](https://astro.build) que centraliza y organiza la informacion de los grupos de investigacion, semilleros y comunidades estudiantiles de la Facultad de Ingenieria de la UNAL Bogota.

El objetivo es facilitar a los estudiantes la busqueda y exploracion de estos grupos, permitiendo filtrar por tipo (Semillero, Grupo de Investigacion, Grupo Estudiantil), por carrera, y por terminos de busqueda. Incluye tambien una funcionalidad de busqueda asistida por IA.

---

## Caracteristicas

| Caracteristica | Descripcion |
|---|---|
| **Catalogo de Grupos** | Visualizacion en formato Bento Grid con tarjetas glassmorphism animadas con GSAP |
| **Filtrado Avanzado** | Filtros por tipo de grupo, carrera y busqueda por texto |
| **Busqueda con IA** | Endpoint de busqueda inteligente integrado con OpenRouter API |
| **Mapa de Investigacion** | Vista organizada por tipo y por carrera de todos los grupos |
| **Responsive** | Diseno adaptable con navbar inferior en movil y navbar flotante en escritorio |
| **Accesibilidad** | Focus states visibles, soporte para `prefers-reduced-motion` |
| **Privacidad** | Sin cookies, sin analytics, sin almacenamiento de datos personales |
| **Tema Oscuro** | Interfaz dark mode con paleta Material Design personalizada |
| **Parser CSV** | Script para importar datos desde CSV a JSON tipado |

---

## Tecnologias

- **Framework:** [Astro](https://astro.build) v4.x (Static Site Generation)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com) v3.x con tema personalizado
- **Animaciones:** [GSAP](https://greensock.com/gsap/) + ScrollTrigger (via CDN)
- **Tipografia:** Google Fonts (Inter, JetBrains Mono, Geist, Material Symbols)
- **IA:** [OpenRouter API](https://openrouter.ai/) (modelo `liquid/lfm-2.5-1.2b-instruct:free`)
- **Deploy:** [Netlify](https://www.netlify.com) (Static)
- **Lenguaje:** TypeScript (estricto)

---

## Estructura del Proyecto

```
FIBOG/
├── scripts/
│   └── parse-csv.js          # Parser CSV -> JSON + tipos TypeScript
├── src/
│   ├── components/
│   │   ├── AISearch.astro     # Barra de busqueda con IA
│   │   ├── BentoCard.astro    # Tarjeta individual de grupo
│   │   ├── BentoGrid.astro    # Grid de tarjetas con animaciones GSAP
│   │   ├── FilterBar.astro    # Barra de filtros (tipo + carrera)
│   │   ├── Footer.astro       # Pie de pagina
│   │   └── Navbar.astro       # Navegacion (desktop + mobile)
│   ├── data/
│   │   ├── grupos.json        # Datos de grupos (generado por parse-csv)
│   │   └── grupos.types.ts    # Tipos TypeScript + helpers de filtrado
│   ├── layouts/
│   │   └── Layout.astro       # Layout principal (HTML base, fonts, GSAP)
│   ├── pages/
│   │   ├── api/
│   │   │   └── search.ts      # Endpoint API para busqueda con IA
│   │   ├── index.astro        # Pagina principal (catalogo de grupos)
│   │   ├── mapa.astro         # Mapa de investigacion
│   │   └── privacidad.astro   # Politica de privacidad
│   ├── styles/
│   │   └── global.css         # Estilos globales (glass, shimmer, etc.)
│   └── env.d.ts               # Tipos para variables de entorno
├── astro.config.mjs           # Configuracion de Astro
├── netlify.toml               # Configuracion de Netlify
├── tailwind.config.mjs        # Configuracion de Tailwind CSS
├── tsconfig.json              # Configuracion de TypeScript (estricto)
└── package.json               # Dependencias y scripts
```

---

## Instalacion y Uso

### Requisitos Previos

- [Node.js](https://nodejs.org/) v20 o superior
- npm

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/WebStoreCorporation/FIBOG.git
cd FIBOG

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

El servidor estara disponible en `http://localhost:4321`.

### Build de Produccion

```bash
# Generar build estatico
npm run build

# Previsualizar el build
npm run preview
```

---

## Variables de Entorno

Crea un archivo `.env` en la raiz del proyecto (opcional, solo necesario para la busqueda con IA):

```env
OPENROUTER_API_KEY=tu_api_key_de_openrouter
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=liquid/lfm-2.5-1.2b-instruct:free
```

> **Nota:** Sin la API key, la busqueda con IA funcionara en modo fallback, ofreciendo resultados basados en coincidencia de palabras clave.

---

## Scripts Disponibles

| Script | Comando | Descripcion |
|---|---|---|
| `dev` | `npm run dev` | Inicia el servidor de desarrollo en `localhost:4321` |
| `build` | `npm run build` | Genera el sitio estatico en `/dist` |
| `preview` | `npm run preview` | Previsualiza el build de produccion |
| `parse-csv` | `npm run parse-csv` | Convierte el CSV de datos a `grupos.json` y genera tipos TypeScript |

---

## Datos

Los datos de los grupos se almacenan en `src/data/grupos.json` y se generan a partir de un archivo CSV usando el script `scripts/parse-csv.js`.

### Estructura de un Grupo

```typescript
interface Grupo {
  id: string;              // Identificador unico (ej: "unal-1-...")
  tipo: TipoGrupo;         // "Semillero" | "Grupo de Investigacion" | "Grupo Estudiantil"
  carreras: string[];      // Carreras asociadas
  carrera_str: string;     // Carreras como string separado por comas
  nombre: string;          // Nombre del grupo
  docente: string;         // Docente a cargo
  lider: string;           // Lider o representante estudiantil
  email: string;           // Correo de contacto
  vinculacion: string;     // Estado del proceso de vinculacion
  enfoque: string;         // Areas de enfoque
  descripcion: string;     // Descripcion detallada
  actividades: string;     // Actividades que realizan
  modalidad: Modalidad;    // "Presencial" | "Virtual" | "Mixta"
  horarios: string;        // Horarios habituales
  requisitos: string;      // Requisitos para ingresar
  nivel_academico: string; // Nivel academico recomendado
  redes: string;           // Redes sociales / contacto
  comentarios: string;     // Comentarios adicionales
}
```

### Actualizar Datos

1. Coloca el archivo CSV actualizado en la carpeta `STITCH DESIGNS/`
2. Ejecuta `npm run parse-csv`
3. Los archivos `src/data/grupos.json` y `src/data/grupos.types.ts` se regeneraran automaticamente

---

## Despliegue

El proyecto esta configurado para desplegarse en **Netlify** como sitio estatico.

### Configuracion de Netlify

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 20

Las variables de entorno de OpenRouter deben configurarse en el panel de Netlify si se desea habilitar la busqueda con IA en produccion.

---

## Contribuir

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/mi-feature`)
3. Realiza tus cambios y haz commit (`git commit -m "Agrega mi feature"`)
4. Sube tu rama (`git push origin feature/mi-feature`)
5. Abre un Pull Request

---

## Licencia

Este proyecto esta bajo la licencia [ISC](https://opensource.org/licenses/ISC).

---

<div align="center">

Hecho con **amor** por [Nikko](https://github.com/NikkoWebDev) para la **UNAL**

</div>
