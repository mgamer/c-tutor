// Profile: rank, stats, badges, minifig shop, export/import/reset.
import * as game from '../game.js';
import { totalExercises, quizTopics } from '../curriculum.js';
import { minifigSvg } from './minifig.js';
import { esc, confirmDialog } from './dom.js';
import { toast } from './toast.js';

const SLOTS = [['hat', '🎩 Hats'], ['hair', '💇 Hair'], ['torso', '👕 Torso'], ['legs', '👖 Legs']];

export function renderProfile(root) {
  let slot = 'hat';
  let preview = null; // {slot, id} being previewed but not owned

  function draw() {
    const s = game.getState();
    const r = game.getRank();
    const solved = Object.values(s.solved);
    const threeStars = solved.filter((x) => x.stars === 3).length;
    const fig = { ...s.minifig };
    if (preview) fig[preview.slot] = preview.id;
    const earned = game.BADGES.filter((b) => s.badges[b.id]).length;
    const thresholds = game.rankThresholds();

    root.innerHTML = `
      <header class="page-head"><h1>🧑‍🚀 Your Builder</h1></header>
      <div class="profile-grid">
        <section class="brick-card fig-card" aria-labelledby="fig-h">
          <div class="fig-stage">${minifigSvg({ full: true, fig })}</div>
          <div class="fig-info">
            <h2 id="fig-h">${esc(r.name)}</h2>
            <p class="lvl">Level ${r.level} · ${s.xp} XP</p>
            <span class="xpbar big"><span style="width:${Math.round(r.progress * 100)}%"></span></span>
            <p class="small muted">${r.next === null ? 'Top rank reached!' : `${r.next - s.xp} XP to ${esc(game.RANK_NAMES[r.index + 1])}`}</p>
            <p class="studs-line"><span class="stud-coin" aria-hidden="true"></span> <b>${s.studs}</b> studs to spend</p>
          </div>
        </section>

        <section class="brick-card shop" aria-labelledby="shop-h">
          <h2 id="shop-h">🛍️ Minifig Shop</h2>
          <div class="shop-tabs" role="tablist">
            ${SLOTS.map(([id, label]) => `<button type="button" role="tab" aria-selected="${id === slot}" class="chip${id === slot ? ' active' : ''}" data-slot="${id}">${label}</button>`).join('')}
          </div>
          <div class="shop-items">
            ${game.MINIFIG_ITEMS[slot].map((it) => {
              const owned = game.ownsItem(slot, it.id);
              const equipped = s.minifig[slot] === it.id;
              const swatch = it.color ? `<span class="swatch" style="background:${it.color}"></span>` : `<span class="swatch hat-swatch">${minifigSvg({ fig: { ...s.minifig, hat: it.id } })}</span>`;
              return `<button type="button" class="shop-item${equipped ? ' equipped' : ''}${!owned && s.studs < it.price ? ' poor' : ''}" data-item="${it.id}"
                  aria-label="${esc(it.name)}${equipped ? ', equipped' : owned ? ', owned' : `, costs ${it.price} studs`}">
                ${swatch}<span class="si-name">${esc(it.name)}</span>
                <span class="si-price">${equipped ? '✔ On' : owned ? 'Wear' : `<span class="stud-coin sm"></span>${it.price}`}</span>
              </button>`;
            }).join('')}
          </div>
          ${preview ? `<p class="small">Previewing. Tap again to buy.</p>` : '<p class="small muted">Tap to preview, tap again to buy or wear.</p>'}
        </section>

        <section class="brick-card stats" aria-labelledby="stats-h">
          <h2 id="stats-h">📊 Stats</h2>
          <dl class="stat-grid">
            <div><dt>Exercises solved</dt><dd>${solved.length}<small>/${totalExercises()}</small></dd></div>
            <div><dt>3-star bricks</dt><dd>${threeStars}</dd></div>
            <div><dt>Quizzes taken</dt><dd>${s.stats.quizzes}</dd></div>
            <div><dt>Quiz topics</dt><dd>${Object.keys(s.quiz).length}<small>/${quizTopics().length}</small></dd></div>
            <div><dt>Programs run</dt><dd>${s.stats.runs}</dd></div>
            <div><dt>Checks</dt><dd>${s.stats.checks}</dd></div>
            <div><dt>Streak</dt><dd>${game.currentStreak()}🔥</dd></div>
            <div><dt>Best streak</dt><dd>${s.streak.best}</dd></div>
          </dl>
        </section>

        <section class="brick-card badges-card" aria-labelledby="badges-h">
          <h2 id="badges-h">🏅 Badges <span class="muted small">${earned}/${game.BADGES.length}</span></h2>
          <ul class="badge-grid">
            ${game.BADGES.map((b) => {
              const got = s.badges[b.id];
              return `<li class="badge${got ? ' got' : ''}" title="${esc(b.how)}">
                <span class="badge-icon" aria-hidden="true">${got ? b.icon : '🔒'}</span>
                <b>${esc(b.title)}</b><span class="badge-how">${esc(b.how)}</span>
                <span class="sr-only">${got ? 'Earned' : 'Not earned yet'}</span>
              </li>`;
            }).join('')}
          </ul>
        </section>

        <section class="brick-card ranks-card" aria-labelledby="ranks-h">
          <h2 id="ranks-h">🪜 Ranks</h2>
          <ol class="rank-list">
            ${game.RANK_NAMES.map((n, i) => `<li class="${i < r.index ? 'past' : i === r.index ? 'current' : ''}"><span>${i + 1}. ${esc(n)}</span><span>${thresholds[i]} XP</span></li>`).join('')}
          </ol>
        </section>

        <section class="brick-card save-card" aria-labelledby="save-h">
          <h2 id="save-h">💾 Save & restore</h2>
          <p class="small muted">Progress is saved in this browser. Copy your save code to move it to another device.</p>
          <div class="save-actions">
            <button type="button" class="btn btn-blue btn-sm" data-act="export">Export</button>
            <button type="button" class="btn btn-white btn-sm" data-act="import">Import</button>
            <button type="button" class="btn btn-red btn-sm" data-act="reset">Reset progress</button>
          </div>
          <label class="sr-only" for="save-code">Save code</label>
          <textarea id="save-code" class="save-code" rows="4" spellcheck="false" placeholder="Your save code appears here. Paste one and press Import to restore."></textarea>
        </section>
      </div>`;
  }

  root.addEventListener('click', async (e) => {
    const st = e.target.closest('[data-slot]');
    if (st) { slot = st.dataset.slot; preview = null; draw(); return; }
    const it = e.target.closest('[data-item]');
    if (it) {
      const id = it.dataset.item;
      const item = game.findItem(slot, id);
      if (game.ownsItem(slot, id)) { preview = null; game.equipItem(slot, id); draw(); return; }
      if (!preview || preview.slot !== slot || preview.id !== id) { preview = { slot, id }; draw(); return; }
      if (game.getState().studs < item.price) {
        toast(`You need ${item.price - game.getState().studs} more studs for that. Solve some bricks!`, { icon: '🪙', color: 'red' });
        return;
      }
      const res = game.equipItem(slot, id);
      preview = null;
      if (res === 'bought') toast(`Bought ${item.name}!`, { icon: '🛍️', color: 'green' });
      draw();
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const ta = root.querySelector('.save-code');
    if (b.dataset.act === 'export') {
      ta.value = game.exportProgress();
      ta.select();
      try { await navigator.clipboard.writeText(ta.value); toast('Save code copied to clipboard', { icon: '📋', color: 'blue' }); } catch (err) { /* clipboard blocked: code is selected */ }
    }
    if (b.dataset.act === 'import') {
      if (!ta.value.trim()) { toast('Paste a save code into the box first.', { icon: '📋', color: 'red' }); ta.focus(); return; }
      if (!(await confirmDialog({ title: 'Import save?', body: '<p>This replaces your current progress with the save code.</p>', ok: 'Import', danger: true }))) return;
      try {
        game.importProgress(ta.value);
        toast('Progress restored!', { icon: '✅', color: 'green' });
        draw();
      } catch (err) {
        toast(err.message, { icon: '⚠️', color: 'red' });
      }
    }
    if (b.dataset.act === 'reset') {
      if (!(await confirmDialog({ title: '⚠️ Reset everything?', body: '<p>All XP, studs, badges, stars and saved code will be deleted. This cannot be undone!</p>', ok: 'Yes, reset', danger: true }))) return;
      game.resetProgress();
      toast('Progress reset. Fresh baseplate!', { icon: '🧱' });
      draw();
    }
  });

  draw();
}
