import { test, expect } from '@playwright/test';

test('Home presents validated starter Page Content', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Professional training/);
  await expect(page.locator('h1')).toContainText('Practical training');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://kautilyamsc.com/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.getByRole('link', { name: 'Discuss Your Training Needs' })).toHaveAttribute('href', '/contact/');
  await expect(page.getByText('Management System Design and Implementation')).toBeVisible();
});

test('public routes and empty Blog state work', async ({ page }) => {
  for (const route of ['/about/', '/services/', '/blog/', '/contact/', '/privacy/']) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBeTruthy();
  }
  await page.goto('/blog/');
  await expect(page.getByText('Insights coming soon')).toBeVisible();
  await expect(page.locator('.card')).toHaveCount(0);
});

test('contact form exposes required enquiry contract', async ({ page }) => {
  await page.goto('/contact/');
  for (const name of ['name', 'email', 'company', 'training-interest', 'message', 'privacy-consent']) {
    await expect(page.locator(`[name="${name}"]`)).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Send Training Enquiry' })).toBeVisible();
});
