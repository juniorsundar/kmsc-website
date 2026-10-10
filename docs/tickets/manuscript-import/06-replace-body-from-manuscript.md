# 06: Replace an existing Blog Post's body from a Manuscript

**What to build:** The Editor revises an existing Blog Post in Word, opens it in the editor, uses **Replace from Word** on the body, reviews the new body and publishes. The URL, date and every other field stay exactly as they were.

**Blocked by:** 03 — Publish the Manuscript Template and reject unedited Manuscripts.

**Type:** task

**Status:** resolved

Spec: Manuscript Import specification; ADR-0002.

- [x] The body field offers a Replace from Word action on both new and existing Blog Posts.
- [x] The action replaces only the body with the importer's body output; title, slug, summary, date, cover, cover image description, tags, byline and search visibility are unchanged.
- [x] Importer warnings and rejections, including template placeholder rejection, are shown beside the body, and a rejection leaves the body unchanged.
- [x] The new body is visible and editable before publishing; nothing is saved automatically.
- [x] The browser test opens an existing entry in the test-repo backend, replaces its body from a fixture, and asserts that only the body changed.

## Answer

Implemented and verified (typecheck clean; full suite of 112 passing).

- **Control:** "Replace the body from a Word document" sits above the Body field on both new and existing Blog Posts. The body field is remounted so it shows the new text; nothing is saved until the Editor publishes.
- **Body only:** title, slug, summary, date, cover, cover image description, tags, byline and search visibility are unchanged. The browser test opens an existing entry in the `test-repo` backend (seeded through `window.repoFiles` before Decap loads), replaces the body, and compares the whole saved post with the original apart from the body.
- **Rejections and warnings:** a rejected Manuscript (including the unedited template or a non-Word file) is explained beside the body and leaves it unchanged. Skipped-image warnings appear beside the body and are replaced by the next replacement.
- **Replace after Start from Word:** on a pre-filled new Blog Post the replacement wins over the earlier import's body (regression test).
- **Review:** a reviewer raised two possible races (stale pre-filled body winning; remount reading an old value). Neither reproduced: the regression test passes on the original code, and a probe of 8 replace cycles plus two back-to-back replacements never showed wrong text. I kept the simpler code.
- **Overwrites hand edits:** Replace from Word replaces the whole body, including text the Editor typed. That matches the ticket; the Editor sees the result before publishing and can discard the form.
- **Note:** Decap leaves Publish enabled on an unchanged existing entry, so a rejected Replace cannot be shown by a disabled button. The test checks the body and saved post instead.
