import { test, expect } from '@playwright/test';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const routes = ['/', '/about/', '/services/', '/blog/', '/contact/', '/privacy/'];
// The first fixture is marked noindex; the second is cleared for indexing. Both
// are built so the per-post control is proven in each direction.
const withheldBlogRoute = '/blog/practical-starting-point-training-conversations/';
const indexableBlogRoute = '/blog/indexable-blog-post-metadata-coverage/';

async function build(mode: 'preview' | 'production', { siteNoindex = false } = {}) {
  const root = await mkdtemp(join(tmpdir(), `kmsc-metadata-${mode}-`));
  for (const directory of ['content', 'public', 'scripts', 'src']) {
    await cp(directory, join(root, directory), { recursive: true });
  }
  for (const file of ['astro.config.mjs', 'package.json', 'package-lock.json', 'tsconfig.json']) {
    await cp(file, join(root, file));
  }
  await symlink(join(process.cwd(), 'node_modules'), join(root, 'node_modules'), 'dir');
  await mkdir(join(root, 'content/blog'), { recursive: true });
  await cp('tests/fixtures/blog/representative.json', join(root, 'content/blog/representative.json'));
  await cp('tests/fixtures/blog/indexable.json', join(root, 'content/blog/indexable.json'));

  if (siteNoindex) {
    const pagePath = join(root, 'content/page-content.json');
    const page = JSON.parse(await readFile(pagePath, 'utf8'));
    page.site.noindex = true;
    await writeFile(pagePath, `${JSON.stringify(page, null, 2)}\n`);
  }

  const result = spawnSync('npm', ['run', 'build'], {
    cwd: root,
    env: {
      ...process.env,
      PUBLIC_FORMSPREE_ENDPOINT: mode === 'production' ? 'https://formspree.io/f/test-production-form' : '',
      ...(mode === 'production' ? { PUBLIC_INDEXING_ENABLED: 'true' } : { PUBLIC_INDEXING_ENABLED: 'false' })
    },
    encoding: 'utf8'
  });
  if (result.status !== 0) throw new Error(`${mode} build failed:\n${result.stdout}\n${result.stderr}`);
  return root;
}

function assertMetadata(html: string, origin: string, indexed: boolean) {
  expect(html).toMatch(/<title>[^<]+<\/title>/);
  expect(html).toMatch(/<meta name="description" content="[^"]+">/);
  expect(html).toContain(`<link rel="canonical" href="${origin}`);
  expect(html).toContain(`<meta property="og:url" content="${origin}`);
  expect(html).toContain(`<meta property="og:image" content="${origin}/media/social-preview.png">`);
  expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
  if (indexed) expect(html).not.toContain('name="robots" content="noindex, nofollow"');
  else expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
}

test('preview production build protects every public route from indexing', async () => {
  const root = await build('preview');
  try {
    for (const route of [...routes, withheldBlogRoute, indexableBlogRoute]) {
      const path = join(root, 'dist', route, 'index.html');
      assertMetadata(await readFile(path, 'utf8'), 'https://preview.kautilyamsc.com', false);
    }
    const robots = await readFile(join(root, 'dist', 'robots.txt'), 'utf8');
    expect(robots).toContain('Disallow: /');
    expect(robots).not.toContain('Sitemap:');
    expect(await readFile(join(root, 'dist', 'sitemap.xml'), 'utf8')).not.toContain('<url>');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('production build enables indexing without changing content', async () => {
  const pageContent = await readFile('content/page-content.json', 'utf8');
  const root = await build('production');
  try {
    expect(await readFile('content/page-content.json', 'utf8')).toBe(pageContent);
    for (const route of [...routes, indexableBlogRoute]) {
      const path = join(root, 'dist', route, 'index.html');
      assertMetadata(await readFile(path, 'utf8'), 'https://kautilyamsc.com', true);
    }
    const robots = await readFile(join(root, 'dist', 'robots.txt'), 'utf8');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Sitemap: https://kautilyamsc.com/sitemap.xml');
    const sitemap = await readFile(join(root, 'dist', 'sitemap.xml'), 'utf8');
    for (const route of [...routes, indexableBlogRoute]) expect(sitemap).toContain(`https://kautilyamsc.com${route}`);
    expect(sitemap).not.toContain('/admin/');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('an indexable production build still withholds a Blog Post marked noindex', async () => {
  const root = await build('production');
  try {
    const html = await readFile(join(root, 'dist', withheldBlogRoute, 'index.html'), 'utf8');
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
    const sitemap = await readFile(join(root, 'dist', 'sitemap.xml'), 'utf8');
    expect(sitemap).not.toContain(withheldBlogRoute);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('the editor global noindex setting withholds an otherwise indexable build', async () => {
  const root = await build('production', { siteNoindex: true });
  try {
    for (const route of [...routes, withheldBlogRoute, indexableBlogRoute]) {
      const html = await readFile(join(root, 'dist', route, 'index.html'), 'utf8');
      expect(html, `${route} must be withheld`).toContain('<meta name="robots" content="noindex, nofollow">');
    }
    expect(await readFile(join(root, 'dist', 'robots.txt'), 'utf8')).toContain('Disallow: /');
    expect(await readFile(join(root, 'dist', 'sitemap.xml'), 'utf8')).not.toContain('<url>');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
