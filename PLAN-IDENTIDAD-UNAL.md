# Plan de Implementación: Identidad Visual UNAL - Semilleros FIBOG

## 📋 Resumen Ejecutivo

Transformar el sitio actual de semilleros (diseño glassmorphism moderno) para que cumpla con la **plantilla web institucional UNAL** manteniendo la funcionalidad existente.

---

## 🏗️ Estructura Obligatoria de la Plantilla UNAL

La plantilla tiene **5 áreas obligatorias** que deben conservar su diseño:

### Área 1: Cabezote (Header)
```
┌─────────────────────────────────────────────────────────────┐
│ [Aspirantes] [Estudiantes] [Egresados] [Docentes] [Admin] │ ← Perfiles usuario
│ [f] [t] [yt] [in]                                    [ES] │ ← Redes sociales + idioma
├─────────────────────────────────────────────────────────────┤
│ 🛡️ UNIVERSIDAD     subdominio.unal.edu.co    🔍 [Buscar] 🇨🇴 │ ← Logo + URL + Buscador
│    NACIONAL                                                │
│    DE COLOMBIA                                             │
├─────────────────────────────────────────────────────────────┤
│ ITEM MENÚ 1 ▼  |  ITEM MENÚ 2  |  ...  |  SEDES ▼         │ ← Menú principal (máx 6)
└─────────────────────────────────────────────────────────────┘
```

**Elementos obligatorios:**
- Escudo UNAL → enlaza a unal.edu.co
- Texto "UNIVERSIDAD NACIONAL DE COLOMBIA"
- URL del sitio: `subdominio.unal.edu.co`
- Menú de perfiles de usuario (5 tipos)
- Menú principal (máx 6 primer nivel, máx 8 segundo nivel)
- Buscador nacional
- Escudo de Colombia
- Iconos de redes sociales (máx 4)
- Menú de idioma

### Área 2: Panel de Accesibilidad
- Flotante en la esquina superior derecha
- Opciones: Tamaño de letra, Cambiar contrastes, Invertir colores

### Área 3: Pestaña de Servicios
- Panel lateral derecho con servicios:
  - Correo institucional (obligatorio)
  - DNINFOA - SIA
  - Bibliotecas
  - Convocatorias
  - Identidad UNAL

### Área 4: Contenido
- **Breadcrumb** (miga de pan) obligatorio en páginas internas
- Layout flexible según nivel:
  - **Nacional**: Foto de fondo + Agencia de Noticias + Banners
  - **Sedes**: Similar a nacional
  - **Facultades**: Más simplificado

### Área 5: Pie de Página (Footer)
```
┌─────────────────────────────────────────────────────────────┐
│ RÉGIMEN LEGAL    │ CORREO INSTITUCIONAL │ CONTACTO PÁGINA: │
│ Talento humano   │ Mapa del sitio       │ Carrera 45 #26-85│
│ Contratación     │ Redes Sociales       │ Edif. Uriel Gutié│
│ Ofertas de empleo│ Preguntas frecuentes │ Bogotá D.C.      │
│ Rendición cuentas│ Quejas y reclamos    │ (+57 1) 316 5000 │
│ Concurso docente │ Servicios en línea   │                  │
│ Pago virtual     │ Encuesta             │ © Copyright 2026 │
│ Control interno  │ Contáctenos          │ Algunos derechos │
│ Calidad          │ Estadísticas         │ reservados.      │
│ Buzón notifs.    │ Glosario             │                  │
├─────────────────────────────────────────────────────────────┤
│ [Orgullo UNAL] [Agencia UNAL] [🇨🇴] [♿]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Paleta de Colores Oficial

| Color | Pantone | RGB | Hex | Uso |
|-------|---------|-----|-----|-----|
| **Institucional** | 376 C | 148, 180, 59 | `#94B43B` | Color principal |
| **Alterno** | 187 C | 166, 28, 49 | `#A61C31` | Acentos, errores |
| **Complementario 1** | 7743 C | 70, 107, 63 | `#466B3F` | Verde oscuro |
| **Complementario 2** | 188 C | 118, 35, 47 | `#76232F` | Rojo oscuro |
| **Gris oscuro** | 425 C | 86, 90, 92 | `#565A5C` | Texto secundario |
| **Gris claro** | 421 C | 177, 178, 176 | `#B1B2B0` | Bordes, divider |

**Nota:** Los colores del kit de diseño (`#677d29`, `#284d21`, etc.) son variaciones digitales de estos colores oficiales.

---

## ✏️ Tipografía

- **Cuerpo**: Ancizar Sans (Regular, Bold)
- **Títulos**: Ancizar Sans (Bold, Extrabold)
- **Serif alternativa**: Ancizar Serif (para citas, énfasis)
- **Monospace**: SFMono-Regular, Menlo, Monaco, Consolas

---

## 📁 Archivos a Modificar

### Críticos (Alto impacto)
| Archivo | Cambio |
|---------|--------|
| `src/layouts/Layout.astro` | Reestructurar con las 5 áreas UNAL |
| `src/components/Navbar.astro` | Reemplazar por cabezote UNAL (perfiles + menú + buscador) |
| `src/components/Footer.astro` | Reemplazar por pie de página UNAL (5 columnas) |
| `tailwind.config.mjs` | Actualizar colores oficiales |
| `src/styles/global.css` | Estilos UNAL + dark mode adaptado |

### Componentes (Medio impacto)
| Archivo | Cambio |
|---------|--------|
| `src/components/AISearch.astro` | Adaptar al buscador UNAL |
| `src/components/FilterBar.astro` | Mantener funcionalidad, ajustar estilos |
| `src/components/BentoCard.astro` | Mantener, ajustar colores |
| `src/components/BentoGrid.astro` | Mantener, ajustar spacing |

### Páginas (Bajo impacto - solo colores)
| Archivo | Cambio |
|---------|--------|
| `src/pages/index.astro` | Reestructurar con layout UNAL |
| `src/pages/login.astro` | Ajustar colores |
| `src/pages/registro.astro` | Ajustar colores |
| `src/pages/admin.astro` | Ajustar colores |
| `src/pages/lider.astro` | Ajustar colores |
| `src/pages/perfil.astro` | Ajustar colores |
| `src/pages/grupo/[id].astro` | Ajustar colores |

---

## 🔧 Plan de Implementación por Fases

### Fase 1: Fundación (Diseño System)
1. Actualizar `tailwind.config.mjs` con colores oficiales UNAL
2. Actualizar `global.css` con variables CSS UNAL
3. Crear componente `UnalHeader.astro` con cabezote completo
4. Crear componente `UnalFooter.astro` con pie de página completo
5. Crear componente `AccessibilityPanel.astro`
6. Crear componente `ServicesTab.astro`

### Fase 2: Layout Base
1. Reestructurar `Layout.astro` con las 5 áreas
2. Integrar `UnalHeader` y `UnalFooter`
3. Agregar breadcrumbs a páginas internas
4. Adaptar `index.astro` al layout UNAL

### Fase 3: Componentes Existentes
1. Adaptar `Navbar.astro` → integrar en cabezote
2. Adaptar `AISearch.astro` → integrar en buscador
3. Adaptar `FilterBar.astro` → ajustar estilos
4. Adaptar `BentoCard.astro` y `BentoGrid.astro`

### Fase 4: Páginas Internas
1. Adaptar `login.astro`
2. Adaptar `registro.astro`
3. Adaptar `admin.astro`
4. Adaptar `lider.astro`
5. Adaptar `perfil.astro`
6. Adaptar `grupo/[id].astro`
7. Adaptar `privacidad.astro`

### Fase 5: Optimización
1. Verificar responsive design
2. Verificar accesibilidad
3. Verificar dark mode (si aplica)
4. Optimizar imágenes
5. Testing final

---

## ⚠️ Consideraciones Importantes

1. **Dominio**: El sitio debe estar en `unal.edu.co` o subdominio
2. **CMS**: La UNAL recomienda usar CMS (no HTML plano)
3. **Avail**: Todo debe ser avalado por Unimedios antes de publicar
4. **Responsive**: Obligatorio para todos los dispositivos
5. **Accesibilidad**: Panel de accesibilidad obligatorio
6. **Footer**: Elementos marcados como "no modificables" no se pueden cambiar

---

## 🎯 Decisión de Diseño

**Opción A**: Cumplimiento estricto (100% plantilla UNAL)
- Pros: Cumple normativa, facile aval
- Contras: Pierde identidad moderna del sitio actual

**Opción B**: Híbrido (mantener funcionalidad + toques UNAL)
- Pros: Mantiene UX moderna, cumple elementos clave
- Contras: Puede no tener aval completo

**Recomendación**: Opción B con énfasis en:
- Cabezote UNAL completo (obligatorio)
- Footer UNAL completo (obligatorio)
- Colores oficiales
- Tipografía Ancizar
- Contenido libre con estética moderna

---

*Documento generado: 2026-07-01*
*Fuentes: identidad.unal.edu.co, gestionapp.unal.edu.co/cdn/doc/*
