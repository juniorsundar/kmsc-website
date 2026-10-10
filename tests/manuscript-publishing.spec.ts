import { test, expect } from '@playwright/test';
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { importManuscript } from '../src/admin/manuscript-importer';

// An imported Manuscript is saved exactly as Decap would save it, then validated and built like any Blog Post.
test('a Blog Post imported from the formatting Manuscript passes validation and renders as written', async ({ page }) => {
  const file = await readFile('tests/fixtures/manuscripts/formatting.docx');
  const imported = await importManuscript(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer, { existingSlugs: [], today: '2026-10-07' });
  if (!imported.ok) throw new Error(imported.reason);

  const root = await mkdtemp(join(tmpdir(), 'kmsc-manuscript-build-'));
  try {
    for (const directory of ['content', 'public', 'scripts', 'src']) await cp(directory, join(root, directory), { recursive: true });
    for (const name of ['astro.config.mjs', 'package.json', 'package-lock.json', 'tsconfig.json']) await cp(name, join(root, name));
    await symlink(join(process.cwd(), 'node_modules'), join(root, 'node_modules'), 'dir');
    await writeFile(join(root, 'content/blog/imported-formatting.json'), JSON.stringify(imported.fields));

    for (const command of [['run', 'validate'], ['run', 'build']]) {
      const result = spawnSync('npm', command, { cwd: root, encoding: 'utf8' });
      if (result.status !== 0) throw new Error(`npm ${command.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
    }

    const html = await readFile(join(root, 'dist/blog', imported.fields.slug, 'index.html'), 'utf8');
    await page.setContent(html.match(/<article[\s\S]*<\/article>/)![0]);
    const article = page.locator('article.prose');
    await expect(article.locator('h1')).toHaveText('Formatting fixture');
    await expect(article.locator('h2', { hasText: 'A section' })).toHaveCount(1);
    await expect(article.locator('strong', { hasText: 'bold' })).toHaveCount(1);
    await expect(article.locator('em')).toHaveText(['italic', 'emphasis']); // the text, then the end note
    await expect(article.locator('a[href="https://kautilyamsc.com/about/"]')).toHaveText('link to KMSC');
    await expect(article.locator('ul > li > ul > li > ul > li')).toHaveText('deeper bullet');
    await expect(article.locator('ol > li > ol > li')).toHaveText('nested step');
    await expect(article.locator('table th')).toHaveText(['Stage', 'Owner']);
    await expect(article.locator('table tbody tr')).toHaveCount(2);
    await expect(article.locator('del, s')).toHaveText('struck out');
    await expect(article.locator('script, img')).toHaveCount(0);
    await expect(article).toContainText('<script>alert(1)</script>'); // shown as text, not run
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
