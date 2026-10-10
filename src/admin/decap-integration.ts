import { importManuscript } from './manuscript-importer';

// Decap exposes React helpers on window; there is no public typing for them.
const w = window as any;

// What the last import pre-filled, as the raw text we sent. Decap HTML-escapes
// pre-filled URL values (ticket 01), so the wrappers below undo that for exactly
// these values and for nothing the Editor typed or an existing Blog Post holds.
// Kept in sessionStorage so a page reload of the pre-filled form still unescapes.
const key = 'kmsc-manuscript-import';
const read = (): Record<string, string> => { try { return JSON.parse(sessionStorage.getItem(key) ?? '{}'); } catch { return {}; } };
const decapEscape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

for (const [name, kind] of [['unescaped_string', 'string'], ['unescaped_markdown', 'markdown']] as const) {
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

w.CMS.registerWidget('manuscript_import', w.createClass({
  getInitialState() { return { problem: '' }; },
  async onPick(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const result = await importManuscript(await file.arrayBuffer());
    if (!result.ok) return this.setState({ problem: result.reason });
    this.setState({ problem: '' });
    const sent = { title: result.fields.title, body: result.fields.body };
    sessionStorage.setItem(key, JSON.stringify(sent));
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
      this.state.problem && w.h('p', { role: 'alert', style: { color: '#b00020' } }, this.state.problem));
  }
}), () => null);
