// World page: intro + exercise bricks.
import { findWorld, worlds, worldProgress, isWorldUnlocked, isExerciseUnlocked, starsFor } from '../curriculum.js';
import { esc, starsHtml, brickStyle } from './dom.js';
import { renderMarkdown } from './markdown.js';

export function renderWorld(root, id) {
  const w = findWorld(id);
  if (!w) {
    root.innerHTML = `<section class="brick-card empty"><h1>World not found</h1><p><a class="btn btn-blue" href="#/home">Back to map</a></p></section>`;
    return;
  }
  const idx = worlds().indexOf(w);
  const p = worldProgress(w);
  const unlocked = isWorldUnlocked(w);
  let nextMarked = false;
  root.innerHTML = `
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#/home">← Map</a></nav>
    <section class="world-hero brick" style="${brickStyle(w.color, '#d01012')}">
      <span class="wh-icon" aria-hidden="true">${esc(w.icon || '🧱')}</span>
      <div>
        <p class="wh-kicker">World ${idx + 1}</p>
        <h1>${esc(w.title)}</h1>
        <p class="wh-meta">${p.done}/${p.total} solved · ${p.stars}/${p.maxStars} ★</p>
      </div>
    </section>
    ${w.intro ? `<section class="brick-card prose world-intro">${renderMarkdown(w.intro)}</section>` : ''}
    ${!unlocked ? `<p class="notice">🔒 Finish the previous world to unlock this one.</p>` : ''}
    <ol class="ex-list">
      ${(w.exercises || []).map((e, i) => {
        const open = isExerciseUnlocked(e.id);
        const stars = starsFor(e.id);
        const isNext = open && !stars && !nextMarked && (nextMarked = true);
        const inner = `
          <span class="ex-num" aria-hidden="true">${i + 1}</span>
          <span class="ex-body">
            <span class="ex-title">${esc(e.title)}</span>
            <span class="ex-meta">${open ? (stars ? starsHtml(stars) : `<span class="xp-pill">+${e.xp || 10} XP</span>`) : '🔒 Solve the one before'}</span>
          </span>
          <span class="ex-go" aria-hidden="true">${open ? (stars ? '↻' : '▶') : ''}</span>`;
        return `<li>${open
          ? `<a class="ex-brick brick${stars ? ' done' : ''}${isNext ? ' next' : ''}" style="${brickStyle(w.color, '#d01012')}" href="#/play/${esc(e.id)}">${inner}</a>`
          : `<div class="ex-brick brick locked" aria-disabled="true">${inner}</div>`}</li>`;
      }).join('')}
    </ol>`;
}
