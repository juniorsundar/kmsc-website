# KMSC preview-launch readiness record

**Gate:** Ticket 13
**Release posture:** Preview only
**Decision:** **Not approved for production indexing**

This record separates checks that can be reproduced from this repository from checks that require the KMSC-owned production accounts, domain, and shared VM. Sensitive values and provider output belong in the operator's password manager or release record, not here.

## Repository and preview evidence

The following checks are reproducible locally and are covered by the production-build browser suite:

- [x] `npm run validate` accepts the current Page Content, Training Services, Blog Posts, and Media Assets.
- [x] `npm run typecheck` reports no diagnostics.
- [x] `npm test` passes the public-route, responsive, semantic, keyboard-focus, reduced-motion, contrast, image-alternative, Training Enquiry, metadata, OAuth, security, Caddy, VM-preparation, publishing, atomic-release, and rollback checks.
- [x] The preview build uses `https://preview.kautilyamsc.com` as its canonical origin, emits `noindex, nofollow` on public HTML, disallows crawling in `robots.txt`, and does not publish sitemap URLs.
- [x] Footer identity, public email, Privacy link, Training Services, the Blog empty state, Training Enquiry validation/failure fallback, and the absence of telephone fields are covered by tests.
- [x] The canonical Caddy configuration serves only the atomic `live` tree, redirects `www` permanently, and contains no Headscale proxy or TCP 8080 configuration.
- [x] The release and rollback scripts verify complete artifacts before changing `live`, swap the symlink atomically, and retain a bounded release history.
- [x] Repository and generated-artifact scans reject private keys, OAuth tokens/secrets, and provider credentials. No unrelated personal asset is included in the approved asset directories.

Run the reproducible checks from the repository root:

```sh
npm ci
npm run validate
npm run typecheck
npm test
npm run build
```

## Human-owned production evidence

These checks cannot be honestly marked passing from CI or a local checkout. The operator must record the date, account/workflow URL, commit or release ID, and redacted command output outside the repository.

- [ ] Editor logs into `/admin/` through GitHub OAuth; Decap can read and directly write `main`; no OAuth secret is shown to the Editor.
- [ ] A restrained Page Content edit and a second revision deploy through the gated workflow; the Editor can reopen the deployed content; a revert commit restores the prior content.
- [ ] Formspree accepts a harmless production test from `https://kautilyamsc.com/contact/`, sends the notification to the approved public email, and domain restriction, CAPTCHA, honeypot, and failure fallback behave as configured. No real Training Enquiry is used.
- [ ] Every public route passes representative desktop/mobile, keyboard, focus, semantic, contrast, image-alternative, and reduced-motion review in production.
- [ ] Production verifies the exact legal identity, public email, Privacy link, Training Services, Blog empty state, Training Enquiry behavior, permanent `www` redirect, absence of telephone details, and absence of fabricated claims.
- [ ] The reserved Oracle IP, Cloudflare authoritative A records, ports 80/443, trusted certificates, certificate renewal readiness, and representative HTTPS routes are recorded as passing.
- [ ] Before/after `scripts/vm-evidence.sh` snapshots show unchanged SSH, Tailscale, firewall behavior, and Headscale on TCP 8080. Only approved 80/443 changes are present.
- [ ] A complete release is activated, served, and rolled back to a retained release. Both `live` targets and route checks are recorded; rollback does not reload Caddy or restart Headscale.

## DNSSEC sequence

DNSSEC is deliberately **not enabled by this repository or its deployment workflow**. It may be enabled only by the domain owner after ordinary DNS has remained stable and the production smoke check has passed:

1. Query Cloudflare authoritative nameservers directly and record stable root and `www` A answers.
2. Run `scripts/production-smoke-check.sh --ip RESERVED_ORACLE_IPV4` and record HTTPS, redirect, route, and TCP 8080 results.
3. Confirm the pre-DNSSEC VM evidence and certificate checks are passing.
4. Enable DNSSEC at the authoritative DNS provider.
5. Publish the newly generated DS record at the registrar; never guess, reuse, or commit it.
6. Validate the chain from multiple networks with `dig +dnssec` (including an authenticated `ad` result where the validating resolver supports it), and record that there are no resolution errors.

Until these steps are recorded, DNSSEC remains disabled. Even after DNSSEC validation, preview `noindex` remains active. Production indexing requires a separate explicit KMSC approval of final Page Content and a deliberate `PUBLIC_INDEXING_ENABLED=true` release.

## Sensitive-value boundary

Do not put any of the following in this record, GitHub, the repository, `dist/`, or test logs: deployment private keys, the Ubuntu administrator key, OAuth client secrets, Formspree credentials or CAPTCHA secrets, registrar/Cloudflare credentials, recovery codes, reserved IP details when treated as sensitive operational data, or real Training Enquiries. Store the human-owned checklist and redacted evidence in the approved operator record.
