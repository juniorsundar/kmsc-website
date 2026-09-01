# Use Git-backed static publishing

GitHub will be the system of record for Page Content, Blog Posts, and Media Assets: Decap will commit editorial changes directly to the repository, and GitHub Actions will build Astro and deploy only static artifacts to the Oracle VM behind Caddy. This was chosen over a database-backed CMS and on-host builds because KMSC has one Editor, needs auditable source-controlled publishing, and the shared VM has limited memory and already runs Headscale; changing this later would require migrating both content ownership and the publishing workflow.
