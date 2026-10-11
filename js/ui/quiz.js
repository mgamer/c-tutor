// Quiz topics list + quiz runner.
import * as game from '../game.js';
import { quizTopics, isTopicUnlocked, findWorld } from '../curriculum.js';
import { esc, brickStyle } from './dom.js';
import { renderMarkdown, renderInline } from './markdown.js';
import { highlightCpp } from '../editor.js';
import { brickConfetti } from './celebrate.js';

const QUESTIONS_PER_QUIZ = 10;

function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function renderQuizList(root) {
  const topics = quizTopics();
  const s = game.getState();
  root.innerHTML = `
    <header class="page-head">
      <h1>❓ Brick Quiz</h1>
      <p class="muted">Quick-fire questions to lock in what you've learned. ${QUESTIONS_PER_QUIZ} questions per round.</p>
    </header>
    ${topics.length ? '' : '<p class="brick-card">No quiz topics yet.</p>'}
    <ul class="topic-grid">
      ${topics.map((t) => {
        const open = isTopicUnlocked(t);
        const q = s.quiz[t.id];
        const w = t.unlockAfterWorld ? findWorld(t.unlockAfterWorld) : null;
        const pct = q && q.total ? Math.round((q.best / q.total) * 100) : null;
        const inner = `
          <span class="topic-icon" aria-hidden="true">${esc(t.icon || '❓')}</span>
          <span class="topic-title">${esc(t.title)}</span>
          <span class="topic-meta">${open
            ? (q ? `Best: ${q.best}/${q.total}${pct === 100 ? ' 🎯' : ''}` : `${Math.min(QUESTIONS_PER_QUIZ, (t.questions || []).length)} questions`)
            : `🔒 Solve a brick in ${esc(w ? w.title : 'the previous world')}`}</span>
          ${q ? `<span class="topic-bar"><span style="width:${pct}%"></span></span>` : ''}`;
        return `<li>${open
          ? `<a class="topic-card brick" style="${brickStyle(t.color, '#0055bf')}" href="#/quiz/${esc(t.id)}">${inner}</a>`
          : `<div class="topic-card brick locked" style="${brickStyle(t.color, '#0055bf')}">${inner}</div>`}</li>`;
      }).join('')}
    </ul>`;
}

export function renderQuiz(root, topicId) {
  const t = quizTopics().find((x) => x.id === topicId);
  if (!t) {
    root.innerHTML = `<section class="brick-card empty"><h1>Quiz not found</h1><p><a class="btn btn-blue" href="#/quiz">All quizzes</a></p></section>`;
    return;
  }
  if (!isTopicUnlocked(t)) {
    root.innerHTML = `<section class="brick-card empty"><h1>🔒 Locked quiz</h1><p>Solve an exercise in the matching world first.</p><p><a class="btn btn-blue" href="#/quiz">All quizzes</a></p></section>`;
    return;
  }
  const color = t.color || '#0055bf';
  let questions, i, correct, answered;

  function start() {
    questions = shuffle(t.questions || []).slice(0, QUESTIONS_PER_QUIZ).map((q) => {
      const opts = shuffle(q.options.map((text, idx) => ({ text, correct: idx === q.answer })));
      return { ...q, opts };
    });
    i = 0; correct = 0;
    show();
  }

  function show() {
    answered = false;
    const q = questions[i];
    root.innerHTML = `
      <div class="quiz" style="--wc:${esc(color)}">
        <div class="quiz-top">
          <a href="#/quiz" class="quiz-quit" aria-label="Quit quiz">✕</a>
          <div class="quiz-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${i}" aria-label="Quiz progress">
            ${questions.map((_, k) => `<span class="qp${k < i ? ' done' : k === i ? ' cur' : ''}"></span>`).join('')}
          </div>
          <span class="quiz-count">${i + 1}/${questions.length}</span>
        </div>
        <section class="quiz-card brick-card">
          <p class="quiz-topic">${esc(t.icon || '')} ${esc(t.title)}</p>
          <h1 class="quiz-q">${renderInline(q.q)}</h1>
          ${q.code ? `<pre class="code-block"><code>${highlightCpp(q.code)}</code></pre>` : ''}
        </section>
        <div class="answers" role="group" aria-label="Answers">
          ${q.opts.map((o, k) => `<button type="button" class="answer brick" data-k="${k}"><span class="ans-key" aria-hidden="true">${'ABCDEF'[k]}</span><span class="ans-text">${renderInline(String(o.text))}</span></button>`).join('')}
        </div>
        <div class="feedback" aria-live="assertive"></div>
      </div>`;
  }

  function answer(k) {
    if (answered) return;
    answered = true;
    const q = questions[i];
    const ok = q.opts[k].correct;
    if (ok) correct++;
    root.querySelectorAll('.answer').forEach((b, idx) => {
      b.disabled = true;
      if (q.opts[idx].correct) b.classList.add('right');
      else if (idx === k) b.classList.add('wrong');
      else b.classList.add('dim');
    });
    const last = i === questions.length - 1;
    root.querySelector('.feedback').innerHTML = `
      <div class="fb brick-card ${ok ? 'fb-ok' : 'fb-bad'}">
        <p class="fb-title">${ok ? '✅ Correct!' : '❌ Not quite'}</p>
        ${q.explain ? `<div class="prose">${renderMarkdown(q.explain)}</div>` : ''}
        <button type="button" class="btn ${ok ? 'btn-green' : 'btn-blue'} btn-lg" data-act="next">${last ? 'See results' : 'Next question ▶'}</button>
      </div>`;
    const next = root.querySelector('[data-act=next]');
    next.focus({ preventScroll: true });
    next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function finish() {
    const total = questions.length;
    const prev = game.getState().quiz[t.id];
    const r = game.recordQuiz(t.id, correct, total);
    const pct = total ? correct / total : 0;
    if (pct >= 0.8) brickConfetti({ count: r.perfect ? 90 : 50 });
    const msg = r.perfect ? 'PERFECT! Master builder brain! 🧠' : pct >= 0.8 ? 'Awesome work!' : pct >= 0.5 ? 'Good job — keep practising!' : 'Every builder starts somewhere. Try again!';
    root.innerHTML = `
      <div class="quiz quiz-end" style="--wc:${esc(color)}">
        <section class="brick-card end-card">
          <p class="quiz-topic">${esc(t.icon || '')} ${esc(t.title)}</p>
          <div class="score-ring" style="--p:${Math.round(pct * 100)}"><span><b>${correct}</b>/${total}</span></div>
          <h1>${msg}</h1>
          ${r.newBest && prev ? '<p class="new-best">🏅 New best score!</p>' : ''}
          <div class="rewards">
            <div class="reward"><b>+${r.xp}</b><span>XP</span></div>
            <div class="reward"><b>+${r.studs}</b><span>studs</span></div>
          </div>
          ${r.xp === 0 && prev ? '<p class="small muted">XP is only given for beating your best score.</p>' : ''}
          ${r.badges.length ? `<div class="cel-badges">${r.badges.map((b) => `<div class="cel-badge"><span aria-hidden="true">${b.icon}</span><b>${esc(b.title)}</b></div>`).join('')}</div>` : ''}
          <div class="modal-actions">
            <a class="btn btn-white" href="#/quiz">All quizzes</a>
            <button type="button" class="btn btn-green btn-lg" data-act="again">Play again ↻</button>
          </div>
        </section>
      </div>`;
  }

  root.addEventListener('click', (e) => {
    const a = e.target.closest('.answer');
    if (a) { answer(+a.dataset.k); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'next') {
      if (i < questions.length - 1) { i++; show(); window.scrollTo({ top: 0, behavior: 'smooth' }); } else finish();
    }
    if (b.dataset.act === 'again') start();
  });
  const onKey = (e) => {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    const k = 'abcdef'.indexOf(e.key.toLowerCase());
    if (!answered && k >= 0 && questions && k < questions[i].opts.length) answer(k);
  };
  document.addEventListener('keydown', onKey);
  start();
  return () => document.removeEventListener('keydown', onKey);
}
