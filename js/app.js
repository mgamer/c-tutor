// Brick++ entry point: loads data, wires the hash router and global HUD.
import * as game from './game.js';
import { loadCurriculum } from './curriculum.js';
import { renderHeader, highlightNav } from './ui/header.js';
import { toast } from './ui/toast.js';

// Surface unexpected errors on screen (handy when testing on a phone without dev tools).
const showCrash = (msg) => toast('Oops: ' + String(msg).slice(0, 160), { icon: '🐞', color: 'red', ms: 8000 });
window.addEventListener('error', (e) => showCrash(e.message || e.error));
window.addEventListener('unhandledrejection', (e) => showCrash((e.reason && e.reason.message) || e.reason));
import { renderHome } from './ui/home.js';
import { renderWorld } from './ui/world.js';
import { renderExercise } from './ui/exercise.js';
import { renderPlayground } from './ui/playground.js';
import { renderQuizList, renderQuiz } from './ui/quiz.js';
import { renderProfile } from './ui/profile.js';

const ROUTES = [
  [/^\/?$/, () => renderHome, 'home'],
  [/^\/home$/, () => renderHome, 'home'],
  [/^\/world\/([\w-]+)$/, () => renderWorld, 'home'],
  [/^\/play\/([\w-]+)$/, () => renderExercise, 'home'],
  [/^\/playground$/, () => renderPlayground, 'playground'],
  [/^\/quiz$/, () => renderQuizList, 'quiz'],
  [/^\/quiz\/([\w-]+)$/, () => renderQuiz, 'quiz'],
  [/^\/profile$/, () => renderProfile, 'profile'],
];

const view = document.getElementById('view');
let cleanup = null;

function route() {
  const path = decodeURIComponent(location.hash.replace(/^#/, '')) || '/home';
  let match = null;
  for (const [re, get, nav] of ROUTES) {
    const m = path.match(re);
    if (m) { match = { render: get(), params: m.slice(1), nav }; break; }
  }
  if (typeof cleanup === 'function') {
    try { cleanup(); } catch (e) { console.error(e); }
  }
  cleanup = null;
  if (!match) { location.replace('#/home'); return; }
  document.body.dataset.route = path.split('/')[1] || 'home';
  highlightNav(match.nav);
  view.className = `view view-${document.body.dataset.route}`;
  // Each page gets a brand-new element, so event listeners from the previous page
  // (attached to its own root) can never fire on the new one.
  const page = document.createElement('div');
  page.className = 'page';
  view.replaceChildren(page);
  cleanup = match.render(page, ...match.params);
  window.scrollTo(0, 0);
  // Move focus for screen readers without scrolling.
  view.focus({ preventScroll: true });
}

game.on((type, detail) => {
  if (type === 'change') renderHeader();
  if (type === 'badge') toast(`Badge unlocked: ${detail.title}!`, { icon: detail.icon, color: 'blue', ms: 4200 });
  if (type === 'rank') toast(`Rank up! You are now a ${detail.name}`, { icon: '🏅', color: 'green', ms: 4500 });
});

// The skip link must not change the hash (that would confuse the router).
document.querySelector('.skip-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  view.focus();
});

async function start() {
  const { WORLDS, QUIZ_TOPICS } = await loadCurriculum();
  game.setCurriculum(WORLDS, QUIZ_TOPICS);
  renderHeader();
  window.addEventListener('hashchange', route);
  route();
}

start();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW registration failed', e));
  });
}
