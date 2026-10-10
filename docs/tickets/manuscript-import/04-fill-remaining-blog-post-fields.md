# 04: Fill the remaining Blog Post fields from the Manuscript

**What to build:** After import, the Editor sees every remaining Blog Post field already filled in sensibly, so the only manual steps are the cover image and its description.

**Blocked by:** 03 — Publish the Manuscript Template and reject unedited Manuscripts.

**Type:** task

**Status:** resolved

Spec: Manuscript Import specification; ADR-0002.

- [x] Title falls back in order: Title style, then the document's title property, then the first paragraph.
- [x] Summary is the first body paragraph, cut at the last sentence ending within about 200 characters; with no sentence ending in time, it is cut at a word boundary with an ellipsis.
- [x] Slug is lowercase ASCII words separated by hyphens, derived from the title, with filler words removed and capped at about 60 characters or 8 words.
- [x] A slug that collides with an existing Blog Post slug gets the lowest free numeric suffix (`-2`, `-3`, …).
- [x] Existing slugs are those known to the deployed site. A code comment marks the shortcut: a Blog Post published since the last deploy is not seen; the build's duplicate-slug validation remains the safety net.
- [x] Date is today in the Editor's local calendar.
- [x] Tags come from the keywords property, split on commas or semicolons, trimmed, lowercased, hyphenated and de-duplicated; they are empty when the property is absent.
- [x] Byline is the existing default, and search visibility is visible.
- [x] Importer tests cover each rule, including each title fallback, a long first paragraph, a paragraph without a sentence ending, slug collisions and messy keywords.
- [x] The browser test sees the summary, slug, date, tags, byline and search visibility in the pre-filled form.

## Answer

Implemented and verified (typecheck clean; full suite and new importer and browser tests pass).

- **Importer contract** is now `importManuscript(bytes, { existingSlugs, today })` returning title, slug, summary, date, body, tags, byline and search visibility, plus warnings (still empty until ticket 05).
- **Summary:** the opening paragraph, cut after the last sentence ending within 200 characters; a lone longer sentence is cut at a word with an ellipsis. A small list of abbreviations ("Dr.", "Mr.", "e.g." …) does not end a sentence; an unlisted one can, and the Editor can edit the summary. If the document has no ordinary paragraph (for example only a list), the summary falls back to the title, which still satisfies validation.
- **Slug:** ASCII words, filler words dropped, at most 8 words and about 60 characters. A title with no Latin letters or digits (for example Hindi) gets `post-<date>`. A `-2`, `-3` … suffix is added after shortening, so a numbered slug can exceed 60 characters slightly; the validator allows it.
- **Existing slugs** come from the deployed site's public Blog index at import time (a marked shortcut: a Blog Post published since the last deploy is not seen; the build's duplicate-slug validation remains the safety net).
- **Tags** keep letters and digits in any script, lowercased and hyphenated. The pre-filled tag string is turned into a list by a `prefilled_list` wrapper (ticket 01 finding), and the summary uses an `unescaped_text` wrapper like title and body.
- **Template Tags placeholder** is now rejected too (the shortcut left in ticket 03 is closed).
- **Mutations checked:** removing the tags wrapper and breaking the slug lookup each fail a browser test.
- **Review changes:** the summary no longer ignores sentences under 40 characters; the browser test now asserts what the Editor sees in the form, not only the saved JSON.
- **Not verified:** a real GitHub-authenticated import, and an Editor's own Manuscript (ticket 09).
