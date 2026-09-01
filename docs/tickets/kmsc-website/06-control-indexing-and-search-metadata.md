# 06: Control indexing and search metadata

**What to build:** Deliver a single tested release switch that keeps incomplete Page Content and Blog Posts out of search indexes during preview, while producing consistent metadata and allowing indexing to be enabled later without rewriting content.

**Blocked by:** 02 — Deliver the branded content-managed site shell; 04 — Publish and revise Blog Posts.

**Status:** ready-for-agent

- [ ] Preview mode emits consistent `noindex` directives for every public route and any representative Blog Post.
- [ ] Preview output does not advertise itself as canonical production content.
- [ ] Production mode can enable indexing through an explicit configuration change without altering Page Content, Blog Posts, or Media Assets.
- [ ] Every route emits a consistent title, description, canonical URL, and social-preview metadata.
- [ ] Production metadata uses `https://kautilyamsc.com` as the canonical origin.
- [ ] Sitemap and robots behavior reflect preview versus indexable state, including stable Blog Post URLs when articles exist.
- [ ] Production-build tests exercise both release modes and verify metadata across all public routes.
