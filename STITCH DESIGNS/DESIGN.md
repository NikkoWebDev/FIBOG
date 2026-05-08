---
name: Ingeniería Dinámica
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bfc9bc'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#899487'
  outline-variant: '#40493f'
  surface-tint: '#85d990'
  primary: '#85d990'
  on-primary: '#003914'
  primary-container: '#006227'
  on-primary-container: '#88db92'
  inverse-primary: '#156d30'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#005d6d'
  on-tertiary-container: '#4fdaf9'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a1f6aa'
  primary-fixed-dim: '#85d990'
  on-primary-fixed: '#002108'
  on-primary-fixed-variant: '#005320'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1440px
---

## Brand & Style

This design system is built for the research groups and seedbeds of the Faculty of Engineering at UNAL Bogotá. It embodies an "Ingeniería Dinámica" (Dynamic Engineering) philosophy, merging the prestige of institutional academia with the cutting-edge velocity of modern technology.

The aesthetic follows **Glassmorphism 2.0**. Unlike early iterations, this version prioritizes legibility and performance, utilizing deep background blurs (`16px`) and multi-layered translucency to create a sense of physical depth. The interface feels like a precision instrument: organic yet structured, high-tech yet accessible. It targets a highly technical audience—researchers, students, and engineers—evoking a sense of speed, precision, and institutional evolution.

## Colors

The color palette is anchored in a deep **Anthracite Dark Mode**, providing a high-contrast foundation for luminous, glass-like elements. 

- **Institutional Green (#006227):** This evolved shade anchors the UI to UNAL’s heritage, used primarily for subtle branding and core structural accents.
- **Vibrant Emerald (#10B981):** Represents growth and the "seedbed" (semillero) concept. Used for primary actions and success states.
- **Electric Cyan (#06B6D4):** Infuses a high-tech, digital energy. Used for data visualizations, interactive highlights, and active states.
- **Surface Transparency:** Containers use a semi-transparent hex with an alpha channel (typically 60%) to allow the underlying background and noise textures to bleed through, creating the "Glass" effect.

## Typography

The typographic system balances technical precision with modern readability.

- **Geist** is used for headlines and display elements. Its tight kerning and geometric purity reflect a developer-centric and engineering aesthetic.
- **Inter** serves as the workhorse for body copy, ensuring high legibility across dense research papers and data-heavy interfaces.
- **JetBrains Mono** is utilized for metadata, badges, and labels, leaning into the engineering/scientific nature of the content.

Maintain tight tracking on large headlines to mimic the "Windows 11" modern typography style. Use secondary text colors (`#94A3B8`) for body descriptions to maintain visual hierarchy against the dark background.

## Layout & Spacing

The design system utilizes a **Bento Grid** layout philosophy. Content is organized into distinct, modular tiles of varying sizes that snap to a 12-column grid.

- **Desktop (12 cols):** 24px gutters. Use varied span widths (e.g., a 2x2 card next to a 1x1 card) to create a dynamic, modern dashboard feel.
- **Mobile (4 cols):** Margins shrink to 16px. Cards stack vertically, maintaining their aspect ratios where possible.
- **Rhythm:** Spacing follows a 4px base unit. Component internal padding should be generous (24px - 32px) to allow the glass backgrounds to breathe.

## Elevation & Depth

Depth is achieved through **optical layering** rather than traditional heavy shadows.

1.  **Backdrop Blur:** All primary containers must use `backdrop-filter: blur(16px)` with a slightly desaturated background color.
2.  **Inner Glow / Border:** Every glass card features a 1px solid border with a linear gradient (top-left to bottom-right). The gradient should go from `white/12%` to `white/4%`, creating a "crystalline" edge that catches the light.
3.  **Shadows:** Use very subtle, high-spread ambient shadows (`0 20px 40px rgba(0,0,0,0.3)`) to separate floating layers from the base anthracite floor.
4.  **Z-Index Layers:**
    - Level 0: Anthracite background with noise texture.
    - Level 1: Bento Grid Cards.
    - Level 2: Floating Navbars and Modals.

## Shapes

The shape language is "Organic Tech." We avoid harsh 90-degree angles in favor of approachable, squircle-like containers.

- **Bento Cards:** Use a standard `1rem` (16px) radius to maintain a structural but soft appearance.
- **Interactive Elements:** Buttons, Navbars, and Badges are strictly **pill-shaped** (fully rounded). This differentiates interactive touchpoints from static content containers.
- **Crystalline Accents:** Small decorative elements can use clipped corners or diamond shapes to reinforce the "Engineering" theme.

## Components

### Floating Navbar
A pill-shaped, centered navigation bar. It utilizes the maximum blur effect and a vibrant emerald border. It should appear to float approximately 24px from the bottom of the viewport on mobile and top of the viewport on desktop.

### Bento Cards
The primary content vessel. Cards have a subtle "noise" texture overlay at 2% opacity to break the digital smoothness and provide an organic feel. Hovering over a card should slightly increase the border opacity and shift the background tint toward the Electric Cyan accent.

### Interactive Badges
Used for research categories (e.g., "AI", "Robotics"). These are small, pill-shaped labels with a semi-transparent background of the accent color and a high-contrast text label using JetBrains Mono.

### Buttons
Primary buttons use a solid gradient from Institutional Green to Emerald. Secondary buttons are "Ghost" style—transparent with a 1px translucent border and a subtle glass blur on hover.

### Progress Indicators
Thin, Electric Cyan lines. Use them for project completion status or research milestones, emphasizing the "Fast" and "High-tech" vibe.