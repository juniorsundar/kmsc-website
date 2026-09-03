import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import astroConfig from '../../astro.config.mjs';

// Read rather than imported: a JSON import would need an import attribute on
// current Node, and the attribute syntax is not accepted by every toolchain
// this file passes through.
const pageContent = JSON.parse(
  readFileSync(new URL('../../content/page-content.json', import.meta.url), 'utf8')
) as { site: { noindex: boolean } };

// Mirrors src/config/release.ts, which cannot be imported here: it reads
// import.meta.env, which only exists inside an Astro build. Keep the two in
// step — the release gate AND the Editor's global switch must both permit
// indexing before any page is served without a robots directive.
const releaseGateOpen = process.env.PUBLIC_INDEXING_ENABLED === 'true';

/** Whether the build under test is expected to allow indexing at all. */
export const siteIndexable = releaseGateOpen && !pageContent.site.noindex;

/** The origin the build under test was configured with. */
export const siteOrigin = astroConfig.site as string;

/**
 * Assert a public route's robots directive matches what this build's settings
 * dictate, rather than assuming the site is permanently withheld. Not for Blog
 * Post pages, which carry their own per-post noindex on top of this.
 */
export async function expectRobotsMeta(page: Page) {
  const robots = page.locator('meta[name="robots"]');
  if (siteIndexable) {
    await expect(robots, 'an indexable build must not emit a robots directive').toHaveCount(0);
  } else {
    await expect(robots).toHaveAttribute('content', 'noindex, nofollow');
  }
}
