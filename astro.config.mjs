import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  distDir: 'dist',
  server: {
    port: 4321,
    host: true
  }
});
