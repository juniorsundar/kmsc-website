import { test, expect } from '@playwright/test';

const SERVICES = [
  {
    name: 'Management System Design and Implementation',
    summary: 'Placeholder overview of management system work and implementation training.',
    description: 'Final Page Content will describe the scope, approach, and fit for Client Companies.'
  },
  {
    name: 'Competency Assessment and Development',
    summary: 'Placeholder overview of assessing and developing competencies through training.',
    description: 'Final Page Content will describe the scope, approach, and fit for Client Companies.'
  },
  {
    name: 'Leadership Coaching',
    summary: 'Placeholder overview of leadership development training.',
    description: 'Final Page Content will describe the scope, approach, and fit for Client Companies.'
  }
];

test('Services presents editable introduction and ordered Training Services', async ({ page }) => {
  await page.goto('/services/');

  await expect(page.locator('h1')).toHaveText('Training Services');
  await expect(page.getByText(
    "Explore KMSC's current Training Services. Each offering is presented as a starting point for a conversation; further Page Content will be added as it is approved.",
    { exact: true }
  )).toBeVisible();

  const cards = page.locator('main article');
  await expect(cards).toHaveCount(SERVICES.length);
  expect(await cards.locator('h2').allTextContents()).toEqual(SERVICES.map(service => service.name));

  for (const [index, service] of SERVICES.entries()) {
    await expect(cards.nth(index)).toContainText(service.name);
    await expect(cards.nth(index)).toContainText(service.summary);
    await expect(cards.nth(index)).toContainText(service.description);
  }
});
