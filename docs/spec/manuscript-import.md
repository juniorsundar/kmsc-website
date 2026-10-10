# Manuscript Import Specification

Labels: ready-for-agent

## Problem Statement

The Editor writes Blog Posts in Word, but publishing one through Decap means filling in ten separate fields by hand: title, URL slug, summary, publication date, cover image, cover image description, body, tags, byline and search visibility. Copy-pasting from Word loses the article's structure. Headings arrive as ordinary paragraphs, line breaks land mid-sentence, and formatting disappears. The fields that need judgement are filled in inconsistently: summaries are long passages copied from the body, slugs contain typos or no longer match the article, tags use mixed conventions, and a cover image description has been left as placeholder text. Search visibility defaults to hidden, so recent Blog Posts have stayed out of search engines by accident. KMSC has asked for a much simpler process.

## Solution

The Editor writes a Manuscript in Word using the Manuscript Template. In the editor, they choose **Start from Word document** and select the Manuscript. The browser converts it and opens a new Blog Post form with every derivable field already filled in. The body keeps its headings, lists, tables, links and emphasis. The Editor reviews the form, uploads a cover image, writes a one-sentence description of it, and publishes. Nothing is published before the Editor has seen it.

To revise an existing Blog Post's text, the Editor uses **Replace from Word** on the body. Only the body changes; the URL, date, cover and other fields stay as they are. New Blog Posts are visible to search engines by default.

The Manuscript is a one-off source, not a lasting copy of the Blog Post: GitHub remains the system of record for Blog Post content (ADR-0001), and Manuscripts are not stored in the repository. The design is recorded in ADR-0002.

## User Stories

1. As an Editor, I want to start a new Blog Post from a Word document, so that I don't have to copy text into many separate fields.
2. As an Editor, I want the Blog Post title taken from my Manuscript, so that I don't retype it.
3. As an Editor, I want the title taken from the Title style, then the document's title property, then the first paragraph, so that a sensible title appears even if I forget the Title style.
4. As an Editor, I want a short summary generated from my opening paragraph, so that the Blog index and search results show a concise description.
5. As an Editor, I want the summary to end at a sentence boundary, never mid-word, so that it reads naturally.
6. As an Editor, I want a short, readable URL slug generated from the title, so that I don't have to invent one or risk typos.
7. As an Editor, I want an automatic distinct slug when one already exists, so that a duplicate slug never makes my publish silently fail the build.
8. As an Editor, I want the publication date set to today, so that I don't have to choose it for a normal same-day post.
9. As an Editor, I want tags taken from the Tags (keywords) property of my Word document, so that topics are set without another form field.
10. As an Editor, I want tags made lowercase and hyphenated automatically, so that tags stay consistent across Blog Posts.
11. As an Editor, I want the default byline filled in automatically, so that I never have to type it.
12. As an Editor, I want new Blog Posts visible to search engines by default, so that published articles aren't hidden by accident.
13. As an Editor, I want Word headings preserved as headings, so that my article's structure appears on the website.
14. As an Editor, I want Word headings shifted one level down on the website, so that the Blog Post title remains the page's only main heading.
15. As an Editor, I want bulleted and numbered lists preserved, so that lists don't become run-on paragraphs.
16. As an Editor, I want bold, italic and hyperlinks preserved, so that emphasis and references survive the import.
17. As an Editor, I want tables preserved, so that tabular content remains readable.
18. As an Editor, I want footnotes turned into numbered notes at the end of the body, so that references aren't lost.
19. As an Editor, I want fonts, colours and highlighting ignored, so that Blog Posts keep the website's consistent styling.
20. As an Editor, I want images embedded in my Manuscript skipped with a clear warning, so that I know to upload a cover image separately and nothing unapproved is published.
21. As an Editor, I want to see every imported value in the form before publishing, so that I can correct anything the importer got wrong.
22. As an Editor, I want every imported field to remain editable, so that I keep full control over what is published.
23. As an Editor, I want the import control and the cover image fields at the top of the form, so that the steps I actually do come first.
24. As an Editor, I want automatically filled fields marked as "normally leave as is", so that I know I can usually ignore them.
25. As an Editor, I want a Manuscript that still contains template placeholder text to be rejected with an explanation, so that I don't publish the template by mistake.
26. As an Editor, I want a clear message when a file isn't a readable Word document, so that I know to save it as .docx and try again.
27. As an Editor, I want to download the Manuscript Template from inside the editor, so that I always use the current version.
28. As an Editor, I want the Manuscript Template's instructions placed in Word comments beside the example text, so that guidance sits where I need it and can never appear on the website.
29. As an Editor, I want the Manuscript Template to show the title, opening paragraph, section headings, sub-headings, body text and lists already in the correct styles, so that I can write by replacing example text.
30. As an Editor, I want to replace an existing Blog Post's body from a revised Manuscript, so that I can revise in Word without retyping.
31. As an Editor, I want replacing the body to leave the title, URL slug, publication date, cover and other fields unchanged, so that a revision never breaks a shared link or changes the date.
32. As an Editor, I want the replaced body shown in the form before I publish, so that I can check it first.
33. As an Editor, I want publishing a cover image without a real description to be rejected, so that the website stays accessible to screen-reader users.
34. As a website owner, I want the Manuscript Template available to send to KMSC directly, so that the Editor can prepare future Blog Posts consistently.
35. As a Blog reader, I want Blog Posts to keep their headings, lists and emphasis, so that articles are easy to scan.
36. As a Blog reader using a screen reader, I want cover images described meaningfully, so that I understand the imagery.
37. As a Blog reader, I want concise summaries on the Blog index, so that I can quickly decide what to read.
38. As a search engine user, I want KMSC's published Blog Posts indexed with concise descriptions, so that I can find them.
39. As a developer, I want Manuscripts converted entirely in the browser, so that no server, API key or new trust boundary is introduced.
40. As a developer, I want the conversion libraries installed as locked npm dependencies and built into a script served from the same site, so that the editor's security policy stays unchanged and no CDN is involved.
41. As a developer, I want the import rules tested through one importer function with Manuscript fixtures, so that rule changes are fast to verify.
42. As a developer, I want one browser test of the import running against the real built editor without GitHub, so that the integration with Decap is protected from regressions.
43. As a developer, I want a Blog Post with no search setting to remain hidden, so that hand-made content fails safe.
44. As a developer, I want Blog Post content that imports produce to pass the existing content validator unchanged, so that the build stays the single safety net before deployment.
45. As a website owner, I want the two existing hidden Blog Posts made visible to search engines, so that the Editor's published work can be found.

## Implementation Decisions

- **Importer module.** One pure, framework-independent importer is the single place where import rules live. Inputs: the Manuscript's bytes, the existing Blog Post slugs, and today's date. Output: pre-filled Blog Post fields (title, slug, summary, date, body, tags, byline, search visibility) and a list of Editor-facing warnings, or a rejection with an Editor-facing reason. It knows nothing about Decap.
- **Conversion.** The importer converts the Manuscript body from Word to HTML with mammoth, then to Markdown with Turndown (including its table support). Mammoth's own Markdown output is deprecated and is not used. The title and keywords document properties are read from the Manuscript's core properties, because mammoth doesn't read them. Word comments are ignored.
- **Structure comes only from Word styles.** Title style → title; Heading 1 → section heading (rendered one level below the title); Heading 2 → sub-section (one level lower again). The importer doesn't guess headings from bold, short or numbered lines. If there's no Title style, the first paragraph becomes the title and is removed from the body.
- **Field rules.**
  - **Title:** Title style, then the title document property, then the first paragraph.
  - **Summary:** the first body paragraph, cut at the last sentence ending within about 200 characters. If no sentence ends in time, it is cut at a word boundary with an ellipsis.
  - **Slug:** derived from the title. Lowercase ASCII words separated by hyphens, small filler words removed, capped at about 60 characters or 8 words. If it collides with an existing slug, the lowest free numeric suffix is added (`-2`, `-3`, …).
  - **Date:** today, in the Editor's local calendar.
  - **Tags:** the keywords property split on commas or semicolons, trimmed, lowercased and hyphenated, with duplicates removed; empty if absent.
  - **Byline:** the existing default.
  - **Search visibility:** visible.
- **Content handling.** Lists, tables, hyperlinks, bold and italic are kept. Footnotes become numbered end notes. Fonts, colours and highlighting are dropped. Embedded images are removed and produce one warning that states the count and that a cover image is uploaded separately. Imported bodies must pass the existing renderer's rules: raw HTML is escaped, and images are allowed only from approved media.
- **Rejections.** A file that isn't a readable .docx, a Manuscript with no text, or a Manuscript that still contains Manuscript Template placeholder text is rejected with a plain-language reason, and no form is opened.
- **Hand-off to Decap: start a new Blog Post.** A custom Decap control, **Start from Word document**, runs the importer and opens Decap's New Blog Post route with the derived values supplied through the URL parameters Decap supports for pre-filling new entries. Decap HTML-escapes these values, so the plain-text fields are unescaped back to their original text before display. The Editor sees and can edit every pre-filled value before publishing. Pre-filling at save time (Decap's `preSave` event) is rejected: in simple publish mode it would publish content the Editor never saw (ADR-0002).
- **Hand-off to Decap: Replace from Word.** The body field gets a **Replace from Word** action that runs the importer and replaces only the body field's value through the standard widget change mechanism, leaving every other field unchanged. Warnings are shown beside the body.
- **Fallback.** The URL hand-off for tags (a list field) and for long bodies is unproven. If the first ticket's spike shows URL pre-fill can't carry the body or tags reliably, the fallback is a narrower in-form import on the body field. That change is brought back to the website owner for a decision rather than adopted silently.
- **Form changes.** Field order becomes: Start from Word document, cover image, cover image description, title, summary, body, publication date, tags, slug, byline, search visibility. Every field stays editable. Slug, byline and search visibility get "filled automatically; normally leave as is" hints. The search-visibility default in the form changes to visible. Existing field names and the cover-image-description hint asserted by tests are kept.
- **Content model.** The Blog Post schema is unchanged, except that the validator rejects the literal placeholder "Cover image description" as a cover image description. When a Blog Post has no search setting at all, the validator and site data still treat it as hidden.
- **Manuscript Template.** One Word document committed with the site's static assets and linked from the import control. It contains example text in the Title, Heading 1, Heading 2, Normal and list styles, uses the keywords property for tags, and contains no images. Its instructions are Word comments. Its placeholder phrases are the same phrases the importer rejects.
- **Delivery.** mammoth and Turndown are added as npm dependencies and bundled by the Astro build into a script served from the same site, loaded by the editor page after Decap. The editor's security policy (CSP) and Decap's committed copy of its code stay unchanged.
- **Content change.** The two existing hidden Blog Posts are switched to visible in search engines, as an ordinary content commit.
- **Docs.** The Editor setup guide gains a short Word-based publishing procedure. CONTEXT.md already defines Manuscript and Manuscript Template.

## Testing Decisions

- Good tests check outward behaviour: what the Editor ends up with in the form, and what the Blog reader gets after publishing. They never check internal steps (intermediate HTML, library calls, helper functions).
- **Test point 1: the importer function.** Fixture Manuscripts derived from the Manuscript Template exercise every rule: title fallback order, summary length and sentence boundary, slug shortening and collision suffixes, date, tags normalisation, heading shift, lists, tables, links, emphasis, footnotes, image removal with a warning, dropped formatting, ignored comments, template-placeholder rejection, and unreadable-file rejection. Fixtures are small committed .docx files. Assertions compare the returned fields and warnings, plus one check that an imported fixture passes the existing content validator.
- **Test point 2: one end-to-end browser test of the built editor.** It runs against the production build with Decap's configuration replaced, in the test only, by Decap's in-browser `test-repo` backend, so no GitHub account or network is involved. It proves three things. Uploading a fixture Manuscript through Start from Word document opens a New Blog Post form showing the expected title, summary, body, tags, slug, date and search visibility. A placeholder Manuscript shows the rejection and opens no form. Replace from Word on an existing entry changes only the body.
- **Existing test points, small additions only.** Content validation rejects the cover-image-description placeholder and keeps the hidden-when-absent fallback. The Decap configuration test checks the new field order, the hints and the visible default, alongside its current assertions. The security scan continues to require scripts from the same site and the unchanged editor security policy.
- **Prior art.** The fixture-copy-and-run pattern in the content validation tests; the production-build fixture site in the Blog and metadata tests; the configuration assertions in the site shell test; and the script-origin and CSP assertions in the security scan.

## Out of Scope

- AI-generated summaries, tags or cover image descriptions.
- Server-side conversion or any new hosted service or API key.
- Storing Manuscripts in the repository, or keeping them as the lasting copy of a Blog Post.
- Importing images from Manuscripts into Media Assets, or picking cover images automatically.
- Formats other than .docx, such as .doc, PDF, Google Docs or Markdown files.
- Guessing headings from unstyled text.
- Importing into Page Content or Training Services.
- Changing Decap's publish mode, review workflow, version or committed copy of its code.
- Re-importing title, summary, slug, date or tags into an existing Blog Post.
- Bulk import of several Manuscripts.

## Further Notes

- The repository was tagged `pre-manuscript-import` before this work began.
- The first implementation ticket should be a spike that proves Decap's URL pre-fill for a long body, a tags list and text containing `&`, before the rest is built.
- If KMSC can supply the original Word files behind existing Blog Posts, they should become extra importer fixtures. They would show how far the Editor's real habits are from the Manuscript Template.
- Existing Blog Posts aren't migrated or reformatted. Their bodies remain as previously published unless the Editor replaces them from a Manuscript.
