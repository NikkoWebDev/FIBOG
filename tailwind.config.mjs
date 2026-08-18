/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Core palette - Dark mode with vibrant accents
        'primary': '#8b5cf6',
        'primary-light': '#a78bfa',
        'primary-dark': '#7c3aed',

        'accent': '#06b6d4',
        'accent-light': '#22d3ee',
        'accent-dark': '#0891b2',

        'neon': '#f472b6',
        'neon-light': '#f9a8d4',

        // Surfaces
        'bg': '#0a0a0f',
        'bg-raised': '#12121a',
        'bg-card': '#1a1a26',
        'bg-hover': '#22223a',
        'bg-input': '#16162a',

        // Text
        'text-primary': '#f0f0f5',
        'text-secondary': '#9494a8',
        'text-muted': '#5a5a72',
        'text-accent': '#a78bfa',

        // Borders
        'border-default': '#2a2a3d',
        'border-hover': '#8b5cf6',
        'border-subtle': '#1e1e30',

        // Semantic
        'success': '#34d399',
        'error': '#f87171',
        'warning': '#fbbf24',

        // Gradients (used as solid fallback)
        'gradient-start': '#8b5cf6',
        'gradient-mid': '#06b6d4',
        'gradient-end': '#f472b6',
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
