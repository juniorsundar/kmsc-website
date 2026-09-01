import { readFile, readdir } from 'node:fs/promises';
import { z } from 'zod';

const service = z.object({ name: z.string().trim().min(1), description: z.string().trim().min(1) });
const content = z.object({
  site: z.object({
    legalName: z.literal('Kautilya Management System Consultancy Pvt. Ltd.'),
    email: z.string().email(), cta: z.literal('Discuss Your Training Needs'),
    author: z.object({ name: z.literal('Dr. Sundar Subramani'), role: z.string().min(1) }),
    description: z.string().trim().min(1), noindex: z.boolean()
  }),
  home: z.object({ eyebrow: z.string().min(1), headline: z.string().min(1), intro: z.string().min(1), servicesHeading: z.string().min(1), servicesIntro: z.string().min(1) }),
  services: z.array(service).min(1)
});
const blogPost = z.object({ title: z.string().trim().min(1), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), summary: z.string().trim().min(1), date: z.string().date(), body: z.string().trim().min(1), tags: z.array(z.string()), author: z.string().min(1), cover: z.string().regex(/^\/media\/.+\.(jpe?g|png|webp)$/i).optional(), noindex: z.boolean().default(true) });

function parse(value, schema, label) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues.map(issue => `${issue.path.join('.') || label}: ${issue.message}`).join('; ');
    throw new Error(`Invalid ${label}: ${details}`);
  }
  return result.data;
}
const page = parse(JSON.parse(await readFile(new URL('../content/page-content.json', import.meta.url))), content, 'Page Content');
const blogDir = new URL('../content/blog/', import.meta.url);
const files = (await readdir(blogDir)).filter(file => file.endsWith('.json')).sort();
const posts = await Promise.all(files.map(async file => JSON.parse(await readFile(new URL(file, blogDir)))));
const slugs = new Set();
for (const [index, post] of posts.entries()) {
  const valid = parse(post, blogPost, `Blog Post ${files[index]}`);
  if (slugs.has(valid.slug)) throw new Error(`Invalid Blog Posts: duplicate slug “${valid.slug}”`);
  slugs.add(valid.slug);
}
console.log(`Validated Page Content and ${posts.length} Blog Post${posts.length === 1 ? '' : 's'}.`);
export { page, posts };
