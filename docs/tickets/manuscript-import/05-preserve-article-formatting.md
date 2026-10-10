# 05: Preserve article formatting in the imported body

**What to build:** An imported Blog Post looks on the website the way the Editor wrote it in Word: structure and emphasis survive, decoration does not, and nothing unapproved is published.

**Blocked by:** 03 — Publish the Manuscript Template and reject unedited Manuscripts.

**Type:** task

**Status:** resolved

Spec: Manuscript Import specification; ADR-0002.

- [x] Bulleted and numbered lists, including nested lists, are kept.
- [x] Tables are kept and render as tables on the Blog Post page.
- [x] Hyperlinks, bold and italic are kept.
- [x] Footnotes become numbered end notes in the body.
- [x] Fonts, colours, highlighting and Word comments are not carried into the body.
- [x] Embedded images are removed and produce one warning stating how many were skipped and that the cover image is uploaded separately; the warning is shown to the Editor.
- [x] No raw HTML is produced in the body.
- [x] A Blog Post imported from the formatting fixture passes the existing content validator and renders with the expected headings, lists, table, links and emphasis on the built Blog Post page.
- [x] Importer tests cover each case above.

## Answer

Implemented and verified (typecheck clean; full suite of 108 passing, including new importer, editor and built-page tests).

- **Kept:** bold, italic, strikethrough, hyperlinks, nested bulleted and numbered lists, and tables. **Not carried:** fonts, colours, highlighting and Word comments (Mammoth drops them; a test proves it).
- **Tables:** the first row is always made the Markdown header row, because Word tables usually do not mark one and the plugin would otherwise leave raw HTML, which the site shows as visible text. Cells are flattened to one line and pipes escaped. *Shortcut:* merged cells are not spanned (text lands in the first cell, the row is padded).
- **Notes:** footnotes and endnotes both become `[1]` in the text and numbered notes at the end, with links inside notes kept and no back-links.
- **Images:** removed through Mammoth's image hook and counted. One warning states how many were skipped and that the cover image is uploaded separately. The warning appears beside the pre-filled form and is replaced or cleared by every later import, including a failed one.
- **No raw HTML:** typed `<` is escaped, and the built-page test shows `<script>…` as text.
- **Built page:** an imported Blog Post built into a copy of the site passes `npm run validate` and renders the expected headings, lists, table, links, emphasis and strikethrough.
- **Dependency:** I did not keep `turndown-plugin-gfm`; the table rule above replaces it, so `NOTICE.md` needed no change.
- **Review changes:** headerless tables, awkward table cells, endnotes, and stale warnings were found in review and fixed, each test first.
- **Risk:** fixtures are made by pandoc (headerless and endnote variants are edited from it), not saved by Word. Word's own XML can differ; ticket 09's check with a real Word-authored Manuscript should include a table and a footnote.
