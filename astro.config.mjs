import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  integrations: [tailwind()],
  output: 'hybrid',
  adapter: vercel({ runtime: 'nodejs20.x' }),
  distDir: 'dist',
  server: {
    port: 4321,
    host: true
  }
});
