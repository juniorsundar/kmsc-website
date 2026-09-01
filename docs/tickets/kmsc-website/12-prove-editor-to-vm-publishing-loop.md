# 12: Prove the Editor-to-VM publishing loop

**What to build:** Prove the accepted Git-backed publishing architecture end to end. From `/admin`, the Editor must authenticate with GitHub, change preview-safe content, create an auditable commit, pass deployment-gating checks, publish atomically to the VM over HTTPS, reopen the deployed content for editing, and revert it cleanly.

**Blocked by:** 07 — Authenticate the Editor and publish directly; 09 — Serve releases safely on the shared VM; 10 — Connect the production domain and HTTPS.

**Status:** ready-for-agent

- [ ] The Editor authenticates through the Cloudflare OAuth Worker without seeing or handling an OAuth secret.
- [ ] A preview-safe Page Content or temporary non-indexed Blog Post change through Decap commits directly to `main` with an auditable history.
- [ ] Validation, tests, and the production build run for the editorial commit; deployment occurs only after all gates pass.
- [ ] The changed content appears at the HTTPS production origin through an atomic release, with Headscale unchanged on port 8080.
- [ ] The Editor can reopen the deployed content in Decap and publish a second revision.
- [ ] Reverting the editorial commits restores the previous content through the same tested deployment path.
- [ ] Any temporary Blog Post used for verification remains non-indexed and is removed before completion, leaving no fabricated public article.
- [ ] A deliberately invalid content scenario demonstrates that failed validation cannot deploy to the VM.
