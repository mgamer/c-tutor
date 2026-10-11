// Checks that common beginner mistakes produce friendly errors on the right line.
import { run } from '../js/engine/interpreter.js';
const H = '#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n';
const cases = [
  ['missing semicolon', H + 'int main() {\n    cout << "hi"\n    return 0;\n}', 'compile', 6, /semicolon/],
  ['undeclared var', H + 'int main() {\n    x = 5;\n}', 'compile', 6, /not been declared/],
  ['case sensitivity', H + 'int main() {\n    Cout << 1;\n}', 'compile', 6, /not been declared/, /case-sensitive/],
  ['no using std', '#include <iostream>\nint main() {\n    cout << 1;\n}', 'compile', 3, /std/],
  ['string to int', H + 'int main() {\n    int x = "5";\n}', 'compile', 6, /text/],
  ['cout >>', H + 'int main() {\n    cout >> 5;\n}', 'compile', 6, /<</],
  ['missing brace', H + 'int main() {\n    if (true) {\n        cout << 1;\n    \n', 'compile', null, /\}/],
  ['vector oob', H + 'int main() {\n    vector<int> v = {1,2,3};\n    cout << v[3];\n}', 'runtime', 7, /out of range/],
  ['div zero', H + 'int main() {\n    int a = 0;\n    cout << 5 / a;\n}', 'runtime', 7, /zero/],
  ['infinite loop', H + 'int main() {\n    int i = 0;\n    while (i < 10) {\n        cout << "";\n    }\n}', 'runtime', 7, /infinite/],
  ['recursion', H + 'int f(int n) {\n    return f(n + 1);\n}\nint main() { f(1); }', 'runtime', 6, /stack overflow/i],
  ['no return', H + 'int f(int n) {\n    if (n > 0) return 1;\n}\nint main() { cout << f(-1); }', 'runtime', null, /without returning/],
  ['const', H + 'int main() {\n    const int x = 1;\n    x = 2;\n}', 'compile', 7, /const/],
  ['char vs string', H + 'int main() {\n    string s = "ab";\n    if (s[0] == "a") cout << 1;\n}', 'compile', 7, /char/],
  ['no main', H + 'int foo() { return 1; }', 'compile', 1, /main/],
  ['if semicolon', H + 'int main() {\n    if (1 > 0);\n    {}\n}', 'compile', 6, /;/],
  ['string + int', H + 'int main() {\n    string s = "a";\n    s = s + 5;\n}', 'compile', 7, /to_string/],
  ['String type', H + 'int main() {\n    String s = "a";\n}', 'compile', 6, /type/],
  ['print vector', H + 'int main() {\n    vector<int> v;\n    cout << v;\n}', 'compile', 7, /loop/],
  ['empty pop', H + 'int main() {\n    vector<int> v;\n    v.pop_back();\n}', 'runtime', 7, /empty/],
  ['ref param literal', H + 'void f(int& x) { x++; }\nint main() {\n    f(5);\n}', 'compile', 7, /reference/],
  ['size no parens', H + 'int main() {\n    string s;\n    cout << s.size;\n}', 'compile', 7, /brackets/],
];
let fail = 0;
for (const [name, code, kind, line, re, hintRe] of cases) {
  const r = run(code, '');
  const e = r.error;
  const ok = e && e.kind === kind && (line == null || e.line === line) && re.test(e.message + ' ' + (e.hint || '')) && (!hintRe || hintRe.test(e.hint || ''));
  if (!ok) fail++;
  console.log(`${ok ? '✓' : '✗'} ${name}: ${e ? `[${e.kind} L${e.line}] ${e.message} — ${e.hint || ''}` : 'NO ERROR ' + JSON.stringify(r.stdout)}`);
}
// warnings
const w = run(H + 'int main() {\n    int x = 1;\n    if (x = 2) cout << x;\n}', '');
console.log(w.warnings.length ? '✓ warning: ' + w.warnings[0].message : '✗ no warning'); if (!w.warnings.length) fail++;
const st = run(H + 'int main() {\n    int x;\n    cin >> x;\n    cout << x;\n}', '');
console.log(st.warnings.length ? '✓ starved: ' + st.warnings[0].message : '✗ no starved warning'); if (!st.warnings.length) fail++;
// performance
const t0 = Date.now();
const p = run(H + 'int main() {\n    long long s = 0;\n    for (int i = 0; i < 3000000; i++) { if (i % 3 == 0) s += i; }\n    cout << s;\n}', '');
console.log(`perf: 3M iterations in ${Date.now() - t0}ms -> ${p.stdout} ${p.error ? JSON.stringify(p.error) : ''}`);
const t1 = Date.now();
const fb = run(H + 'int fib(int n) { return n < 2 ? n : fib(n-1) + fib(n-2); }\nint main() { cout << fib(25); }', '');
console.log(`perf: fib(25) in ${Date.now() - t1}ms -> ${fb.stdout} ${fb.error ? JSON.stringify(fb.error) : ''}`);
process.exit(fail ? 1 : 0);
