# 07: Authenticate the Editor and publish directly

**What to build:** Deliver the secure authentication integration needed for the single Editor to use Decap with GitHub. A Cloudflare Worker must proxy the GitHub OAuth exchange, Decap must publish valid content directly to `main`, and all secrets must remain in their consuming platforms. Local verification must not require live credentials; live login is reserved for the integrated publishing-loop ticket.

**Blocked by:** 03 — Publish editable Training Services; 04 — Publish and revise Blog Posts; 05 — Accept a private Training Enquiry.

**Status:** ready-for-agent

- [ ] The OAuth proxy can be validated locally or through a provider dry run without live GitHub or Cloudflare secrets.
- [ ] Decap targets the public `juniorsundar/kmsc-website` repository, `main` branch, and configured OAuth Worker endpoint.
- [ ] Decap uses direct publishing and does not enable an editorial pull-request workflow.
- [ ] The OAuth client secret is stored only as a Cloudflare Worker secret and never reaches browser-delivered code, repository content, logs, or generated artifacts.
- [ ] Configuration supports placeholders until the GitHub OAuth application and Cloudflare account are created.
- [ ] Security checks detect accidental inclusion of OAuth credentials or unrelated personal files.
- [ ] Setup guidance identifies the Editor’s required repository access without requiring Git command knowledge.
