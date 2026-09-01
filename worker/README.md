# KMSC Editor OAuth Worker

This Worker is the server-side OAuth proxy for Decap. It exchanges a GitHub authorization code for an access token without sending the GitHub OAuth client secret to the browser.

## Local dry run

From the repository root, run `npx wrangler dev worker/oauth-proxy.mjs` (or use the repository's automated tests). Without secrets, `/auth` and `/callback` return a safe dry-run message and do not contact GitHub. This does not require a GitHub account, OAuth application, or Cloudflare credentials.

## Configure the real service

1. Create a GitHub OAuth application. Set its callback URL to `https://YOUR-WORKER-DOMAIN/callback`.
2. Deploy this Worker to Cloudflare with `wrangler deploy`.
3. Store both OAuth values as Cloudflare Worker secrets:

   ```sh
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   ```

4. Set the Worker `CMS_ORIGIN` variable to the exact origin serving `/admin/` (for example `https://kautilyamsc.com`), then replace `base_url` in `public/admin/config.yml` with the deployed Worker URL and replace `app_id: placeholder` with the GitHub OAuth application's client ID.
5. Keep the repository's `publish_mode: simple` setting. It publishes directly to `main`; no editorial pull-request workflow is used.

The client ID is public configuration. The client secret is not configuration for Decap and must remain only in Cloudflare's secret store. Never print it in deployment logs or commit it to GitHub.
