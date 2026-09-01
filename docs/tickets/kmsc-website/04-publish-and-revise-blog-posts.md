# 04: Publish and revise Blog Posts

**What to build:** Deliver a complete Blog Post publishing model through Decap and Astro. Visitors must receive an honest empty state before the first genuine article, while a representative test fixture proves stable article rendering and the Editor receives enough field guidance to create and later revise a Blog Post.

**Blocked by:** 02 — Deliver the branded content-managed site shell.

**Status:** resolved

- [x] Blog Posts validate title, stable slug, summary, publication date, optional cover Media Asset, body, tags, author, and search metadata.
- [x] Dr. Sundar Subramani is the default Blog Post author, while “Director, Principal Consultant” is not repeated on every article.
- [x] With no published Blog Posts, the Blog route renders an “Insights coming soon” state and no fabricated article appears in production content.
- [x] A test-only representative Blog Post renders an index card and stable article URL with its metadata, author, tags, optional cover behavior, and body.
- [x] Duplicate or invalid slugs, malformed dates, missing required fields, and unsupported Media Asset references fail with actionable errors.
- [x] Decap supplies field descriptions or writing guidance without introducing a fake public Blog Post.
- [x] Production-build browser coverage verifies both the empty state and representative article behavior.

## Answer

Implemented and verified against the repository test, build, and documented production-evidence checks.
