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

const templateBytes = async () => {
  const file = await readFile('public/admin/manuscript-template.docx');
  return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
};

test('the unedited Manuscript Template is rejected and the reason says what to replace', async () => {
  const result = await importManuscript(await templateBytes());
  expect(result).toMatchObject({ ok: false, reason: expect.stringContaining('Replace') });
  expect(!result.ok && result.reason).toContain('Replace this line with your Blog Post title');
});

test('a Manuscript with a new title but the template opening paragraph is still rejected', async () => {
  const edited = await readFile('public/admin/manuscript-template.docx');
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(edited);
  const xml = (await zip.file('word/document.xml')!.async('string')).replace('Replace this line with your Blog Post title', 'A real title');
  zip.file('word/document.xml', xml);
  const result = await importManuscript(await zip.generateAsync({ type: 'arraybuffer' }));
  expect(result).toMatchObject({ ok: false, reason: expect.stringContaining('Replace this paragraph with your opening') });
});

test('a filled-in copy of the template imports with its structure and none of its instructions', async () => {
  const result = await importManuscript(await manuscript('template-filled'));
  if (!result.ok) throw new Error(result.reason);
  expect(result.fields.title).toBe('Why practice beats training');
  expect(result.fields.body).toBe([
    'Training tells people what to do. Practice is how they learn to do it.',
    '## Start with the behaviour',
    'Pick one behaviour and practise it on real work.',
    '### Make it observable',
    '-   Choose the behaviour\n-   Choose the behaviour',
    '1.  Practise it this week\n2.  Practise it this week'
  ].join('\n\n'));
  expect(result.fields.body).not.toMatch(/Aim for one or two sentences|Do not put pictures/);
});
