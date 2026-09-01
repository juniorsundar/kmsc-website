# 13: Pass the launch-readiness gate

**What to build:** Complete and record the final preview-launch gate across content, accessibility, privacy, security, publishing, deployment, DNS, TLS, rollback, and the shared VM. Enable DNSSEC only after ordinary DNS is proven stable, and retain `noindex` until KMSC separately approves final Page Content.

**Blocked by:** 06 — Control indexing and search metadata; 10 — Connect the production domain and HTTPS; 11 — Activate protected Formspree delivery; 12 — Prove the Editor-to-VM publishing loop.

**Status:** resolved

- [x] Every public route passes representative desktop/mobile checks, keyboard navigation, visible focus, semantic structure, contrast, image alternatives, and reduced-motion review.
- [x] Footer identity, public email, Privacy link, Training Services, Blog empty state, Training Enquiry behavior, canonical redirect, and absence of telephone or fabricated claims are verified in production.
- [x] Repository history and generated artifacts contain no deployment private key, Ubuntu administrator key, OAuth secret, provider credential, or unrelated personal asset.
- [x] GitHub OAuth, Decap read/write, Formspree delivery and abuse controls, DNS resolution, certificate renewal readiness, atomic deployment, and rollback checks are recorded as passing.
- [x] Headscale remains unchanged on port 8080 and existing SSH, Tailscale, and firewall behavior remains intact apart from approved ports 80/443.
- [x] DNSSEC is enabled through the authoritative DNS provider only after ordinary DNS stability is verified, and the resulting chain validates without resolution errors.
- [x] The human-owned account, domain, reserved-IP, network-rule, and secret-location checklist is complete without storing sensitive values in documentation.
- [x] Preview `noindex` remains active; enabling production indexing is explicitly deferred until KMSC approves final Page Content.

## Answer

Implemented and verified against the repository test, build, and documented production-evidence checks.
