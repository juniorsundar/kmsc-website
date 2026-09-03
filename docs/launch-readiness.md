# KMSC preview-launch readiness record

**Gate:** Ticket 13
**Release posture:** Preview only
**Decision:** **Preview launch gate passed; production indexing remains deferred**

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

These checks were completed by the operator and recorded outside the repository. The operator-owned record contains the date, account/workflow URL, commit or release ID, and redacted command output; sensitive values are not copied here.

- [x] Editor logs into `/admin/` through GitHub OAuth; Decap can read and directly write `main`; no OAuth secret is shown to the Editor.
- [x] A restrained Page Content edit and a second revision deploy through the gated workflow; the Editor can reopen the deployed content; a revert commit restores the prior content.
- [x] Formspree accepts a harmless production test from `https://kautilyamsc.com/contact/`, sends the notification to the approved public email, and domain restriction, CAPTCHA, honeypot, and failure fallback behave as configured. No real Training Enquiry is used.
- [x] Every public route passes representative desktop/mobile, keyboard, focus, semantic, contrast, image-alternative, and reduced-motion review in production.
- [x] Production verifies the exact legal identity, public email, Privacy link, Training Services, Blog empty state, Training Enquiry behavior, permanent `www` redirect, absence of telephone details, and absence of fabricated claims.
- [x] The reserved Oracle IP, Cloudflare authoritative A records, ports 80/443, trusted certificates, certificate renewal readiness, and representative HTTPS routes are recorded as passing.
- [x] Before/after `scripts/vm-evidence.sh` snapshots show unchanged SSH, Tailscale, firewall behavior, and Headscale on TCP 8080. Only approved 80/443 changes are present.
- [x] A complete release is activated, served, and rolled back to a retained release. Both `live` targets and route checks are recorded; rollback does not reload Caddy or restart Headscale.

## DNSSEC sequence

DNSSEC is deliberately **not enabled by this repository or its deployment workflow**. The domain owner enabled it only after ordinary DNS remained stable and the production smoke check passed:

1. Query Cloudflare authoritative nameservers directly and record stable root and `www` A answers.
2. Run `scripts/production-smoke-check.sh --ip RESERVED_ORACLE_IPV4` and record HTTPS, redirect, route, and TCP 8080 results.
3. Confirm the pre-DNSSEC VM evidence and certificate checks are passing.
4. Enable DNSSEC at the authoritative DNS provider.
5. Publish the newly generated DS record at the registrar; never guess, reuse, or commit it.
6. Validate the chain from multiple networks with `dig +dnssec` (including an authenticated `ad` result where the validating resolver supports it), and record that there are no resolution errors.

The completed operator record confirms the DNSSEC chain validates without resolution errors. Preview `noindex` remains active even after DNSSEC validation. Production indexing requires a separate explicit KMSC approval of final Page Content and a deliberate `PUBLIC_INDEXING_ENABLED=true` release.

## Who controls indexing

Indexing needs two independent permissions, and either one alone withholds the website.

| Control | Owner | Meaning |
| --- | --- | --- |
| `PUBLIC_INDEXING_ENABLED` repository variable | Operator, once at launch | Authorises production releases to be indexable at all. Preview and pull-request builds are never indexable. |
| **Exclude the whole website from search engines** in the Editor | KMSC, at any time | The live on/off switch. ON withholds every page; OFF publishes the website to search engines. |
| **Exclude from search engines** on a Blog Post | KMSC, per post | Withholds that one post even when the website is indexable. Defaults to ON for new posts. |

Once the operator has set the repository variable, KMSC owns the decision from the Editor and no repository or CI change is needed to publish or withdraw the website. A change takes effect on the next release, which the Editor triggers automatically when it saves.

Withdrawing is not retroactive: search engines may already have cached pages indexed while the switch was OFF, and removing those is a separate request to each search engine.

## Sensitive-value boundary

Do not put any of the following in this record, GitHub, the repository, `dist/`, or test logs: deployment private keys, the Ubuntu administrator key, OAuth client secrets, Formspree credentials or CAPTCHA secrets, registrar/Cloudflare credentials, recovery codes, reserved IP details when treated as sensitive operational data, or real Training Enquiries. Store the human-owned checklist and redacted evidence in the approved operator record.
