// Output console + test result rendering (shared by exercise and playground).
import { normalizeOutput } from '../engine/judge.js';
import { esc } from './dom.js';

const ERROR_TITLES = {
  compile: ['🧱', "Those bricks don't fit!", 'Build error'],
  runtime: ['💥', 'Crash! The program fell apart while running', 'Runtime error'],
  timeout: ['⏰', 'Too slow!', 'Timeout'],
};

export function errorBoxHtml(err) {
  const [icon, title, kindLabel] = ERROR_TITLES[err.kind] || ['⚠️', 'Something went wrong', 'Error'];
  const where = err.line
    ? `<button type="button" class="err-line" data-line="${err.line}" data-col="${err.col || 1}" title="Jump to line ${err.line}">📍 Line ${err.line}${err.col ? `, col ${err.col}` : ''}</button>`
    : '';
  return `<div class="error-box" role="alert">
    <div class="err-head"><span class="err-icon" aria-hidden="true">${icon}</span><span><b>${esc(title)}</b><span class="err-kind">${kindLabel}</span></span>${where}</div>
    <p class="err-msg">${esc(err.message || '')}</p>
    ${err.hint ? `<p class="err-hint">💡 ${esc(err.hint)}</p>` : ''}
  </div>`;
}

/**
 * @param {HTMLElement} host
 * @param {null|{running?:boolean,label?:string,result?:{stdout:string,error:any,timeMs?:number},stdin?:string,onErrorLine?:Function,title?:string}} st
 */
export function renderConsole(host, st) {
  if (!st) {
    host.innerHTML = `<div class="console idle"><div class="console-head"><span>📟 Output</span></div>
      <pre class="console-out muted">Press ▶ Run to build and run your program.</pre></div>`;
    return;
  }
  if (st.running) {
    host.innerHTML = `<div class="console"><div class="console-head"><span>📟 Output</span></div>
      <div class="console-out building"><span class="snap-loader" aria-hidden="true"><i></i><i></i><i></i></span> ${esc(st.label || 'Building your program…')}</div></div>`;
    return;
  }
  const { result } = st;
  const out = result.stdout || '';
  host.innerHTML = `<div class="console">
      <div class="console-head"><span>📟 ${esc(st.title || 'Output')}</span>
        ${result.timeMs != null ? `<span class="console-time">${Math.round(result.timeMs)} ms</span>` : ''}</div>
      ${st.stdin ? `<div class="console-stdin"><span class="label">input</span><pre>${esc(st.stdin)}</pre></div>` : ''}
      ${out || !result.error ? `<pre class="console-out${out ? '' : ' muted'}">${out ? esc(out) : '(no output)'}</pre>` : '<div class="console-gap"></div>'}
      ${result.error ? errorBoxHtml(result.error) : ''}
      ${(result.warnings || []).map((w) => `<p class="warn-box">⚠️ ${w.line ? `<b>Line ${w.line}:</b> ` : ''}${esc(w.message)}</p>`).join('')}
    </div>`;
  const btn = host.querySelector('.err-line');
  if (btn && st.onErrorLine) btn.addEventListener('click', () => st.onErrorLine(+btn.dataset.line, +btn.dataset.col));
}

function diffHtml(expected, actual) {
  const e = normalizeOutput(expected).split('\n');
  const aNorm = normalizeOutput(actual || '');
  const a = aNorm === '' ? [] : aNorm.split('\n');
  const n = Math.max(e.length, a.length);
  let left = '', right = '';
  for (let i = 0; i < n; i++) {
    const same = e[i] === a[i];
    const show = (s) => (s === undefined ? '' : s === '' ? ' ' : esc(s));
    left += `<span class="dl${same ? '' : ' bad'}">${show(e[i])}</span>`;
    right += `<span class="dl${same ? '' : ' bad'}">${a[i] === undefined ? `<i class="missing">${a.length ? 'missing line' : 'nothing printed'}</i>` : show(a[i])}</span>`;
  }
  return `<div class="diff">
    <div><span class="label">expected</span><pre>${left}</pre></div>
    <div><span class="label">your output</span><pre>${right}</pre></div>
  </div>`;
}

/** Render judge() verdict. */
export function renderResults(host, verdict, ex) {
  const tests = ex.tests || [];
  const passedN = verdict.results.filter((r) => r.passed).length;
  let html = `<div class="results">
    <h3 class="results-title ${verdict.passed ? 'ok' : 'bad'}">${verdict.passed ? '🎉 All tests passed!' : `🔍 ${passedN} of ${tests.length} tests passed`}</h3>`;
  if (verdict.ruleFailures && verdict.ruleFailures.length) {
    html += `<ul class="rules">${verdict.ruleFailures.map((m) => `<li>📏 ${esc(m)}</li>`).join('')}</ul>`;
  }
  html += '<ol class="tests">';
  tests.forEach((t, i) => {
    const r = verdict.results[i];
    const status = !r ? 'skip' : r.passed ? 'pass' : 'fail';
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏸️';
    if (t.hidden) {
      html += `<li class="test ${status}"><div class="test-head">${icon} <b>Secret test ${i + 1}</b>
        <span class="muted small">${status === 'skip' ? 'not run' : status === 'pass' ? 'passed' : "didn't match (it's a secret!)"}</span></div></li>`;
      return;
    }
    html += `<li class="test ${status}"><details ${status === 'fail' ? 'open' : ''}>
      <summary class="test-head">${icon} <b>Test ${i + 1}</b> <span class="muted small">${status === 'skip' ? 'not run (fix the error above first)' : status}</span></summary>
      ${t.stdin ? `<div class="test-in"><span class="label">input</span><pre>${esc(t.stdin)}</pre></div>` : ''}
      ${r && !r.error ? diffHtml(t.expected, r.actual) : r && r.error ? `<p class="small">Stopped by an error: ${esc(r.error.message)}</p>` : `<div class="test-in"><span class="label">expected</span><pre>${esc(t.expected)}</pre></div>`}
    </details></li>`;
  });
  html += '</ol></div>';
  host.innerHTML = html;
}
