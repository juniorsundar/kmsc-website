import { test, expect } from '@playwright/test';
import { readdir, readFile, stat } from 'node:fs/promises';
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
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
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
  const allowed = new Map([
    ['public/media', /^social-preview\.(png|jpe?g|webp)$/i],
    ['src/assets/brand', /^kmsc-(acronym(?:-full)?|head-and-ideas)\.png$/i]
  ]);

  for (const [directory, pattern] of allowed) {
    for (const path of await filesUnder(directory)) {
      expect(relative(directory, path), `unexpected file in ${directory}`).toMatch(pattern);
    }
  }
});
