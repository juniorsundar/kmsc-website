import mammoth from 'mammoth';
import TurndownService from 'turndown';
import placeholders from './manuscript-placeholders.js';

export type ImportResult =
  | { ok: true; fields: { title: string; body: string }; warnings: string[] }
  | { ok: false; reason: string };

// Structure comes only from Word styles. Heading 1 and 2 shift down a level so the
// Blog Post title stays the page's only main heading.
const styleMap = [
  "p[style-name='Title'] => h1.manuscript-title:fresh",
  "p[style-name='Heading 1'] => h2:fresh",
  "p[style-name='Heading 2'] => h3:fresh",
  "p[style-name='Heading 3'] => h4:fresh"
];

const entities: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const plainText = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&(?:amp|lt|gt|quot|#39);/g, entity => entities[entity]).trim();

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });

export async function importManuscript(bytes: ArrayBuffer): Promise<ImportResult> {
  let html: string;
  try {
    // mammoth's Node build reads `buffer`, its browser build reads `arrayBuffer`; the bundler picks the build.
    html = (await mammoth.convertToHtml({ arrayBuffer: bytes, buffer: bytes as unknown as Buffer }, { styleMap })).value;
  } catch {
    return { ok: false, reason: 'This file could not be read as a Word document. Save it as a .docx file in Word and try again.' };
  }
  if (!plainText(html)) return { ok: false, reason: 'This Word document has no text to import.' };

  // shortcut: the title is found with a pattern, not a DOM; mammoth emits flat, well-formed HTML.
  const first = html.match(/<h1 class="manuscript-title">(.*?)<\/h1>/) ?? html.match(/<p>(.*?)<\/p>/);
  const title = plainText(first?.[1] ?? '');
  const body = turndown.turndown(first ? html.replace(first[0], '') : html).trim();
  if (!title) return { ok: false, reason: 'This Word document has no title. Start it with a Title-style line.' };

  // The same phrases are written into the Manuscript Template, so an unedited copy can never become a Blog Post.
  const unedited = Object.entries(placeholders).filter(([name, phrase]) => name !== 'keywords' && (title + '\n' + body).includes(phrase)).map(([, phrase]) => phrase);
  if (unedited.length) return { ok: false, reason: `This Word document still contains text from the Manuscript Template. Replace: "${unedited.join('", "')}".` };
  return { ok: true, fields: { title, body }, warnings: [] };
}
