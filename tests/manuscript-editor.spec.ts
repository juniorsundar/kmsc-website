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
  await page.getByRole('button', { name: /^publish/i }).click();
  await page.getByText(/publish now/i).click();
  await expect.poll(() => page.evaluate(() => Object.keys((window as any).repoFiles?.content?.blog ?? {}).length)).toBe(1);
  const saved = JSON.parse(await page.evaluate(() => (Object.values((window as any).repoFiles.content.blog)[0] as { content: string }).content));
  expect(saved.title).toBe(`Tom & Jerry's <Big> Plan`);
  expect(saved.body).toContain('Body text with a "quote" & an ampersand.');
  expect(saved.body).toContain('\n## First section\n');
  expect(saved.summary).toBe('The opening paragraph of the article. It has a second sentence.');
});

async function importAndPublish(page: Page, fixture: string) {
  await openEditor(page);
  await page.goto('/admin/#/collections/blog/new');
  await page.locator('input[type=file]').setInputFiles(`tests/fixtures/manuscripts/${fixture}.docx`);
  await expect(page.locator('[id^="title-field"]').first()).not.toHaveValue('');
  await page.getByRole('button', { name: /^publish/i }).click();
  await page.getByText(/publish now/i).click();
  await expect.poll(() => page.evaluate(() => Object.keys((window as any).repoFiles?.content?.blog ?? {}).length)).toBe(1);
  return JSON.parse(await page.evaluate(() => (Object.values((window as any).repoFiles.content.blog)[0] as { content: string }).content));
}

test('an imported Manuscript publishes without typing anything but the cover, with every other field filled', async ({ page }) => {
  const saved = await importAndPublish(page, 'template-filled');
  const today = new Date();
  const localToday = [today.getFullYear(), today.getMonth() + 1, today.getDate()].map((n, i) => String(n).padStart(i ? 2 : 4, '0')).join('-');
  expect(saved).toEqual({
    title: 'Why practice beats training',
    slug: 'why-practice-beats-training',
    summary: 'Training tells people what to do. Practice is how they learn to do it.',
    date: localToday,
    body: expect.stringContaining('## Start with the behaviour'),
    tags: ['practice', 'leadership'],
    author: 'Dr. Sundar Subramani',
    noindex: false
  });
});

test('an imported Manuscript whose slug is taken on the deployed site gets a numbered slug', async ({ page }) => {
  // The first Blog Post on the site is read from its real, built Blog index.
  const existing = (await (await page.request.get('/blog/')).text()).match(/href="\/blog\/([a-z0-9-]+)\/"/)?.[1];
  test.skip(!existing, 'the built site has no Blog Posts');
  await page.route('**/blog/', route => route.fulfill({ contentType: 'text/html', body: `<a href="/blog/why-practice-beats-training/">x</a>` }));
  const saved = await importAndPublish(page, 'template-filled');
  expect(saved.slug).toBe('why-practice-beats-training-2');
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

test('the import control offers the Manuscript Template as a download that opens as a Word document', async ({ page }) => {
  await openEditor(page);
  await page.goto('/admin/#/collections/blog/new');
  const link = page.getByRole('link', { name: 'Download the Manuscript Template' });
  const href = await link.getAttribute('href');
  expect(href).toMatch(/\.docx$/);

  const response = await page.request.get(href!);
  expect(response.ok()).toBe(true);
  const bytes = await response.body();
  expect(bytes.subarray(0, 2).toString()).toBe('PK'); // a .docx is a zip file

  // The template the Editor downloads is the one the importer rejects when left unedited.
  await page.locator('input[type=file]').setInputFiles({ name: 'manuscript-template.docx', mimeType: 'application/octet-stream', buffer: bytes });
  await expect(page.getByRole('alert')).toContainText('Replace');
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue('');
});
