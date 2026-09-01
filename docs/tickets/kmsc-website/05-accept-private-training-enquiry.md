# 05: Accept a private Training Enquiry

**What to build:** Deliver an accessible Contact experience that collects a privacy-consented Training Enquiry through a configurable Formspree contract, provides useful success and failure feedback, and explains data processing without adding analytics or unsupported legal claims.

**Blocked by:** 02 — Deliver the branded content-managed site shell.

**Status:** resolved

- [x] The Contact route renders editable Contact Page Content and a Training Enquiry form for name, work email, company, training interest, message, privacy consent, and a honeypot.
- [x] The form omits telephone and displays `drsundar.subramani@outlook.com` as the fallback contact route.
- [x] Missing or invalid values produce visible, accessible validation feedback; success and failure states are announced to assistive technology.
- [x] Browser tests intercept the Formspree request and verify the public field contract without sending a real Training Enquiry.
- [x] Failure behavior preserves useful input where safe and provides the visible email fallback.
- [x] The Privacy route identifies Formspree, explains why Training Enquiry data is collected, and provides a privacy contact without inventing retention or jurisdiction claims.
- [x] No analytics, advertising pixels, behavioral tracking, nonessential cookies, or cookie-consent banner are present.
- [x] Keyboard operation, focus visibility, reduced-motion behavior, and descriptive errors pass production-build checks.

## Answer

Implemented and verified against the repository test, build, and documented production-evidence checks.
