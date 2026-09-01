import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const recordPath = 'docs/launch-readiness.md';

test('launch-readiness record keeps preview indexing deferred', async () => {
  const record = await readFile(recordPath, 'utf8');

  expect(record).toContain('**Decision:** **Not approved for production indexing**');
  expect(record).toContain('preview `noindex` remains active');
  expect(record).toContain('PUBLIC_INDEXING_ENABLED=true');
  expect(record).toContain('final Page Content');
  expect(record).toContain('DNSSEC remains disabled');
});

test('preview Blog route contains no fabricated Blog Post', async ({ page }) => {
  await page.goto('/blog/');
  await expect(page.getByText('Insights coming soon', { exact: false })).toBeVisible();
  await expect(page.locator('article.card')).toHaveCount(0);
});

test('launch-readiness record separates human-owned production evidence', async () => {
  const record = await readFile(recordPath, 'utf8');

  expect(record).toContain('## Human-owned production evidence');
  for (const requirement of [
    'Editor logs into `/admin/`',
    'Formspree accepts a harmless production test',
    'reserved Oracle IP',
    'unchanged SSH, Tailscale, firewall behavior, and Headscale on TCP 8080',
    'complete release is activated, served, and rolled back'
  ]) {
    expect(record).toContain(requirement);
  }
  expect(record).toMatch(/Do not put any of the following.*deployment private keys/s);
  expect(record).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY-----/);
});
