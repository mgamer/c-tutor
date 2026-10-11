// Entry point: parse + compile + run a C++ program with the given stdin.
import { parse } from './parser.js';
import { compileProgram, Runtime } from './compiler.js';
import { CppError } from './lexer.js';

function toError(e, R) {
  if (e instanceof CppError) {
    const out = { kind: e.kind, message: e.message };
    if (e.line) out.line = e.line;
    if (e.col) out.col = e.col;
    if (e.hint) out.hint = e.hint;
    return out;
  }
  if (e instanceof RangeError) {
    const n = R && R.callNode;
    return { kind: 'runtime', message: 'Stack overflow: your functions call each other too deeply.', ...(n ? { line: n.line, col: n.col } : {}), hint: 'Does your recursive function have a base case that stops it?' };
  }
  return { kind: 'runtime', message: 'Internal error: ' + (e && e.message ? e.message : String(e)) };
}

/**
 * @returns {{stdout:string, error:null|{kind,message,line?,col?,hint?}, steps:number, exitCode:number|null, warnings:{line?:number,message:string}[]}}
 */
export function run(code, stdin = '') {
  const R = new Runtime(stdin);
  let prog;
  try {
    prog = compileProgram(parse(code), R);
  } catch (e) {
    return { stdout: '', error: toError(e), steps: 0, exitCode: null, warnings: [] };
  }
  let error = null, exitCode = null;
  try {
    exitCode = prog.run();
  } catch (e) {
    error = toError(e, R);
  }
  const warnings = [...prog.warnings];
  if (R.inputStarved) {
    warnings.push({ message: 'Your program tried to read input with cin, but the input box was empty.' });
  }
  return { stdout: R.out.join(''), error, steps: R.steps, exitCode, warnings };
}
