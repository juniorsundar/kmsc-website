import { access, readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { relative, resolve, sep } from 'node:path';
import { z } from 'zod';
import { marked } from 'marked';

const trainingService = z.object({
  order: z.number().int().positive(),
  name: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  description: z.string().trim().min(1)
});
const content = z.object({
  site: z.object({
    legalName: z.literal('Kautilya Management System Consultancy Pvt. Ltd.'),
    email: z.string().email(),
    cta: z.literal('Discuss Your Training Needs'),
    author: z.object({ name: z.literal('Dr. Sundar Subramani'), role: z.string().min(1) }),
    description: z.string().trim().min(1),
    noindex: z.boolean(),
    socialPreview: z.string().regex(/^\/(media)\/.+\.(jpe?g|png|webp)$/i),
    footerTagline: z.string().trim().min(1),
    formspreeEndpoint: z.string().url().regex(/^https:\/\/formspree\.io\/f\/.+$/, 'must be a Formspree form endpoint').optional()
  }),
  home: z.object({
    titleSuffix: z.string().trim().min(1),
    eyebrow: z.string().min(1),
    headline: z.string().min(1),
    intro: z.string().min(1),
    servicesHeading: z.string().min(1),
    servicesIntro: z.string().min(1)
  }),
  about: z.object({ heading: z.string().min(1), intro: z.string().min(1), founderBio: z.string().min(1) }),
  servicesPage: z.object({ heading: z.string().trim().min(1), intro: z.string().trim().min(1) }),
  contact: z.object({
    eyebrow: z.string().trim().min(1),
    heading: z.string().trim().min(1),
    intro: z.string().trim().min(1)
  })
});
const blogPost = z.object({
  title: z.string().trim().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'use lowercase words separated by hyphens'),
  summary: z.string().trim().min(1),
  date: z.string().date(),
  body: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).default([]),
  author: z.string().trim().min(1),
  cover: z.string().regex(/^\/media\/.+\.(jpe?g|png|webp)$/i, 'must reference an approved /media JPG, PNG, or WebP Media Asset').optional(),
  coverAlt: z.string().trim().min(1).optional(),
  noindex: z.boolean().default(true)
}).superRefine((post, context) => {
  if (post.cover && !post.coverAlt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['coverAlt'], message: 'is required when cover is provided' });
  }
});

async function readJson(file, label) {
  try {
    return JSON.parse(await readFile(file));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${label} ${contentLabel(file)}: malformed JSON (${reason})`);
  }
}

function parse(value, schema, label) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues.map(issue => `${issue.path.join('.') || label}: ${issue.message}`).join('; ');
    throw new Error(`Invalid ${label}: ${details}`);
  }
  return result.data;
}

const contentRoot = process.env.CONTENT_DIR
  ? resolve(process.env.CONTENT_DIR)
  : fileURLToPath(new URL('../content/', import.meta.url));
const mediaRoot = process.env.MEDIA_DIR
  ? resolve(process.env.MEDIA_DIR)
  : resolve(fileURLToPath(new URL('../public/media/', import.meta.url)));
const contentPath = file => resolve(contentRoot, file);
const contentLabel = file => `content/${relative(contentRoot, file).split(sep).join('/')}`;

async function loadCollection(directory, label, schema, { required = false } = {}) {
  let dirEntries = [];
  try {
    dirEntries = await readdir(directory);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const files = dirEntries.filter(file => file.endsWith('.json')).sort();
  if (required && files.length === 0) {
    throw new Error(`Invalid ${label}s: ${contentLabel(directory)} must contain at least one ${label}.`);
  }

  return Promise.all(files.map(async file => {
    const fullPath = resolve(directory, file);
    const value = await readJson(fullPath, label);
    return { file: contentLabel(fullPath), value: parse(value, schema, `${label} ${contentLabel(fullPath)}`) };
  }));
}

const pagePath = contentPath('page-content.json');
const page = parse(await readJson(pagePath, 'Page Content'), content, 'Page Content');
const serviceEntries = await loadCollection(contentPath('services'), 'Training Service', trainingService, { required: true });
const services = serviceEntries.map(entry => entry.value);
const serviceOrders = new Map();
for (const entry of serviceEntries) {
  if (serviceOrders.has(entry.value.order)) {
    throw new Error(`Invalid Training Services: duplicate order "${entry.value.order}" in ${serviceOrders.get(entry.value.order)} and ${entry.file}.`);
  }
  serviceOrders.set(entry.value.order, entry.file);
}

const postEntries = await loadCollection(contentPath('blog'), 'Blog Post', blogPost);
async function validateMediaAsset(reference, entry, field) {
  if (!/^\/media\/.+\.(jpe?g|png|webp)$/i.test(reference)) {
    throw new Error(`Invalid Blog Post ${entry.file}: ${field} "${reference}" must reference an approved /media JPG, PNG, or WebP Media Asset.`);
  }

  const mediaPath = resolve(mediaRoot, reference.slice('/media/'.length));
  if (!mediaPath.startsWith(`${mediaRoot}${sep}`)) {
    throw new Error(`Invalid Blog Post ${entry.file}: ${field} "${reference}" must stay inside public/media.`);
  }

  try {
    const mediaStats = await stat(mediaPath);
    if (!mediaStats.isFile()) throw new Error('not a file');
    await access(mediaPath);
  } catch {
    throw new Error(`Invalid Blog Post ${entry.file}: ${field} "${reference}" does not exist.`);
  }
}

function markdownImageReferences(tokens, references = []) {
  for (const token of tokens) {
    if (token.type === 'image') references.push(token.href);
    if (token.tokens) markdownImageReferences(token.tokens, references);
    if (token.items) {
      for (const item of token.items) {
        markdownImageReferences([item], references);
      }
    }
  }
  return references;
}

await Promise.all(postEntries.map(async entry => {
  if (entry.value.cover) await validateMediaAsset(entry.value.cover, entry, 'cover Media Asset');
  const imageReferences = markdownImageReferences(marked.lexer(entry.value.body));
  await Promise.all(imageReferences.map(reference => validateMediaAsset(reference, entry, 'body Media Asset')));
}));
const posts = postEntries.map(entry => entry.value);
const slugs = new Map();
for (const entry of postEntries) {
  if (slugs.has(entry.value.slug)) {
    throw new Error(`Invalid Blog Posts: duplicate slug "${entry.value.slug}" in ${slugs.get(entry.value.slug)} and ${entry.file}.`);
  }
  slugs.set(entry.value.slug, entry.file);
}

console.log(`Validated Page Content, ${services.length} Training Services, and ${posts.length} Blog Post${posts.length === 1 ? '' : 's'}.`);
export { page, services, posts };
