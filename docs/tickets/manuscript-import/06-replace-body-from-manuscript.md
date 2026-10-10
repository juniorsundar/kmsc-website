# 06: Replace an existing Blog Post's body from a Manuscript

**What to build:** The Editor revises an existing Blog Post in Word, opens it in the editor, uses **Replace from Word** on the body, reviews the new body and publishes. The URL, date and every other field stay exactly as they were.

**Blocked by:** 03 — Publish the Manuscript Template and reject unedited Manuscripts.

**Type:** task

**Status:** open

Spec: Manuscript Import specification; ADR-0002.

- [ ] The body field offers a Replace from Word action on both new and existing Blog Posts.
- [ ] The action replaces only the body with the importer's body output; title, slug, summary, date, cover, cover image description, tags, byline and search visibility are unchanged.
- [ ] Importer warnings and rejections, including template placeholder rejection, are shown beside the body, and a rejection leaves the body unchanged.
- [ ] The new body is visible and editable before publishing; nothing is saved automatically.
- [ ] The browser test opens an existing entry in the test-repo backend, replaces its body from a fixture, and asserts that only the body changed.
