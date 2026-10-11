// Toast notifications (XP, badges, rank ups).
import { esc } from './dom.js';

let host = null;

function ensureHost() {
  if (!host) {
    host = document.createElement('div');
    host.className = 'toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  return host;
}

/**
 * @param {string} text
 * @param {{icon?:string, color?:'yellow'|'blue'|'green'|'red', ms?:number}} opts
 */
export function toast(text, { icon = '🧱', color = 'yellow', ms = 3200 } = {}) {
  const el = document.createElement('div');
  el.className = `toast toast-${color}`;
  el.innerHTML = `<span class="toast-icon" aria-hidden="true">${esc(icon)}</span><span>${esc(text)}</span>`;
  ensureHost().appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, ms);
}
