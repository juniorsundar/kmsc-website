# 08: Produce atomic static releases

**What to build:** Deliver a tested release path from successful GitHub Actions checks to a verified static artifact and atomic versioned deployment. Failure at any upload or verification step must preserve the current live release, and the production VM must never build Astro.

**Blocked by:** 01 — Bootstrap the first tested Home slice.

**Status:** ready-for-agent

- [ ] GitHub Actions packages the exact Astro output produced after validation, browser tests, and the production build pass on `main`.
- [ ] Deployment is skipped whenever validation, tests, or build fails, while direct Decap commits to `main` remain compatible with the workflow.
- [ ] The release process uploads into a new versioned release, verifies required artifact contents, and switches the live reference atomically only after success.
- [ ] Isolated release tests prove that failed upload or verification leaves the previous live release unchanged.
- [ ] A bounded release history is retained and older releases beyond that bound are removed without deleting the current target.
- [ ] Authentication is designed around a dedicated restricted deployment key; the Ubuntu administrator key is explicitly rejected.
- [ ] The production workflow installs no Node.js runtime and runs no Astro build on the VM.
