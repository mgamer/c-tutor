// The exercise screen: story, concept, task, hints, editor, run/check, results.
import { runProgram } from '../engine/runner.js';
import { judge } from '../engine/judge.js';
import * as game from '../game.js';
import { findExercise, isExerciseUnlocked, exerciseAfter, starsFor, worlds } from '../curriculum.js';
import { createEditor } from '../editor.js';
import { renderMarkdown } from './markdown.js';
import { esc, starsHtml, confirmDialog, isMobile } from './dom.js';
import { renderConsole, renderResults } from './console.js';
import { celebrate } from './celebrate.js';
import { toast } from './toast.js';

export function renderExercise(root, id) {
  const f = findExercise(id);
  if (!f) {
    root.innerHTML = `<section class="brick-card empty"><h1>Exercise not found</h1><p><a class="btn btn-blue" href="#/home">Back to map</a></p></section>`;
    return;
  }
  const { world, ex, index } = f;
  if (!isExerciseUnlocked(id)) {
    root.innerHTML = `<section class="brick-card empty"><h1>🔒 Locked brick</h1><p>Solve the exercises before this one first.</p>
      <p><a class="btn btn-blue" href="#/world/${esc(world.id)}">Back to ${esc(world.title)}</a></p></section>`;
    return;
  }
  const color = world.color || '#d01012';
  const firstStdin = ((ex.tests || []).find((t) => !t.hidden && t.stdin) || {}).stdin || '';
  const solvedBefore = starsFor(id) > 0;

  root.innerHTML = `
    <div class="ex-page tab-task" style="--wc:${esc(color)}">
      <nav class="crumbs ex-crumbs" aria-label="Breadcrumb">
        <a href="#/world/${esc(world.id)}">← ${esc(world.icon || '')} ${esc(world.title)}</a>
        <span class="crumb-pos">Brick ${index + 1} of ${world.exercises.length}</span>
        <span class="crumb-stars">${starsHtml(starsFor(id))}</span>
      </nav>
      <div class="ex-tabs" role="tablist" aria-label="Exercise sections">
        <button type="button" role="tab" id="tab-task" aria-controls="pane-task" aria-selected="true" data-tab="task">📜 Task</button>
        <button type="button" role="tab" id="tab-code" aria-controls="pane-code" aria-selected="false" data-tab="code">⌨️ Code</button>
        <button type="button" role="tab" id="tab-output" aria-controls="pane-output" aria-selected="false" data-tab="output">📟 Output<span class="tab-dot" hidden></span></button>
      </div>
      <div class="ex-cols">
        <section class="pane pane-task" id="pane-task" role="tabpanel" aria-labelledby="tab-task">
          <h1 class="ex-h1">${esc(ex.title)}</h1>
          ${ex.story ? `<div class="story"><div class="story-bubble prose">${renderMarkdown(ex.story)}</div></div>` : ''}
          ${ex.concept ? `<details class="concept brick-card card-blue-soft" ${solvedBefore ? '' : 'open'}>
            <summary><span>🧠 Learn</span><span class="chev" aria-hidden="true">▾</span></summary>
            <div class="prose">${renderMarkdown(ex.concept)}</div>
          </details>` : ''}
          <section class="task brick-card card-yellow-soft" aria-labelledby="task-h">
            <h2 id="task-h">🎯 Your mission</h2>
            <div class="prose">${renderMarkdown(ex.task || '')}</div>
            <p class="xp-line"><span class="xp-pill">+${ex.xp || 10} XP</span> <span class="muted small">3★ = no hints and ≤2 checks</span></p>
          </section>
          <section class="help-box" aria-label="Help">
            <div class="hints" aria-live="polite"></div>
            <div class="help-actions">
              <button type="button" class="btn btn-yellow btn-sm" data-act="hint"></button>
              <button type="button" class="btn btn-white btn-sm" data-act="solution"></button>
            </div>
            <div class="solution-box"></div>
          </section>
        </section>
        <section class="pane pane-code" id="pane-code" role="tabpanel" aria-labelledby="tab-code">
          <div class="toolbar">
            <button type="button" class="btn btn-green" data-act="run" title="Run (Ctrl+Enter)">▶ Run</button>
            <button type="button" class="btn btn-blue" data-act="check">✅ Check</button>
            <span class="spacer"></span>
            <button type="button" class="btn btn-white btn-sm" data-act="reset" title="Reset to starter code">↺ Reset</button>
          </div>
          <div class="editor-host"></div>
          <label class="stdin-box">
            <span class="stdin-label">⌨️ Program input (cin)</span>
            <textarea class="stdin" rows="2" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"
              placeholder="Type what the program reads with cin…">${esc(firstStdin)}</textarea>
          </label>
        </section>
        <section class="pane pane-output" id="pane-output" role="tabpanel" aria-labelledby="tab-output">
          <div class="console-host"></div>
          <div class="results-host"></div>
        </section>
      </div>
      <div class="action-bar">
        <button type="button" class="btn btn-green" data-act="run">▶ Run</button>
        <button type="button" class="btn btn-blue" data-act="check">✅ Check</button>
      </div>
    </div>`;

  const page = root.querySelector('.ex-page');
  const stdinEl = root.querySelector('.stdin');
  const consoleHost = root.querySelector('.console-host');
  const resultsHost = root.querySelector('.results-host');
  const tabDot = root.querySelector('.tab-dot');
  let busy = false;
  let currentTab = 'task';

  const editor = createEditor(root.querySelector('.editor-host'), {
    value: game.getCode(id) ?? ex.starter ?? '',
    onRun: () => run(),
    label: `Code editor for ${ex.title}`,
  });
  editor.onChange((v) => game.saveCode(id, v));

  renderConsole(consoleHost, null);

  // ---- tabs (mobile)
  function setTab(t) {
    currentTab = t;
    page.classList.remove('tab-task', 'tab-code', 'tab-output');
    page.classList.add(`tab-${t}`);
    root.querySelectorAll('[role=tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    if (t === 'output') tabDot.hidden = true;
    if (t === 'code') editor.refresh();
    if (isMobile()) window.scrollTo({ top: 0 });
  }
  root.querySelector('.ex-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) setTab(b.dataset.tab);
  });
  root.querySelector('.ex-tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const order = ['task', 'code', 'output'];
    const i = (order.indexOf(currentTab) + (e.key === 'ArrowRight' ? 1 : 2)) % 3;
    setTab(order[i]);
    root.querySelector(`#tab-${order[i]}`).focus();
  });
  function showOutput() {
    if (isMobile()) setTab('output');
    else {
      tabDot.hidden = currentTab === 'output';
      // On desktop make sure the console is visible.
      const r = consoleHost.getBoundingClientRect();
      if (r.top > window.innerHeight - 80) consoleHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ---- hints & solution
  function renderHelp() {
    const a = game.getAttempts(id);
    const hints = ex.hints || [];
    const shown = Math.min(a.hints, hints.length);
    root.querySelector('.hints').innerHTML = hints.slice(0, shown).map((h, i) =>
      `<div class="hint brick-card card-hint"><b>💡 Hint ${i + 1}</b><div class="prose">${renderMarkdown(h)}</div></div>`).join('');
    const hb = root.querySelector('[data-act=hint]');
    hb.hidden = shown >= hints.length;
    hb.textContent = shown === 0 ? `💡 Need a hint?` : `💡 Another hint (${hints.length - shown} left)`;
    const sb = root.querySelector('[data-act=solution]');
    const left = Math.max(0, 3 - a.checks);
    sb.hidden = !ex.solution || a.solutionViewed;
    sb.disabled = left > 0;
    sb.textContent = left > 0 ? `🔑 Solution (unlocks after ${left} more ${left === 1 ? 'check' : 'checks'})` : `🔑 Show solution (${game.SOLUTION_COST} studs)`;
    const box = root.querySelector('.solution-box');
    box.innerHTML = a.solutionViewed && ex.solution
      ? `<div class="brick-card card-solution"><b>🔑 Solution</b> <span class="muted small">(max 1★ for this one)</span>
           <div class="prose">${renderMarkdown('```cpp\n' + ex.solution + '\n```')}</div>
           <button type="button" class="btn btn-white btn-sm" data-act="use-solution">Copy into editor</button></div>`
      : '';
  }
  renderHelp();

  async function onHint() {
    const a = game.getAttempts(id);
    if (a.hints === 0) {
      const ok = await confirmDialog({ title: '💡 Use a hint?', body: '<p>Hints help you get unstuck, but you can get at most <b>2 stars</b> with hints. Want one?</p>', ok: 'Yes, hint please' });
      if (!ok) return;
    }
    game.recordHint(id);
    renderHelp();
  }

  async function onSolution() {
    const s = game.getState();
    const cost = game.SOLUTION_COST;
    const canPay = s.studs >= cost;
    const ok = await confirmDialog({
      title: '🔑 Peek at the solution?',
      body: canPay
        ? `<p>This costs <b>${cost} studs</b> and you'll get <b>1 star</b> max for this exercise. Try reading it carefully, then type it yourself!</p>`
        : `<p>You only have ${s.studs} studs, so this one's on the house. You'll get <b>1 star</b> max for this exercise.</p>`,
      ok: canPay ? `Spend ${cost} studs` : 'Show me',
    });
    if (!ok) return;
    if (canPay) game.spendStuds(cost);
    game.recordSolutionView(id);
    renderHelp();
  }

  // ---- run / check
  function setBusy(b, label) {
    busy = b;
    root.querySelectorAll('[data-act=run],[data-act=check]').forEach((btn) => {
      btn.disabled = b;
      btn.classList.toggle('loading', b && btn.dataset.act === label);
    });
  }

  function onErrorLine(line, col) {
    if (isMobile()) setTab('code');
    editor.goToLine(line, col);
  }

  async function run() {
    if (busy) return;
    setBusy(true, 'run');
    editor.clearError();
    renderConsole(consoleHost, { running: true });
    resultsHost.innerHTML = '';
    showOutput();
    try {
      const res = await runProgram(editor.getValue(), stdinEl.value);
      game.recordRun(id, res);
      if (res.error && res.error.line) editor.markError(res.error.line);
      renderConsole(consoleHost, { result: res, stdin: stdinEl.value, onErrorLine });
    } catch (e) {
      renderConsole(consoleHost, { result: { stdout: '', error: { kind: 'runtime', message: 'Could not run: ' + (e && e.message || e) } } });
    } finally {
      setBusy(false);
    }
  }

  async function check() {
    if (busy) return;
    setBusy(true, 'check');
    editor.clearError();
    renderConsole(consoleHost, { running: true, label: 'Checking your build…' });
    resultsHost.innerHTML = '';
    showOutput();
    const code = editor.getValue();
    let verdict;
    try {
      verdict = await judge(code, ex, (c, s) => runProgram(c, s));
    } catch (e) {
      verdict = { passed: false, results: [], error: { kind: 'runtime', message: String(e.message || e) }, ruleFailures: [] };
    }
    setBusy(false);
    if (verdict.error && verdict.error.line) editor.markError(verdict.error.line);
    const firstRun = verdict.results[0];
    renderConsole(consoleHost, {
      result: firstRun ? { stdout: firstRun.actual, error: verdict.error } : { stdout: '', error: verdict.error },
      stdin: firstRun ? firstRun.stdin : '',
      onErrorLine,
      title: 'Output of test 1',
    });
    renderResults(resultsHost, verdict, ex);
    if (verdict.passed) {
      const a = game.getAttempts(id);
      const stars = game.computeStars({ checks: a.checks + 1, hints: a.hints, solutionViewed: a.solutionViewed });
      const reward = game.recordSolve(id, stars, ex.xp || 10);
      renderHelp();
      root.querySelector('.crumb-stars').innerHTML = starsHtml(starsFor(id));
      const next = exerciseAfter(id);
      celebrate({
        title: ex.title,
        color,
        ...reward,
        next: next ? { href: `#/play/${next.ex.id}`, label: next.world.id !== world.id ? `Next world: ${next.world.title}` : 'Next brick' } : { href: '#/home', label: 'Back to map' },
        worldDone: next ? next.world.id !== world.id : true,
        isLast: !next && worlds().length > 0,
      });
    } else {
      const a = game.recordFailedCheck(id, verdict);
      renderHelp();
      if (a.checks === 3 && ex.solution) toast(`Stuck? You can now peek at the solution${isMobile() ? ' in the Task tab' : ''}.`, { icon: '🔑', color: 'blue' });
    }
  }

  // ---- wire actions (delegated, toolbar + mobile action bar)
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    switch (b.dataset.act) {
      case 'run': run(); break;
      case 'check': check(); break;
      case 'hint': onHint(); break;
      case 'solution': onSolution(); break;
      case 'use-solution':
        if (await confirmDialog({ title: 'Replace your code?', body: '<p>Your current code will be replaced by the solution.</p>', ok: 'Replace' })) {
          editor.setValue(ex.solution);
          game.saveCode(id, ex.solution);
          if (isMobile()) setTab('code');
        }
        break;
      case 'reset':
        if (await confirmDialog({ title: '↺ Start over?', body: '<p>Your code for this exercise will go back to the starter code.</p>', ok: 'Reset', danger: true })) {
          editor.setValue(ex.starter || '');
          game.clearCode(id);
          renderConsole(consoleHost, null);
          resultsHost.innerHTML = '';
        }
        break;
      default:
    }
  });

  // Ctrl/Cmd+Enter anywhere on the page runs; Ctrl/Cmd+Shift+Enter checks.
  const onKey = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); check(); }
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}
