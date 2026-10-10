import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';
import { importManuscript as runImport, type ImportOptions } from '../src/admin/manuscript-importer';

const importManuscript = (bytes: ArrayBuffer, options: Partial<ImportOptions> = {}) =>
  runImport(bytes, { existingSlugs: [], today: '2026-10-07', ...options });

// Fixtures were generated with pandoc from Markdown, which writes real Word styles
// (Title, Heading 1, Heading 2). template-filled.docx comes from the Manuscript Template generator.
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

test('a template placeholder is still caught when part of it is bold', async () => {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(await readFile('public/admin/manuscript-template.docx'));
  const xml = (await zip.file('word/document.xml')!.async('string'))
    .replace('Replace this line with your Blog Post title', 'A real title')
    .replace('Replace this paragraph', 'Replace </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">this</w:t></w:r><w:r><w:t xml:space="preserve"> paragraph');
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

// A copy of the filled-in template with some of its text, or its document properties, replaced.
async function variant(edits: { text?: [string, string][]; core?: [string, string][] }) {
  const zip = await JSZip.loadAsync(await readFile('tests/fixtures/manuscripts/template-filled.docx'));
  for (const [part, pairs] of [['word/document.xml', edits.text], ['docProps/core.xml', edits.core]] as const) {
    let xml = await zip.file(part)!.async('string');
    for (const [from, to] of pairs ?? []) {
      if (!xml.includes(from)) throw new Error(`fixture has no "${from}"`);
      xml = xml.replace(from, to);
    }
    zip.file(part, xml);
  }
  return zip.generateAsync({ type: 'arraybuffer' });
}
const opening = 'Training tells people what to do. Practice is how they learn to do it.';
const fields = async (bytes: ArrayBuffer, options?: Partial<ImportOptions>) => {
  const result = await importManuscript(bytes, options);
  if (!result.ok) throw new Error(result.reason);
  return result.fields;
};

test('a short opening paragraph is the whole summary', async () => {
  expect((await fields(await manuscript('template-filled'))).summary).toBe(opening);
});

test('a long opening paragraph is cut after the last sentence that ends within 200 characters', async () => {
  const first = 'The first sentence of this opening paragraph is a moderately long one, about the size of a typical summary.';
  const second = 'The second sentence adds a little more detail and fits.';
  const third = 'A third sentence pushes the whole paragraph well beyond what a Blog index card should show.';
  const summary = (await fields(await variant({ text: [[opening, `${first} ${second} ${third}`]] }))).summary;
  expect(summary).toBe(`${first} ${second}`);
  expect(summary.length).toBeLessThanOrEqual(200);
});

test('a short first sentence is kept when the text after it has no sentence end in range', async () => {
  const rest = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
  expect((await fields(await variant({ text: [[opening, `Short one. ${rest}`]] }))).summary).toBe('Short one.');
});

test('an abbreviation such as Dr. does not end the summary early', async () => {
  const sentence = 'Dr. Sundar explains why teams that practise together outperform teams that only train together, using three short examples from client work.';
  const rest = Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ');
  expect((await fields(await variant({ text: [[opening, `${sentence} ${rest}`]] }))).summary).toBe(sentence);
});

test('a single sentence longer than 200 characters is cut at a word with an ellipsis', async () => {
  const sentence = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ') + '.';
  const summary = (await fields(await variant({ text: [[opening, sentence]] }))).summary;
  expect(summary.length).toBeLessThanOrEqual(200);
  expect(summary).toMatch(/ word\d+…$/);
  expect(sentence.startsWith(summary.slice(0, -1))).toBe(true);
});

test('the slug is short, lowercase words from the title without filler words', async () => {
  const slug = async (title: string) => (await fields(await variant({ text: [['Why practice beats training', title]] }))).slug;
  expect(await slug('Why practice beats training')).toBe('why-practice-beats-training');
  expect(await slug('The Art of Leading a Team in a Crisis')).toBe('art-leading-team-crisis');
  expect(await slug('Café Résumé Ideas')).toBe('cafe-resume-ideas');
  expect(await slug('ISO 9001:2015 to ISO 9001:2026: What changes? Who prepares? When? Why?')).toBe('iso-9001-2015-iso-9001-2026-what-changes');
  const long = (await slug('Extraordinarily comprehensive organisational transformation methodologies demonstrate consistently remarkable results')).split('-');
  expect(long.length).toBeLessThanOrEqual(8);
});

test('the slug stays within about 60 characters', async () => {
  const slug = (await fields(await variant({ text: [['Why practice beats training', 'Internationalisation Standardisation Professionalisation Institutionalisation Operationalisation Conceptualisation']] }))).slug;
  expect(slug.length).toBeLessThanOrEqual(60);
  expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});

test('a slug that is already taken gets the lowest free number', async () => {
  const taken = ['why-practice-beats-training', 'why-practice-beats-training-2', 'why-practice-beats-training-4'];
  expect((await fields(await manuscript('template-filled'), { existingSlugs: taken })).slug).toBe('why-practice-beats-training-3');
});

test('the date is the date supplied for today', async () => {
  expect((await fields(await manuscript('template-filled'), { today: '2026-11-30' })).date).toBe('2026-11-30');
});

test('tags come from the keywords property, lowercase and hyphenated, without repeats', async () => {
  const bytes = await variant({ core: [['<cp:keywords>practice, leadership</cp:keywords>', '<cp:keywords> Leadership; Human Behaviour, leadership ,, </cp:keywords>']] });
  expect((await fields(bytes)).tags).toEqual(['leadership', 'human-behaviour']);
  expect((await fields(await manuscript('styled'))).tags).toEqual([]);
});

test('the byline is the default and the post is visible to search engines', async () => {
  expect(await fields(await manuscript('template-filled'))).toMatchObject({ author: 'Dr. Sundar Subramani', noindex: false });
});

test('the title falls back from the Title style to the document title property to the first paragraph', async () => {
  const withProperty = (bytes: ArrayBuffer) => bytes;
  void withProperty;
  const styleAndProperty = await variant({ core: [['<dc:title></dc:title>', '<dc:title>Property title</dc:title>']] });
  expect((await fields(styleAndProperty)).title).toBe('Why practice beats training');

  const zip = await JSZip.loadAsync(await manuscript('untitled'));
  zip.file('docProps/core.xml', (await zip.file('docProps/core.xml')!.async('string')).replace('<dc:title></dc:title>', '<dc:title>Property title</dc:title>'));
  const propertyOnly = await fields(await zip.generateAsync({ type: 'arraybuffer' }));
  expect(propertyOnly.title).toBe('Property title');
  // The first paragraph is then the opening, so it is kept in the body and used as the summary.
  expect(propertyOnly.summary).toBe('This first paragraph is the only title signal.');
  expect(propertyOnly.body).toContain('This first paragraph is the only title signal.');

  const paragraphOnly = await fields(await manuscript('untitled'));
  expect(paragraphOnly.title).toBe('This first paragraph is the only title signal.');
  expect(paragraphOnly.summary).toBe('Then a paragraph of body text.');
});

test('a Manuscript whose Tags property is still the template placeholder is rejected', async () => {
  const bytes = await variant({ core: [['<cp:keywords>practice, leadership</cp:keywords>', '<cp:keywords>replace-this-with-your-topics</cp:keywords>']] });
  const result = await importManuscript(bytes);
  expect(result).toMatchObject({ ok: false, reason: expect.stringContaining('replace-this-with-your-topics') });
});

// ── Formatting: what survives from Word and what does not ───────────────
const formatted = async () => {
  const result = await importManuscript(await manuscript('formatting'));
  if (!result.ok) throw new Error(result.reason);
  return result;
};

test('bold, italic and hyperlinks are kept', async () => {
  const { fields } = await formatted();
  expect(fields.body).toContain('**bold**');
  expect(fields.body).toContain('_italic_');
  expect(fields.body).toContain('[link to KMSC](https://kautilyamsc.com/about/)');
});

test('bulleted and numbered lists are kept, including nested ones', async () => {
  const { fields } = await formatted();
  expect(fields.body).toMatch(/^-\s+first bullet\n\s+-\s+nested bullet\n\s+-\s+deeper bullet\n-\s+second bullet$/m);
  expect(fields.body).toMatch(/^1\.\s+first step\n\s+1\.\s+nested step\n2\.\s+second step$/m);
});

test('a table is kept as a table', async () => {
  const { fields } = await formatted();
  expect(fields.body).toMatch(/\| Stage \| Owner \|\n\| ?-+ ?\| ?-+ ?\|\n\| Plan \| Team \|\n\| Do \| Lead \|/);
});

test('footnotes become numbered notes at the end of the body', async () => {
  const { fields } = await formatted();
  expect(fields.body).toContain('It has a note.[1]');
  const notes = fields.body.slice(fields.body.lastIndexOf('\n\n') + 2);
  expect(notes).toBe('1. Note text with _emphasis_.');
  expect(fields.body).not.toContain('↑');
  expect(fields.body).not.toContain('footnote-');
});

test('colours, fonts, highlighting and comments leave only their plain text', async () => {
  const { fields } = await formatted();
  expect(fields.body).toContain('Text with ~~struck out~~ words, and a commented phrase, plus red yellow comic text.');
  expect(fields.body).not.toMatch(/Comic|FF0000|highlight|style=/);
});

test('embedded images are removed with one warning that counts them and points to the cover image', async () => {
  const { fields, warnings } = await formatted();
  expect(fields.body).not.toMatch(/!\[|data:image|<img/);
  expect(warnings).toEqual(['2 images in the Word document were not imported. Upload the cover image separately in the editor.']);
});

test('one skipped image is described in the singular', async () => {
  const result = await importManuscript(await manuscript('one-image'));
  expect(result).toMatchObject({ ok: true, warnings: ['1 image in the Word document was not imported. Upload the cover image separately in the editor.'] });
});

test('a Manuscript without images produces no warning', async () => {
  expect(await importManuscript(await manuscript('template-filled'))).toMatchObject({ ok: true, warnings: [] });
});

test('text that looks like HTML is plain text, never raw HTML in the body', async () => {
  const { fields } = await formatted();
  expect(fields.body).toContain('A line that types \\<script>alert(1)\\</script> and & as plain words');
  expect(fields.body).not.toMatch(/(^|[^\\])<script/);
});

// ── Tables and notes as Word really writes them ─────────────────────────
// headerless.docx is tables.docx with the "repeat as header row" mark removed, as in most Word tables.
const tableFields = async (name: string) => {
  const result = await importManuscript(await manuscript(name));
  if (!result.ok) throw new Error(result.reason);
  return result.fields;
};

test('a table without a marked header row is still a table, never raw HTML', async () => {
  const { body } = await tableFields('headerless');
  expect(body).not.toMatch(/<\/?(table|tr|td|th)\b/i);
  expect(body).toMatch(/^\| Plan \| A \\\| B choice \|\n\| -+ \| -+ \|\n\| Do \| line one line two \|$/m);
});

test('a table cell with a pipe or several paragraphs stays on one row', async () => {
  const { body } = await tableFields('tables');
  expect(body).toMatch(/^\| Plan \| A \\\| B choice \|$/m);
  expect(body).toMatch(/^\| Do \| line one line two \|$/m);
  expect(body.split('\n').filter(line => line.startsWith('|'))).toHaveLength(3);
});

test('several footnotes are numbered in order and keep their links', async () => {
  const { body } = await tableFields('tables');
  expect(body).toContain('Opening paragraph with two notes.[1] The second one.[2]');
  expect(body.slice(body.lastIndexOf('\n\n') + 2)).toBe('1. First note.\n2. Second note with a [link](https://kautilyamsc.com/).');
});

test('Word endnotes are kept as numbered end notes like footnotes', async () => {
  const { body } = await tableFields('endnotes');
  expect(body).toContain('Opening paragraph with two notes.[1] The second one.[2]');
  expect(body.slice(body.lastIndexOf('\n\n') + 2)).toBe('1. First note.\n2. Second note with a [link](https://kautilyamsc.com/).');
  expect(body).not.toMatch(/endnote-|↑/);
});
