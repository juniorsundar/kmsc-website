import mammoth from 'mammoth';
import JSZip from 'jszip';
import TurndownService from 'turndown';
import placeholders from './manuscript-placeholders.js';

export type ImportOptions = {
  // shortcut: callers pass the slugs known when the editor was deployed; a Blog Post published since then is not
  // seen here, and the build's duplicate-slug validation remains the safety net. Upgrade by reading the repo.
  existingSlugs: string[];
  today: string;
};
export type ImportedFields = {
  title: string; slug: string; summary: string; date: string; body: string; tags: string[]; author: string; noindex: boolean;
};
export type ImportResult =
  | { ok: true; fields: ImportedFields; warnings: string[] }
  | { ok: false; reason: string };

// Structure comes only from Word styles. Heading 1 and 2 shift down a level so the
// Blog Post title stays the page's only main heading.
const styleMap = [
  "p[style-name='Title'] => h1.manuscript-title:fresh",
  "p[style-name='Heading 1'] => h2:fresh",
  "p[style-name='Heading 2'] => h3:fresh",
  "p[style-name='Heading 3'] => h4:fresh"
];

const defaultAuthor = 'Dr. Sundar Subramani';
const summaryLimit = 200;
const slugMaxWords = 8;
const slugMaxLength = 60;
const fillerWords = new Set(['a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'for', 'and', 'or', 'is', 'are', 'be', 'by', 'with', 'from', 'as']);

const entities: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };
const unescapeXml = (text: string) => text.replace(/&(?:amp|lt|gt|quot|#39|apos);/g, entity => entities[entity]);
const plainText = (html: string) => unescapeXml(html.replace(/<[^>]+>/g, '')).trim();

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });

// shortcut: core properties are read with patterns, not an XML parser (none exists in Node tests); Word writes
// them as flat elements. Upgrade if a property ever carries nested markup.
async function coreProperty(zip: JSZip, tag: string) {
  const xml = (await zip.file('docProps/core.xml')?.async('string')) ?? '';
  return unescapeXml(xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1] ?? '').trim();
}

function summaryFrom(paragraph: string) {
  const text = paragraph.replace(/\s+/g, ' ').trim();
  if (text.length <= summaryLimit) return text;
  // shortcut: sentence ends are found by punctuation, so an abbreviation such as "Dr." can end one early;
  // ends before 40 characters are ignored to limit that. The Editor can edit the summary.
  let end = 0;
  for (const match of text.matchAll(/[.!?]["')\]]*(?=\s|$)/g)) {
    const stop = match.index + match[0].length;
    if (stop > summaryLimit) break;
    if (stop >= 40) end = stop;
  }
  if (end) return text.slice(0, end);
  const cut = text.slice(0, summaryLimit - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 1)).replace(/[\s,;:.]+$/, '')}…`;
}

function slugFrom(title: string, today: string, existing: string[]) {
  const words = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const kept = words.filter(word => !fillerWords.has(word));
  let slug = '';
  for (const word of (kept.length ? kept : words).slice(0, slugMaxWords)) {
    const next = slug ? `${slug}-${word}` : word;
    if (next.length > slugMaxLength) break;
    slug = next;
  }
  slug = slug || words[0]?.slice(0, slugMaxLength) || `post-${today}`;
  let candidate = slug;
  for (let number = 2; existing.includes(candidate); number++) candidate = `${slug}-${number}`;
  return candidate;
}

const tagsFrom = (keywords: string) => [...new Set(keywords.split(/[,;]/)
  .map(tag => tag.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, ''))
  .filter(Boolean))];

export async function importManuscript(bytes: ArrayBuffer, { existingSlugs, today }: ImportOptions): Promise<ImportResult> {
  let html: string;
  let zip: JSZip;
  try {
    // mammoth's Node build reads `buffer`, its browser build reads `arrayBuffer`; the bundler picks the build.
    html = (await mammoth.convertToHtml({ arrayBuffer: bytes, buffer: bytes as unknown as Buffer }, { styleMap })).value;
    zip = await JSZip.loadAsync(bytes);
  } catch {
    return { ok: false, reason: 'This file could not be read as a Word document. Save it as a .docx file in Word and try again.' };
  }
  if (!plainText(html)) return { ok: false, reason: 'This Word document has no text to import.' };

  // Title: the Title style, then the document's title property, then the first paragraph.
  // shortcut: the title is found with a pattern, not a DOM; mammoth emits flat, well-formed HTML.
  const styled = html.match(/<h1 class="manuscript-title">(.*?)<\/h1>/);
  const propertyTitle = await coreProperty(zip, 'dc:title');
  const first = styled ?? (propertyTitle ? null : html.match(/<p>(.*?)<\/p>/));
  const title = styled || first ? plainText(first![1]) : propertyTitle;
  const rest = first ? html.replace(first[0], '') : html;
  if (!title) return { ok: false, reason: 'This Word document has no title. Start it with a Title-style line.' };

  const body = turndown.turndown(rest).trim();
  const summary = summaryFrom(plainText(rest.match(/<p>(.*?)<\/p>/)?.[1] ?? '')) || title;
  const keywords = await coreProperty(zip, 'cp:keywords');

  // The same phrases are written into the Manuscript Template, so an unedited copy can never become a Blog Post.
  // Matched on the plain text, not the Markdown, so bold or italic inside a placeholder cannot hide it.
  const text = plainText(html.replace(/<\/(p|h\d|li)>/g, end => end + ' ')).replace(/\s+/g, ' ');
  const unedited = Object.entries(placeholders)
    .filter(([name, phrase]) => (name === 'keywords' ? keywords : text).includes(phrase))
    .map(([, phrase]) => phrase);
  if (unedited.length) return { ok: false, reason: `This Word document still contains text from the Manuscript Template. Replace: "${unedited.join('", "')}".` };

  return {
    ok: true,
    fields: { title, slug: slugFrom(title, today, existingSlugs), summary, date: today, body, tags: tagsFrom(keywords), author: defaultAuthor, noindex: false },
    warnings: []
  };
}
