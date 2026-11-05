/** @type {import('tailwindcss').Config} */
const tok = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Tokens via CSS vars (RGB triplets) - ver global.css :root / html.dark
        'primary': tok('primary'),
        'primary-light': tok('primary-light'),
        'primary-dark': tok('primary-dark'),

        'accent': tok('accent'),
        'accent-light': tok('accent-light'),
        'accent-dark': tok('accent-dark'),

        'neon': tok('neon'),
        'neon-light': tok('neon-light'),

        // Surfaces
        'bg': tok('bg'),
        'bg-raised': tok('bg-raised'),
        'bg-card': tok('bg-card'),
        'bg-hover': tok('bg-hover'),
        'bg-input': tok('bg-input'),
        'ink': tok('ink'),
        'paper': tok('paper'),

        // Text
        'text-primary': tok('text-primary'),
        'text-secondary': tok('text-secondary'),
        'text-muted': tok('text-muted'),
        'text-accent': tok('text-accent'),

        // Borders
        'border-default': tok('border-default'),
        'border-hover': tok('border-hover'),
        'border-subtle': tok('border-subtle'),

        // Semantic
        'success': tok('success'),
        'error': tok('error'),
        'warning': tok('warning'),

        // Aliases heredados (sistema Material anterior) -> tokens actuales
        'on-surface': tok('text-primary'),
        'on-surface-variant': tok('text-secondary'),
        'secondary': tok('accent-light'),
        'secondary-container': tok('bg-hover'),
        'tertiary': tok('neon'),
        'surface-container-low': tok('bg-raised'),
        'outline-variant': tok('border-default'),
        'error-container': tok('error'),

        'gradient-start': tok('primary'),
        'gradient-mid': tok('accent'),
        'gradient-end': tok('neon'),
      },
      fontFamily: {
        'sans': ['Geist', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'mono': ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        'display': ['Geist', 'system-ui', 'sans-serif'],
        'serif': ['"Instrument Serif"', 'Georgia', 'serif'],
        // Aliases heredados
        'label-mono': ['"Geist Mono"', 'ui-monospace', 'monospace'],
        'display-lg': ['Geist', 'system-ui', 'sans-serif'],
        'headline-md': ['Geist', 'system-ui', 'sans-serif'],
        'body-base': ['Geist', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '600' }],
        'display-lg': ['2.75rem', { lineHeight: '1.08', letterSpacing: '-0.035em', fontWeight: '600' }],
        'display-lg-mobile': ['2.125rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-md': ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '600' }],
        'headline-md': ['1.375rem', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-base': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.06em', fontWeight: '500' }],
        'label-mono': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.08em', fontWeight: '500' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        'margin-mobile': '1.25rem',
        'margin-desktop': '2.5rem',
      },
      maxWidth: {
        'container-max': '80rem',
      },
      borderRadius: {
        'sm': '0.375rem',
        'DEFAULT': '0.5rem',
        'md': '0.625rem',
        'lg': '0.875rem',
        'xl': '1.125rem',
        '2xl': '1.375rem',
        '3xl': '1.75rem',
        'full': '9999px',
      },
      boxShadow: {
        // Sombras neutras y cortas: sin "glow"
        'xs': '0 1px 2px rgb(var(--c-shadow) / 0.06)',
        'glow-sm': '0 1px 2px rgb(var(--c-shadow) / 0.08), 0 4px 12px -4px rgb(var(--c-shadow) / 0.12)',
        'glow': '0 2px 4px rgb(var(--c-shadow) / 0.08), 0 12px 28px -10px rgb(var(--c-shadow) / 0.22)',
        'glow-lg': '0 4px 8px rgb(var(--c-shadow) / 0.08), 0 24px 48px -16px rgb(var(--c-shadow) / 0.28)',
        'glow-accent': '0 12px 28px -10px rgb(var(--c-shadow) / 0.22)',
        'glow-lime': '0 12px 28px -10px rgb(var(--c-shadow) / 0.22)',
        'card': '0 1px 2px rgb(var(--c-shadow) / 0.05), 0 8px 24px -12px rgb(var(--c-shadow) / 0.14)',
        'card-hover': '0 2px 4px rgb(var(--c-shadow) / 0.06), 0 24px 48px -20px rgb(var(--c-shadow) / 0.28)',
      },
      backdropBlur: {
        'glass': '14px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'none',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow': 'fadeIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    }
  },
  plugins: []
};
