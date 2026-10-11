// Checks a student's program against an exercise's tests.

/** Normalise output so trailing spaces / final newlines don't matter. */
export function normalizeOutput(s) {
  return String(s)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

/** Strip comments and string literals so `require` patterns only match real code. */
export function codeWithoutCommentsAndStrings(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ')
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
}

/**
 * @param {string} code
 * @param {{tests:{stdin?:string, expected:string, hidden?:boolean}[], require?:{pattern:string,message:string}[], forbid?:{pattern:string,message:string}[]}} exercise
 * @param {(code:string, stdin:string)=>Promise<{stdout:string,error:any}>} runFn
 */
export async function judge(code, exercise, runFn) {
  const bare = codeWithoutCommentsAndStrings(code);
  const ruleFailures = [];
  for (const r of exercise.require || []) {
    if (!new RegExp(r.pattern).test(bare)) ruleFailures.push(r.message);
  }
  for (const r of exercise.forbid || []) {
    if (new RegExp(r.pattern).test(bare)) ruleFailures.push(r.message);
  }
  const results = [];
  let error = null;
  for (const t of exercise.tests) {
    const res = await runFn(code, t.stdin || '');
    const passed = !res.error && normalizeOutput(res.stdout) === normalizeOutput(t.expected);
    results.push({ stdin: t.stdin || '', expected: t.expected, actual: res.stdout, passed, hidden: !!t.hidden, error: res.error });
    if (res.error) { error = res.error; break; }
  }
  const passed = !error && ruleFailures.length === 0 && results.every((r) => r.passed);
  return { passed, results, error, ruleFailures };
}
