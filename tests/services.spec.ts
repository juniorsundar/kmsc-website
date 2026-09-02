import { test, expect } from '@playwright/test';

const SERVICES = [
  'Management System Design and Implementation',
  'Competency Assessment and Development',
  'Leadership Coaching'
];

test('Services presents editable introduction and ordered Training Services', async ({ page }) => {
  await page.goto('/services/');

  await expect(page.locator('h1')).not.toHaveText('');
  await expect(page.locator('section[aria-label="Training Services overview"] > p')).not.toHaveText('');

  const cards = page.locator('main article');
  await expect(cards).toHaveCount(SERVICES.length);
  expect(await cards.locator('h2').allTextContents()).toEqual(SERVICES);

  for (const [index, name] of SERVICES.entries()) {
    const card = cards.nth(index);
    await expect(card).toContainText(name);
    await expect(card.locator('p')).toHaveCount(2);
    for (const paragraph of await card.locator('p').all()) {
      await expect(paragraph).not.toHaveText('');
    }
  }
});
