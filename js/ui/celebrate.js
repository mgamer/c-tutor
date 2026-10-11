// Success celebration: falling-brick confetti + reward modal.
import { esc, prefersReducedMotion } from './dom.js';
import { getRank } from '../game.js';

const COLORS = ['#d01012', '#f2cd37', '#0055bf', '#237841', '#ffffff', '#fe8a18', '#a0bcac'];

/** Rain little LEGO bricks over the page using a lightweight canvas animation. */
export function brickConfetti({ count = 70, duration = 2600 } = {}) {
  if (prefersReducedMotion()) return;
  const cv = document.createElement('canvas');
  cv.className = 'confetti';
  cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  const bits = Array.from({ length: count }, () => {
    const studs = 1 + Math.floor(Math.random() * 3);
    return {
      x: Math.random() * W, y: -20 - Math.random() * H * 0.6,
      vx: (Math.random() - 0.5) * 2.2, vy: 2 + Math.random() * 3,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.15,
      c: COLORS[Math.floor(Math.random() * COLORS.length)], studs, s: 0.8 + Math.random() * 0.6,
    };
  });
  const start = performance.now();
  function brick(b) {
    const w = 12 * b.studs * b.s, h = 9 * b.s, sw = 5 * b.s, sh = 3 * b.s;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.r);
    ctx.fillStyle = b.c;
    ctx.strokeStyle = 'rgba(0,0,0,.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < b.studs; i++) {
      ctx.fillRect(-w / 2 + (i + 0.5) * (w / b.studs) - sw / 2, -h / 2 - sh, sw, sh);
    }
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
  function frame(t) {
    const el = t - start;
    ctx.clearRect(0, 0, W, H);
    for (const b of bits) {
      b.vy += 0.07; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      brick(b);
    }
    cv.style.opacity = el > duration - 500 ? String(Math.max(0, (duration - el) / 500)) : '1';
    if (el < duration) requestAnimationFrame(frame);
    else cv.remove();
  }
  requestAnimationFrame(frame);
}

/**
 * Show the success modal.
 * @param {{title, color, stars, best, prevStars, xp, studs, badges, rankUp, next:{href,label}, dailyBonus, worldDone, isLast}} r
 */
export function celebrate(r) {
  brickConfetti();
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop celebrate-backdrop';
  const improved = r.stars > r.prevStars;
  const starRow = [0, 1, 2].map((i) => `<span class="big-star${i < r.stars ? ' on' : ''}" style="--i:${i}" aria-hidden="true">★</span>`).join('');
  const rank = getRank();
  wrap.innerHTML = `
    <div class="modal celebrate brick-card" role="dialog" aria-modal="true" aria-labelledby="cel-title" style="--wc:${esc(r.color || '#d01012')}">
      <div class="cel-bricks" aria-hidden="true"><span></span><span></span><span></span></div>
      <h2 id="cel-title">${r.isLast ? 'You finished everything!' : r.worldDone ? 'World complete!' : 'Brick snapped in!'}</h2>
      <p class="cel-sub">${esc(r.title)}</p>
      <div class="big-stars" aria-label="${r.stars} of 3 stars">${starRow}</div>
      ${!improved && r.prevStars ? `<p class="small muted">Your best is still ${r.best}★ — nice practice!</p>` : ''}
      <div class="rewards">
        <div class="reward"><b>+${r.xp}</b><span>XP</span></div>
        <div class="reward"><b>+${r.studs}</b><span>studs</span></div>
      </div>
      ${r.dailyBonus ? '<p class="small">🔥 Daily streak bonus included!</p>' : ''}
      ${r.rankUp ? `<p class="rank-up">🏅 Rank up: <b>${esc(rank.name)}</b></p>` : ''}
      ${r.badges && r.badges.length ? `<div class="cel-badges">${r.badges.map((b) =>
        `<div class="cel-badge"><span aria-hidden="true">${b.icon}</span><b>${esc(b.title)}</b></div>`).join('')}</div>` : ''}
      <div class="modal-actions">
        <button type="button" class="btn btn-white" data-v="stay">Stay here</button>
        <a class="btn btn-green btn-lg" href="${esc(r.next.href)}" data-v="next">${esc(r.next.label)} ▶</a>
      </div>
    </div>`;
  const close = () => {
    wrap.remove();
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('hashchange', close);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  wrap.addEventListener('click', (e) => {
    const v = e.target.closest('[data-v]');
    if (v || e.target === wrap) close();
  });
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', close);
  document.body.appendChild(wrap);
  wrap.querySelector('[data-v=next]').focus();
}
