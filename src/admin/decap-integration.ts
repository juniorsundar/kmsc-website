import { importManuscript } from './manuscript-importer';

// Decap exposes React helpers on window; there is no public typing for them.
const w = window as any;

// What the last import pre-filled, as the raw text we sent. Decap HTML-escapes
// pre-filled URL values (ticket 01), so the wrappers below undo that for exactly
// these values and for nothing the Editor typed or an existing Blog Post holds.
// Kept in sessionStorage so a page reload of the pre-filled form still unescapes.
const key = 'kmsc-manuscript-import';
const warningsKey = 'kmsc-manuscript-import-warnings';
const readWarnings = (): string[] => { try { return JSON.parse(sessionStorage.getItem(warningsKey) ?? '[]'); } catch { return []; } };
const read = (): Record<string, string> => { try { return JSON.parse(sessionStorage.getItem(key) ?? '{}'); } catch { return {}; } };
const decapEscape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

// Text the Editor can read and edit: undo Decap's escaping of the importer's values.
for (const [name, kind] of [['unescaped_string', 'string'], ['unescaped_text', 'text'], ['unescaped_markdown', 'markdown']] as const) {
  const inner = w.CMS.getWidget(kind);
  const Control = w.createClass({
    componentDidMount() {
      const raw = read()[this.props.field.get('name')];
      if (this.props.entry.get('newRecord') && raw !== undefined && this.props.value === decapEscape(raw)) this.props.onChange(raw);
    },
    // The markdown editor reads `value` only when it mounts, so show the unescaped text from the first render.
    render() {
      const raw = this.props.entry.get('newRecord') ? read()[this.props.field.get('name')] : undefined;
      return w.h(inner.control, { ...this.props, value: raw !== undefined && this.props.value === decapEscape(raw) ? raw : this.props.value });
    }
  });
  w.CMS.registerWidget(name, Control, inner.preview);
}

// Decap stores a pre-filled list as one comma-separated string (ticket 01); turn it into the list the schema expects.
{
  const inner = w.CMS.getWidget('list');
  w.CMS.registerWidget('prefilled_list', w.createClass({
    componentDidMount() {
      const raw = read().tags;
      if (this.props.entry.get('newRecord') && typeof this.props.value === 'string' && raw !== undefined && this.props.value === raw) {
        this.props.onChange(raw.split(',').filter(Boolean));
      }
    },
    render() { return w.h(inner.control, this.props); }
  }), inner.preview);
}

// Slugs of the Blog Posts on the deployed site, read from its public Blog index.
async function existingSlugs() {
  try {
    const html = await (await fetch('/blog/', { cache: 'no-store' })).text();
    return [...html.matchAll(/href="\/blog\/([a-z0-9-]+)\/"/g)].map(match => match[1]);
  } catch {
    return []; // the build's duplicate-slug validation still catches a clash
  }
}

const localDate = () => {
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((part, i) => String(part).padStart(i ? 2 : 4, '0')).join('-');
};

w.CMS.registerWidget('manuscript_import', w.createClass({
  getInitialState() { return { problem: '', warnings: readWarnings() }; },
  async onPick(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    sessionStorage.removeItem(warningsKey);
    this.setState({ problem: '', warnings: [] });
    const result = await importManuscript(await file.arrayBuffer(), { existingSlugs: await existingSlugs(), today: localDate() });
    if (!result.ok) return this.setState({ problem: result.reason });
    const { tags, noindex, ...text } = result.fields;
    const sent = { ...text, tags: tags.join(','), noindex: String(noindex) };
    sessionStorage.setItem(key, JSON.stringify(sent));
    sessionStorage.setItem(warningsKey, JSON.stringify(result.warnings));
    const target = '#/collections/blog/new?' + new URLSearchParams(sent);
    // Decap only builds a fresh draft when the form is mounted anew, so leave the form, wait until it is gone, then re-enter.
    location.hash = '#/collections/blog';
    const leftAt = Date.now();
    const reenter = () => {
      if (document.querySelector('[id^="title-field"]') && Date.now() - leftAt < 3000) return requestAnimationFrame(reenter);
      location.hash = target;
    };
    requestAnimationFrame(reenter);
  },
  render() {
    if (!this.props.entry.get('newRecord')) return w.h('p', { id: this.props.forID }, 'Start from Word document is available when creating a new Blog Post.');
    return w.h('div', { id: this.props.forID },
      w.h('input', { type: 'file', accept: '.docx', onChange: (event: Event) => this.onPick(event) }),
      w.h('p', null, w.h('a', { href: '/admin/manuscript-template.docx', download: '' }, 'Download the Manuscript Template')),
      this.state.problem && w.h('p', { role: 'alert', style: { color: '#b00020' } }, this.state.problem),
      // The control is mounted anew with the pre-filled form, so warnings are kept in sessionStorage; a blank form shows none.
      location.hash.includes('?') && this.state.warnings.map((warning: string) => w.h('p', { key: warning, role: 'status' }, warning)));
  }
}), () => null);
