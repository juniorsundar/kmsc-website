import { test, expect } from '@playwright/test';
import { expectRobotsMeta, siteOrigin } from './support/indexing';

// Taken from the build configuration rather than hardcoded: the origin depends
// on whether this is a production release, and the assertion is that the page
// agrees with the origin it was built for.
const homeUrl = new URL('/', siteOrigin).href;

test('Home presents validated starter Page Content', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Kautilya Management System Consultancy Pvt\. Ltd\. \| /);
  await expect(page.locator('h1')).not.toHaveText('');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', homeUrl);
  await expectRobotsMeta(page);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', homeUrl);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.getByRole('link', { name: 'Discuss Your Training Needs' })).toHaveAttribute('href', '/contact/');
  await expect(page.getByText('Management System Design and Implementation')).toBeVisible();
});

test('public routes and the Blog state work', async ({ page }) => {
  for (const route of ['/about/', '/services/', '/blog/', '/contact/', '/privacy/']) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBeTruthy();
  }
  await page.goto('/blog/');
  const cards = page.locator('article.card');
  if (await cards.count() === 0) {
    await expect(page.getByText('Insights coming soon')).toBeVisible();
  } else {
    await expect(page.getByText('Insights coming soon')).toHaveCount(0);
    await expect(cards.first()).toBeVisible();
  }
});

test('contact form exposes required enquiry contract', async ({ page }) => {
  await page.goto('/contact/');
  for (const name of ['name', 'email', 'company', 'training-interest', 'message', 'privacy-consent']) {
    await expect(page.locator(`[name="${name}"]`)).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Send Training Enquiry' })).toBeVisible();
});
