# 01: Prove Decap URL pre-fill for new Blog Posts

**What to build:** Find out, against the built editor and Decap's in-browser test-repo backend (no GitHub), whether opening the New Blog Post route with pre-fill parameters reliably fills every field the importer needs. The result decides whether the agreed hand-off (ADR-0002) is viable before anything else is built.

**Blocked by:** None (can start immediately).

**Type:** prototype

**Status:** resolved

Spec: Manuscript Import specification; ADR-0002.

- [x] A body of at least 20,000 characters, containing headings, lists, a table and Markdown punctuation, arrives in the Body field intact.
- [x] A tags list with several values arrives in the Tags field as separate tags.
- [x] Title and summary text containing `&`, `<`, `>`, single and double quotes is shown exactly as written after unescaping, and is saved exactly as written.
- [x] Date, slug, byline and search-visibility values supplied by pre-fill are shown and saved.
- [x] Findings, including any limits and the unescaping approach, are recorded under `## Answer`.
- [x] If any of the above cannot be made reliable, work stops and the fallback is brought to the website owner (not needed: all items work, with the two adjustments below).
- [x] The spike code is kept on branch `prototype/manuscript-import-url-prefill` (not on main) as the starting point for the ticket 02 browser test.

## Answer

**Verdict: URL pre-fill is viable. The agreed design (ADR-0002) stands; no fallback is needed.** Checked against the built editor, Decap 3.8.3, and its `test-repo` backend (a 40,089-character body in a 57,114-character URL; the largest existing post is 21,168 characters). The spike is on branch `prototype/manuscript-import-url-prefill`.

| Field | Pre-fill result |
|---|---|
| Body (40k chars, headings, lists, links, quotes, `&`, `<`) | Arrives and saves intact, but Decap HTML-escapes it, so the stored body has `&amp;`, `&lt;`, `&quot;` instead. **Needs unescaping.** |
| Title, summary | Same escaping (`&` → `&amp;`, `'` → `&#039;` and so on). **Needs unescaping.** |
| Tags (`a,b`) | Shows as separate tags in the UI, but is **saved as one string** (`"a,b"`), which would fail validation. **Needs converting to a list.** |
| Date, slug, byline | Pre-fill correctly. Slug input takes effect as supplied. |
| Search visibility (`noindex=false`) | Saved as a real boolean `false`. |

**Fixes that were proven in the spike**
1. **Unescape.** Registering wrappers around Decap's own string, text and markdown widgets that unescape the five HTML entities when the value loads (and write it back through the normal change mechanism) gave the exact original text in the form and in the saved entry. The body was byte-identical (40,089 characters).
2. **Tags.** A `preSave` handler that turns the pre-filled string into a list fixed tags. That is normalisation of the Editor's visible tags, not hidden filling of content. Cleaner alternatives for ticket 02 are a small wrapper widget around the list widget.

**Notes for tickets 02 to 07**
- A literal `&amp;` typed by the Editor in a pre-filled value would be unescaped once. Only values loaded from the URL need it; the wrappers should unescape only when the entry is new and came from the importer.
- The URL is long (about 1.4× the body). Browsers and the in-page router handle 57k characters; no limit was hit. Ticket 02 should still pass the data with the least URL, for example by keeping the converted result in memory and sending only a short key, if a limit appears in practice.
- Cover and cover description stay empty after pre-fill, as designed.
- Nothing was published or changed on the real site; the test used Decap's offline backend.
