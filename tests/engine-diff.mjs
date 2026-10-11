// Differential test: every tests/cases/*.cpp must print the same in our interpreter as with real g++.
// Usage: node tests/engine-diff.mjs
import { readdirSync, readFileSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { run } from '../js/engine/interpreter.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'cases');
const tmp = mkdtempSync(join(tmpdir(), 'brickpp-'));
let fail = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith('.cpp')).sort()) {
  const code = readFileSync(join(dir, f), 'utf8');
  const inFile = join(dir, f.replace(/\.cpp$/, '.in'));
  const stdin = existsSync(inFile) ? readFileSync(inFile, 'utf8') : '';
  const exe = join(tmp, f + '.out');
  execFileSync('g++', ['-std=c++17', '-O0', '-o', exe, join(dir, f)]);
  const expected = execFileSync(exe, { input: stdin }).toString();
  const t0 = Date.now();
  const r = run(code, stdin);
  const ms = Date.now() - t0;
  if (r.error || r.stdout !== expected) {
    fail++;
    console.log(`✗ ${f}`, r.error || '');
    const a = r.stdout.split('\n'), b = expected.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) console.log(`  line ${i + 1}: got ${JSON.stringify(a[i])} want ${JSON.stringify(b[i])}`);
  } else console.log(`✓ ${f} (${ms}ms)`);
}
writeFileSync(join(tmp, 'done'), '');
process.exit(fail ? 1 : 0);
