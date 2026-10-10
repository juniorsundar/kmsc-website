# 03: Publish the Manuscript Template and reject unedited Manuscripts

**What to build:** KMSC receives one Word document showing exactly how to lay out a Manuscript, downloadable from the import control in the editor. A Manuscript that still contains the template's placeholder text is rejected rather than turned into a Blog Post.

**Blocked by:** 02 — Start a Blog Post from a Manuscript (title and body).

**Type:** task

**Status:** open

Spec: Manuscript Import specification; ADR-0002.

- [ ] The Manuscript Template contains example text in the Title, Heading 1, Heading 2, Normal, bulleted-list and numbered-list styles, and a Tags (keywords) property, with no images.
- [ ] Every instruction is a Word comment attached to the text it explains; no instruction appears in the document body.
- [ ] The opening paragraph's example text explains that it becomes the summary and should be one or two sentences.
- [ ] The template is committed with the site's static assets and linked as "Download the Manuscript Template" from the import control.
- [ ] Importing the unedited template, or a Manuscript whose title or opening paragraph still matches template placeholder text, is rejected with a message explaining what to replace, and no form opens.
- [ ] The importer's placeholder phrases and the template's placeholder text come from one shared definition, so they cannot drift apart.
- [ ] A filled-in copy of the template becomes the base fixture for tickets 04 to 06 and imports successfully.
- [ ] The template opens without errors or compatibility warnings in Microsoft Word and LibreOffice.
