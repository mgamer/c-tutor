// Top bar (avatar, rank, XP, studs, streak) and navigation highlighting.
import { getState, getRank, currentStreak, streakActiveToday } from '../game.js';
import { minifigSvg } from './minifig.js';
import { esc } from './dom.js';

export function renderHeader() {
  const el = document.getElementById('hud');
  if (!el) return;
  const s = getState();
  const r = getRank();
  const streak = currentStreak();
  const toNext = r.next === null ? 'Max rank!' : `${r.next - s.xp} XP to next rank`;
  el.innerHTML = `
    <div class="hud-stat hud-streak${streakActiveToday() ? ' lit' : ''}" title="Daily streak: ${streak} day${streak === 1 ? '' : 's'}">
      <span aria-hidden="true">🔥</span><b>${streak}</b><span class="sr-only">day streak</span>
    </div>
    <div class="hud-stat hud-studs" title="Studs (coins): ${s.studs}">
      <span class="stud-coin" aria-hidden="true"></span><b>${s.studs}</b><span class="sr-only">studs</span>
    </div>
    <a class="hud-player" href="#/profile" aria-label="Profile: level ${r.level} ${esc(r.name)}, ${s.xp} XP. ${toNext}">
      <div class="hud-rank">
        <span class="hud-rank-name">${esc(r.name)}</span>
        <span class="xpbar" title="${s.xp} XP · ${toNext}"><span style="width:${Math.round(r.progress * 100)}%"></span></span>
        <span class="hud-xp">${s.xp} XP</span>
      </div>
      <span class="hud-avatar">${minifigSvg({ size: 44 })}<span class="hud-level">${r.level}</span></span>
    </a>`;
}

export function highlightNav(route) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const active = a.dataset.nav === route;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}
