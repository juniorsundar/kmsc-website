import { test, expect } from '@playwright/test';

const endpoint = 'https://formspree.io/f/mgaekezn';

async function fillEnquiry(page: import('@playwright/test').Page) {
  await page.getByLabel('Name').fill('Asha Rao');
  await page.getByLabel('Work email').fill('asha@example.com');
  await page.getByLabel('Company').fill('Example Company');
  await page.getByLabel('Training interest').fill('Management system design');
  await page.getByLabel('Message').fill('We would like to discuss a Training Service.');
  await page.getByLabel(/I consent/).check();
}

test('invalid Training Enquiry values receive visible accessible feedback', async ({ page }) => {
  await page.goto('/contact/');
  await page.getByRole('button', { name: 'Send Training Enquiry' }).click();

  await expect(page.getByText('Please enter your name.')).toBeVisible();
  await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('.form-status')).toBeHidden();
});

test('a successful Training Enquiry sends the public field contract', async ({ page }) => {
  let requestBody = '';
  await page.route(endpoint, async route => {
    requestBody = route.request().postData() || '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.goto('/contact/');
  await fillEnquiry(page);
  await page.getByRole('button', { name: 'Send Training Enquiry' }).click();

  await expect(page.getByRole('status')).toContainText('Training Enquiry was sent');
  for (const field of ['name', 'email', 'company', 'training-interest', 'message', 'privacy-consent', '_gotcha']) {
    expect(requestBody).toContain(`name="${field}"`);
  }
});

test('a delivery failure preserves input and provides a retry message', async ({ page }) => {
  await page.route(endpoint, route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('/contact/');
  await fillEnquiry(page);
  await page.getByRole('button', { name: 'Send Training Enquiry' }).click();

  await expect(page.getByRole('status')).toContainText('could not be sent. Please try again.');
  await expect(page.getByRole('status').getByRole('link')).toHaveCount(0);
  await expect(page.getByLabel('Name')).toHaveValue('Asha Rao');
  await expect(page.getByLabel('Message')).toHaveValue('We would like to discuss a Training Service.');
});

test('the honeypot is not keyboard reachable and CAPTCHA is presented', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.locator('.g-recaptcha')).toHaveAttribute('data-sitekey', /.+/);
  await expect(page.getByText('Spam protection is provided by Google reCAPTCHA.')).toBeVisible();
  await expect(page.locator('[name="_gotcha"]')).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('[type="tel"]')).toHaveCount(0);
  await expect(page.locator('[name="telephone"]')).toHaveCount(0);
});
