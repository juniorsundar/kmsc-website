import { test, expect } from '@playwright/test';
import { cp, mkdir, mkdtemp, readFile, readlink, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const activation = join(process.cwd(), 'scripts/activate-static-release.sh');
const rollback = join(process.cwd(), 'scripts/rollback-static-release.sh');
const required = [
  'index.html', 'about/index.html', 'services/index.html', 'blog/index.html',
  'contact/index.html', 'privacy/index.html', 'admin/index.html',
  'media/social-preview.png', 'favicon.svg', 'favicon-32.png',
  'apple-touch-icon.png', 'robots.txt', 'sitemap.xml'
];

async function staticArtifact(root: string, marker: string) {
  for (const path of required) {
    const file = join(root, path);
    await mkdir(join(file, '..'), { recursive: true });
    await writeFile(file, path === 'index.html' ? marker : path);
  }
}

test('the Editor publishing path is direct, gated, and secret-free', async () => {
  const config = await readFile('public/admin/config.yml', 'utf8');
  const workflow = await readFile('.github/workflows/ci.yml', 'utf8');
  const guide = await readFile('docs/publishing-loop.md', 'utf8');

  expect(config).toContain('repo: juniorsundar/kmsc-website');
  expect(config).toContain('branch: main');
  expect(config).toContain('publish_mode: simple');
  expect(config).toContain('auth_endpoint: auth');
  expect(config).not.toMatch(/client_secret|GITHUB_CLIENT_SECRET|private key/i);
  expect(workflow).toContain('needs: verify');
  expect(workflow).toContain('npm run validate');
  expect(workflow).toContain('npm test');
  expect(workflow).toContain('npm run build');
  expect(workflow).toContain('name: static-site');
  expect(workflow).toContain('activate-static-release.sh');
  expect(guide).toContain('temporary Blog Post');
  expect(guide).toContain('Remove it before declaring the check complete');
  expect(guide).toContain('revert commit on `main`');
  expect(guide).toContain('normal validation/build/deploy path');
});

test('two editorial revisions can be deployed and the first restored atomically', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kmsc-publishing-loop-'));
  try {
    await mkdir(join(root, '.incoming', 'revision-1'), { recursive: true });
    await mkdir(join(root, '.incoming', 'revision-2'), { recursive: true });
    await mkdir(join(root, 'releases'), { recursive: true });
    await staticArtifact(join(root, '.incoming', 'revision-1'), 'revision one');
    await staticArtifact(join(root, '.incoming', 'revision-2'), 'revision two');

    execFileSync('bash', [activation, root, 'revision-1', '5'], { stdio: 'pipe' });
    execFileSync('bash', [activation, root, 'revision-2', '5'], { stdio: 'pipe' });
    expect(await readFile(join(root, 'live', 'index.html'), 'utf8')).toBe('revision two');

    execFileSync('bash', [rollback, root, 'revision-1'], { stdio: 'pipe' });
    expect(await readlink(join(root, 'live'))).toBe(join(root, 'releases', 'revision-1'));
    expect(await readFile(join(root, 'live', 'index.html'), 'utf8')).toBe('revision one');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('invalid editorial content cannot enter the deployment path', async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'kmsc-publishing-invalid-'));
  const fixtureContent = join(fixtureRoot, 'content');
  const releaseRoot = join(fixtureRoot, 'release');
  try {
    await cp('content', fixtureContent, { recursive: true });
    const pagePath = join(fixtureContent, 'page-content.json');
    const page = JSON.parse(await readFile(pagePath, 'utf8')) as { site: { legalName: string } };
    page.site.legalName = 'KMSC with unapproved name';
    await writeFile(pagePath, JSON.stringify(page));

    const result = spawnSync(process.execPath, ['scripts/validate-content.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, CONTENT_DIR: fixtureContent },
      encoding: 'utf8'
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('legalName');

    // A failed validation produces no artifact to upload, so activation is not
    // invoked. This is the deployment boundary used by the verify job.
    await mkdir(join(releaseRoot, 'releases', 'previous'), { recursive: true });
    await staticArtifact(join(releaseRoot, 'releases', 'previous'), 'previous');
    await mkdir(join(releaseRoot, '.incoming'), { recursive: true });
    await symlink(join(releaseRoot, 'releases', 'previous'), join(releaseRoot, 'live'));
    expect(await readlink(join(releaseRoot, 'live'))).toBe(join(releaseRoot, 'releases', 'previous'));
    expect(() => execFileSync('bash', [activation, releaseRoot, 'invalid'], { stdio: 'pipe' })).toThrow();
    expect(await readlink(join(releaseRoot, 'live'))).toBe(join(releaseRoot, 'releases', 'previous'));
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
