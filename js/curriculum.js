// Loads the course data and answers progression questions
// (what's unlocked, what's next, how far along a world is).
import { getState } from './game.js';

let WORLDS = [];
let QUIZ_TOPICS = [];

export async function loadCurriculum() {
  const [ex, qz] = await Promise.allSettled([import('./data/exercises.js'), import('./data/quiz.js')]);
  if (ex.status === 'fulfilled') WORLDS = ex.value.WORLDS || [];
  else console.warn('Could not load exercises', ex.reason);
  if (qz.status === 'fulfilled') QUIZ_TOPICS = qz.value.QUIZ_TOPICS || [];
  else console.warn('Could not load quiz', qz.reason);
  return { WORLDS, QUIZ_TOPICS };
}

export const worlds = () => WORLDS;
export const quizTopics = () => QUIZ_TOPICS;

export function findWorld(id) { return WORLDS.find((w) => w.id === id) || null; }

/** @returns {{world, ex, index, worldIndex}|null} */
export function findExercise(id) {
  for (let wi = 0; wi < WORLDS.length; wi++) {
    const w = WORLDS[wi];
    const i = (w.exercises || []).findIndex((e) => e.id === id);
    if (i >= 0) return { world: w, ex: w.exercises[i], index: i, worldIndex: wi };
  }
  return null;
}

const solved = (id) => !!getState().solved[id];
export const starsFor = (id) => (getState().solved[id] || {}).stars || 0;

export function worldProgress(w) {
  const exs = w.exercises || [];
  const done = exs.filter((e) => solved(e.id)).length;
  const stars = exs.reduce((n, e) => n + starsFor(e.id), 0);
  return { done, total: exs.length, stars, maxStars: exs.length * 3, complete: exs.length > 0 && done === exs.length };
}

export function isWorldUnlocked(w) {
  const i = WORLDS.indexOf(w);
  if (i <= 0) return true;
  if ((w.exercises || []).some((e) => solved(e.id))) return true;
  return worldProgress(WORLDS[i - 1]).complete;
}

export function isExerciseUnlocked(id) {
  const f = findExercise(id);
  if (!f) return false;
  if (solved(id)) return true;
  if (!isWorldUnlocked(f.world)) return false;
  return f.index === 0 || solved(f.world.exercises[f.index - 1].id);
}

/** The next exercise the player should do (first unsolved unlocked), or null when all done. */
export function nextExercise() {
  for (const w of WORLDS) {
    for (const e of w.exercises || []) {
      if (!solved(e.id) && isExerciseUnlocked(e.id)) return { world: w, ex: e };
    }
  }
  return null;
}

/** Exercise after `id` in course order (may be locked/solved). */
export function exerciseAfter(id) {
  const f = findExercise(id);
  if (!f) return null;
  if (f.index + 1 < f.world.exercises.length) return { world: f.world, ex: f.world.exercises[f.index + 1] };
  const nw = WORLDS[f.worldIndex + 1];
  return nw && nw.exercises && nw.exercises.length ? { world: nw, ex: nw.exercises[0] } : null;
}

export function totalExercises() {
  return WORLDS.reduce((n, w) => n + (w.exercises || []).length, 0);
}

export function isTopicUnlocked(t) {
  if (QUIZ_TOPICS.indexOf(t) === 0 || !t.unlockAfterWorld) return true;
  const w = findWorld(t.unlockAfterWorld);
  return !w || (w.exercises || []).some((e) => solved(e.id));
}
