# 02: Start a Blog Post from a Manuscript (title and body)

**What to build:** The thinnest complete path: the Editor opens New Blog Post, uses **Start from Word document** at the top of the form, selects a Manuscript, and a New Blog Post form opens with the title and body already filled in and editable. The conversion runs entirely in the browser, using locked npm dependencies built into a script served from the same site.

**Blocked by:** 01 — Prove Decap URL pre-fill for new Blog Posts.

**Type:** task

**Status:** open

Spec: Manuscript Import specification; ADR-0002.

- [ ] mammoth and Turndown are locked npm dependencies, bundled by the site build into a same-origin script loaded by the editor page after Decap.
- [ ] The editor's security policy (CSP), Decap's version and Decap's committed copy of its code are unchanged; the security scan still passes.
- [ ] A pure importer function accepts Manuscript bytes, existing slugs and today's date, and returns Blog Post fields plus warnings, or a rejection with an Editor-facing reason. It knows nothing about Decap.
- [ ] Title comes from the Title style, falling back to the first paragraph (which is then removed from the body).
- [ ] Body is Markdown derived only from Word styles: Heading 1 becomes a second-level heading and Heading 2 a third-level heading; nothing is guessed from bold or numbered lines.
- [ ] A file that is not a readable .docx, or a Manuscript with no text, is rejected with a plain-language message and no form opens.
- [ ] The importer test harness exists, with small committed .docx fixtures, covering the behaviour above.
- [ ] One browser test against the production build, with configuration swapped in the test only to Decap's test-repo backend, uploads a fixture and sees the expected title and body in the form.
- [ ] Validation, tests and build pass.
