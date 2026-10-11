// Runs every exercise solution (and starter) through OUR interpreter: solutions must pass, starters must not.
import { WORLDS } from '../js/data/exercises.js';
import { judge } from '../js/engine/judge.js';
import { run } from '../js/engine/interpreter.js';

const runFn = async (code, stdin) => run(code, stdin);
let fail = 0, n = 0;
for (const w of WORLDS) {
  for (const ex of w.exercises) {
    n++;
    const res = await judge(ex.solution, ex, runFn);
    if (!res.passed) {
      fail++;
      const bad = res.results.find((r) => !r.passed);
      console.log(`✗ ${ex.id} ${ex.title}:`, res.error || res.ruleFailures, bad && !res.error ? { stdin: bad.stdin, expected: bad.expected, actual: bad.actual } : '');
    }
    const st = await judge(ex.starter, ex, runFn);
    if (st.passed) { fail++; console.log(`✗ ${ex.id} starter already passes`); }
  }
}
console.log(`${n - fail}/${n} exercises OK in the interpreter`);
process.exit(fail ? 1 : 0);
