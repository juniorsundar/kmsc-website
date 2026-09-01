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

## Get help

Contact the repository owner if `/admin/` does not load, GitHub login fails, the Editor reports a permission problem, or a build error appears after publishing. The Editor should not edit source files or deployment settings.
