import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const fixturePath = 'tests/fixtures/blog/representative.json';

async function buildFixtureSite() {
  const projectRoot = process.cwd();
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'kmsc-blog-build-'));

  for (const directory of ['content', 'public', 'scripts', 'src']) {
    await cp(directory, join(fixtureRoot, directory), { recursive: true });
  }
  for (const file of ['astro.config.mjs', 'package.json', 'package-lock.json', 'tsconfig.json']) {
    await cp(file, join(fixtureRoot, file));
  }
  await symlink(join(projectRoot, 'node_modules'), join(fixtureRoot, 'node_modules'), 'dir');
  await mkdir(join(fixtureRoot, 'content/blog'), { recursive: true });
  await cp(fixturePath, join(fixtureRoot, 'content/blog/representative.json'));
  const optionalPost = JSON.parse(await readFile(fixturePath, 'utf8')) as Record<string, unknown>;
  delete optionalPost.cover;
  delete optionalPost.coverAlt;
  optionalPost.tags = [];
  optionalPost.title = 'A Blog Post Without Optional Media';
  optionalPost.slug = 'blog-post-without-optional-media';
  await writeFile(join(fixtureRoot, 'content/blog/without-optional-media.json'), JSON.stringify(optionalPost));

  const result = spawnSync('npm', ['run', 'build'], {
    cwd: fixtureRoot,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    throw new Error(`Representative Blog Post build failed:\n${result.stdout}\n${result.stderr}`);
  }

  return fixtureRoot;
}

async function serveDirectory(directory: string) {
  const server = createServer(async (request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const relativePath = requestPath.endsWith('/') ? `${requestPath}index.html` : requestPath;
    const filePath = resolve(directory, `.${relativePath}`);

    if (!filePath.startsWith(`${resolve(directory)}/`)) {
      response.writeHead(404).end();
      return;
    }

    try {
      const body = await readFile(filePath);
      const contentTypes: Record<string, string> = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.png': 'image/png',
        '.svg': 'image/svg+xml'
      };
      response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream' }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });

  await new Promise<void>(resolveServer => server.listen(0, '127.0.0.1', resolveServer));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Fixture server did not expose a port.');
  return { server, url: `http://127.0.0.1:${address.port}` };
}

test('representative Blog Post renders from a production build', async ({ page }) => {
  const fixtureRoot = await buildFixtureSite();
  let fixtureServer: { server: Server; url: string } | undefined;

  try {
    fixtureServer = await serveDirectory(join(fixtureRoot, 'dist'));
    await page.goto(`${fixtureServer.url}/blog/practical-starting-point-training-conversations/`);

    await expect(page).toHaveTitle('A Practical Starting Point for Training Conversations | Kautilya Management System Consultancy Pvt. Ltd.');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'A representative Blog Post summary used only to verify the publishing path.');
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute('content', '2025-01-15');
    await expect(page.locator('article.prose h1')).toHaveText('A Practical Starting Point for Training Conversations');
    await expect(page.locator('time[datetime="2025-01-15"]')).toHaveText('15 January 2025');
    await expect(page.getByText('By Dr. Sundar Subramani', { exact: true })).toBeVisible();
    await expect(page.getByText('Tags: training, management systems', { exact: true })).toBeVisible();
    await expect(page.getByText('This is a representative Blog Post body for test coverage.', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'A considered approach' })).toBeVisible();
    await expect(page.locator('article.prose > div strong')).toHaveText('not');
    await expect(page.getByText('Unsafe link', { exact: true })).toBeVisible();
    await expect(page.locator('article.prose a[href^="javascript:"]')).toHaveCount(0);
    await expect(page.locator('article.prose img')).toHaveAttribute('src', '/media/social-preview.png');
    await expect(page.locator('article.prose img')).toHaveAttribute('alt', 'KMSC navy and orange brand mark on a light background');

    await page.goto(`${fixtureServer.url}/blog/`);
    await expect(page.getByRole('link', { name: 'A Practical Starting Point for Training Conversations' })).toHaveAttribute(
      'href',
      '/blog/practical-starting-point-training-conversations/'
    );
    const representativeCard = page.locator('article.card').filter({ hasText: 'A Practical Starting Point for Training Conversations' });
    await expect(representativeCard.getByText('A representative Blog Post summary used only to verify the publishing path.', { exact: true })).toBeVisible();
    await expect(representativeCard.locator('time[datetime="2025-01-15"]')).toHaveText('15 January 2025');
    await expect(representativeCard.getByText('Tags: training, management systems', { exact: true })).toBeVisible();
    await expect(representativeCard.locator('img')).toHaveCount(1);
    const cardImage = representativeCard.locator('img');
    const cardImageBox = await cardImage.boundingBox();
    const cardBox = await representativeCard.boundingBox();
    expect(cardImageBox).not.toBeNull();
    expect(cardBox).not.toBeNull();
    expect(cardImageBox!.width).toBeLessThanOrEqual(cardBox!.width);
    expect(cardImageBox!.height).toBeLessThanOrEqual(220);

    await page.goto(`${fixtureServer.url}/blog/blog-post-without-optional-media/`);
    await expect(page.locator('article.prose img')).toHaveCount(0);
    await expect(page.getByText('Tags:', { exact: false })).toHaveCount(0);
  } finally {
    fixtureServer?.server.close();
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
