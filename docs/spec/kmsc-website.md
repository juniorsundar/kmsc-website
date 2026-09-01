# KMSC Website Specification

## Problem Statement

KMSC needs a credible, maintainable business website that explains its Training Services to prospective Client Companies and provides a simple way to submit a Training Enquiry. The business also needs a Blog that a single nontechnical Editor can manage without editing source code, while retaining source control, deployment history, and ownership of its content.

KMSC currently has brand assets and preliminary service names but does not yet have final marketing copy, a website codebase, a configured domain, or a publishing system. The available Oracle VM is resource-constrained and already hosts Headscale, so the website must not build on the server or disrupt the existing service.

## Solution

Create a modern, human-centered static Astro website for Kautilya Management System Consultancy Pvt. Ltd. with Home, About, Services, Blog, Contact, and Privacy pages. Use Decap as the editing interface and GitHub as the system of record for Page Content, Blog Posts, and Media Assets. The Editor will authenticate with GitHub, update existing content or publish new Blog Posts directly, and trigger an automated GitHub Actions build and deployment.

The production build will be uploaded as static artifacts to the existing Oracle VM and served by Caddy over HTTPS on `kautilyamsc.com`. The site will coexist with Headscale without changing its port or service configuration. Initial content will use restrained, editable placeholders, remain excluded from search indexing, and avoid fabricated Blog Posts or unsupported business claims.

## User Stories

1. As a prospective Client Company representative, I want to immediately recognize KMSC and its full legal name, so that I know whose website I am visiting.
2. As a prospective Client Company representative, I want the Home page to explain that KMSC provides professional training, so that I can quickly judge whether the business is relevant to my needs.
3. As a prospective Client Company representative, I want a clear overview of KMSC's Training Services, so that I can identify an offering worth discussing.
4. As a prospective Client Company representative, I want to see Management System Design and Implementation as an initial Training Service, so that I can discover that area of expertise.
5. As a prospective Client Company representative, I want to see Competency Assessment and Development as an initial Training Service, so that I can discover that area of expertise.
6. As a prospective Client Company representative, I want to see Leadership Coaching as an initial Training Service, so that I can discover that area of expertise.
7. As a prospective Client Company representative, I want restrained placeholder descriptions rather than invented claims, so that I am not misled while KMSC prepares final copy.
8. As a prospective Client Company representative, I want a prominent “Discuss Your Training Needs” action, so that I can move directly from interest to an enquiry.
9. As a prospective Client Company representative, I want an About page introducing Dr. Sundar Subramani, so that I understand who leads KMSC.
10. As a prospective Client Company representative, I want the About page to identify Dr. Sundar Subramani as Director, Principal Consultant, so that I understand his role.
11. As a prospective Client Company representative, I want the site to present KMSC with a modern and professional visual identity, so that the consultancy feels credible.
12. As a prospective Client Company representative, I want consistent use of KMSC's navy, blue, and orange identity, so that the website matches its existing brand assets.
13. As a prospective Client Company representative, I want straightforward navigation between Home, About, Services, Blog, Contact, and Privacy, so that I can find information without confusion.
14. As a prospective Client Company representative, I want the website to work on phones, tablets, and desktop displays, so that I can use it on my preferred device.
15. As a keyboard user, I want every interactive control to be reachable and visibly focused, so that I can navigate without a mouse.
16. As a screen-reader user, I want semantic headings, landmarks, form labels, and meaningful image alternatives, so that I can understand and operate the website.
17. As a visitor with reduced-motion preferences, I want nonessential motion reduced or removed, so that the website remains comfortable to use.
18. As a visitor on a slow connection, I want optimized images and a small static payload, so that pages load quickly.
19. As a visitor, I want all production traffic encrypted with HTTPS, so that my browsing and Training Enquiry are protected in transit.
20. As a prospective Client Company representative, I want to send a Training Enquiry from the Contact page, so that I can discuss my requirements with KMSC.
21. As a prospective Client Company representative, I want the Training Enquiry to request my name, work email, company, training interest, and message, so that I can provide useful context.
22. As a prospective Client Company representative, I want to give explicit privacy consent before submitting a Training Enquiry, so that I understand how my information will be processed.
23. As a prospective Client Company representative, I want clear validation messages for missing or invalid form data, so that I can correct the submission.
24. As a prospective Client Company representative, I want confirmation after a successful Training Enquiry, so that I know it was delivered.
25. As a prospective Client Company representative, I want a helpful failure message and visible email fallback if form delivery fails, so that I can still contact KMSC.
26. As a prospective Client Company representative, I want to contact KMSC at `drsundar.subramani@outlook.com`, so that I have a direct alternative to the form.
27. As a privacy-conscious visitor, I want a concise Privacy page naming the contact-form processor, so that I understand where Training Enquiry data goes.
28. As a privacy-conscious visitor, I want the initial site to avoid analytics and tracking cookies, so that I am not tracked unnecessarily.
29. As a KMSC representative, I want phone numbers omitted from the initial website, so that unpublished contact channels remain private.
30. As a Blog reader, I want a clear Blog index, so that I can browse KMSC's published thinking when articles become available.
31. As a Blog reader, I want an honest “Insights coming soon” state when no Blog Posts exist, so that placeholder content is not presented as genuine expertise.
32. As a Blog reader, I want each Blog Post to have a stable, readable URL, so that I can bookmark or share it.
33. As a Blog reader, I want each Blog Post to display its title, summary, publication date, cover image when provided, body, and relevant tags, so that I can understand and navigate the article.
34. As a Blog reader, I want Dr. Sundar Subramani shown as the default Blog Post author, so that I know whose perspective I am reading.
35. As an Editor, I want to sign in through a browser using my GitHub account, so that I do not need to use Git commands or edit source files.
36. As an Editor, I want direct publishing rather than a multi-stage review workflow, so that managing content remains simple for one authorized person.
37. As an Editor, I want to create a Blog Post from structured fields, so that articles remain consistent.
38. As an Editor, I want to reopen and change an already deployed Blog Post, so that published information can be corrected or improved.
39. As an Editor, I want to change Page Content on Home, About, Services, and Contact, so that routine copy updates do not require a developer.
40. As an Editor, I want to add, reorder, update, or remove Training Services, so that the offering can evolve.
41. As an Editor, I want to update page and Blog Post search metadata, so that KMSC can improve search and link-preview presentation later.
42. As an Editor, I want to upload approved JPG, PNG, or WebP Media Assets, so that I can add relevant imagery without arbitrary file uploads.
43. As an Editor, I want clear Media Asset guidance and validation, so that oversized or unsupported files do not degrade the site.
44. As an Editor, I want published changes recorded as Git commits, so that KMSC has an auditable content history.
45. As an Editor, I want a successful publish to trigger deployment automatically, so that I do not need server access.
46. As an Editor, I want field descriptions and a writing template without a fake public article, so that I know how to prepare the first genuine Blog Post.
47. As a KMSC owner, I want all initial Page Content to remain editable, so that placeholder copy can be replaced incrementally.
48. As a KMSC owner, I want the preview site marked `noindex`, so that incomplete placeholder content does not enter search results.
49. As a KMSC owner, I want search indexing enabled only after content approval, so that the public search presence launches intentionally.
50. As a KMSC owner, I want the footer to show the exact legal name, copyright, email, and Privacy link, so that essential business identity is present.
51. As a KMSC owner, I want registered-address and corporate-identifier fields to remain absent until verified, so that the site does not invent legal information.
52. As a KMSC owner, I want KMSC branding and content treated as proprietary, so that public source visibility is not mistaken for permission to reuse them.
53. As a KMSC owner, I want the repository owned initially by the `juniorsundar` GitHub account, so that the developer can manage the first release.
54. As a future KMSC repository owner, I want the repository to remain migratable to another account or organization, so that ownership can change later.
55. As a developer, I want a clean installation and production build to succeed in CI, so that each deployment is reproducible.
56. As a developer, I want Decap's content fields to correspond to Astro's validated content model, so that editorial errors fail before deployment rather than breaking production.
57. As an operator, I want Astro built in GitHub Actions rather than on the VM, so that the VM's limited memory is not consumed by builds.
58. As an operator, I want only static artifacts deployed to the VM, so that the production runtime remains small and predictable.
59. As an operator, I want deployment to use a restricted deployment account and dedicated key, so that GitHub does not possess the Ubuntu administrator key.
60. As an operator, I want a deployment to switch releases atomically, so that visitors never receive a partially uploaded site.
61. As an operator, I want a bounded set of previous releases retained, so that a known-good version can be restored quickly.
62. As an operator, I want Caddy to serve the website on ports 80 and 443, so that HTTPS certificates and renewals are automated.
63. As an operator, I want `kautilyamsc.com` to be the canonical hostname and `www.kautilyamsc.com` redirected to it, so that the site has one stable origin.
64. As an operator, I want the Oracle public IP reserved before DNS cutover, so that the domain does not unexpectedly point at a reassigned address.
65. As an operator, I want only ports 80 and 443 added to the existing inbound rules, so that the website does not broaden network exposure unnecessarily.
66. As an operator, I want the existing SSH and Headscale access rules preserved, so that website deployment does not interrupt administration or the existing service.
67. As an operator, I want Headscale to remain on port 8080 without reconfiguration, so that the established production workload is not disturbed.
68. As a domain owner, I want full private registration for `kautilyamsc.com`, so that personal registration details are not needlessly exposed.
69. As a domain owner, I want Cloudflare to provide authoritative DNS, so that website DNS and the Decap OAuth Worker can be managed together.
70. As a domain owner, I want DNSSEC enabled only after ordinary DNS is verified, so that domain integrity improves without risking an avoidable DNSSEC outage.
71. As a security-conscious developer, I want repository, deployment, OAuth, and form credentials stored outside source control, so that the public repository reveals no secrets.
72. As a security-conscious developer, I want automated deployment to stop when tests or the production build fail, so that a known-broken release is not promoted.

## Implementation Decisions

1. The site will be a statically generated Astro application. No application server or Node.js runtime will be required on the production VM.
2. The public information architecture will contain Home, About, Services, Blog, Contact, and Privacy pages, with a shared header, navigation, footer, metadata system, and responsive design system.
3. The canonical business name is “Kautilya Management System Consultancy Pvt. Ltd.” and the canonical acronym is “KMSC.” “KMCS” and “Kautilya Management Consultancy Service” must not appear as business names.
4. The visual direction will be modern and human-centered while remaining restrained and professional. It will use the supplied navy, blue, sky-blue, and orange brand palette.
5. The compact KMSC acronym asset will be used where a concise brand mark is required. The head-and-ideas illustration may be used as a larger decorative or editorial image, not as a small navigation logo.
6. Supplied KMSC assets may be copied into the project, renamed consistently, and converted into suitable web sizes and formats. Originals outside the repository must remain unchanged, and source-quality brand assets must be kept distinct from generated derivatives.
7. Generated favicon and social-preview variants will be derived from approved KMSC assets. Text alternatives will describe informative images, while purely decorative images will be ignored by assistive technology.
8. Page Content will be represented as validated, structured content rather than hard-coded prose. Home, About, Services, and Contact will expose editable copy and approved imagery through Decap while layout and application behavior remain developer-controlled.
9. Training Services will be an ordered editable collection. The initial entries will be Management System Design and Implementation, Competency Assessment and Development, and Leadership Coaching, each with restrained placeholder copy and no unsupported outcomes, accreditations, statistics, or client claims.
10. Global editable settings will cover the legal name, public email address, primary call to action, default author profile, footer content, default search metadata, and social-preview image.
11. The primary call to action will read “Discuss Your Training Needs” and will lead to the Contact form.
12. The initial public author identity will be “Dr. Sundar Subramani.” “Director, Principal Consultant” will be presented on the author profile or About page rather than repeated on every Blog Post.
13. Blog Posts will use validated fields for title, stable slug, summary, publication date, optional cover Media Asset, body, tags, author, and search metadata. Dr. Sundar Subramani will be the default author.
14. The Blog index will support zero Blog Posts and render an “Insights coming soon” state. No fabricated article will be committed as published content.
15. Decap will provide field hints or equivalent editorial guidance for the first Blog Post without introducing a publicly rendered sample article.
16. Media Asset uploads through Decap will be restricted to approved image formats: JPG, PNG, and WebP. Arbitrary files will not be accepted. Upload guidance and validation will prevent unsupported or unreasonably large inputs; exact limits may be tuned during implementation based on the image pipeline.
17. GitHub will remain the system of record for Page Content, Blog Posts, and Media Assets, as established by the accepted Git-backed static publishing ADR. The deployed VM filesystem is an artifact destination and must never become the editorial source of truth.
18. Decap will use the GitHub backend against the public `juniorsundar/kmsc-website` repository and the default `main` branch.
19. One Editor will have publishing access. Decap editorial workflow will not be enabled; saving valid content will commit directly to `main` and trigger deployment.
20. The Editor will be able to load and modify existing Blog Posts from GitHub after they have been deployed. Editing a deployed page or Blog Post will create a new commit and release rather than modifying production files in place.
21. Decap authentication will use a GitHub OAuth application and a small OAuth proxy deployed as a Cloudflare Worker. The OAuth client secret will be stored as a Worker secret and must not be sent to the browser or committed to GitHub.
22. The Editor must have a GitHub account with access appropriate to the content repository. Routine editorial work will happen through `/admin`; knowledge of Git commands is not required.
23. The Contact form will submit Training Enquiries to Formspree and deliver notifications to `drsundar.subramani@outlook.com`.
24. The Training Enquiry contract will contain name, work email, company, training interest, message, explicit privacy consent, and anti-spam fields. Telephone will not be requested initially.
25. The form will provide accessible client-side feedback, but server-side Formspree responses remain authoritative. Success and failure states must be visible and announced to assistive technology, with the public email address available as a fallback.
26. Formspree domain restriction, CAPTCHA support, and a honeypot will be enabled when the production account and domain are configured. The public form identifier is not treated as a secret, but account credentials are.
27. The Privacy page will explain the purpose of Training Enquiry collection, identify Formspree as the processor, state the contact route for privacy questions, and avoid claims about retention or jurisdiction that KMSC has not verified.
28. No analytics, advertising pixels, behavioral tracking, or nonessential cookies will be included in the first release. Consequently, the first release will not add a cookie-consent banner.
29. The preview release will emit `noindex` directives consistently for HTML and crawler-facing metadata. Indexing will be enabled only through an explicit release configuration change after KMSC approves final Page Content.
30. Page titles, descriptions, canonical URLs, social-preview metadata, and sitemap behavior will be generated consistently. Preview deployments must not advertise themselves as canonical production content.
31. The production canonical origin will be `https://kautilyamsc.com`; `https://www.kautilyamsc.com` will redirect permanently to the canonical origin.
32. `kautilyamsc.com` will be registered with full privacy. Cloudflare will host authoritative DNS, and DNSSEC will be enabled only after ordinary resolution and production records have been verified.
33. The website repository will initially be public under the `juniorsundar` personal GitHub account. Migration to a KMSC-controlled account or organization is intentionally deferred but must not be blocked by account-specific application design.
34. No open-source license will be granted initially. A repository notice will clarify that KMSC names, branding, Page Content, Blog Posts, and Media Assets are proprietary; public repository access does not grant reuse rights.
35. GitHub Actions will install dependencies, run validation and tests, create the Astro production build, and deploy only when all required checks pass on `main`.
36. The production VM will not run Astro builds and will not require Node.js. This preserves memory for existing workloads and follows the accepted ADR.
37. GitHub Actions will authenticate to the VM with a dedicated deployment key belonging to a restricted deployment account. The existing Ubuntu administrator key must never be stored in GitHub.
38. Deployment will upload into a new versioned release directory, verify the uploaded artifact, and atomically switch a live reference only after success. A bounded number of previous releases will be retained for rollback.
39. Caddy will serve the selected live static release and manage HTTPS certificates for the canonical and redirect hostnames.
40. Caddy will coexist with the existing Headscale service. Headscale will remain on port 8080 and must not be reconfigured, restarted, proxied, or incorporated into the website deployment.
41. Host and Oracle Cloud network rules will add inbound TCP 80 and 443 only. Existing SSH, Headscale, Tailscale, and firewall behavior must otherwise remain unchanged.
42. The current public IP must be confirmed as reserved in Oracle Cloud before production DNS points to it.
43. Human-owned setup steps—domain purchase, nameserver delegation, DNSSEC activation, Oracle network-rule changes, Formspree enrollment, Cloudflare enrollment, OAuth application creation, and Editor GitHub enrollment—will be performed through a separate guided checklist. The codebase will support placeholders until those values exist.
44. Secrets will be stored in the systems that consume them: GitHub Actions secrets for deployment, Cloudflare Worker secrets for OAuth, and provider account configuration for Formspree. Secrets must not be embedded in Page Content, Blog Posts, Media Assets, build output, or repository history.
45. The production site must meet baseline accessibility expectations: semantic structure, keyboard operation, visible focus, sufficient text contrast, descriptive form errors, reduced-motion support, and appropriate image alternatives.
46. The implementation will favor static HTML and minimal client-side JavaScript. Interactive code will be added only where required for navigation, form feedback, or Decap administration.
47. The initial footer will include the exact legal name, copyright, public email address, and Privacy link. Registered address, CIN, GST, telephone, and other corporate details will be omitted until verified and supplied.
48. Placeholder Page Content will be clearly restrained but visually complete enough to evaluate layout. Lorem ipsum, fake testimonials, client logos, certifications, statistics, and fabricated case studies are prohibited.

## Testing Decisions

1. The primary acceptance seam will be the highest available seam: a browser exercising the production Astro build as a served static site. Tests will assert visitor-visible behavior and accessibility outcomes rather than component structure, CSS implementation, internal helper functions, or Decap implementation details.
2. Because the repository is greenfield, there is no existing test prior art to preserve. The initial suite will establish production-build browser tests as the project convention, using representative content fixtures through the same validated content path used by Decap and Astro.
3. A clean dependency installation followed by validation, tests, and a production build must pass in CI. A failed content validation, test, or build must prevent deployment.
4. Browser coverage will include every public route, shared navigation, canonical links, responsive rendering at representative viewport sizes, the primary call to action, footer identity, and the absence of broken internal links.
5. Browser coverage will verify that zero Blog Posts produces the intended empty state and that a representative valid Blog Post produces the expected index card, stable URL, metadata, author, tags, optional cover image behavior, and article body.
6. Content-contract coverage will exercise representative Page Content, Training Services, Blog Posts, and Media Assets through the real validation/build boundary. Invalid required fields, duplicate or invalid slugs, unsupported Media Asset references, and malformed dates must fail with actionable errors.
7. CMS smoke coverage will verify that `/admin` loads the Decap application and references a valid configuration whose collections correspond to the validated content model. Full GitHub OAuth behavior will not be simulated in ordinary CI because it crosses live GitHub and Cloudflare boundaries.
8. Training Enquiry browser tests will intercept the external Formspree request and verify the public request contract, required consent, validation feedback, successful completion state, failed-delivery state, and visible email fallback. CI will not send real enquiries.
9. Accessibility tests will combine automated checks with focused assertions for heading order, landmarks, accessible names, keyboard navigation, focus visibility, error announcements, image alternatives, reduced-motion behavior, and brand-color contrast. Automated checks do not replace a manual keyboard and screen-reader smoke test before launch.
10. Search and preview-state coverage will verify page titles, descriptions, canonical origins, social metadata, sitemap/robots behavior, and consistent `noindex` output. A separate production-mode assertion will verify that indexing can be intentionally enabled without changing content.
11. Asset coverage will verify that required brand variants resolve, informative images have meaningful alternatives, decorative imagery is hidden appropriately, and generated pages do not reference original Downloads locations or missing derivatives.
12. Deployment behavior will be tested at the release-script boundary in an isolated filesystem where practical: a failed upload or verification must leave the current live release unchanged, while a successful deployment must switch atomically and retain only the configured bounded history.
13. Caddy configuration will be validated before reload or activation. Post-deployment smoke checks will verify HTTPS, the canonical hostname, the `www` redirect, representative routes, and an unchanged Headscale listener on port 8080.
14. Live-provider checks will be explicit release checks rather than routine CI tests: GitHub OAuth login, Decap read/write access, Formspree delivery, DNS resolution, DNSSEC validation after activation, certificate issuance, and rollback from a previous release.
15. Formspree release checks will verify production-domain restriction, CAPTCHA and honeypot behavior, and rejection or isolation of submissions originating outside the approved website.
16. Security-focused checks will verify that repository history and generated artifacts contain none of the deployment private key, GitHub OAuth secret, administrator SSH key, provider credentials, or unrelated personal files from the source asset directory.
17. A good test for this project describes an observable visitor, Editor, publishing, or deployment outcome; remains stable through internal refactoring; uses the production content/build path; and produces a failure that explains which contract was broken.

## Out of Scope

- Final marketing copy, detailed Training Service curricula, case studies, testimonials, client logos, certifications, performance claims, and a production Blog Post.
- Fabricated content used to make the business appear more established than the supplied information supports.
- Publishing telephone numbers in the first release.
- Analytics, advertising, tracking pixels, remarketing, heat maps, or a consent-management platform.
- Multiple languages or locale-specific content.
- Online course delivery, learning-management features, learner accounts, assessments, certificates, bookings, calendars, payments, subscriptions, or ecommerce.
- Client portals, authenticated visitor accounts, databases, server-rendered application features, or a database-backed CMS.
- Multiple Editors, role-based editorial permissions, approval queues, or Decap editorial workflow.
- Building Astro on the Oracle VM or installing a production Node.js runtime there.
- Moving, upgrading, reconfiguring, restarting, or reverse-proxying the existing Headscale service.
- Replacing Tailscale, changing unrelated firewall rules, or hardening unrelated VM workloads.
- Self-hosting the Training Enquiry delivery service.
- Granting an open-source license to KMSC code, content, or branding.
- Migrating the repository from `juniorsundar` to a KMSC organization during the first release.
- Purchasing the domain, accepting registrar agreements, creating third-party accounts, entering payment details, or completing human identity verification automatically.
- Legal advice, trademark clearance, privacy-law certification, or verification of registered address, CIN, GST, data-retention, and jurisdictional requirements.
- Business email migration to an address at `kautilyamsc.com`.
- Search-engine marketing, backlink campaigns, paid promotion, or guaranteed ranking outcomes.
- Production indexing before KMSC approves the final Page Content.

## Further Notes

- The repository is currently greenfield apart from the domain glossary and the accepted Git-backed static publishing ADR. There are no existing application modules or tests to preserve.
- `kautilyamsc.com` appeared available during planning, but registration availability and pricing are authoritative only at checkout.
- The VM is Ubuntu 22.04 with approximately 956 MB RAM and no swap. It currently runs Headscale on port 8080, while ports 80 and 443 are unused but blocked by host and likely Oracle Cloud network rules.
- The current public IP is `51.170.90.37`, but its reserved status must be confirmed in Oracle Cloud before DNS cutover.
- The currently supplied KMSC assets establish useful branding and preliminary business details but do not include final site copy, founder photography, client evidence, or verified corporate identifiers.
- Human setup should occur after the application can build and run locally. Provider-specific values should be introduced through configuration without weakening local development or committing secrets.
- The testing approach intentionally uses one primary browser-level seam around the production build, supplemented only by narrow contract checks where external providers or atomic deployment behavior cannot be safely exercised through that seam.
