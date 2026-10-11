// Home / build map screen.
import { getState, getRank } from '../game.js';
import { worlds, worldProgress, isWorldUnlocked, nextExercise, totalExercises, findExercise, quizTopics } from '../curriculum.js';
import { esc, brickStyle } from './dom.js';

export function renderHome(root) {
  const s = getState();
  const r = getRank();
  const next = nextExercise();
  const ws = worlds();
  const solvedN = Object.keys(s.solved).length;
  const total = totalExercises();

  if (!ws.length) {
    root.innerHTML = `<section class="brick-card empty"><h1>Bricks are on the way…</h1><p>The exercises haven't loaded yet. Try refreshing the page.</p></section>`;
    return;
  }

  const continueBtn = next
    ? `<a class="btn btn-yellow btn-xl continue" href="#/play/${esc(next.ex.id)}">
         <span class="continue-label">${solvedN ? 'Continue building' : 'Start building!'}</span>
         <span class="continue-sub">${esc(next.world.icon || '🧱')} ${esc(next.ex.title)}</span>
       </a>`
    : `<a class="btn btn-green btn-xl continue" href="#/playground"><span class="continue-label">All bricks placed! 🏆</span><span class="continue-sub">Free build in the Playground</span></a>`;

  root.innerHTML = `
    <section class="hero brick-card">
      <div class="hero-text">
        <h1>Hi, ${esc(r.name)}!</h1>
        <p>${solvedN ? `You've snapped <b>${solvedN}</b> of <b>${total}</b> bricks into place. Keep going!` : 'Learn C++ one brick at a time. Every exercise you solve adds a brick to your build.'}</p>
      </div>
      ${continueBtn}
    </section>
    <div class="home-grid">
      <section class="map baseplate" aria-labelledby="map-title">
        <h2 id="map-title" class="section-title on-plate">Build Map</h2>
        <ol class="map-path">
          ${ws.map((w, i) => worldTile(w, i)).join('')}
        </ol>
      </section>
      <aside class="home-side">
        <section class="brick-card tower-card" aria-labelledby="tower-title">
          <h2 id="tower-title">Your build</h2>
          <p class="muted small">${solvedN} / ${total} bricks</p>
          ${towerSvg()}
        </section>
        <a class="side-link brick-card card-blue" href="#/quiz">
          <span class="side-icon" aria-hidden="true">❓</span>
          <span><b>Brick Quiz</b><br><span class="small">${quizTopics().length} topics to test your brain</span></span>
        </a>
        <a class="side-link brick-card card-green" href="#/playground">
          <span class="side-icon" aria-hidden="true">🛠️</span>
          <span><b>Playground</b><br><span class="small">Free build: write any program</span></span>
        </a>
      </aside>
    </div>`;
}

function worldTile(w, i) {
  const p = worldProgress(w);
  const unlocked = isWorldUnlocked(w);
  const state = p.complete ? 'complete' : unlocked ? 'open' : 'locked';
  const label = `World ${i + 1}: ${w.title}. ${state === 'locked' ? 'Locked' : `${p.done} of ${p.total} solved, ${p.stars} stars`}`;
  const inner = `
      <span class="wt-num" aria-hidden="true">${i + 1}</span>
      <span class="wt-icon" aria-hidden="true">${esc(w.icon || '🧱')}</span>
      <span class="wt-body">
        <span class="wt-title">${esc(w.title)}</span>
        <span class="wt-meta">${state === 'locked' ? '🔒 Finish the previous world' : `${p.done}/${p.total} · ${p.stars}/${p.maxStars} ★`}</span>
        ${state !== 'locked' ? `<span class="wt-bar"><span style="width:${p.total ? Math.round((p.done / p.total) * 100) : 0}%"></span></span>` : ''}
      </span>
      ${p.complete ? '<span class="wt-badge" aria-hidden="true">✔</span>' : ''}`;
  return `<li class="wt-wrap ${i % 2 ? 'right' : 'left'}">
    ${unlocked
      ? `<a class="world-tile brick ${state}" style="${brickStyle(w.color, '#d01012')}" href="#/world/${esc(w.id)}" aria-label="${esc(label)}">${inner}</a>`
      : `<div class="world-tile brick locked" style="${brickStyle(w.color, '#d01012')}" aria-label="${esc(label)}" role="img">${inner}</div>`}
  </li>`;
}

function shade(hex, amt) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** SVG wall of bricks: one brick per solved exercise, coloured by its world. */
export function towerSvg() {
  const s = getState();
  const total = Math.max(totalExercises(), 1);
  const solved = Object.entries(s.solved)
    .map(([id, v]) => ({ id, at: v.at || 0, f: findExercise(id) }))
    .filter((x) => x.f)
    .sort((a, b) => a.at - b.at);
  const PER = 3, BW = 56, BH = 22, STUD = 6;
  const rows = Math.ceil(total / PER);
  const W = PER * BW + BW / 2 + 4, H = rows * BH + STUD + 4;
  let out = '';
  const recent = Date.now() - 90 * 1000;
  for (let i = 0; i < rows * PER && i < total; i++) {
    const row = Math.floor(i / PER), col = i % PER;
    const x = 2 + col * BW + (row % 2 ? BW / 2 : 0);
    const y = H - 2 - (row + 1) * BH;
    const item = solved[i];
    if (item) {
      const c = item.f.world.color || '#d01012';
      const isNew = item.at > recent && i === solved.length - 1;
      out += `<g class="tb${isNew ? ' tb-new' : ''}" style="--d:${Math.min(i, 40) * 25}ms">
        <rect x="${x + 9}" y="${y - STUD + 1}" width="12" height="${STUD}" rx="1.5" fill="${c}"/>
        <rect x="${x + 35}" y="${y - STUD + 1}" width="12" height="${STUD}" rx="1.5" fill="${c}"/>
        <rect x="${x + 1}" y="${y + 1}" width="${BW - 2}" height="${BH - 2}" rx="3" fill="${c}" stroke="${shade(c, -0.18)}" stroke-width="2"/>
        <rect x="${x + 5}" y="${y + 4}" width="${BW - 14}" height="3" rx="1.5" fill="#fff" opacity=".3"/>
      </g>`;
    } else {
      out += `<rect class="tb-ghost" x="${x + 1.5}" y="${y + 1.5}" width="${BW - 3}" height="${BH - 3}" rx="3"/>`;
    }
  }
  return `<svg class="tower" viewBox="0 0 ${W} ${H}" role="img" aria-label="A wall of ${solved.length} bricks out of ${total}">${out}</svg>`;
}

