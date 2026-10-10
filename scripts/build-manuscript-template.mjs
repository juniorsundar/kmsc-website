// Maintainer tool (needs pandoc; not run in CI). Rebuilds the Manuscript Template whose
// placeholder text lives in src/admin/manuscript-placeholders.js, the same list the
// importer uses to reject an unedited Manuscript.
//
//   node scripts/build-manuscript-template.mjs public/admin/manuscript-template.docx
//   node scripts/build-manuscript-template.mjs tests/fixtures/manuscripts/template-filled.docx --filled
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const [out, flag] = process.argv.slice(2);
if (!out) throw new Error('usage: build-manuscript-template.mjs <output.docx> [--filled]');
const { default: p } = await import('../src/admin/manuscript-placeholders.js');

// --filled writes a finished example (the test fixture) instead of the template.
const t = flag === '--filled' ? {
  title: 'Why practice beats training', opening: 'Training tells people what to do. Practice is how they learn to do it.',
  heading1: 'Start with the behaviour', heading2: 'Make it observable', body: 'Pick one behaviour and practise it on real work.',
  bullet: 'Choose the behaviour', numbered: 'Practise it this week', keywords: 'practice, leadership'
} : p;

// Word comments carry the instructions, so none of them can reach the website.
let id = 0;
const note = (comment, text) => { const n = id++; return `[${comment}]{.comment-start id="${n}" author="KMSC" date="2026-01-01T00:00:00Z"}${text}[]{.comment-end id="${n}"}`; };
const markdown = `---
keywords: [${t.keywords}]
---

::: {custom-style="Title"}
${note('Write your Blog Post title here, in the Title style. Set your topics under File > Info > Tags (separate them with commas).', t.title)}
:::

::: {custom-style="Normal"}
${note('This opening paragraph becomes the summary on the Blog index and in search results. Aim for one or two sentences.', t.opening)}
:::

# ${note('Use the Heading 1 style for each section heading.', t.heading1)}

::: {custom-style="Normal"}
${note('Write normal text in the Normal style. Bold, italic, links, lists and tables are kept; fonts, colours and highlighting are ignored. Do not put pictures in this document: upload the cover image separately in the editor.', t.body)}
:::

## ${note('Use the Heading 2 style for sub-sections under a section heading.', t.heading2)}

- ${note('Use the Word bullet and numbered list buttons for lists.', t.bullet)}
- ${t.bullet}

1. ${t.numbered}
2. ${t.numbered}
`;

const dir = await mkdtemp(join(tmpdir(), 'kmsc-template-'));
try {
  await writeFile(join(dir, 'template.md'), markdown);
  const run = spawnSync('pandoc', ['-f', 'markdown-smart-raw_html', join(dir, 'template.md'), '-o', out], { stdio: 'inherit' });
  if (run.status !== 0) process.exit(run.status ?? 1);
} finally {
  await rm(dir, { recursive: true, force: true });
}
