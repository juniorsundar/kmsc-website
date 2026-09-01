# Formspree production activation

The public form endpoint is configuration, not a credential. Do not put a Formspree account password, API key, CAPTCHA secret, or real Training Enquiry in this repository.

## Configure Formspree

These steps must be completed by the KMSC account owner at [Formspree](https://formspree.io/):

1. Create and verify an account at [formspree.io/register](https://formspree.io/register).
2. Open [Forms](https://formspree.io/forms), choose **New Form**, and copy the endpoint from its **Integration** tab. It must look like `https://formspree.io/f/<form-id>`.
3. In the project settings, set **Restrict to Domain** to `kautilyamsc.com` (without `https://` or `www`). Formspree sends off-origin requests to its spam inbox rather than accepting them as normal submissions.
4. In the form's **Settings** / **Spam protection**, leave CAPTCHA enabled or configure the approved CAPTCHA provider. Keep any provider secret in Formspree; it must not be added to Astro, GitHub, or this repository. The form also includes Formspree's `_gotcha` honeypot.
5. In **Workflow**, add an email notification action for the linked and verified address `drsundar.subramani@outlook.com`.
6. Submit one harmless test enquiry from `https://kautilyamsc.com/contact/`. Confirm the dashboard delivery and notification. Do not use a real Client Company enquiry as a test.

Formspree's domain restriction relies on the browser `Referer` header. The production Caddy configuration sends `strict-origin-when-cross-origin`, which preserves the origin needed for the check without sending the full contact URL.

## Configure the release

In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables** and add:

- `PUBLIC_FORMSPREE_ENDPOINT`: the public endpoint copied from Formspree
- `PUBLIC_INDEXING_ENABLED`: `true` only when KMSC has approved the production Page Content

The endpoint is passed to the build as a repository variable when supplied, not a secret; the approved public endpoint is also kept in `content/page-content.json` so local builds use the same form. A production/indexable build fails if the resolved endpoint is still the local placeholder. Preview builds remain available for browser tests without a live provider endpoint.

After adding the variables, push the release to `main`. CI runs validation, browser tests, and the build before deployment. Inspect the generated Contact page and then repeat the harmless production test.

## Official references

- [Building an HTML form](https://help.formspree.io/articles/building-your-form/building-an-html-form)
- [Restrict to Domain](https://help.formspree.io/articles/form-and-project-settings/restrict-to-domain)
- [Honeypot spam filtering](https://help.formspree.io/articles/building-your-form/honeypot-spam-filtering)
- [CAPTCHA settings](https://help.formspree.io/articles/form-and-project-settings/recaptcha-settings)
- [Email notification settings](https://help.formspree.io/articles/form-and-project-settings/changing-a-form-email-address)
