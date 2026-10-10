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
  await page.getByLabel('Start from Word document', { exact: true }).setInputFiles('tests/fixtures/manuscripts/styled.docx');

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
  await page.getByLabel('Start from Word document', { exact: true }).setInputFiles(`tests/fixtures/manuscripts/${fixture}.docx`);
  await expect(page.locator('[id^="title-field"]').first()).not.toHaveValue('');
  await page.getByRole('button', { name: /^publish/i }).click();
  await page.getByText(/publish now/i).click();
  await expect.poll(() => page.evaluate(() => Object.keys((window as any).repoFiles?.content?.blog ?? {}).length)).toBe(1);
  return JSON.parse(await page.evaluate(() => (Object.values((window as any).repoFiles.content.blog)[0] as { content: string }).content));
}

test('an imported Manuscript publishes without typing anything but the cover, with every other field filled', async ({ page }) => {
  const today = new Date();
  const localToday = [today.getFullYear(), today.getMonth() + 1, today.getDate()].map((n, i) => String(n).padStart(i ? 2 : 4, '0')).join('-');
  await openEditor(page);
  await page.goto('/admin/#/collections/blog/new');
  await page.getByLabel('Start from Word document', { exact: true }).setInputFiles('tests/fixtures/manuscripts/template-filled.docx');

  // The Editor sees every value in the form before publishing.
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue('Why practice beats training');
  await expect(page.locator('[id^="slug-field"]').first()).toHaveValue('why-practice-beats-training');
  await expect(page.locator('[id^="summary-field"]').first()).toHaveValue('Training tells people what to do. Practice is how they learn to do it.');
  await expect(page.locator('[id^="date-field"]').first()).toHaveValue(localToday);
  await expect(page.locator('[id^="tags-field"]').first()).toHaveValue('practice, leadership');
  await expect(page.locator('[id^="author-field"]').first()).toHaveValue('Dr. Sundar Subramani');

  await page.getByRole('button', { name: /^publish/i }).click();
  await page.getByText(/publish now/i).click();
  await expect.poll(() => page.evaluate(() => Object.keys((window as any).repoFiles?.content?.blog ?? {}).length)).toBe(1);
  const saved = JSON.parse(await page.evaluate(() => (Object.values((window as any).repoFiles.content.blog)[0] as { content: string }).content));
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
  await page.route('**/blog/', route => route.fulfill({ contentType: 'text/html', body: `<a href="/blog/why-practice-beats-training/">x</a>` }));
  const saved = await importAndPublish(page, 'template-filled');
  expect(saved.slug).toBe('why-practice-beats-training-2');
});

test('a file that is not a Word document is rejected and no form opens', async ({ page }) => {
  await openEditor(page);
  await page.goto('/admin/#/collections/blog/new');
  await page.getByLabel('Start from Word document', { exact: true }).setInputFiles({ name: 'notes.docx', mimeType: 'application/octet-stream', buffer: Buffer.from('not a word document') });

  await expect(page.getByRole('alert')).toContainText('.docx');
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue('');
});

test('a second import replaces the first, and a reload keeps the text readable', async ({ page }) => {
  const prompts: string[] = [];
  page.on('dialog', dialog => { prompts.push(dialog.message()); void dialog.accept(); });
  await openEditor(page);
  await page.goto('/admin/#/collections/blog/new');
  await page.getByLabel('Start from Word document', { exact: true }).setInputFiles('tests/fixtures/manuscripts/styled.docx');
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue(`Tom & Jerry's <Big> Plan`);

  await page.getByLabel('Start from Word document', { exact: true }).setInputFiles('tests/fixtures/manuscripts/untitled.docx');
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue('This first paragraph is the only title signal.');
  await expect(page.locator('[data-slate-editor]').first()).not.toContainText('opening paragraph');

  await page.getByLabel('Start from Word document', { exact: true }).setInputFiles('tests/fixtures/manuscripts/styled.docx');
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
  await page.getByLabel('Start from Word document', { exact: true }).setInputFiles({ name: 'manuscript-template.docx', mimeType: 'application/octet-stream', buffer: bytes });
  await expect(page.getByRole('alert')).toContainText('Replace');
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue('');
});

test('skipped images are reported beside the pre-filled form, and a blank form shows no warning', async ({ page }) => {
  page.on('dialog', dialog => void dialog.accept().catch(() => {})); // Decap asks before leaving a filled-in form
  await openEditor(page);
  await page.goto('/admin/#/collections/blog/new');
  await page.getByLabel('Start from Word document', { exact: true }).setInputFiles('tests/fixtures/manuscripts/formatting.docx');
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue('Formatting fixture');
  await expect(page.getByRole('status')).toContainText('2 images in the Word document were not imported. Upload the cover image separately in the editor.');
  await expect(page.locator('[data-slate-editor]').first()).not.toContainText('data:image');

  // A form opened without an import (no pre-fill in the address) never shows an earlier import's warning.
  await page.evaluate(() => localStorage.clear());
  await page.goto('/admin/#/collections/blog/new');
  await page.reload();
  await page.getByRole('button', { name: /login/i }).click({ timeout: 2000 }).catch(() => {});
  await expect(page.getByLabel('Start from Word document', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('a later import or failed import never shows an earlier import\'s warning', async ({ page }) => {
  page.on('dialog', dialog => void dialog.accept().catch(() => {}));
  await openEditor(page);
  await page.goto('/admin/#/collections/blog/new');
  await page.getByLabel('Start from Word document', { exact: true }).setInputFiles('tests/fixtures/manuscripts/formatting.docx');
  await expect(page.getByRole('status')).toHaveCount(1);

  // A second import with no images replaces the first import's warning.
  await page.getByLabel('Start from Word document', { exact: true }).setInputFiles('tests/fixtures/manuscripts/template-filled.docx');
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue('Why practice beats training');
  await expect(page.getByRole('status')).toHaveCount(0);

  // A failed import leaves the earlier form alone, and its warning does not come back.
  await page.getByLabel('Start from Word document', { exact: true }).setInputFiles('tests/fixtures/manuscripts/formatting.docx');
  await expect(page.getByRole('status')).toHaveCount(1);
  await page.getByLabel('Start from Word document', { exact: true }).setInputFiles({ name: 'bad.docx', mimeType: 'application/octet-stream', buffer: Buffer.from('nope') });
  await expect(page.getByRole('alert')).toContainText('.docx');
  await expect(page.getByRole('status')).toHaveCount(0);
});

// ── Replace from Word on the body ───────────────────────────────────────
const existingPost = {
  title: 'An existing Blog Post',
  slug: 'existing-post',
  summary: 'The summary the Editor wrote earlier.',
  date: '2025-03-04',
  cover: '/media/social-preview.png',
  coverAlt: 'KMSC brand mark',
  body: 'The old body text.\n\n## Old section\n\nMore old text.',
  tags: ['old-tag', 'second-tag'],
  author: 'Dr. Sundar Subramani',
  noindex: true
};

async function openExistingPost(page: Page) {
  await page.addInitScript(post => {
    (window as any).repoFiles = { content: { blog: { 'existing-post.json': { content: JSON.stringify(post), path: 'content/blog/existing-post.json' } } } };
  }, existingPost);
  await openEditor(page);
  await page.goto('/admin/#/collections/blog/entries/existing-post');
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue('An existing Blog Post');
}

const replaceInput = (page: Page) => page.getByLabel('Replace the body from a Word document');
const bodyEditor = (page: Page) => page.locator('[data-slate-editor]').first();
const savedPost = (page: Page) => page.evaluate(() => JSON.parse((Object.values((window as any).repoFiles.content.blog)[0] as { content: string }).content));

test('Replace from Word changes only the body of an existing Blog Post, in view before publishing', async ({ page }) => {
  await openExistingPost(page);
  await expect(bodyEditor(page)).toContainText('The old body text.');

  await replaceInput(page).setInputFiles('tests/fixtures/manuscripts/template-filled.docx');
  await expect(bodyEditor(page)).toContainText('Pick one behaviour and practise it on real work.');
  await expect(bodyEditor(page)).not.toContainText('The old body text.');

  // Nothing is saved until the Editor publishes, and every other field is as it was.
  expect(await savedPost(page)).toEqual(existingPost);
  await expect(page.locator('[id^="title-field"]').first()).toHaveValue(existingPost.title);
  await expect(page.locator('[id^="slug-field"]').first()).toHaveValue(existingPost.slug);
  await expect(page.locator('[id^="summary-field"]').first()).toHaveValue(existingPost.summary);

  await page.getByRole('button', { name: /^publish/i }).click();
  await page.getByText(/publish now/i).click();
  await expect.poll(async () => (await savedPost(page)).body).toContain('## Start with the behaviour');
  expect(await savedPost(page)).toEqual({ ...existingPost, body: expect.stringContaining('Pick one behaviour and practise it on real work.') });
});

test('a rejected Manuscript is explained beside the body and leaves the body unchanged', async ({ page }) => {
  await openExistingPost(page);
  await replaceInput(page).setInputFiles('public/admin/manuscript-template.docx');
  await expect(page.getByRole('alert')).toContainText('Replace');
  await expect(bodyEditor(page)).toContainText('The old body text.');

  await replaceInput(page).setInputFiles({ name: 'bad.docx', mimeType: 'application/octet-stream', buffer: Buffer.from('nope') });
  await expect(page.getByRole('alert')).toContainText('.docx');
  await expect(bodyEditor(page)).toContainText('The old body text.');
  await expect(page.getByRole('status')).toHaveCount(0);
  expect(await savedPost(page)).toEqual(existingPost);
});

test('Replace from Word reports skipped images and is also offered on a new Blog Post', async ({ page }) => {
  await openExistingPost(page);
  await replaceInput(page).setInputFiles('tests/fixtures/manuscripts/formatting.docx');
  await expect(page.getByRole('status')).toContainText('2 images in the Word document were not imported');
  await replaceInput(page).setInputFiles('tests/fixtures/manuscripts/template-filled.docx');
  await expect(page.getByRole('status')).toHaveCount(0);

  await page.goto('/admin/#/collections/blog/new');
  await expect(replaceInput(page)).toBeVisible();
});
