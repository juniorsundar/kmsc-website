import { test, expect } from '@playwright/test';
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';

const textExtensions = new Set(['.astro', '.css', '.html', '.js', '.json', '.mjs', '.md', '.ts', '.toml', '.txt', '.xml', '.yml', '.yaml']);
const credentialPatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(?:ghp|gho|ghs)_[A-Za-z0-9]{20,}/,
  /client_secret\s*[:=]\s*["'][^"']{10,}["']/i,
  /GITHUB_TOKEN\s*[:=]\s*["'][^"']{10,}["']/i
];

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(path));
    else files.push(path);
  }
  return files;
}

function trackedFiles() {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
    .trim().split('\n').filter(path => path && existsSync(path));
}

async function assertNoCredentials(paths: string[]) {
  for (const path of paths) {
    if (!textExtensions.has(path.slice(path.lastIndexOf('.')))) continue;
    const content = await readFile(path, 'utf8');
    for (const pattern of credentialPatterns) {
      expect(content, `${path} matches ${pattern}`).not.toMatch(pattern);
    }
  }
}

test('tracked files contain no OAuth credentials or private keys', async () => {
  await assertNoCredentials(trackedFiles());
});

test('repository history contains no OAuth credentials or private keys', async () => {
  const history = execFileSync('git', ['log', '--all', '--format=', '--patch', '--', '.'], { encoding: 'utf8' });
  for (const pattern of credentialPatterns) {
    expect(history, `git history matches ${pattern}`).not.toMatch(pattern);
  }
});

test('generated artifacts contain no OAuth credentials or private keys', async () => {
  const artifactRoot = 'dist';
  try {
    await stat(artifactRoot);
  } catch {
    test.skip(true, 'The production build has not created dist yet.');
  }
  await assertNoCredentials(await filesUnder(artifactRoot));
});

test('the editor bundle is served same-origin and never from a CDN', async () => {
  const adminPage = await readFile('src/pages/admin/index.html', 'utf8');
  // The editor receives the GitHub access token, so a third-party host able to
  // answer for that script could exfiltrate a token with push access to main.
  const scriptSources = [...adminPage.matchAll(/<script[^>]*\ssrc="([^"]+)"/gi)].map(match => match[1]);
  expect(scriptSources.length).toBeGreaterThan(0);
  for (const source of scriptSources) {
    expect(source, 'the editor bundle must be a same-origin path').toMatch(/^\//);
  }
  expect(adminPage).not.toMatch(/unpkg\.com|cdn\.jsdelivr|cdnjs|jsdelivr\.net/i);

  const bundle = await stat('public/admin/decap-cms.js');
  expect(bundle.isFile()).toBe(true);
  expect(bundle.size).toBeGreaterThan(1_000_000);
});

test('production Caddy config sets the transport and content security headers', async () => {
  const config = await readFile('deploy/caddy/Caddyfile', 'utf8');
  expect(config).toMatch(/Strict-Transport-Security "max-age=\d+/);
  expect(config).toContain('X-Content-Type-Options "nosniff"');
  expect(config).toContain('Referrer-Policy "strict-origin-when-cross-origin"');

  // Each route group gets exactly one Content-Security-Policy, so the editor's
  // necessarily looser policy never applies to the public content pages.
  const policies = [...config.matchAll(/header @(\w+) Content-Security-Policy "([^"]+)"/g)];
  const byGroup = new Map(policies.map(([, group, policy]) => [group, policy]));
  expect([...byGroup.keys()].sort()).toEqual(['admin', 'contact', 'content']);
  for (const [group, policy] of byGroup) {
    expect(policy, `${group} must default to deny`).toContain("default-src 'none'");
    expect(policy, `${group} must not be framable`).toContain("frame-ancestors 'none'");
    expect(policy, `${group} must pin base-uri`).toContain("base-uri 'none'");
  }

  // Content pages run no script at all, and only the editor may reach GitHub.
  expect(byGroup.get('content')).not.toContain('script-src');
  expect(byGroup.get('content')).not.toMatch(/unsafe-eval|api\.github\.com/);
  expect(byGroup.get('contact')).not.toMatch(/unsafe-eval|api\.github\.com/);
  expect(byGroup.get('admin')).toContain("script-src 'self'");
  expect(byGroup.get('admin')).toMatch(/connect-src 'self' https:\/\/api\.github\.com/);
});

test('asset directories contain only approved project assets', async () => {
  const pageContent = await readFile('content/page-content.json', 'utf8');
  const blogFiles = await filesUnder('content/blog');
  const blogContent = await Promise.all(blogFiles.filter(path => path.endsWith('.json')).map(path => readFile(path, 'utf8')));
  const referencedMedia = new Set<string>();
  for (const source of [pageContent, ...blogContent]) {
    for (const match of source.matchAll(/\/media\/([^\s)\"']+\.(?:jpe?g|png|webp))/gi)) referencedMedia.add(match[1]);
  }
  referencedMedia.add('social-preview.png');

  for (const path of await filesUnder('public/media')) {
    expect(referencedMedia, `unexpected file in public/media`).toContain(relative('public/media', path));
  }

  const brandPattern = /^kmsc-(acronym(?:-full)?|head-and-ideas|card-back)\.png$/i;
  for (const path of await filesUnder('src/assets/brand')) {
    expect(relative('src/assets/brand', path), `unexpected file in src/assets/brand`).toMatch(brandPattern);
  }
});
