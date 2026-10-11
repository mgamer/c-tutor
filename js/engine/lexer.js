// Tokenizer for the C++ teaching subset.

export class CppError extends Error {
  constructor(kind, message, line, col, hint) {
    super(message);
    this.kind = kind; // 'compile' | 'runtime'
    this.line = line;
    this.col = col;
    this.hint = hint;
  }
}

const PUNCT = [
  '<<=', '>>=', '...', '->*',
  '::', '->', '++', '--', '<<', '>>', '<=', '>=', '==', '!=', '&&', '||',
  '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=',
  '{', '}', '(', ')', '[', ']', ';', ',', '.', '?', ':', '+', '-', '*', '/', '%',
  '<', '>', '=', '!', '~', '&', '|', '^', '#',
];

const ESCAPES = { n: '\n', t: '\t', r: '\r', '0': '\0', '\\': '\\', "'": "'", '"': '"', a: '\x07', b: '\b', f: '\f', v: '\v', '?': '?' };

export const KNOWN_HEADERS = new Set([
  'iostream', 'string', 'vector', 'cmath', 'math.h', 'algorithm', 'iomanip', 'cstdlib', 'stdlib.h', 'ctime', 'time.h',
  'climits', 'limits', 'numeric', 'cctype', 'utility', 'bits/stdc++.h', 'cstdio', 'sstream', 'array', 'string.h', 'cstring',
]);

/**
 * Turns source code into tokens: {t:'id'|'num'|'str'|'char'|'op'|'eof', v, line, col, ...}
 * Also handles preprocessor lines (#include, #define).
 */
export function tokenize(src) {
  const toks = [];
  const defines = new Map();
  const includes = [];
  let i = 0, line = 1, col = 1;
  const n = src.length;
  let lineStart = true; // only whitespace seen so far on this line

  const err = (msg, l = line, c = col, hint) => { throw new CppError('compile', msg, l, c, hint); };
  const adv = (k = 1) => {
    for (let j = 0; j < k; j++) {
      if (src[i] === '\n') { line++; col = 1; lineStart = true; } else col++;
      i++;
    }
  };

  while (i < n) {
    const ch = src[i];
    if (ch === '\n' || ch === ' ' || ch === '\t' || ch === '\r' || ch === '\f' || ch === '\v') { adv(); continue; }
    if (ch === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') adv(); continue; }
    if (ch === '/' && src[i + 1] === '*') {
      const l0 = line, c0 = col;
      adv(2);
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) adv();
      if (i >= n) err('This comment is never closed. Add */ to end it.', l0, c0);
      adv(2);
      continue;
    }
    const startLine = line, startCol = col;
    if (ch === '#' && lineStart) {
      // Preprocessor directive: read to end of line.
      let j = i;
      while (j < n && src[j] !== '\n') j++;
      const text = src.slice(i + 1, j).replace(/\/\/.*$/, '').trim();
      adv(j - i);
      const m = /^(\w+)\s*(.*)$/.exec(text);
      if (!m) continue;
      const [, dir, rest] = m;
      if (dir === 'include') {
        const hm = /^[<"]([^>"]+)[>"]$/.exec(rest.trim());
        if (!hm) err('#include needs a header name like <iostream>.', startLine, startCol);
        const h = hm[1].trim();
        if (!KNOWN_HEADERS.has(h)) {
          err(`The header <${h}> is not available in this playground.`, startLine, startCol,
            'Try <iostream>, <string>, <vector>, <cmath>, <algorithm> or <iomanip>.');
        }
        includes.push(h);
      } else if (dir === 'define') {
        const dm = /^([A-Za-z_]\w*)\s*(.*)$/.exec(rest);
        if (!dm) err('#define needs a name.', startLine, startCol);
        if (rest.slice(dm[1].length).startsWith('(')) err('Function-like macros are not supported here — use a function instead!', startLine, startCol);
        defines.set(dm[1], tokenize(dm[2]).tokens.filter((t) => t.t !== 'eof'));
      } else if (dir === 'pragma' || dir === 'ifndef' || dir === 'endif' || dir === 'ifdef') {
        // ignore
      } else {
        err(`Unsupported preprocessor directive #${dir}.`, startLine, startCol);
      }
      continue;
    }
    lineStart = false;
    // identifiers / keywords
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      adv(j - i);
      if (defines.has(word)) {
        for (const dt of defines.get(word)) toks.push({ ...dt, line: startLine, col: startCol });
      } else {
        toks.push({ t: 'id', v: word, line: startLine, col: startCol });
      }
      continue;
    }
    // numbers
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      let j = i;
      let isFloat = false;
      let value;
      if (ch === '0' && (src[j + 1] === 'x' || src[j + 1] === 'X')) {
        j += 2;
        while (j < n && /[0-9a-fA-F']/.test(src[j])) j++;
        value = parseInt(src.slice(i + 2, j).replace(/'/g, ''), 16);
      } else if (ch === '0' && (src[j + 1] === 'b' || src[j + 1] === 'B')) {
        j += 2;
        while (j < n && /[01']/.test(src[j])) j++;
        value = parseInt(src.slice(i + 2, j).replace(/'/g, ''), 2);
      } else {
        while (j < n && /[0-9']/.test(src[j])) j++;
        if (src[j] === '.') { isFloat = true; j++; while (j < n && /[0-9]/.test(src[j])) j++; }
        if ((src[j] === 'e' || src[j] === 'E') && /[0-9+-]/.test(src[j + 1] || '')) {
          isFloat = true; j++;
          if (src[j] === '+' || src[j] === '-') j++;
          while (j < n && /[0-9]/.test(src[j])) j++;
        }
        const txt = src.slice(i, j).replace(/'/g, '');
        value = isFloat ? parseFloat(txt) : (txt.length > 1 && txt[0] === '0' ? parseInt(txt, 8) : parseInt(txt, 10));
      }
      let isLong = false, isFloatSuffix = false;
      while (j < n && /[uUlLfF]/.test(src[j])) {
        if (/[lL]/.test(src[j])) isLong = true;
        if (/[fF]/.test(src[j])) isFloatSuffix = true;
        j++;
      }
      if (j < n && /[A-Za-z_]/.test(src[j])) err(`"${src.slice(i, j + 1)}" is not a valid number.`, startLine, startCol, 'Variable names cannot start with a digit.');
      adv(j - i);
      if (!isFloat && value > 2147483647) isLong = true;
      toks.push({ t: 'num', v: value, isFloat: isFloat || (isFloatSuffix && isFloat), isLong, line: startLine, col: startCol });
      continue;
    }
    // string literal (adjacent literals are joined)
    if (ch === '"') {
      let s = '';
      adv();
      while (true) {
        if (i >= n || src[i] === '\n') err('This text (string) is missing its closing " quote.', startLine, startCol);
        const c = src[i];
        if (c === '"') { adv(); break; }
        if (c === '\\') {
          const e = src[i + 1];
          if (!(e in ESCAPES)) err(`Unknown escape sequence \\${e}.`, line, col, 'Use \\n for a new line, \\t for a tab, \\" for a quote and \\\\ for a backslash.');
          s += ESCAPES[e];
          adv(2);
          continue;
        }
        s += c;
        adv();
      }
      const prev = toks[toks.length - 1];
      if (prev && prev.t === 'str' && prev.adjacentOk) prev.v += s;
      else toks.push({ t: 'str', v: s, line: startLine, col: startCol, adjacentOk: true });
      continue;
    }
    if (ch === "'") {
      adv();
      let c = src[i];
      let code;
      if (c === '\\') {
        const e = src[i + 1];
        if (!(e in ESCAPES)) err(`Unknown escape sequence \\${e}.`, line, col);
        code = ESCAPES[e].charCodeAt(0);
        adv(2);
      } else if (c === "'" || c === '\n' || c === undefined) {
        err("A char needs exactly one character between single quotes, like 'a'.", startLine, startCol);
      } else {
        code = c.charCodeAt(0);
        adv();
      }
      if (src[i] !== "'") {
        err("A char can only hold ONE character between single quotes. For text use double quotes: \"hello\".", startLine, startCol);
      }
      adv();
      toks.push({ t: 'char', v: code, line: startLine, col: startCol });
      continue;
    }
    let op = null;
    for (const p of PUNCT) {
      if (src.startsWith(p, i)) { op = p; break; }
    }
    if (!op) err(`Unexpected character "${ch}".`, startLine, startCol);
    adv(op.length);
    toks.push({ t: 'op', v: op, line: startLine, col: startCol });
  }
  toks.push({ t: 'eof', v: '<end of program>', line, col });
  return { tokens: toks, includes };
}
