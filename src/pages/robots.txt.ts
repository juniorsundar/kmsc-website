import type { APIRoute } from 'astro';
import { indexingEnabled } from '../config/release';

export const GET: APIRoute = ({ site }) => {
  const origin = site || new URL('https://preview.kautilyamsc.com');
  const body = indexingEnabled
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', origin).href}\n`
    : 'User-agent: *\nDisallow: /\n';

  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};
