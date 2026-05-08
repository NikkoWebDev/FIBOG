/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'tertiary-fixed': '#acedff',
        'background': '#131313',
        'primary': '#85d990',
        'secondary-fixed': '#6ffbbe',
        'outline-variant': '#40493f',
        'surface-container-highest': '#353534',
        'on-tertiary-fixed': '#001f26',
        'inverse-surface': '#e5e2e1',
        'surface-dim': '#131313',
        'on-surface': '#e5e2e1',
        'on-tertiary-container': '#4fdaf9',
        'primary-fixed-dim': '#85d990',
        'primary-fixed': '#a1f6aa',
        'on-surface-variant': '#bfc9bc',
        'surface-container-lowest': '#0e0e0e',
        'on-primary-container': '#88db92',
        'inverse-on-surface': '#313030',
        'surface-bright': '#393939',
        'on-background': '#e5e2e1',
        'on-secondary-fixed': '#002113',
        'inverse-primary': '#156d30',
        'on-tertiary-fixed-variant': '#004e5c',
        'on-primary': '#003914',
        'primary-container': '#006227',
        'surface-variant': '#353534',
        'surface-container': '#201f1f',
        'surface-container-low': '#1c1b1b',
        'secondary': '#4edea3',
        'error': '#ffb4ab',
        'surface': '#131313',
        'on-primary-fixed-variant': '#005320',
        'on-secondary-fixed-variant': '#005236',
        'secondary-container': '#00a572',
        'tertiary-fixed-dim': '#4cd7f6',
        'on-error': '#690005',
        'outline': '#899487',
        'surface-container-high': '#2a2a2a',
        'on-primary-fixed': '#002108',
        'secondary-fixed-dim': '#4edea3',
        'on-error-container': '#ffdad6',
        'on-secondary-container': '#00311f',
        'tertiary': '#4cd7f6',
        'tertiary-container': '#005d6d',
        'error-container': '#93000a',
        'surface-tint': '#85d990',
        'on-tertiary': '#003640'
      },
      fontFamily: {
        'label-mono': ['JetBrains Mono', 'monospace'],
        'body-sm': ['Inter', 'sans-serif'],
        'display-lg': ['Geist', 'sans-serif'],
        'body-base': ['Inter', 'sans-serif'],
        'display-lg-mobile': ['Geist', 'sans-serif'],
        'headline-md': ['Geist', 'sans-serif']
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
