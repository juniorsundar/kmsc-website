# 10: Connect the production domain and HTTPS

**What to build:** Guide and verify the safe cutover of `kautilyamsc.com` to the prepared Oracle VM using private registration and Cloudflare DNS. Ordinary DNS and HTTPS must work before DNSSEC is attempted, and the canonical and redirect hostnames must behave consistently.

**Blocked by:** 09 — Serve releases safely on the shared VM.

**Status:** resolved

- [x] Domain registration is confirmed with full privacy and registrar account protections; no payment or identity credential is stored in the repository.
- [x] Oracle Cloud confirms the website’s public IP is reserved before production DNS points to it.
- [x] Oracle network rules add public TCP 80 and 443 only and preserve existing SSH and Headscale access.
- [x] Cloudflare authoritative DNS resolves the root and `www` hostnames to the reserved public IP before DNSSEC is enabled.
- [x] Caddy obtains and serves valid HTTPS certificates for both hostnames.
- [x] `https://kautilyamsc.com` serves the selected release and `https://www.kautilyamsc.com` permanently redirects to the canonical origin.
- [x] DNS, HTTPS, representative routes, and the unchanged Headscale listener pass recorded smoke checks.
- [x] DNSSEC remains disabled until the final launch-readiness gate verifies ordinary DNS stability.

## Answer

Implemented and verified against the repository test, build, and documented production-evidence checks.
