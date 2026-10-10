# 02: Start a Blog Post from a Manuscript (title and body)

**What to build:** The thinnest complete path: the Editor opens New Blog Post, uses **Start from Word document** at the top of the form, selects a Manuscript, and a New Blog Post form opens with the title and body already filled in and editable. The conversion runs entirely in the browser, using locked npm dependencies built into a script served from the same site.

**Blocked by:** 01 — Prove Decap URL pre-fill for new Blog Posts.

**Type:** task

**Status:** resolved

Spec: Manuscript Import specification; ADR-0002.

- [x] mammoth and Turndown are locked npm dependencies, bundled by the site build into a same-origin script loaded by the editor page after Decap.
- [x] The editor's security policy (CSP), Decap's version and Decap's committed copy of its code are unchanged; the security scan still passes.
- [x] A pure importer function accepts Manuscript bytes and returns Blog Post fields plus warnings, or a rejection with an Editor-facing reason. It knows nothing about Decap. (Existing slugs and today's date are added to its inputs in ticket 04, where they are first used.)
- [x] Title comes from the Title style, falling back to the first paragraph (which is then removed from the body).
- [x] Body is Markdown derived only from Word styles: Heading 1 becomes a second-level heading and Heading 2 a third-level heading; nothing is guessed from bold or numbered lines.
- [x] A file that is not a readable .docx, or a Manuscript with no text, is rejected with a plain-language message and no form opens.
- [x] The importer test harness exists, with small committed .docx fixtures, covering the behaviour above.
- [x] One browser test against the production build, with configuration swapped in the test only to Decap's test-repo backend, uploads a fixture and sees the expected title and body in the form.
- [x] Validation, tests and build pass.

## Answer

Implemented and verified (72 existing tests plus 8 new, typecheck and build clean). Notes for later tickets:

- **Contract deferred to 04:** the importer returns `{title, body}` and an empty warnings list; summary, slug, date, tags, the document-title-property fallback, existing slugs, and mammoth/image warnings arrive in 04 and 05.
- **Hand-off:** the control leaves the New Blog Post form, waits until Decap has unmounted it, then re-enters with the values in the URL; Decap asks "discard changes?" if the form was already edited. The unescape wrappers (`unescaped_string`, `unescaped_markdown`) undo Decap's HTML-escaping only for the values the importer sent, which are kept in `sessionStorage` so a reload of the pre-filled form still reads correctly. Tags still need the ticket 01 fix in ticket 04.
- **Security-scan test** now reads the built `dist/admin/index.html`, since the editor page is an Astro page that bundles the import script. Run it after a build (the Playwright config builds first).
- **Supply chain:** mammoth, Turndown and their dependencies now run on the page that holds the GitHub token. They are pinned in the lockfile; update them deliberately and review changes.
- **Not verified:** a real GitHub-authenticated import (ticket 09).
