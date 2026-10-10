# 07: Simplify the Blog Post form and make new Blog Posts visible to search engines

**What to build:** The Blog Post form puts what the Editor actually does first, labels the automatic fields, defaults to visible in search engines, and refuses an unwritten cover image description.

**Blocked by:** 02 — Start a Blog Post from a Manuscript (title and body).

**Type:** task

**Status:** resolved

Spec: Manuscript Import specification; ADR-0002.

- [x] Field order is: Start from Word document, cover image, cover image description, title, summary, body, publication date, tags, slug, byline, search visibility.
- [x] Slug, byline and search visibility hints say they are filled automatically and should normally be left as is; the slug hint still warns that changing it changes the public URL.
- [x] The form's search-visibility default is visible.
- [x] A Blog Post with no search setting at all is still treated as hidden by validation and by the site.
- [x] Validation rejects the literal placeholder "Cover image description" with an actionable error.
- [x] Existing field names and the cover-image-description hint that the configuration test asserts are kept; the configuration test additionally asserts the new order, the hints and the visible default.
- [x] Content validation tests cover the placeholder rejection and the hidden fallback.

## Answer

Implemented and verified (typecheck clean; full suite of 114 passing).

- **Form:** fields now run Start from Word document, cover image, cover image description, title, summary, body, publication date, tags, URL slug, byline, search visibility. Slug, byline and search visibility hints say "Filled in automatically from your Word document; normally leave as is."; the slug hint still warns that changing it changes the public URL.
- **Search visibility:** the field is now "Hide from search engines" and defaults to off (visible). The stored key is unchanged (`noindex`, true = hidden), so existing posts and the importer's pre-fill still mean the same thing. The label was flipped from "Exclude from search engines" because "default off" reads clearly for an Editor, where "exclude: false" did not. `docs/launch-readiness.md` was updated to match.
- **Fail-safe kept:** a Blog Post file with no `noindex` value is hidden. A built-site test removes the value and asserts the page carries `noindex` and is absent from the sitemap, with an indexable control beside it; flipping the site's fallback makes it fail.
- **Validator:** a cover image description of "Cover image description" (any case, optional trailing full stop) is rejected with "write a sentence describing the cover image, not the placeholder".
- **Content change you should review:** the published post `freshgraduates-why-lacks-leadership-qualities` had that placeholder as its description, which the new rule would have failed. Its `coverAlt` is now "Graduate on one cliff and backpacker on another, linked by a blue Curriculum and orange Life Experience bridge over a city." (written from the cover image).
- **Tests:** field order, hints, label and default are asserted in the Decap configuration test; the placeholder cases in the content validation test. Existing assertions (field names, the cover-description hint) are unchanged.
