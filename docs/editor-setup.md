# Editor access and publishing

This guide is for KMSC's single authorized **Editor**. Git or coding knowledge is not required.

## Before you start

You need a GitHub account. Ask the repository owner to invite that account to `juniorsundar/kmsc-website` with permission to write content. Accept the invitation sent by GitHub. Do not share anyone else's account or credentials.

## Open the Editor

Open `/admin/` on the approved KMSC website and choose **Login with GitHub**. The sign-in window is handled by the site's authentication service; the GitHub OAuth client secret is never shown to the Editor.

## What you can publish

The Editor can update Home, About, Services, and Contact Page Content; add, reorder, update, or remove Training Services; create and revise Blog Posts; upload approved JPG, PNG, or WebP Media Assets; and update search metadata. Keep Media Assets reasonably sized and use the fields' guidance.

Choose **Publish** to save. Decap commits directly to the `main` branch and starts the automated build and deployment. There is no editorial pull-request review step. A change becomes visible after the checks and build finish; a failed build will not be published.

To revise deployed content, reopen it in the Editor, make the change, and publish again. This creates a new auditable version.

## Publish a Blog Post from a Word document

You write the Blog Post in Word. The Editor fills in the title, summary, web address, date and topics for you, and you add only the cover image.

### 1. Get the template

In the Editor, open **Blog Posts** and choose **New Blog Post**. Under **Start from Word document**, choose **Download the Manuscript Template** and save the file. Keep it as your starting point for every Blog Post: open it, save a copy under a new name, and write in the copy.

### 2. Write in Word

Replace the example text in the template. The notes in the margin explain each part and will not appear on the website.

- **Title:** write the title on the first line, in the **Title style**.
- **Opening paragraph:** write one or two sentences saying what the article is about. This becomes the summary on the Blog page and in search results.
- **Section headings:** use the **Heading 1** style. For a heading under a section heading, use **Heading 2**.
- **Body:** write normal text. Bold, italic, links, bulleted and numbered lists, tables and footnotes are kept. Fonts, colours and highlighting are not.
- **Topics:** under **File > Info**, fill in **Tags** with a few topics separated by commas (for example: leadership, practice). Leave it empty for none.
- **No pictures:** do not put pictures in the document. Choose the cover image in the Editor (step 4).
- Save the file as a Word document (**.docx**).

### 3. Start the Blog Post

Under **Start from Word document**, choose your file. The form fills in below. If the file cannot be used, a message explains why, for example that the template text was not replaced or the file is not a .docx. Fix it in Word and choose the file again. If your document had pictures, a note says how many were skipped.

### 4. Add the cover image

Choose a **Cover image** (JPG, PNG or WebP). Then write the **Cover image description**: one short sentence saying what the image shows, for readers who cannot see it. Do not leave this empty if you chose a cover image.

### 5. Check and publish

Read through the title, summary, body, date and topics. Everything can be changed. The URL slug, byline and **Hide from search engines** are filled in automatically; normally leave them as they are. New Blog Posts are visible to search engines unless you turn **Hide from search engines** on. Then choose **Publish**.

### Change the text of a published Blog Post

Open the Blog Post in the Editor. Above the **Body**, choose **Replace the body from a Word document** and pick your updated file. Only the body changes. The title, web address, date, cover image and other details stay as they are. Check the result, then choose **Publish**. This replaces the whole body, including anything you typed in the Editor, so make small corrections in the Editor and use Word for larger revisions.

If you start a Blog Post from Word after filling in the form by hand, the Editor asks whether to discard what you entered.

## Get help

Contact the repository owner if `/admin/` does not load, GitHub login fails, the Editor reports a permission problem, or a build error appears after publishing. The Editor should not edit source files or deployment settings.
