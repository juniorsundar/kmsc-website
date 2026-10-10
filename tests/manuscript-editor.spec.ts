import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// Runs the real built editor against Decap's in-browser test backend, so no GitHub is involved.
async function openEditor(page: Page) {
  const config = (await readFile('public/admin/config.yml', 'utf8'))
    .replace(/backend:[\s\S]*?\nmedia_folder/, 'backend:\n  name: test-repo\nmedia_folder');
  await page.route('**/admin/config.yml', route => route.fulfill({ contentType: 'text/yaml', body: config }));
  await page.goto('/admin/');
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL(/#\//);
}

test('starting a Blog Post from a Manuscript opens a form with the title and body filled in', async ({ page }) => {
  await openEditor(page);
  await page.goto('/admin/#/collections/blog/new');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/manuscripts/styled.docx');

  await expect(page.locator('#title-field-2, [id^="title-field"]').first()).toHaveValue(`Tom & Jerry's <Big> Plan`);
  await expect(page.locator('[data-slate-editor]').first()).toContainText('The opening paragraph of the article.');
  await expect(page.locator('[data-slate-editor]').first()).toContainText('First section');
  await expect(page.locator('[data-slate-editor]').first()).not.toContainText('&amp;');

  // What is stored is what the Editor sees: Decap's HTML-escaping of pre-filled values must not leak into the saved post.
  // Summary, slug and date are filled automatically in ticket 04; until then the Editor types them.
  await page.locator('[id^="slug-field"]').fill('manuscript-import-test');
  await page.locator('[id^="summary-field"]').fill('A summary.');
  await page.locator('[id^="date-field"]').fill('2026-10-07');
  await page.getByRole('button', { name: /^publish/i }).click();
  await page.getByText(/publish now/i).click();
  await expect.poll(() => page.evaluate(() => Object.keys((window as any).repoFiles?.content?.blog ?? {}).length)).toBe(1);
  const saved = JSON.parse(await page.evaluate(() => (Object.values((window as any).repoFiles.content.blog)[0] as { content: string }).content));
  expect(saved.title).toBe(`Tom & Jerry's <Big> Plan`);
  expect(saved.body).toContain('Body text with a "quote" & an ampersand.');
  expect(saved.body).toContain('\n## First section\n');
});

test('a file that is not a Word document is rejected and no form opens', async ({ page }) => {
  await openEditor(page);
  await page.goto('/admin/#/collections/blog/new');
  await page.locator('input[type=file]').setInputFiles({ name: 'notes.docx', mimeType: 'application/octet-stream', buffer: Buffer.from('not a word document') });

  await expect(page.getByRole('alert')).toContainText('.docx');
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue('');
});

test('a second import replaces the first, and a reload keeps the text readable', async ({ page }) => {
  const prompts: string[] = [];
  page.on('dialog', dialog => { prompts.push(dialog.message()); void dialog.accept(); });
  await openEditor(page);
  await page.goto('/admin/#/collections/blog/new');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/manuscripts/styled.docx');
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue(`Tom & Jerry's <Big> Plan`);

  await page.locator('input[type=file]').setInputFiles('tests/fixtures/manuscripts/untitled.docx');
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue('This first paragraph is the only title signal.');
  await expect(page.locator('[data-slate-editor]').first()).not.toContainText('opening paragraph');

  await page.locator('input[type=file]').setInputFiles('tests/fixtures/manuscripts/styled.docx');
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue(`Tom & Jerry's <Big> Plan`);
  expect(prompts.length, 'Decap warns before replacing an already-filled form').toBeGreaterThan(0);
  page.removeAllListeners('dialog');
  page.on('dialog', dialog => void dialog.accept());
  await page.reload();
  await page.getByRole('button', { name: /login/i }).click({ timeout: 2000 }).catch(() => {}); // the test backend may remember the login
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue(`Tom & Jerry's <Big> Plan`);
});
