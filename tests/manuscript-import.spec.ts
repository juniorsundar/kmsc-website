import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { importManuscript } from '../src/admin/manuscript-importer';

// Fixtures were generated with pandoc from Markdown, which writes real Word styles
// (Title, Heading 1, Heading 2). Replace with Manuscript Template copies in ticket 03.
const manuscript = async (name: string) => {
  const file = await readFile(`tests/fixtures/manuscripts/${name}.docx`);
  return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
};

test('the Title style becomes the title and is not repeated in the body', async () => {
  const result = await importManuscript(await manuscript('styled'));
  expect(result).toMatchObject({ ok: true, fields: { title: `Tom & Jerry's <Big> Plan` } });
  if (!result.ok) return;
  expect(result.fields.body).not.toContain('Big');
  expect(result.fields.body.startsWith('The opening paragraph of the article.')).toBe(true);
});

test('Word headings move down one level so the title stays the only main heading', async () => {
  const result = await importManuscript(await manuscript('styled'));
  if (!result.ok) throw new Error(result.reason);
  expect(result.fields.body).toContain('\n## First section\n');
  expect(result.fields.body).toContain('\n### A sub-section\n');
  expect(result.fields.body).toContain('\n## Second section\n');
  expect(result.fields.body).not.toMatch(/^# /m);
});

test('without a Title style the first paragraph becomes the title', async () => {
  const result = await importManuscript(await manuscript('untitled'));
  if (!result.ok) throw new Error(result.reason);
  expect(result.fields.title).toBe('This first paragraph is the only title signal.');
  expect(result.fields.body.startsWith('Then a paragraph of body text.')).toBe(true);
});

test('a Manuscript with no text is rejected with a plain-language reason', async () => {
  const result = await importManuscript(await manuscript('empty'));
  expect(result).toMatchObject({ ok: false, reason: expect.stringContaining('no text') });
});

test('a file that is not a Word document is rejected with a plain-language reason', async () => {
  const notWord = new TextEncoder().encode('this is not a docx').buffer as ArrayBuffer;
  const result = await importManuscript(notWord);
  expect(result).toMatchObject({ ok: false, reason: expect.stringContaining('.docx') });
});
