// Brick++ gamification: XP, studs, ranks, streaks, badges, minifig shop.
// All state lives in localStorage under STORAGE_KEY. The module is data-agnostic;
// call setCurriculum(WORLDS, QUIZ_TOPICS) once so world/quiz badges and rank
// thresholds can be computed.

export const STORAGE_KEY = 'brickpp:v1';

export const SOLUTION_COST = 20;
const STAR_MULT = { 0: 0, 1: 0.5, 2: 0.8, 3: 1 };

// ---------------------------------------------------------------------------
// State

function defaultState() {
  return {
    version: 1,
    xp: 0,
    studs: 0,
    totalStudsEarned: 0,
    solved: {},      // exId -> { stars, xp, at }
    attempts: {},    // exId -> { checks, hints, solutionViewed, hadCompileError }
    code: {},        // exId -> saved source
    quiz: {},        // topicId -> { best, total, taken }
    stats: { runs: 0, checks: 0, quizzes: 0, solutionsViewed: 0 },
    streak: { count: 0, best: 0, lastDay: null },
    badges: {},      // badgeId -> timestamp
    minifig: { hat: 'none', hair: 'brown', torso: 'red', legs: 'blue', owned: [] },
    playground: null,
    createdAt: Date.now(),
  };
}

let state = load();
const listeners = new Set();
let curriculum = { worlds: [], topics: [] };

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return merge(defaultState(), JSON.parse(raw));
  } catch (e) { /* storage blocked or corrupt -> start fresh */ }
  return defaultState();
}

function merge(base, saved) {
  const out = { ...base, ...saved };
  for (const k of ['stats', 'streak', 'minifig']) out[k] = { ...base[k], ...(saved[k] || {}) };
  for (const k of ['solved', 'attempts', 'code', 'quiz', 'badges']) out[k] = { ...(saved[k] || {}) };
  return out;
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* quota / private mode */ }
}
function saveSoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(save, 400);
}
window.addEventListener('pagehide', () => { if (saveTimer) save(); });

function emit(type, detail) {
  for (const fn of listeners) {
    try { fn(type, detail); } catch (e) { console.error(e); }
  }
}

/** Subscribe to game events: 'change', 'badge', 'rank', 'reward'. Returns unsubscribe. */
export function on(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() { return state; }

export function setCurriculum(worlds = [], topics = []) {
  curriculum = { worlds, topics };
}

// ---------------------------------------------------------------------------
// Ranks

export const RANK_NAMES = [
  'Brick Rookie', 'Stud Collector', 'Plate Placer', 'Junior Builder', 'Builder',
  'Senior Builder', 'Architect', 'Master Builder', 'Legendary Builder',
];
const RANK_FRACTIONS = [0, 0.03, 0.08, 0.15, 0.25, 0.38, 0.53, 0.7, 0.88];

export function totalAvailableXp() {
  let total = 0;
  for (const w of curriculum.worlds) for (const e of w.exercises || []) total += e.xp || 10;
  for (const t of curriculum.topics) total += Math.min(10, (t.questions || []).length) * 5 + 20;
  return total || 2000;
}

export function rankThresholds() {
  const total = totalAvailableXp();
  return RANK_FRACTIONS.map((f, i) => (i === 0 ? 0 : Math.max(i * 10, Math.round((total * f) / 10) * 10)));
}

/** @returns {{index, name, level, min, next, progress}} */
export function getRank(xp = state.xp) {
  const t = rankThresholds();
  let i = 0;
  while (i + 1 < t.length && xp >= t[i + 1]) i++;
  const min = t[i];
  const next = i + 1 < t.length ? t[i + 1] : null;
  const progress = next === null ? 1 : (xp - min) / (next - min);
  return { index: i, name: RANK_NAMES[i], level: i + 1, min, next, progress: Math.max(0, Math.min(1, progress)) };
}

// ---------------------------------------------------------------------------
// Streak

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function touchStreak() {
  const today = dayKey();
  const s = state.streak;
  if (s.lastDay === today) return false;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  s.count = s.lastDay === dayKey(y) ? s.count + 1 : 1;
  s.best = Math.max(s.best, s.count);
  s.lastDay = today;
  return true;
}

/** Current streak, or 0 if the chain is broken (no activity yesterday or today). */
export function currentStreak() {
  const s = state.streak;
  if (!s.lastDay) return 0;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return s.lastDay === dayKey() || s.lastDay === dayKey(y) ? s.count : 0;
}

export function streakActiveToday() { return state.streak.lastDay === dayKey(); }

// ---------------------------------------------------------------------------
// Badges

const solvedCount = () => Object.keys(state.solved).length;
const worldDone = (w) => w && (w.exercises || []).length > 0 && w.exercises.every((e) => state.solved[e.id]);

export const BADGES = [
  { id: 'first-run', icon: '▶️', title: 'First Program', how: 'Run your very first program.', test: () => state.stats.runs >= 1 },
  { id: 'hello-world', icon: '👋', title: 'Hello World', how: 'Solve your first exercise.', test: () => solvedCount() >= 1 },
  { id: 'bug-squasher', icon: '🐞', title: 'Bug Squasher', how: 'Fix a compile error and then pass the check.', test: (ctx) => ctx && ctx.squashed },
  { id: 'never-give-up', icon: '💪', title: 'Never Give Up', how: 'Solve an exercise after 5 or more failed checks.', test: (ctx) => ctx && ctx.persistent },
  { id: 'no-hint-hero', icon: '🦸', title: 'No-Hint Hero', how: 'Earn 3 stars on 10 exercises.', test: () => Object.values(state.solved).filter((s) => s.stars === 3).length >= 10 },
  { id: 'world-builder', icon: '🏗️', title: 'World Builder', how: 'Complete every exercise in a world.', test: () => curriculum.worlds.some(worldDone) },
  { id: 'loop-master', icon: '🔁', title: 'Loop Master', how: 'Complete world 5.', test: () => worldDone(curriculum.worlds[4]) },
  { id: 'perfectionist', icon: '🌟', title: 'Perfectionist', how: 'Get 3 stars on every exercise of a world.', test: () => curriculum.worlds.some((w) => worldDone(w) && w.exercises.every((e) => state.solved[e.id].stars === 3)) },
  { id: 'halfway', icon: '🧗', title: 'Halfway There', how: 'Complete half of all worlds.', test: () => curriculum.worlds.length > 0 && curriculum.worlds.filter(worldDone).length >= Math.ceil(curriculum.worlds.length / 2) },
  { id: 'master-builder', icon: '🏆', title: 'Master Builder', how: 'Solve every single exercise.', test: () => curriculum.worlds.length > 0 && curriculum.worlds.every(worldDone) },
  { id: 'quiz-perfect', icon: '🎯', title: 'Bullseye', how: 'Get a perfect score in a quiz.', test: () => Object.values(state.quiz).some((q) => q.total > 0 && q.best === q.total) },
  { id: 'quiz-champion', icon: '🥇', title: 'Quiz Champion', how: 'Score 80% or more in every quiz topic.', test: () => curriculum.topics.length > 0 && curriculum.topics.every((t) => { const q = state.quiz[t.id]; return q && q.total > 0 && q.best / q.total >= 0.8; }) },
  { id: 'streak-3', icon: '🔥', title: 'Warming Up', how: 'Keep a 3-day streak.', test: () => state.streak.best >= 3 },
  { id: 'streak-5', icon: '☄️', title: 'On Fire', how: 'Keep a 5-day streak.', test: () => state.streak.best >= 5 },
  { id: 'night-owl', icon: '🦉', title: 'Night Owl', how: 'Solve something between 10pm and 5am.', test: (ctx) => ctx && ctx.solvedNow && (new Date().getHours() >= 22 || new Date().getHours() < 5) },
  { id: 'tinkerer', icon: '🔧', title: 'Tinkerer', how: 'Run programs 100 times.', test: () => state.stats.runs >= 100 },
  { id: 'stud-hoarder', icon: '💰', title: 'Stud Hoarder', how: 'Earn 500 studs in total.', test: () => state.totalStudsEarned >= 500 },
  { id: 'fashionista', icon: '🎩', title: 'Fashionista', how: 'Buy your first minifig item.', test: () => state.minifig.owned.length >= 1 },
];

function checkBadges(ctx) {
  const fresh = [];
  for (const b of BADGES) {
    if (state.badges[b.id]) continue;
    let ok = false;
    try { ok = !!b.test(ctx); } catch (e) { ok = false; }
    if (ok) {
      state.badges[b.id] = Date.now();
      fresh.push(b);
    }
  }
  for (const b of fresh) emit('badge', b);
  return fresh;
}

// ---------------------------------------------------------------------------
// Rewards

function award(xp, studs) {
  const before = getRank().index;
  state.xp += xp;
  state.studs += studs;
  state.totalStudsEarned += studs;
  const after = getRank();
  if (after.index > before) emit('rank', after);
  return after.index > before ? after : null;
}

const studsForXp = (xp) => Math.ceil(xp / 2);

export function starsMultiplier(stars) { return STAR_MULT[stars] || 0; }

function attemptsFor(exId) {
  if (!state.attempts[exId]) state.attempts[exId] = { checks: 0, hints: 0, solutionViewed: false, hadCompileError: false };
  return state.attempts[exId];
}

export function getAttempts(exId) { return attemptsFor(exId); }

/** Call after every Run (playground or exercise). */
export function recordRun(exId, result) {
  state.stats.runs++;
  if (exId && result && result.error && result.error.kind === 'compile') attemptsFor(exId).hadCompileError = true;
  const badges = checkBadges();
  save();
  emit('change');
  return { badges };
}

/** Call after a failed Check. */
export function recordFailedCheck(exId, result) {
  state.stats.checks++;
  const a = attemptsFor(exId);
  a.checks++;
  if (result && result.error && result.error.kind === 'compile') a.hadCompileError = true;
  save();
  emit('change');
  return a;
}

export function recordHint(exId) {
  const a = attemptsFor(exId);
  a.hints++;
  save();
  emit('change');
  return a.hints;
}

export function recordSolutionView(exId) {
  const a = attemptsFor(exId);
  a.solutionViewed = true;
  state.stats.solutionsViewed++;
  save();
  emit('change');
}

/** Stars for the current attempt, using the counters (checks includes the passing one). */
export function computeStars({ checks, hints, solutionViewed }) {
  if (solutionViewed) return 1;
  if (hints === 0 && checks <= 2) return 3;
  if (hints <= 1 || checks <= 4) return 2;
  return 1;
}

/**
 * Record a passed Check. Awards only the improvement over the previous best.
 * @returns {{stars, prevStars, xp, studs, badges, rankUp, firstSolve}}
 */
export function recordSolve(exId, stars, baseXp = 10) {
  state.stats.checks++;
  const a = attemptsFor(exId);
  const ctx = { solvedNow: true, squashed: a.hadCompileError, persistent: a.checks >= 5 };
  const prev = state.solved[exId];
  const prevStars = prev ? prev.stars : 0;
  const prevXp = prev ? prev.xp : 0;
  const best = Math.max(stars, prevStars);
  const earnedXp = Math.round(baseXp * starsMultiplier(best));
  const xp = Math.max(0, earnedXp - prevXp);
  let studs = studsForXp(xp);
  if (stars === 3 && prevStars < 3) studs += 5;
  const newDay = touchStreak();
  if (newDay) studs += 5; // daily bonus
  state.solved[exId] = { stars: best, xp: Math.max(prevXp, earnedXp), at: Date.now() };
  // Fresh counters so a replay can earn more stars.
  state.attempts[exId] = { checks: 0, hints: 0, solutionViewed: false, hadCompileError: false };
  const rankUp = award(xp, studs);
  const badges = checkBadges(ctx);
  save();
  emit('change');
  return { stars, prevStars, best, xp, studs, badges, rankUp, firstSolve: !prev, dailyBonus: newDay };
}

/** Record a finished quiz. */
export function recordQuiz(topicId, correct, total) {
  state.stats.quizzes++;
  const q = state.quiz[topicId] || { best: 0, total, taken: 0 };
  const perfect = total > 0 && correct === total;
  // XP for correct answers above the previous best, so replays can't farm XP.
  const improvement = Math.max(0, correct - (q.total === total ? q.best : Math.round((q.best / (q.total || 1)) * total)));
  let xp = improvement * 5;
  const firstPerfect = perfect && !(q.best === q.total && q.total > 0);
  if (firstPerfect) xp += 20;
  let studs = studsForXp(xp) + (perfect ? 5 : 0) + (correct > 0 ? 2 : 0);
  const newDay = touchStreak();
  if (newDay) studs += 5;
  const isBest = correct >= q.best || q.total !== total;
  state.quiz[topicId] = { best: isBest ? correct : q.best, total: isBest ? total : q.total, taken: q.taken + 1 };
  const rankUp = award(xp, studs);
  const badges = checkBadges();
  save();
  emit('change');
  return { xp, studs, badges, rankUp, perfect, newBest: isBest && correct > 0, dailyBonus: newDay };
}

export function spendStuds(n) {
  if (state.studs < n) return false;
  state.studs -= n;
  save();
  emit('change');
  return true;
}

// ---------------------------------------------------------------------------
// Saved code

export function getCode(key) { return state.code[key]; }
export function saveCode(key, code) {
  state.code[key] = code;
  saveSoon();
}
export function clearCode(key) {
  delete state.code[key];
  saveSoon();
}
export function getPlayground() { return state.playground; }
export function savePlayground(code) { state.playground = code; saveSoon(); }

// ---------------------------------------------------------------------------
// Minifig shop

export const MINIFIG_ITEMS = {
  hat: [
    { id: 'none', name: 'No hat', price: 0 },
    { id: 'cap', name: 'Red cap', price: 30 },
    { id: 'hardhat', name: 'Hard hat', price: 40 },
    { id: 'beanie', name: 'Beanie', price: 40 },
    { id: 'wizard', name: 'Wizard hat', price: 80 },
    { id: 'crown', name: 'Crown', price: 150 },
  ],
  hair: [
    { id: 'brown', name: 'Brown', color: '#6b3d1e', price: 0 },
    { id: 'black', name: 'Black', color: '#1b1b1b', price: 10 },
    { id: 'blonde', name: 'Blonde', color: '#e9b949', price: 10 },
    { id: 'ginger', name: 'Ginger', color: '#c75b12', price: 15 },
    { id: 'blue', name: 'Electric blue', color: '#1e88e5', price: 25 },
    { id: 'pink', name: 'Bubblegum', color: '#e8559b', price: 25 },
  ],
  torso: [
    { id: 'red', name: 'Red', color: '#d01012', price: 0 },
    { id: 'blue', name: 'Blue', color: '#0055bf', price: 15 },
    { id: 'green', name: 'Green', color: '#237841', price: 15 },
    { id: 'yellow', name: 'Yellow', color: '#f2cd37', price: 15 },
    { id: 'black', name: 'Black', color: '#2b2b2b', price: 20 },
    { id: 'white', name: 'White', color: '#f4f4f4', price: 20 },
    { id: 'space', name: 'Space suit', color: '#e8eef5', price: 60 },
  ],
  legs: [
    { id: 'blue', name: 'Blue', color: '#0a3b7a', price: 0 },
    { id: 'black', name: 'Black', color: '#2b2b2b', price: 10 },
    { id: 'tan', name: 'Tan', color: '#c9a36a', price: 10 },
    { id: 'green', name: 'Green', color: '#1d5e33', price: 15 },
    { id: 'red', name: 'Red', color: '#a50d0f', price: 15 },
  ],
};

export function findItem(slot, id) {
  return (MINIFIG_ITEMS[slot] || []).find((i) => i.id === id) || MINIFIG_ITEMS[slot][0];
}

export function ownsItem(slot, id) {
  const item = findItem(slot, id);
  return item.price === 0 || state.minifig.owned.includes(`${slot}:${id}`);
}

/** Buy (if needed) and equip an item. Returns 'equipped' | 'bought' | 'poor'. */
export function equipItem(slot, id) {
  const item = findItem(slot, id);
  let result = 'equipped';
  if (!ownsItem(slot, id)) {
    if (!spendStuds(item.price)) return 'poor';
    state.minifig.owned.push(`${slot}:${id}`);
    result = 'bought';
    checkBadges();
  }
  state.minifig[slot] = id;
  save();
  emit('change');
  return result;
}

// ---------------------------------------------------------------------------
// Export / import / reset

export function exportProgress() {
  save();
  const json = JSON.stringify(state);
  return btoa(unescape(encodeURIComponent(json)));
}

export function importProgress(text) {
  const trimmed = String(text || '').trim();
  let obj;
  try {
    obj = JSON.parse(trimmed.startsWith('{') ? trimmed : decodeURIComponent(escape(atob(trimmed))));
  } catch (e) {
    throw new Error('That code does not look like a Brick++ save.');
  }
  if (!obj || typeof obj !== 'object' || typeof obj.xp !== 'number') throw new Error('That code does not look like a Brick++ save.');
  state = merge(defaultState(), obj);
  save();
  emit('change');
}

export function resetProgress() {
  state = defaultState();
  save();
  emit('change');
}
