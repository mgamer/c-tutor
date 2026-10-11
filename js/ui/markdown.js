// Tiny, safe mini-markdown renderer: paragraphs, `code`, **bold**,
// ```cpp fenced blocks``` and "- " bullet lists. Everything is HTML-escaped first.
import { escapeHtml, highlightCpp } from '../editor.js';

function inline(text) {
  // Split out inline code first so ** inside code is left alone.
  return text.split(/(`[^`\n]+`)/g).map((part) => {
    if (part.length > 1 && part.startsWith('`') && part.endsWith('`')) {
      return `<code class="ic">${escapeHtml(part.slice(1, -1))}</code>`;
    }
    return escapeHtml(part).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }).join('');
}

export function renderMarkdown(src) {
  const lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null;
  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`);
    list = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^\s*```\s*([\w+]*)\s*$/);
    if (fence) {
      flushPara(); flushList();
      const lang = fence[1];
      const body = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) body.push(lines[i++]);
      const code = body.join('\n');
      const html = /^(cpp|c\+\+|c)$/i.test(lang) ? highlightCpp(code) : escapeHtml(code);
      out.push(`<pre class="code-block"><code>${html}</code></pre>`);
      continue;
    }
    if (/^\s*$/.test(line)) { flushPara(); flushList(); continue; }
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) {
      flushPara();
      (list = list || []).push(li[1]);
      continue;
    }
    if (list && /^\s{2,}\S/.test(line)) { list[list.length - 1] += ' ' + line.trim(); continue; }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();
  return out.join('\n');
}

export { inline as renderInline };
