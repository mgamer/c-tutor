#!/usr/bin/env node
// Validates Brick++ teaching content.
//
//   node tools/check-content.mjs            # schema + compile/run every exercise with g++
//   node tools/check-content.mjs --no-run   # schema checks only
//   node tools/check-content.mjs w5e4       # only run exercises whose id starts with w5e4
//
// For every exercise: the solution must compile with `g++ -std=c++17` and pass
// every test; the starter must fail at least one test (a compile error counts
// as failing); require/forbid regexes must accept the solution. Quiz topics
// get structural checks (answers in range, unique options, explanations...).

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir, cpus } from 'node:os';
import { join } from 'node:path';
import { WORLDS } from '../js/data/exercises.js';
import { QUIZ_TOPICS } from '../js/data/quiz.js';

const args = process.argv.slice(2);
const NO_RUN = args.includes('--no-run');
const FILTER = args.find((a) => !a.startsWith('--')) || '';

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

// ---- helpers mirroring js/engine/judge.js ----------------------------------
function normalizeOutput(s) {
  return String(s)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}
function stripCommentsAndStrings(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ')
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
}

// Constructs outside the interpreter's supported subset.
const SUBSET_LINT = [
  [/\bstd::/, 'std:: (use "using namespace std;")'],
  [/\b(printf|scanf|puts|getchar)\s*\(/, 'C stdio'],
  [/\bnew\b|\bdelete\b/, 'new/delete'],
  [/->/, 'pointer ->'],
  [/\b(class|template|typename|try|catch|throw|nullptr)\b/, 'unsupported keyword'],
  [/\b(map|set|unordered_map|unordered_set|pair|queue|stack|deque|list)\s*</, 'unsupported container'],
  [/\[\s*[&=]?\s*\]\s*\(/, 'lambda'],
  [/\bcin\s*\.\s*(ignore|get|peek|fail|clear)\b/, 'unsupported cin member'],
  [/\b(max_element|min_element|accumulate|count|find_if)\s*\(/, 'unsupported algorithm'],
  [/\bsrand\s*\(|\brand\s*\(/, 'rand (non-deterministic)'],
];
const ALLOWED_HEADERS = new Set(['iostream', 'string', 'vector', 'cmath', 'algorithm', 'iomanip', 'cstdlib', 'ctime']);

function lintSubset(where, code) {
  const bare = stripCommentsAndStrings(code);
  for (const [re, what] of SUBSET_LINT) if (re.test(bare)) err(where, `uses ${what}, outside the supported subset`);
  for (const m of code.matchAll(/#include\s*<([^>]+)>/g)) {
    if (!ALLOWED_HEADERS.has(m[1])) err(where, `includes unsupported header <${m[1]}>`);
  }
  if (!/using namespace std;/.test(code)) err(where, 'missing "using namespace std;"');
}

// ---- schema: exercises -------------------------------------------------------
const ids = new Set();
const worldIds = new Set();
let exerciseCount = 0;
let testCount = 0;
let prevXp = 0;

if (!Array.isArray(WORLDS) || WORLDS.length === 0) err('WORLDS', 'must be a non-empty array');
for (const w of WORLDS) {
  const W = `world ${w.id}`;
  for (const k of ['id', 'title', 'color', 'icon', 'intro']) if (typeof w[k] !== 'string' || !w[k]) err(W, `missing ${k}`);
  if (!/^#[0-9a-f]{6}$/i.test(w.color || '')) err(W, 'color must be #rrggbb');
  if (worldIds.has(w.id) || ids.has(w.id)) err(W, 'duplicate id');
  worldIds.add(w.id);
  ids.add(w.id);
  if (!Array.isArray(w.exercises) || !w.exercises.length) err(W, 'no exercises');
  for (const ex of w.exercises || []) {
    exerciseCount++;
    const E = `exercise ${ex.id}`;
    if (ids.has(ex.id)) err(E, 'duplicate id');
    ids.add(ex.id);
    if (!String(ex.id).startsWith(w.id + 'e')) warn(E, `id does not start with ${w.id}e`);
    for (const k of ['id', 'title', 'story', 'concept', 'task', 'starter', 'solution']) {
      if (typeof ex[k] !== 'string' || !ex[k].trim()) err(E, `missing ${k}`);
    }
    const words = (ex.concept || '').split(/\s+/).filter(Boolean).length;
    if (words < 50 || words > 260) warn(E, `concept is ${words} words (aim 80-200)`);
    if (!Array.isArray(ex.hints) || ex.hints.length < 2) err(E, 'needs at least 2 hints');
    if (!Array.isArray(ex.tests) || ex.tests.length < 1) err(E, 'needs tests');
    const readsInput = /\bcin\b|\bgetline\b/.test(stripCommentsAndStrings(ex.solution || ''));
    if (readsInput) {
      if (ex.tests.length < 3) err(E, 'reads input but has fewer than 3 tests');
      if (!ex.tests.some((t) => t.hidden)) err(E, 'reads input but has no hidden tests');
      if (ex.tests.every((t) => t.hidden)) err(E, 'all tests are hidden - show at least one');
    }
    for (const t of ex.tests || []) {
      testCount++;
      if (typeof t.expected !== 'string') err(E, 'test without expected string');
      if (t.stdin != null && typeof t.stdin !== 'string') err(E, 'test stdin must be a string');
    }
    if (typeof ex.xp !== 'number' || ex.xp <= 0) err(E, 'xp must be a positive number');
    if (ex.xp < prevXp) warn(E, `xp ${ex.xp} lower than previous ${prevXp}`);
    prevXp = ex.xp;
    for (const kind of ['require', 'forbid']) {
      if (ex[kind] == null) continue;
      if (!Array.isArray(ex[kind])) { err(E, `${kind} must be an array`); continue; }
      for (const r of ex[kind]) {
        if (typeof r.pattern !== 'string' || typeof r.message !== 'string') { err(E, `${kind} rule needs pattern+message`); continue; }
        try { new RegExp(r.pattern); } catch (e) { err(E, `${kind} regex invalid: ${e.message}`); }
      }
    }
    // require/forbid must accept the solution
    const bare = stripCommentsAndStrings(ex.solution || '');
    for (const r of ex.require || []) if (!new RegExp(r.pattern).test(bare)) err(E, `solution fails require /${r.pattern}/`);
    for (const r of ex.forbid || []) if (new RegExp(r.pattern).test(bare)) err(E, `solution hits forbid /${r.pattern}/`);
    lintSubset(`${E} solution`, ex.solution || '');
    lintSubset(`${E} starter`, ex.starter || '');
    // fenced code blocks in concept should be balanced
    for (const k of ['concept', 'task']) {
      const fences = ((ex[k] || '').match(/^```/gm) || []).length;
      if (fences % 2) err(E, `${k} has unbalanced \`\`\` fences`);
    }
  }
}

// ---- schema: quiz ------------------------------------------------------------
let questionCount = 0;
const answerPos = [0, 0, 0, 0, 0, 0];
const topicIds = new Set();
if (!Array.isArray(QUIZ_TOPICS) || !QUIZ_TOPICS.length) err('QUIZ_TOPICS', 'must be a non-empty array');
for (const t of QUIZ_TOPICS) {
  const T = `quiz ${t.id}`;
  for (const k of ['id', 'title', 'icon', 'color', 'unlockAfterWorld']) if (typeof t[k] !== 'string' || !t[k]) err(T, `missing ${k}`);
  if (topicIds.has(t.id)) err(T, 'duplicate id');
  topicIds.add(t.id);
  if (!worldIds.has(t.unlockAfterWorld)) err(T, `unlockAfterWorld "${t.unlockAfterWorld}" is not a world id`);
  if (!Array.isArray(t.questions) || t.questions.length < 10) err(T, 'needs at least 10 questions');
  const seen = new Set();
  (t.questions || []).forEach((q, i) => {
    questionCount++;
    const Q = `${T} q${i + 1}`;
    if (typeof q.q !== 'string' || !q.q) err(Q, 'missing q');
    if (seen.has(q.q + (q.code || ''))) err(Q, 'duplicate question');
    seen.add(q.q + (q.code || ''));
    if (!Array.isArray(q.options) || q.options.length < 2) err(Q, 'needs at least 2 options');
    else {
      if (new Set(q.options).size !== q.options.length) err(Q, 'duplicate options');
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) err(Q, 'answer index out of range');
      else answerPos[q.answer]++;
      if (q.options.some((o) => typeof o !== 'string' || !o.length)) err(Q, 'empty option');
    }
    if (typeof q.explain !== 'string' || q.explain.length < 15) err(Q, 'needs an explanation');
    if (q.code != null && typeof q.code !== 'string') err(Q, 'code must be a string');
    if (q.code && /\bstd::/.test(q.code)) warn(Q, 'code uses std::');
  });
}

// ---- compile & run -----------------------------------------------------------
function sh(cmd, argv, { input = '', timeout = 10000 } = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, argv, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let errOut = '';
    let killed = false;
    const timer = setTimeout(() => { killed = true; p.kill('SIGKILL'); }, timeout);
    p.stdout.on('data', (d) => { out += d; if (out.length > 1e6) { killed = true; p.kill('SIGKILL'); } });
    p.stderr.on('data', (d) => { errOut += d; });
    p.on('close', (code) => { clearTimeout(timer); resolve({ code, out, err: errOut, killed }); });
    p.stdin.on('error', () => {});
    p.stdin.end(input);
  });
}

const work = mkdtempSync(join(tmpdir(), 'brickpp-'));
let compiles = 0;
async function compileAndRun(name, code, tests) {
  const src = join(work, `${name}.cpp`);
  const bin = join(work, name);
  writeFileSync(src, code);
  compiles++;
  const c = await sh('g++', ['-std=c++17', '-O0', '-Wall', '-Wno-sign-compare', '-o', bin, src], { timeout: 60000 });
  if (c.code !== 0) return { compiled: false, compileError: c.err, results: [], warnings: '' };
  const results = [];
  for (const t of tests) {
    const r = await sh(bin, [], { input: t.stdin || '', timeout: 5000 });
    const ok = !r.killed && r.code === 0 && normalizeOutput(r.out) === normalizeOutput(t.expected);
    results.push({ ok, actual: r.out, exit: r.code, killed: r.killed, test: t });
  }
  return { compiled: true, results, warnings: c.err };
}

async function checkExercise(ex) {
  const E = `exercise ${ex.id}`;
  const sol = await compileAndRun(`${ex.id}_solution`, ex.solution, ex.tests);
  if (!sol.compiled) err(E, `solution does not compile:\n${sol.compileError}`);
  else {
    if (sol.warnings.trim()) warn(E, `solution compiler warnings:\n${sol.warnings.trim()}`);
    sol.results.forEach((r, i) => {
      if (!r.ok) {
        err(E, `solution fails test ${i + 1} (stdin ${JSON.stringify(r.test.stdin || '')})` +
          `${r.killed ? ' [timeout]' : ''}${r.exit ? ` [exit ${r.exit}]` : ''}\n  expected: ${JSON.stringify(r.test.expected)}\n  actual:   ${JSON.stringify(r.actual)}`);
      }
    });
  }
  const st = await compileAndRun(`${ex.id}_starter`, ex.starter, ex.tests);
  if (st.compiled && st.results.every((r) => r.ok)) err(E, 'starter passes every test - it must fail at least one');
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await fn(items[i++]); }));
}

const allExercises = WORLDS.flatMap((w) => w.exercises || []).filter((e) => e.id.startsWith(FILTER));
if (!NO_RUN) {
  await pool(allExercises, Math.max(2, Math.min(8, cpus().length)), checkExercise);
}
rmSync(work, { recursive: true, force: true });

// ---- report ----------------------------------------------------------------
const xpTotal = WORLDS.flatMap((w) => w.exercises).reduce((s, e) => s + (e.xp || 0), 0);
console.log(`Worlds: ${WORLDS.length}, exercises: ${exerciseCount}, tests: ${testCount}, total XP: ${xpTotal}`);
console.log(`Quiz topics: ${QUIZ_TOPICS.length}, questions: ${questionCount}, answer positions: ${answerPos.slice(0, 4).join('/')}`);
if (!NO_RUN) console.log(`Compiled & ran ${compiles} programs (${allExercises.length} exercises × solution + starter)`);
for (const w of warnings) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(errors.length ? `\nFAILED with ${errors.length} error(s)` : '\nAll content checks passed.');
process.exit(errors.length ? 1 : 0);
