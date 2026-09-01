import { test, expect } from '@playwright/test';
import { mkdtemp, mkdir, readFile, readlink, symlink, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const script = join(process.cwd(), 'scripts/activate-static-release.sh');
const required = [
  'index.html', 'about/index.html', 'services/index.html', 'blog/index.html',
  'contact/index.html', 'privacy/index.html', 'admin/index.html',
  'media/social-preview.png', 'favicon.svg', 'favicon-32.png',
  'apple-touch-icon.png', 'robots.txt', 'sitemap.xml'
];

async function artifact(root: string, complete = true) {
  for (const path of (complete ? required : ['index.html'])) {
    const file = join(root, path);
    await mkdir(join(file, '..'), { recursive: true });
    await writeFile(file, path);
  }
}

async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'kmsc-release-'));
  await mkdir(join(root, '.incoming', 'next'), { recursive: true });
  await mkdir(join(root, 'releases', 'previous'), { recursive: true });
  await writeFile(join(root, 'releases', 'previous', 'index.html'), 'previous');
  await symlink(join(root, 'releases', 'previous'), join(root, 'live'));
  return root;
}

function activate(root: string, id = 'next', retain = '5') {
  return execFileSync('bash', [script, root, id, retain], { encoding: 'utf8' });
}

test('failed artifact verification preserves the current live release', async () => {
  const root = await setup();
  try {
    await artifact(join(root, '.incoming', 'next'), false);
    expect(() => activate(root)).toThrow();
    expect(await readlink(join(root, 'live'))).toBe(join(root, 'releases', 'previous'));
    expect(await readFile(join(root, 'releases', 'previous', 'index.html'), 'utf8')).toBe('previous');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('successful activation swaps live atomically and bounds history', async () => {
  const root = await setup();
  try {
    await artifact(join(root, '.incoming', 'next'));
    for (let i = 1; i <= 5; i++) {
      await mkdir(join(root, 'releases', `old-${i}`));
      await writeFile(join(root, 'releases', `old-${i}`, 'index.html'), 'old');
    }
    activate(root, 'next', '3');
    expect(await readlink(join(root, 'live'))).toBe(join(root, 'releases', 'next'));
    const entries = await readdir(join(root, 'releases'));
    expect(entries).toHaveLength(3);
    expect(entries).toContain('next');
    expect(entries).not.toContain('old-1');
    expect(entries).not.toContain('previous');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('a missing upload preserves live and does not create a release', async () => {
  const root = await setup();
  try {
    expect(() => activate(root, 'not-uploaded')).toThrow();
    expect(await readlink(join(root, 'live'))).toBe(join(root, 'releases', 'previous'));
  } finally { await rm(root, { recursive: true, force: true }); }
});
