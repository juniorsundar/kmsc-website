# 07: Simplify the Blog Post form and make new Blog Posts visible to search engines

**What to build:** The Blog Post form puts what the Editor actually does first, labels the automatic fields, defaults to visible in search engines, and refuses an unwritten cover image description.

**Blocked by:** 02 — Start a Blog Post from a Manuscript (title and body).

**Type:** task

**Status:** open

Spec: Manuscript Import specification; ADR-0002.

- [ ] Field order is: Start from Word document, cover image, cover image description, title, summary, body, publication date, tags, slug, byline, search visibility.
- [ ] Slug, byline and search visibility hints say they are filled automatically and should normally be left as is; the slug hint still warns that changing it changes the public URL.
- [ ] The form's search-visibility default is visible.
- [ ] A Blog Post with no search setting at all is still treated as hidden by validation and by the site.
- [ ] Validation rejects the literal placeholder "Cover image description" with an actionable error.
- [ ] Existing field names and the cover-image-description hint that the configuration test asserts are kept; the configuration test additionally asserts the new order, the hints and the visible default.
- [ ] Content validation tests cover the placeholder rejection and the hidden fallback.
