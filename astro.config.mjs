import { defineConfig } from 'astro/config';

const indexingEnabled = process.env.PUBLIC_INDEXING_ENABLED === 'true';
const productionOrigin = 'https://kautilyamsc.com';
const configuredPreviewOrigin = process.env.PUBLIC_SITE_URL;
const site = indexingEnabled
  ? productionOrigin
  : configuredPreviewOrigin && configuredPreviewOrigin !== productionOrigin
    ? configuredPreviewOrigin
    : 'https://preview.kautilyamsc.com';

export default defineConfig({
  site,
  output: 'static',
  build: { format: 'directory' }
});
