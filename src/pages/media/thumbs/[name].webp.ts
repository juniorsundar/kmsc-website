import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { blogPosts, coverThumbName } from '../../../data/blog-posts';

// Blog list previews are built from the full-size cover at build time; the post page keeps the original.
export function getStaticPaths() {
  const covers = new Set(blogPosts.flatMap(post => (post.cover ? [post.cover] : [])));
  return [...covers].map(cover => ({ params: { name: coverThumbName(cover) }, props: { cover } }));
}

export const GET: APIRoute = async ({ props }) => {
  const source = await readFile(join(process.cwd(), 'public', props.cover as string));
  // 720x405 = 2x the largest card image (16:9, ~350px wide), matching the CSS crop.
  const body = await sharp(source).resize(720, 405, { fit: 'cover' }).webp({ quality: 75 }).toBuffer();
  return new Response(body, { headers: { 'Content-Type': 'image/webp' } });
};
