// PROTOTYPE (ticket manuscript-import/01): throwaway. Do not merge to main.
import { test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const config = async () => (await readFile('public/admin/config.yml', 'utf8'))
  .replace(/backend:[\s\S]*?\nmedia_folder/, 'backend:\n  name: test-repo\nmedia_folder')
  // route the blog text fields through the wrapper widgets under test
  .replace(/(- \{ name: (?:title|slug), label: [^,]+, widget: )string/g, '$1unesc_string')
  .replace(/(name: summary, label: Summary, widget: )text(, hint: "A concise description)/, '$1unesc_text$2')
  .replace(/(- \{ name: body, label: [^,]+, widget: )markdown/, '$1unesc_markdown');

const wrappers = () => {
  const w = window as any;
  const unesc = (s: any) => typeof s === 'string' ? s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : s;
  for (const kind of ['string', 'text', 'markdown']) {
    const inner = w.CMS.getWidget(kind);
    const Control = w.createClass({
      componentDidMount() { const v = this.props.value; if (typeof v === 'string' && v !== unesc(v)) this.props.onChange(unesc(v)); },
      render() { return w.h(inner.control, { ...this.props, value: unesc(this.props.value) }); }
    });
    w.CMS.registerWidget('unesc_' + kind, Control, inner.preview);
  }
  // normalisation only: Decap stores a pre-filled list as one string
  w.CMS.registerEventListener({ name: 'preSave', handler: ({ entry }: any) => {
    const t = entry.get('data').get('tags');
    return typeof t === 'string' ? entry.get('data').set('tags', t.split(',').map((x: string) => x.trim()).filter(Boolean)) : undefined;
  }});
};

const longBody = Array.from({ length: 300 }, (_, i) =>
  `## Section ${i}\n\nParagraph with **bold**, a [link](https://example.com/?a=1&b=2), "quotes" & <angle> brackets.\n\n- item one\n- item two\n`).join('\n');

test('SPIKE url prefill + wrappers', async ({ page }) => {
  const yml = await config();
  await page.route('**/admin/config.yml', route => route.fulfill({ contentType: 'text/yaml', body: yml }));
  await page.goto('/admin/');
  await page.evaluate(`(${wrappers.toString()})()`);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL(/#\//);
  const title = `Tom & Jerry's <Big> "Plan"`, summary = `Fish & chips <b>x</b> "q" 'r'`;
  const params = new URLSearchParams({ title, summary, body: longBody, tags: 'leadership,management-system', date: '2026-10-07', slug: 'tom-and-jerrys-plan', author: 'Dr. Sundar Subramani', noindex: 'false' });
  await page.goto('/admin/#/collections/blog/new?' + params.toString());
  await page.waitForTimeout(3000);
  console.log('UI title:', await page.locator('#title-field-1').inputValue());
  console.log('UI summary:', await page.locator('#summary-field-3').inputValue());
  const editor = await page.locator('[data-slate-editor]').first().innerText();
  console.log('UI body head:', JSON.stringify(editor.slice(0, 120)));
  await page.getByRole('button', { name: /^publish/i }).click();
  await page.getByText(/publish now/i).click();
  await page.waitForTimeout(2500);
  const saved = await page.evaluate(() => JSON.stringify((window as any).repoFiles));
  const c = JSON.parse(Object.values(JSON.parse(saved).content.blog)[0]!.content ?? Object.values(JSON.parse(saved).content.blog)[0].content);
  console.log('SAVED title ok:', c.title === title, JSON.stringify(c.title));
  console.log('SAVED summary ok:', c.summary === summary);
  console.log('SAVED tags:', JSON.stringify(c.tags), 'noindex:', typeof c.noindex, c.noindex);
  console.log('SAVED body len', c.body.length, 'ok:', c.body.trim() === longBody.trim());
  if (c.body.trim() !== longBody.trim()) { let i = 0; while (c.body[i] === longBody[i]) i++; console.log('diff at', i, JSON.stringify(c.body.slice(i - 20, i + 60)), 'VS', JSON.stringify(longBody.slice(i - 20, i + 60))); }
});
