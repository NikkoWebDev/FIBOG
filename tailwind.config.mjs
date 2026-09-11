/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Tokens via CSS vars (RGB triplets) - ver global.css :root / html.dark
        'primary': 'rgb(var(--c-primary) / <alpha-value>)',
        'primary-light': 'rgb(var(--c-primary-light) / <alpha-value>)',
        'primary-dark': 'rgb(var(--c-primary-dark) / <alpha-value>)',

        'accent': 'rgb(var(--c-accent) / <alpha-value>)',
        'accent-light': 'rgb(var(--c-accent-light) / <alpha-value>)',
        'accent-dark': 'rgb(var(--c-accent-dark) / <alpha-value>)',

        'neon': 'rgb(var(--c-neon) / <alpha-value>)',
        'neon-light': 'rgb(var(--c-neon-light) / <alpha-value>)',

        // Surfaces
        'bg': 'rgb(var(--c-bg) / <alpha-value>)',
        'bg-raised': 'rgb(var(--c-bg-raised) / <alpha-value>)',
        'bg-card': 'rgb(var(--c-bg-card) / <alpha-value>)',
        'bg-hover': 'rgb(var(--c-bg-hover) / <alpha-value>)',
        'bg-input': 'rgb(var(--c-bg-input) / <alpha-value>)',

        // Text
        'text-primary': 'rgb(var(--c-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--c-text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--c-text-muted) / <alpha-value>)',
        'text-accent': 'rgb(var(--c-text-accent) / <alpha-value>)',

        // Borders
        'border-default': 'rgb(var(--c-border-default) / <alpha-value>)',
        'border-hover': 'rgb(var(--c-border-hover) / <alpha-value>)',
        'border-subtle': 'rgb(var(--c-border-subtle) / <alpha-value>)',

        // Semantic
        'success': 'rgb(var(--c-success) / <alpha-value>)',
        'error': 'rgb(var(--c-error) / <alpha-value>)',
        'warning': 'rgb(var(--c-warning) / <alpha-value>)',

        // Gradients (used as solid fallback)
        'gradient-start': 'rgb(var(--c-primary) / <alpha-value>)',
        'gradient-mid': 'rgb(var(--c-accent) / <alpha-value>)',
        'gradient-end': 'rgb(var(--c-neon) / <alpha-value>)',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-lg': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-md': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-base': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'sm': '0.375rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(139, 92, 246, 0.3)',
        'glow': '0 0 30px -5px rgba(139, 92, 246, 0.4)',
        'glow-lg': '0 0 50px -10px rgba(139, 92, 246, 0.5)',
        'glow-accent': '0 0 30px -5px rgba(6, 182, 212, 0.4)',
        'card': '0 4px 24px -4px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 40px -8px rgba(139, 92, 246, 0.25)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(139, 92, 246, 0.15) 0, transparent 50%), radial-gradient(at 80% 0%, rgba(6, 182, 212, 0.1) 0, transparent 50%), radial-gradient(at 0% 50%, rgba(244, 114, 182, 0.08) 0, transparent 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px -3px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 30px -5px rgba(139, 92, 246, 0.5)' },
        },
      },
    }
  },
  plugins: []
};
