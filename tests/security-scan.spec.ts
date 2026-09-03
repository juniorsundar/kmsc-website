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
