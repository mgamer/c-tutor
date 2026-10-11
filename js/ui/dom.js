// Small DOM helpers shared by the views.
export { escapeHtml as esc } from '../editor.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function isMobile() {
  return window.matchMedia('(max-width: 899px)').matches;
}

/** Render n stars (filled up to `filled`) as HTML. */
export function starsHtml(filled, n = 3, cls = '') {
  let s = `<span class="stars ${cls}" aria-label="${filled} of ${n} stars">`;
  for (let i = 0; i < n; i++) s += `<span class="star${i < filled ? ' on' : ''}" aria-hidden="true">★</span>`;
  return s + '</span>';
}

/** A simple promise-based confirm dialog styled as a brick card. */
export function confirmDialog({ title, body, ok = 'OK', cancel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal brick-card" role="dialog" aria-modal="true" aria-labelledby="cd-title">
        <h2 id="cd-title">${title}</h2>
        <div class="modal-body">${body}</div>
        <div class="modal-actions">
          ${cancel ? `<button type="button" class="btn btn-white" data-v="0">${cancel}</button>` : ''}
          <button type="button" class="btn ${danger ? 'btn-red' : 'btn-green'}" data-v="1">${ok}</button>
        </div>
      </div>`;
    const prevFocus = document.activeElement;
    const close = (v) => {
      wrap.remove();
      document.removeEventListener('keydown', onKey);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      resolve(v);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]');
      if (b) close(b.dataset.v === '1');
      else if (e.target === wrap) close(false);
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(wrap);
    wrap.querySelector('[data-v="1"]').focus();
  });
}

/** Pick dark or white text for a given background hex colour (WCAG-ish luminance). */
export function fgFor(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return '#fff';
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  // Contrast vs white = 1.05/(L+.05); vs dark (#1b2a34, L≈.022) = (L+.05)/.072
  return 1.05 / (L + 0.05) >= (L + 0.05) / 0.072 ? '#fff' : '#1b2a34';
}

/** style="" fragment for a coloured brick. */
export function brickStyle(color, fallback = '#d01012') {
  const c = color || fallback;
  return `--c:${escapeAttr(c)};--fg:${fgFor(c)}`;
}
function escapeAttr(s) { return String(s).replace(/[^#\w(),.% -]/g, ''); }
