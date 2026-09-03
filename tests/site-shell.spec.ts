import { test, expect } from '@playwright/test';

const LEGAL_NAME = 'Kautilya Management System Consultancy Pvt. Ltd.';
const ROUTES = ['/', '/about/', '/services/', '/blog/', '/contact/', '/privacy/'];
const FORBIDDEN_NAMES = ['KMCS', 'Kautilya Management Consultancy Service'];

// ── Navigation and footer consistency ──────────────────────────────

test('all routes share consistent navigation links', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();
    for (const label of ['Home', 'About', 'Services', 'Blog', 'Contact']) {
      await expect(nav.getByRole('link', { name: label })).toBeVisible();
    }
  }
});

test('all routes share footer with legal name, copyright, Contact, and Privacy link', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    const footer = page.locator('footer');
    await expect(footer).toContainText(LEGAL_NAME);
    await expect(footer).toContainText(`© ${new Date().getFullYear()}`);
    await expect(footer.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact/');
    await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy/');
  }
});

test('internal navigation between routes works without broken links', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('nav[aria-label="Main navigation"]');

  await nav.getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(/\/about\//);

  await nav.getByRole('link', { name: 'Services' }).click();
  await expect(page).toHaveURL(/\/services\//);

  await nav.getByRole('link', { name: 'Blog' }).click();
  await expect(page).toHaveURL(/\/blog\//);

  await nav.getByRole('link', { name: 'Contact' }).click();
  await expect(page).toHaveURL(/\/contact\//);

  await page.locator('footer').getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveURL(/\/privacy\//);

  await nav.getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL(/\/$/);
});

// ── Page-specific content ──────────────────────────────────────────

test('Home presents restrained training-focused copy and CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).not.toHaveText('');
  await expect(page.getByRole('link', { name: 'Discuss Your Training Needs' })).toHaveAttribute('href', '/contact/');
  // Three training services visible
  for (const name of ['Management System Design and Implementation', 'Competency Assessment and Development', 'Leadership Coaching']) {
    await expect(page.getByRole('heading', { name })).toBeVisible();
  }
});

test('About presents Dr. Sundar Subramani as Director, Principal Consultant', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.getByRole('heading', { name: 'Dr. Sundar Subramani' })).toBeVisible();
  await expect(page.getByText('Director, Principal Consultant')).toBeVisible();
});

// ── Metadata and noindex ───────────────────────────────────────────

test('all routes emit noindex and have og:image', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /social-preview/);
  }
});

// ── Responsive viewports ───────────────────────────────────────────

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

for (const vp of VIEWPORTS) {
  test(`all routes render at ${vp.name} viewport (${vp.width}×${vp.height})`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.locator('h1'), `h1 on ${route}`).toBeVisible();
      await expect(page.locator('nav'), `nav on ${route}`).toBeVisible();
      await expect(page.locator('footer'), `footer on ${route}`).toBeVisible();
    }
    await context.close();
  });
}

// ── Semantic landmarks ─────────────────────────────────────────────

test('pages have semantic header, main, footer landmarks', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main#main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  }
});

// ── Keyboard focus ─────────────────────────────────────────────────

test('keyboard Tab reaches skip-link, nav, and main content', async ({ page }) => {
  await page.goto('/');
  // First Tab should reveal skip-link
  await page.keyboard.press('Tab');
  const skipLink = page.locator('.skip-link');
  await expect(skipLink).toBeFocused();

  // Continue tabbing — should reach nav links
  await page.keyboard.press('Tab');
  const brand = page.locator('a.brand');
  await expect(brand).toBeFocused();

  // Tab through nav
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
  }
  // Should now be past nav, reaching main content CTA
  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
});

test('focus-visible outline is visible on interactive elements', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab'); // brand link
  const brand = page.locator('a.brand');
  const outline = await brand.evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.outlineColor;
  });
  // Orange outline: #ef8b3a = rgb(239, 139, 58)
  expect(outline).toContain('rgb(239, 139, 58)');
});

// ── Reduced motion ─────────────────────────────────────────────────

test('reduced motion preference is respected', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  // Verify the prefers-reduced-motion media query is present in the page
  const hasReducedMotionRule = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSMediaRule && rule.conditionText?.includes('prefers-reduced-motion')) {
            return true;
          }
        }
      } catch { /* cross-origin sheets */ }
    }
    return false;
  });
  expect(hasReducedMotionRule).toBe(true);
  await context.close();
});

// ── Image alternatives ─────────────────────────────────────────────

test('informative images have alt text; decorative images are hidden', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      const role = await img.getAttribute('role');
      // Every image must either have alt text or be explicitly decorative
      const isDecorative = alt === '' || ariaHidden === 'true' || role === 'presentation';
      const hasAlt = alt !== null && alt.length > 0;
      expect(hasAlt || isDecorative, `image on ${route} missing alt or decorative marker`).toBe(true);
    }
  }
});

// ── Brand-color contrast ───────────────────────────────────────────

test('brand colors meet WCAG AA contrast minimums', async ({ page }) => {
  await page.goto('/');

  // Test key color combinations used in the design
  const contrastRatios = await page.evaluate(() => {
    function luminance(hex: string): number {
      const rgb = hex.match(/\w\w/g)!.map(x => {
        const c = parseInt(x, 16) / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    }
    function ratio(hex1: string, hex2: string): number {
      const l1 = luminance(hex1);
      const l2 = luminance(hex2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }
    return {
      // Navy text on white background (body text)
      navyOnWhite: ratio('10253f', 'fbfcfc'),
      // Blue text on white (links)
      blueOnWhite: ratio('1d5d87', 'fbfcfc'),
      // Ink on white (body text)
      inkOnWhite: ratio('203044', 'fbfcfc'),
      // White on navy (footer)
      whiteOnNavy: ratio('ffffff', '10253f'),
      // Navy on orange (button text)
      navyOnOrange: ratio('10253f', 'ef8b3a'),
      // Muted on white (secondary text)
      mutedOnWhite: ratio('5b6b7b', 'fbfcfc'),
    };
  });

  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  expect(contrastRatios.navyOnWhite, 'navy on white').toBeGreaterThanOrEqual(4.5);
  expect(contrastRatios.blueOnWhite, 'blue on white').toBeGreaterThanOrEqual(4.5);
  expect(contrastRatios.inkOnWhite, 'ink on white').toBeGreaterThanOrEqual(4.5);
  expect(contrastRatios.whiteOnNavy, 'white on navy').toBeGreaterThanOrEqual(4.5);
  expect(contrastRatios.navyOnOrange, 'navy on orange (large text)').toBeGreaterThanOrEqual(3);
  expect(contrastRatios.mutedOnWhite, 'muted on white').toBeGreaterThanOrEqual(4.5);
});

// ── Decap admin loads ──────────────────────────────────────────────

test('Decap administration route loads', async ({ page }) => {
  const response = await page.goto('/admin/');
  expect(response?.ok()).toBeTruthy();
  // Verify it references Decap CMS
  const html = await page.content();
  expect(html).toContain('decap-cms');
});

test('Decap config does not expose a provider secret', async ({ page }) => {
  const response = await page.goto('/admin/config.yml');
  expect(response?.ok()).toBeTruthy();
  const text = await response!.text();
  expect(text).not.toMatch(/secret|token|password|oauth.*key/i);
  expect(text).toContain('repo: juniorsundar/kmsc-website');
  expect(text).toContain('branch: main');
  expect(text).toMatch(/base_url:\s+https:\/\/[^\s#]+/);
  expect(text).toContain('auth_endpoint: auth');
  expect(text).toMatch(/app_id:\s+[^\s#]+/);
  expect(text).toContain('publish_mode: simple');
  // Verify collections and the editable Training Service contract exist
  expect(text).toContain('page-content');
  expect(text).toContain('servicesPage');
  expect(text).toContain('name: services');
  expect(text).toContain('folder: content/services');
  expect(text).toContain('identifier_field: name');
  expect(text).toContain('name: order');
  expect(text).toContain('name: summary');
  expect(text).toContain('name: description');
  expect(text).toContain('identifier_field: slug');
  expect(text).toContain('name: title');
  expect(text).toContain('name: date');
  expect(text).toContain('name: cover');
  expect(text).toContain('name: coverAlt');
  expect(text).toContain('Optional when no cover is used; required when a cover image is provided.');
  expect(text).toContain('blog');
});

// ── Forbidden names ────────────────────────────────────────────────

test('incorrect business names do not appear as KMSC identity', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    const text = await page.locator('body').textContent();
    for (const forbidden of FORBIDDEN_NAMES) {
      expect(text, `"${forbidden}" found on ${route}`).not.toContain(forbidden);
    }
  }
});

// ── Footer prohibitions ────────────────────────────────────────────

test('footer and pages contain no prohibited content', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    const footerText = await page.locator('footer').textContent() || '';
    // No telephone numbers (patterns like +91, (0), or sequences of 7+ digits)
    expect(footerText).not.toMatch(/\+\d{1,3}\s?\d|\(\d\)|\d{7,}/);
    // No registered address, CIN, GST
    expect(footerText.toLowerCase()).not.toMatch(/\bcin\b|\bgst\b|registered\s+address/);
  }
});

// ── Asset coverage ─────────────────────────────────────────────────

test('favicon and social-preview assets resolve', async ({ page }) => {
  await page.goto('/');
  // SVG favicon
  const svgFavicon = page.locator('link[rel="icon"][type="image/svg+xml"]');
  await expect(svgFavicon).toHaveAttribute('href', '/favicon.svg');
  const svgResponse = await page.goto('/favicon.svg');
  expect(svgResponse?.ok()).toBeTruthy();

  // PNG favicon
  const pngResponse = await page.goto('/favicon-32.png');
  expect(pngResponse?.ok()).toBeTruthy();

  // Apple touch icon
  const appleResponse = await page.goto('/apple-touch-icon.png');
  expect(appleResponse?.ok()).toBeTruthy();

  // Social preview
  const previewResponse = await page.goto('/media/social-preview.png');
  expect(previewResponse?.ok()).toBeTruthy();
});
