# 01: Prove Decap URL pre-fill for new Blog Posts

**What to build:** Find out, against the built editor and Decap's in-browser test-repo backend (no GitHub), whether opening the New Blog Post route with pre-fill parameters reliably fills every field the importer needs. The result decides whether the agreed hand-off (ADR-0002) is viable before anything else is built.

**Blocked by:** None (can start immediately).

**Type:** prototype

**Status:** open

Spec: Manuscript Import specification; ADR-0002.

- [ ] A body of at least 20,000 characters, containing headings, lists, a table and Markdown punctuation, arrives in the Body field intact.
- [ ] A tags list with several values arrives in the Tags field as separate tags.
- [ ] Title and summary text containing `&`, `<`, `>`, single and double quotes is shown exactly as written after unescaping, and is saved exactly as written.
- [ ] Date, slug, byline and search-visibility values supplied by pre-fill are shown and saved.
- [ ] Findings, including any limits and the unescaping approach, are recorded under `## Answer`.
- [ ] If any of the above cannot be made reliable, work on this feature stops and the import-button fallback is brought to the website owner for a decision; no fallback is adopted silently.
- [ ] The spike code is either removed or kept only as the starting point for the browser test in ticket 02.
