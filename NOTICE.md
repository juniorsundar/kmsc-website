# KMSC Website

No open-source license is granted. KMSC names, branding, Page Content, Blog Posts, and Media Assets are proprietary. Public repository visibility does not grant permission to reuse them.

## Vendored third-party code

`public/admin/decap-cms.js` is the Decap CMS editor bundle, vendored unmodified so
the editor is served same-origin rather than from a public CDN. It is covered by
its own license, retained alongside it in `public/admin/decap-cms.js.LICENSE.txt`,
not by the terms above. Re-vendor with `scripts/vendor-decap.sh <version>`.
