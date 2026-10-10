# KMSC Website

No open-source license is granted. KMSC names, branding, Page Content, Blog Posts, and Media Assets are proprietary. Public repository visibility does not grant permission to reuse them.

## Vendored third-party code

`public/admin/decap-cms.js` is the Decap CMS editor bundle, vendored unmodified so
the editor is served same-origin rather than from a public CDN. It is covered by
its own license, retained alongside it in `public/admin/decap-cms.js.LICENSE.txt`,
not by the terms above. Re-vendor with `scripts/vendor-decap.sh <version>`.

## Bundled third-party code

The editor page at `/admin/` also loads a script built from `src/admin/`, which bundles
[mammoth](https://github.com/mwilliamson/mammoth.js) (BSD-2-Clause) and
[Turndown](https://github.com/mixmark-io/turndown) (MIT) and their dependencies, locked in
`package-lock.json`. They are covered by their own licenses, not by the terms above.
