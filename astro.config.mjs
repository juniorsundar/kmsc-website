import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://kautilyamsc.com',
  output: 'static',
  build: { format: 'directory' }
});
