# 09: Document Manuscript publishing and verify it on the live site

**What to build:** The Editor has a short, plain-language procedure for publishing from Word, and the full flow is proven once on the live site with the real GitHub login, which the automated browser test cannot cover.

**Blocked by:** 04, 05, 06, 07.

**Type:** task

**Status:** open

Spec: Manuscript Import specification; ADR-0002.

- [ ] The Editor setup guide gains a short procedure: download the Manuscript Template, write the Manuscript, Start from Word document, add the cover image and description, review, publish; and how to use Replace from Word for revisions.
- [ ] On the live site, signed in as the Editor, a clearly labelled temporary Blog Post is created from a Manuscript, published, revised with Replace from Word, and deleted, following the temporary Blog Post rules in the publishing-loop guide.
- [ ] The commit SHAs and workflow runs are recorded outside the repository, and no temporary Blog Post remains on the live site.
- [ ] The Manuscript Template is confirmed downloadable from the live editor and is handed to the website owner to send to KMSC.
- [ ] Results, and any deviations from the spec, are recorded under `## Answer`.
