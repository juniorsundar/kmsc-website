# 08: Make the two hidden Blog Posts visible to search engines

**What to build:** The two published Blog Posts that were left hidden by accident (the ISO 9001 amendment article and the article on practising differently) become visible to search engines.

**Blocked by:** None (can start immediately).

**Type:** task

**Status:** resolved

Spec: Manuscript Import specification; ADR-0002.

- [x] Both Blog Posts have search visibility set to visible, in one ordinary content commit.
- [ ] After deployment, both Blog Post pages have no `noindex` robots meta and both appear in the sitemap. (Checked on a local build with indexing enabled; the live check happens after the next deploy, see Answer.)
- [x] No other content changes.

## Answer

`noindex` was changed from `true` to `false` on `iso-9001amendment` and on the post whose file is named `want-people-to-perform-differently-…` (its slug is `training-doesnt-create-competence-practice-does`), in one content commit that touches only those two files.

- **Local proof:** a build with `PUBLIC_INDEXING_ENABLED=true` gives both Blog Post pages no `noindex` robots meta and lists both in `sitemap.xml`. Typecheck-free content change; `npm run validate` and the full suite (114 tests) pass.
- **Not yet checked live:** whether the deployed site shows the same depends on the repository variable `PUBLIC_INDEXING_ENABLED` and the site-wide switch under Site Settings (currently `noindex: false`). Once this is pushed and deployed, open both post URLs and `/sitemap.xml` on `kautilyamsc.com` to confirm. If the variable is not `true`, every page, including these two, stays hidden by design.
- **Note:** the second post's file name and slug differ (the file was created from an earlier title). That is existing content and was left as is.
