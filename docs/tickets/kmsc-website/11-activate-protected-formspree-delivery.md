# 11: Activate protected Formspree delivery

**What to build:** Connect the tested Training Enquiry experience to KMSC’s real Formspree account and verify delivery, abuse controls, privacy behavior, and accessible visitor feedback on the production domain.

**Blocked by:** 05 — Accept a private Training Enquiry; 10 — Connect the production domain and HTTPS.

**Status:** ready-for-agent

- [ ] The production form endpoint delivers valid Training Enquiries to `drsundar.subramani@outlook.com` without exposing an account credential.
- [ ] Formspree restricts accepted production submissions to the approved website domain.
- [ ] CAPTCHA and honeypot protections operate as configured without blocking keyboard or assistive-technology use.
- [ ] A valid production submission produces the accessible success state and an email notification with the agreed public fields.
- [ ] Provider failure produces the accessible failure state and visible email fallback without falsely claiming delivery.
- [ ] Off-origin or abusive submissions are rejected or isolated according to the configured provider controls.
- [ ] The Privacy route accurately names Formspree and remains free of unverified retention or jurisdiction claims.
- [ ] No real Training Enquiry or provider credential is retained in tests, logs, repository history, or generated artifacts.
