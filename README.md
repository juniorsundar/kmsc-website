# KMSC Website

Static Astro website for **Kautilya Management System Consultancy Pvt. Ltd.**

## Development

```sh
npm ci
npm run validate
npm test
npm run build
```

Page Content and Blog Posts live in `content/` and are validated before the Astro build. `/admin/` provides the Decap editor configuration for the public `juniorsundar/kmsc-website` repository. Provider setup and deployment credentials are deliberately not stored in this repository.

See [NOTICE.md](NOTICE.md) for content ownership and reuse terms.

## Release mode

Builds are preview-safe by default. Set `PUBLIC_INDEXING_ENABLED=true` for the approved indexable release; this switches the canonical origin, robots policy, sitemap, and HTML metadata without changing content files.
