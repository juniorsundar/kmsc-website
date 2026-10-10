# 05: Preserve article formatting in the imported body

**What to build:** An imported Blog Post looks on the website the way the Editor wrote it in Word: structure and emphasis survive, decoration does not, and nothing unapproved is published.

**Blocked by:** 03 — Publish the Manuscript Template and reject unedited Manuscripts.

**Type:** task

**Status:** open

Spec: Manuscript Import specification; ADR-0002.

- [ ] Bulleted and numbered lists, including nested lists, are kept.
- [ ] Tables are kept and render as tables on the Blog Post page.
- [ ] Hyperlinks, bold and italic are kept.
- [ ] Footnotes become numbered end notes in the body.
- [ ] Fonts, colours, highlighting and Word comments are not carried into the body.
- [ ] Embedded images are removed and produce one warning stating how many were skipped and that the cover image is uploaded separately; the warning is shown to the Editor.
- [ ] No raw HTML is produced in the body.
- [ ] A Blog Post imported from the formatting fixture passes the existing content validator and renders with the expected headings, lists, table, links and emphasis on the built Blog Post page.
- [ ] Importer tests cover each case above.
