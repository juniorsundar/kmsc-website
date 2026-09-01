# 09: Serve releases safely on the shared VM

**What to build:** Prepare the existing Oracle VM to receive atomic static releases and serve them through Caddy without disrupting Headscale, SSH, Tailscale, or unrelated host behavior. This is a production-system change and must include before-and-after evidence and rollback instructions.

**Blocked by:** 08 — Produce atomic static releases.

**Status:** ready-for-agent

- [ ] A restricted deployment account and dedicated key can write release artifacts and switch the website’s live release without general administrator access.
- [ ] Release directories and permissions support atomic deployment and rollback while preventing the web server from modifying source-controlled content.
- [ ] Caddy configuration validates before activation and serves the selected static release without requiring Node.js.
- [ ] Host firewall changes add inbound TCP 80 and 443 only; existing SSH, Headscale, and Tailscale rules remain otherwise unchanged.
- [ ] Headscale continues listening on port 8080 and is not reconfigured, restarted, proxied, or incorporated into the website deployment.
- [ ] A deployment and rollback smoke test succeeds against the prepared VM without a partial-live state.
- [ ] Before-and-after checks record active services, listeners, firewall behavior, and sufficient disk/memory headroom.
