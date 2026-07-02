/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // UNAL Primary Scale (Green Olive)
        'primary': '#677d29',
        'primary-10': '#2a3805',
        'primary-20': '#3e4c19',
        'primary-30': '#516320',
        'primary-40': '#677d29',
        'primary-50': '#87a436',
        'primary-60': '#94b43b',
        'primary-70': '#a9c362',
        'primary-80': '#c0d881',
        'primary-90': '#deefb0',
        'primary-95': '#f4fddd',

        // UNAL Secondary (Dark Green)
        'secondary': '#284d21',

        // UNAL Tertiary (Institutional Blue)
        'tertiary': '#00566f',
        'tertiary-60': '#0082a9',
        'tertiary-70': '#2ba6cb',
        'tertiary-80': '#4fc5e9',

        // UNAL Neutral Scale
        'neutral': '#3d4041',
        'neutral-0': '#000000',
        'neutral-10': '#151717',
        'neutral-20': '#242627',
        'neutral-30': '#2f3233',
        'neutral-40': '#3d4041',
        'neutral-50': '#4e5254',
        'neutral-60': '#787b7d',
        'neutral-70': '#a2a3a4',
        'neutral-80': '#cccccc',
        'neutral-90': '#dcdcdc',
        'neutral-95': '#f4f4f4',
        'neutral-99': '#fafafa',
        'neutral-100': '#ffffff',

        // Semantic Colors (Light Mode)
        'success': '#1a784b',
        'error': '#aa0c00',
        'warning': '#8c6800',

        // Light mode surface aliases
        'background': '#fafafa',
        'surface': '#ffffff',
        'surface-container': '#f4f4f4',
        'surface-container-low': '#f4f4f4',
        'surface-container-lowest': '#ffffff',
        'surface-container-high': '#ececec',
        'surface-container-highest': '#e6e6e6',
        'surface-bright': '#ffffff',
        'surface-dim': '#d9d9d9',
        'surface-variant': '#e0e3e1',
        'surface-tint': '#677d29',

        'on-surface': '#1c1b1f',
        'on-surface-variant': '#49454f',
        'on-background': '#1c1b1f',
        'on-primary': '#ffffff',
        'on-primary-container': '#e8f5e9',
        'on-primary-fixed': '#2a3805',
        'on-primary-fixed-variant': '#3e4c19',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#e8f5e9',
        'on-secondary-fixed': '#1a2d16',
        'on-secondary-fixed-variant': '#284d21',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#e0f7fa',
        'on-tertiary-fixed': '#001f26',
        'on-tertiary-fixed-variant': '#004e5c',
        'on-error': '#ffffff',
        'on-error-container': '#ffdad6',
        'inverse-surface': '#313033',
        'inverse-on-surface': '#f4eff4',
        'inverse-primary': '#a9c362',

        'outline': '#79747e',
        'outline-variant': '#cac4d0',

        'error-container': '#ffdad6',
        'tertiary-container': '#d1e8f0',
        'secondary-container': '#d4edda',
        'primary-container': '#e8f5e9',
      },
      fontFamily: {
        'body': ['"Ancízar Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'display': ['"Ancízar Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'label-mono': ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        'body-sm': ['"Ancízar Sans"', 'system-ui', 'sans-serif'],
        'display-lg': ['"Ancízar Sans"', 'system-ui', 'sans-serif'],
        'body-base': ['"Ancízar Sans"', 'system-ui', 'sans-serif'],
        'display-lg-mobile': ['"Ancízar Sans"', 'system-ui', 'sans-serif'],
        'headline-md': ['"Ancízar Sans"', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'label-mono': ['12px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '500' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'display-lg': ['48px', { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '700' }],
        'body-base': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'display-lg-mobile': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '600' }]
      },
      spacing: {
        'unit': '4px',
        'gutter': '24px',
        'margin-mobile': '16px',
        'margin-desktop': '64px',
        'container-max': '1440px'
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        'full': '9999px'
      },
      backdropBlur: {
        'glass': '16px'
      }
    }
  },
  plugins: []
};
