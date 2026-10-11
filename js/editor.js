// A tiny dependency-free code editor: a transparent <textarea> on top of a
// syntax-highlighted <pre>. Both layers share exactly the same font metrics,
// padding and `white-space: pre`, so the caret lines up with the colours.

const KEYWORDS = new Set(('if else for while do switch case default break continue return new delete class struct ' +
  'public private protected using namespace const static void true false nullptr this template typename sizeof ' +
  'try catch throw auto enum virtual override operator friend inline constexpr goto and or not').split(' '));
const TYPES = new Set(('int long short double float char bool unsigned signed string size_t vector map set pair ' +
  'array deque queue stack list unordered_map unordered_set').split(' '));
const BUILTINS = new Set('std cout cin endl cerr getline main printf scanf max min swap sort abs sqrt pow to_string push_back size'.split(' '));

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

const TOKEN_RE = new RegExp([
  /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))/.source,                  // 1 comment
  /(^[ \t]*#[^\n]*)/.source,                                     // 2 preprocessor
  /("(?:[^"\\\n]|\\.)*"?)/.source,                               // 3 string
  /('(?:[^'\\\n]|\\.)*'?)/.source,                               // 4 char
  /(\b(?:0[xX][0-9a-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?[fFlLuU]*)\b)/.source, // 5 number
  /([A-Za-z_]\w*)/.source,                                       // 6 identifier
].join('|'), 'gm');

/** Highlight C++ source into HTML (escaped). */
export function highlightCpp(src) {
  let out = '';
  let last = 0;
  TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = TOKEN_RE.exec(src))) {
    if (m[0] === '') { TOKEN_RE.lastIndex++; continue; }
    out += escapeHtml(src.slice(last, m.index));
    const t = m[0];
    let cls = null;
    if (m[1]) cls = 'c';
    else if (m[2]) {
      // Highlight an <include> target separately.
      out += t.replace(/^([ \t]*#\s*\w+)(.*)$/, (_, a, b) => `<span class="tk-p">${escapeHtml(a)}</span><span class="tk-s">${escapeHtml(b)}</span>`);
      last = m.index + t.length;
      continue;
    } else if (m[3]) cls = 's';
    else if (m[4]) cls = 'ch';
    else if (m[5]) cls = 'n';
    else if (m[6]) cls = KEYWORDS.has(t) ? 'k' : TYPES.has(t) ? 't' : BUILTINS.has(t) ? 'b' : null;
    out += cls ? `<span class="tk-${cls}">${escapeHtml(t)}</span>` : escapeHtml(t);
    last = m.index + t.length;
  }
  return out + escapeHtml(src.slice(last));
}

const INDENT = '    ';

const SYMBOLS = [
  ['Tab', INDENT], ['{', '{'], ['}', '}'], ['(', '('], [')', ')'], [';', ';'], ['<<', ' << '], ['>>', ' >> '],
  ['"', '"'], ['=', '='], ['<', '<'], ['>', '>'], ['+', '+'], ['-', '-'], ['*', '*'], ['/', '/'], ['[', '['], [']', ']'],
  ['&', '&'], ['|', '|'], ['!', '!'], ['cout', 'cout << '], ['cin', 'cin >> '], ['endl', 'endl'], ["'", "'"], ['%', '%'],
];

/**
 * Create an editor inside `host`.
 * @param {HTMLElement} host
 * @param {{value?:string, onRun?:()=>void, label?:string, symbols?:boolean}} opts
 */
export function createEditor(host, opts = {}) {
  host.classList.add('ed');
  const helpId = 'ed-help-' + Math.random().toString(36).slice(2, 8);
  host.innerHTML = `
    ${opts.symbols === false ? '' : `<div class="ed-symbols" role="toolbar" aria-label="Insert symbol">${SYMBOLS.map(([label, ins], i) =>
      `<button type="button" class="ed-sym" data-i="${i}" tabindex="-1" aria-label="Insert ${escapeHtml(label)}">${escapeHtml(label)}</button>`).join('')}</div>`}
    <div class="ed-body">
      <div class="ed-gutter" aria-hidden="true"><div class="ed-gutter-inner"></div></div>
      <div class="ed-main">
        <div class="ed-layer" aria-hidden="true"><div class="ed-errline" hidden></div><pre class="ed-hl"><code></code></pre></div>
        <textarea class="ed-input" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"
          wrap="off" aria-label="${escapeHtml(opts.label || 'C++ code editor')}" aria-describedby="${helpId}"></textarea>
        <p class="sr-only" id="${helpId}">Tab indents. Press Escape then Tab to leave the editor. Ctrl+Enter runs the program.</p>
      </div>
    </div>`;
  const ta = host.querySelector('.ed-input');
  const code = host.querySelector('.ed-hl code');
  const layer = host.querySelector('.ed-layer');
  const gutter = host.querySelector('.ed-gutter-inner');
  const errLine = host.querySelector('.ed-errline');
  const changeCbs = [];
  let lineCount = 0;
  let errorAt = 0;
  let escaped = false; // after Esc, Tab leaves the editor (keyboard a11y)

  function render() {
    const v = ta.value;
    // A trailing newline needs a visible character so the <pre> grows like the textarea.
    code.innerHTML = highlightCpp(v) + (v.endsWith('\n') || v === '' ? ' ' : '');
    const n = v.split('\n').length;
    if (n !== lineCount) {
      lineCount = n;
      let g = '';
      for (let i = 1; i <= n; i++) g += `<div class="ed-ln" data-ln="${i}">${i}</div>`;
      gutter.innerHTML = g;
      markGutter();
    }
    sync();
  }

  function sync() {
    const x = ta.scrollLeft, y = ta.scrollTop;
    layer.style.transform = `translate(${-x}px, ${-y}px)`;
    gutter.style.transform = `translateY(${-y}px)`;
  }

  function lineHeight() {
    return parseFloat(getComputedStyle(ta).lineHeight) || 24;
  }
  function padTop() {
    return parseFloat(getComputedStyle(ta).paddingTop) || 0;
  }

  function markGutter() {
    gutter.querySelectorAll('.ed-ln.err').forEach((el) => el.classList.remove('err'));
    if (errorAt) {
      const el = gutter.querySelector(`[data-ln="${errorAt}"]`);
      if (el) el.classList.add('err');
    }
  }

  function changed() {
    if (errorAt) markError(0);
    render();
    for (const cb of changeCbs) cb(ta.value);
  }

  /** Replace [start,end) with text, keeping native undo where possible. */
  function replaceRange(start, end, text, selStart, selEnd) {
    ta.focus();
    ta.setSelectionRange(start, end);
    let ok = false;
    try { ok = document.execCommand('insertText', false, text); } catch (e) { ok = false; }
    if (!ok || ta.value.slice(start, start + text.length) !== text) {
      ta.setRangeText(text, start, end, 'end');
      changed();
    }
    const s = selStart ?? start + text.length;
    ta.setSelectionRange(s, selEnd ?? s);
  }

  function lineStartOf(pos) { return ta.value.lastIndexOf('\n', pos - 1) + 1; }

  function indentLines(outdent) {
    const v = ta.value;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const ls = lineStartOf(s);
    const le = e > s && v[e - 1] === '\n' ? e - 1 : e;
    const block = v.slice(ls, le);
    const lines = block.split('\n');
    let firstDelta = 0, total = 0;
    const out = lines.map((l, i) => {
      if (outdent) {
        const rm = (l.match(/^ {1,4}|^\t/) || [''])[0].length;
        if (i === 0) firstDelta = -rm;
        total -= rm;
        return l.slice(rm);
      }
      if (i === 0) firstDelta = INDENT.length;
      total += INDENT.length;
      return INDENT + l;
    }).join('\n');
    if (out === block) return;
    replaceRange(ls, le, out, Math.max(ls, s + firstDelta), Math.max(ls, e + total));
  }

  ta.addEventListener('input', changed);
  ta.addEventListener('scroll', sync);

  ta.addEventListener('keydown', (ev) => {
    const v = ta.value;
    const s = ta.selectionStart, e = ta.selectionEnd;
    if (ev.key === 'Escape') { escaped = true; return; }
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault();
      if (!ev.shiftKey && opts.onRun) opts.onRun();
      return;
    }
    if (ev.key === 'Tab' && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
      if (escaped) { escaped = false; return; }
      ev.preventDefault();
      if (ev.shiftKey) indentLines(true);
      else if (v.slice(s, e).includes('\n')) indentLines(false);
      else replaceRange(s, e, INDENT);
      return;
    }
    escaped = false;
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.altKey && !ev.isComposing) {
      ev.preventDefault();
      const ls = lineStartOf(s);
      const line = v.slice(ls, s);
      const indent = (line.match(/^[ \t]*/) || [''])[0];
      const before = line.trimEnd();
      const after = v.slice(e, v.indexOf('\n', e) === -1 ? v.length : v.indexOf('\n', e));
      if (before.endsWith('{')) {
        if (after.trimStart().startsWith('}')) {
          // Put the closing brace on its own line, caret on the indented line between.
          const inner = '\n' + indent + INDENT;
          replaceRange(s, e, inner + '\n' + indent, s + inner.length);
        } else {
          replaceRange(s, e, '\n' + indent + INDENT);
        }
      } else {
        replaceRange(s, e, '\n' + indent);
      }
      return;
    }
    if (ev.key === '}' && s === e) {
      const ls = lineStartOf(s);
      const line = v.slice(ls, s);
      if (line.length > 0 && /^[ \t]+$/.test(line)) {
        ev.preventDefault();
        const rm = line.endsWith(INDENT) ? INDENT.length : line.endsWith('\t') ? 1 : line.length;
        replaceRange(s - rm, s, '}');
      }
    }
  });

  // Mobile symbol bar: pointerdown + preventDefault keeps the on-screen keyboard open.
  const sym = host.querySelector('.ed-symbols');
  if (sym) {
    sym.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.ed-sym')) ev.preventDefault();
    });
    sym.addEventListener('click', (ev) => {
      const b = ev.target.closest('.ed-sym');
      if (!b) return;
      const ins = SYMBOLS[+b.dataset.i][1];
      if (ins === '}') {
        const s = ta.selectionStart;
        const line = ta.value.slice(lineStartOf(s), s);
        if (/^[ \t]+$/.test(line)) {
          const rm = line.endsWith(INDENT) ? INDENT.length : line.length;
          replaceRange(s - rm, ta.selectionEnd, '}');
          return;
        }
      }
      replaceRange(ta.selectionStart, ta.selectionEnd, ins);
    });
  }

  // Clicking the gutter moves the caret to that line.
  host.querySelector('.ed-gutter').addEventListener('click', (ev) => {
    const ln = ev.target.closest('.ed-ln');
    if (ln) goToLine(+ln.dataset.ln);
  });

  function setValue(v) {
    ta.value = String(v ?? '').replace(/\r\n/g, '\n').replace(/\t/g, INDENT);
    markError(0);
    render();
  }

  function goToLine(n, col = 1) {
    const lines = ta.value.split('\n');
    n = Math.max(1, Math.min(lines.length, n | 0));
    let pos = 0;
    for (let i = 0; i < n - 1; i++) pos += lines[i].length + 1;
    const indent = (lines[n - 1].match(/^\s*/) || [''])[0].length;
    pos += Math.min(lines[n - 1].length, Math.max(indent, col - 1));
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(pos, pos);
    const lh = lineHeight();
    const target = padTop() + (n - 1) * lh;
    if (target < ta.scrollTop || target + lh > ta.scrollTop + ta.clientHeight) {
      ta.scrollTop = Math.max(0, target - ta.clientHeight / 3);
    }
    sync();
    host.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function markError(line) {
    errorAt = line > 0 ? line : 0;
    if (errorAt) {
      errLine.hidden = false;
      errLine.style.top = `${padTop() + (errorAt - 1) * lineHeight()}px`;
      errLine.style.height = `${lineHeight()}px`;
    } else {
      errLine.hidden = true;
    }
    markGutter();
  }

  setValue(opts.value || '');

  return {
    el: host,
    textarea: ta,
    getValue: () => ta.value,
    setValue,
    onChange: (cb) => changeCbs.push(cb),
    focus: () => ta.focus(),
    goToLine,
    markError,
    clearError: () => markError(0),
    refresh: render,
  };
}
