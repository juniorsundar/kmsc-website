# 08: Produce atomic static releases

**What to build:** Deliver a tested release path from successful GitHub Actions checks to a verified static artifact and atomic versioned deployment. Failure at any upload or verification step must preserve the current live release, and the production VM must never build Astro.

**Blocked by:** 01 — Bootstrap the first tested Home slice.

**Status:** resolved

- [x] GitHub Actions packages the exact Astro output produced after validation, browser tests, and the production build pass on `main`.
- [x] Deployment is skipped whenever validation, tests, or build fails, while direct Decap commits to `main` remain compatible with the workflow.
- [x] The release process uploads into a new versioned release, verifies required artifact contents, and switches the live reference atomically only after success.
- [x] Isolated release tests prove that failed upload or verification leaves the previous live release unchanged.
- [x] A bounded release history is retained and older releases beyond that bound are removed without deleting the current target.
- [x] Authentication is designed around a dedicated restricted deployment key; the Ubuntu administrator key is explicitly rejected.
- [x] The production workflow installs no Node.js runtime and runs no Astro build on the VM.

## Answer

The verified `dist/` output is handed from the `verify` job to the gated `main` deploy job as the `static-site` artifact. The deploy job uploads it to a versioned incoming directory over a dedicated restricted SSH key, then runs `scripts/activate-static-release.sh` on the VM. That shell-only activation verifies all required routes and assets, moves the release into the retained release set, and replaces `live` with a single symlink rename. Failed uploads or verification therefore leave the previous live release unchanged. Five releases, including the current target, are retained. See `docs/deployment.md` for credential boundaries and setup requirements.
