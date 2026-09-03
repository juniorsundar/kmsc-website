import type { APIRoute } from 'astro';
import { siteIndexable } from '../config/release';
import { blogPosts } from '../data/blog-posts';

const publicPaths = ['/', '/about/', '/services/', '/blog/', '/contact/', '/privacy/'];

export const GET: APIRoute = ({ site }) => {
  const origin = site || new URL('https://preview.kautilyamsc.com');
  // Never advertise a page that BaseLayout serves as noindex.
  const paths = siteIndexable
    ? [...publicPaths, ...blogPosts.filter(post => !post.noindex).map(post => `/blog/${post.slug}/`)]
    : [];
  const urls = paths
    .map(path => `  <url><loc>${new URL(path, origin).href}</loc></url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls ? `\n${urls}\n` : ''}</urlset>\n`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
