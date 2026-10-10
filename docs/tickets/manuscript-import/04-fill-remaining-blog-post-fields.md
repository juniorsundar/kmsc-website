# 04: Fill the remaining Blog Post fields from the Manuscript

**What to build:** After import, the Editor sees every remaining Blog Post field already filled in sensibly, so the only manual steps are the cover image and its description.

**Blocked by:** 03 — Publish the Manuscript Template and reject unedited Manuscripts.

**Type:** task

**Status:** open

Spec: Manuscript Import specification; ADR-0002.

- [ ] Title falls back in order: Title style, then the document's title property, then the first paragraph.
- [ ] Summary is the first body paragraph, cut at the last sentence ending within about 200 characters; with no sentence ending in time, it is cut at a word boundary with an ellipsis.
- [ ] Slug is lowercase ASCII words separated by hyphens, derived from the title, with filler words removed and capped at about 60 characters or 8 words.
- [ ] A slug that collides with an existing Blog Post slug gets the lowest free numeric suffix (`-2`, `-3`, …).
- [ ] Existing slugs are those known to the deployed site. A code comment marks the shortcut: a Blog Post published since the last deploy is not seen; the build's duplicate-slug validation remains the safety net.
- [ ] Date is today in the Editor's local calendar.
- [ ] Tags come from the keywords property, split on commas or semicolons, trimmed, lowercased, hyphenated and de-duplicated; they are empty when the property is absent.
- [ ] Byline is the existing default, and search visibility is visible.
- [ ] Importer tests cover each rule, including each title fallback, a long first paragraph, a paragraph without a sentence ending, slug collisions and messy keywords.
- [ ] The browser test sees the summary, slug, date, tags, byline and search visibility in the pre-filled form.
