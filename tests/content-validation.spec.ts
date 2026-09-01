import { test, expect } from '@playwright/test';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('missing Training Service fields fail validation with an actionable error', async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'kmsc-content-'));
  const fixtureContent = join(fixtureRoot, 'content');

  try {
    await cp('content', fixtureContent, { recursive: true });
    const servicePath = join(fixtureContent, 'services', 'management-system-design-and-implementation.json');
    const service = JSON.parse(await readFile(servicePath, 'utf8')) as Record<string, unknown>;
    delete service.summary;
    await writeFile(servicePath, JSON.stringify(service));

    const result = spawnSync(process.execPath, ['scripts/validate-content.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, CONTENT_DIR: fixtureContent },
      encoding: 'utf8'
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'Invalid Training Service content/services/management-system-design-and-implementation.json'
    );
    expect(`${result.stdout}${result.stderr}`).toContain('summary');
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test('malformed Page Content identifies the file during validation', async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'kmsc-content-'));
  const fixtureContent = join(fixtureRoot, 'content');

  try {
    await cp('content', fixtureContent, { recursive: true });
    await writeFile(join(fixtureContent, 'page-content.json'), '{');

    const result = spawnSync(process.execPath, ['scripts/validate-content.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, CONTENT_DIR: fixtureContent },
      encoding: 'utf8'
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('Invalid Page Content content/page-content.json: malformed JSON');
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
