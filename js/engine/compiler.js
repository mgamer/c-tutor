// Compiles the AST into JavaScript closures with C++ semantics (static types,
// integer arithmetic, value/reference semantics) and runs them.
import { CppError } from './lexer.js';

// ---------- types ----------
const T = {
  int: { k: 'int' }, long: { k: 'long' }, double: { k: 'double' }, float: { k: 'float' }, char: { k: 'char' },
  bool: { k: 'bool' }, string: { k: 'string' }, void: { k: 'void' }, ostream: { k: 'ostream' }, istream: { k: 'istream' },
  manip: { k: 'manip' },
};
const NUMERIC = new Set(['int', 'long', 'double', 'float', 'char', 'bool']);
const INTEGRAL = new Set(['int', 'long', 'char', 'bool']);
const isNum = (t) => NUMERIC.has(t.k);
const isIntegral = (t) => INTEGRAL.has(t.k);
const isFloat = (t) => t.k === 'double' || t.k === 'float';
const isAggregate = (t) => t.k === 'vector' || t.k === 'struct' || t.k === 'array';

export function typeName(t) {
  switch (t.k) {
    case 'vector': return `vector<${typeName(t.elem)}>`;
    case 'array': return `${typeName(t.elem)}[]`;
    case 'struct': return t.name;
    case 'long': return t.unsigned ? 'unsigned long' : 'long long';
    case 'int': return t.unsigned ? 'unsigned int' : 'int';
    case 'ostream': return 'cout';
    case 'istream': return 'cin';
    case 'iter': return 'iterator';
    case 'fnref': return 'function';
    case 'manip': return 'stream manipulator';
    default: return t.k;
  }
}
const article = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const describeType = (t) => {
  const n = typeName(t);
  if (t.k === 'string') return 'text (string)';
  if (t.k === 'char') return 'a single character (char)';
  return n;
};

function sameType(a, b) {
  if (a.k !== b.k) return false;
  if (a.k === 'vector' || a.k === 'array') return sameType(a.elem, b.elem);
  if (a.k === 'struct') return a.name === b.name;
  return true;
}

// Control-flow signals returned by compiled statements.
const BRK = 1, CNT = 2, RET = 3;

// Locations (lvalues) used by references and assignments.
class Loc {
  constructor(c, k) { this.c = c; this.k = k; }
  get() { return this.c[this.k]; }
  set(v) { this.c[this.k] = v; }
}
class CharLoc {
  constructor(base, i, R, node) { this.base = base; this.i = i; this.R = R; this.node = node; }
  get() { const s = this.base.get(); return this.i < s.length ? s.charCodeAt(this.i) : 0; }
  set(v) {
    const s = this.base.get();
    if (this.i >= s.length) this.R.fail(this.node, `Index ${this.i} is outside the string (size ${s.length}).`);
    this.base.set(s.slice(0, this.i) + String.fromCharCode(v & 0xff) + s.slice(this.i + 1));
  }
}
class TempLoc {
  constructor(v) { this.v = v; }
  get() { return this.v; }
  set(v) { this.v = v; }
}

class ExitSignal { constructor(code) { this.code = code; } }

// ---------- number formatting (matches printf %g / %f) ----------
export function formatDouble(v, prec, mode) {
  if (Number.isNaN(v)) return 'nan';
  if (!Number.isFinite(v)) return v < 0 ? '-inf' : 'inf';
  if (mode === 'fixed') return fixedStr(v, prec);
  if (mode === 'scientific') return expStr(v, prec);
  let p = prec === 0 ? 1 : prec;
  if (v === 0) return Object.is(v, -0) ? '-0' : '0';
  const e = v.toExponential(p - 1);
  const X = parseInt(e.slice(e.indexOf('e') + 1), 10);
  if (X < -4 || X >= p) {
    let [m, ex] = e.split('e');
    if (m.includes('.')) m = m.replace(/0+$/, '').replace(/\.$/, '');
    const sign = ex[0] === '-' ? '-' : '+';
    let digits = ex.replace(/^[+-]/, '');
    if (digits.length < 2) digits = '0' + digits;
    return `${m}e${sign}${digits}`;
  }
  let s = fixedStr(v, Math.max(0, p - 1 - X));
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}
function fixedStr(v, p) {
  if (Math.abs(v) < 1e21) return v.toFixed(Math.min(p, 100));
  return BigInt(Math.round(v)).toString() + (p > 0 ? '.' + '0'.repeat(p) : '');
}
function expStr(v, p) {
  let [m, ex] = v.toExponential(Math.min(p, 100)).split('e');
  const sign = ex[0] === '-' ? '-' : '+';
  let digits = ex.replace(/^[+-]/, '');
  if (digits.length < 2) digits = '0' + digits;
  return `${m}e${sign}${digits}`;
}

// ---------- edit distance for "did you mean" ----------
function lev(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[m][n];
}
function suggest(name, candidates) {
  let best = null, bestD = Infinity;
  for (const c of candidates) {
    if (c.toLowerCase() === name.toLowerCase()) return c;
    const dd = lev(name, c);
    if (dd < bestD) { bestD = dd; best = c; }
  }
  return bestD <= Math.max(1, Math.floor(name.length / 3)) ? best : null;
}

const STD_IDENTS = new Set(['cout', 'cin', 'endl', 'fixed', 'scientific', 'defaultfloat', 'boolalpha', 'noboolalpha', 'left', 'right', 'string::npos', 'showpoint', 'noshowpoint']);
const GLOBAL_CONSTS = {
  INT_MAX: [2147483647, T.int], INT_MIN: [-2147483648, T.int], LLONG_MAX: [9223372036854775807, T.long], LLONG_MIN: [-9223372036854775808, T.long],
  LONG_MAX: [9223372036854775807, T.long], LONG_MIN: [-9223372036854775808, T.long],
  UINT_MAX: [4294967295, T.long], RAND_MAX: [2147483647, T.int], M_PI: [Math.PI, T.double], M_E: [Math.E, T.double],
  NULL: [0, T.int], nullptr: [0, T.int], EOF: [-1, T.int], CHAR_MAX: [127, T.int], CHAR_MIN: [-128, T.int],
};
const MATH1 = {
  sqrt: Math.sqrt, cbrt: Math.cbrt, floor: Math.floor, ceil: Math.ceil, trunc: Math.trunc, fabs: Math.abs,
  round: (x) => (x < 0 ? -Math.round(-x) : Math.round(x)),
  log: Math.log, log2: Math.log2, log10: Math.log10, exp: Math.exp, sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
};
const MATH2 = { pow: Math.pow, atan2: Math.atan2, hypot: Math.hypot, fmod: (a, b) => a % b, fmax: Math.max, fmin: Math.min };
const CTYPE = {
  isdigit: (c) => c >= 48 && c <= 57,
  isalpha: (c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122),
  isalnum: (c) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122),
  isupper: (c) => c >= 65 && c <= 90,
  islower: (c) => c >= 97 && c <= 122,
  isspace: (c) => c === 32 || (c >= 9 && c <= 13),
  ispunct: (c) => c > 32 && c < 127 && !((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122)),
};
// Functions that need the std namespace when called without std::
const STD_FUNCS = new Set(['max', 'min', 'swap', 'sort', 'reverse', 'to_string', 'stoi', 'stol', 'stoll', 'stod', 'stof', 'getline',
  'count', 'find', 'max_element', 'min_element', 'accumulate', 'fill', 'setprecision', 'setw', 'setfill']);

export const LIMITS = { steps: 20_000_000, output: 200_000, depth: 2500 };

export class Runtime {
  constructor(stdin) {
    this.stdin = String(stdin || '').replace(/\r\n/g, '\n');
    this.pos = 0;
    this.failed = false;
    this.out = [];
    this.outLen = 0;
    this.steps = 0;
    this.depth = 0;
    this.retVal = undefined;
    this.prec = 6; this.floatMode = 'general'; this.width = 0; this.fill = ' '; this.leftAlign = false; this.boolalpha = false;
    this.seed = 1;
    this.inputStarved = false;
    this.currentLine = 0;
  }
  fail(node, msg, hint) { throw new CppError('runtime', msg, node && node.line, node && node.col, hint); }
  step(node) {
    if (++this.steps > LIMITS.steps) {
      this.fail(node, 'Your program ran too many steps and was stopped. This is probably an infinite loop.',
        'Check the loop on this line: does its condition ever become false?');
    }
  }
  write(s) {
    if (this.width > 0) {
      const w = this.width;
      this.width = 0;
      if (s.length < w) s = this.leftAlign ? s + this.fill.repeat(w - s.length) : this.fill.repeat(w - s.length) + s;
    }
    this.out.push(s);
    this.outLen += s.length;
    if (this.outLen > LIMITS.output) {
      throw new CppError('runtime', 'Your program printed way too much output and was stopped.', this.currentLine, 1,
        'Maybe a loop that prints never stops?');
    }
  }
  // --- input ---
  skipWs() {
    const s = this.stdin;
    while (this.pos < s.length && /\s/.test(s[this.pos])) this.pos++;
  }
  noteEof() {
    if (this.stdin.trim() === '') this.inputStarved = true;
    this.failed = true;
  }
  readToken() {
    if (this.failed) return null;
    this.skipWs();
    const s = this.stdin;
    if (this.pos >= s.length) { this.noteEof(); return null; }
    let j = this.pos;
    while (j < s.length && !/\s/.test(s[j])) j++;
    const tok = s.slice(this.pos, j);
    this.pos = j;
    return tok;
  }
  readNumber(re) {
    if (this.failed) return null;
    this.skipWs();
    if (this.pos >= this.stdin.length) { this.noteEof(); return null; }
    re.lastIndex = this.pos;
    const m = re.exec(this.stdin);
    if (!m || m.index !== this.pos || m[0] === '' || m[0] === '+' || m[0] === '-') { this.failed = true; return 0; }
    this.pos += m[0].length;
    return m[0];
  }
  readChar() {
    if (this.failed) return null;
    this.skipWs();
    if (this.pos >= this.stdin.length) { this.noteEof(); return null; }
    return this.stdin.charCodeAt(this.pos++);
  }
  readLine(delim = '\n') {
    if (this.failed) return null;
    const s = this.stdin;
    if (this.pos >= s.length) { this.noteEof(); return null; }
    let j = s.indexOf(delim, this.pos);
    let line;
    if (j < 0) { line = s.slice(this.pos); this.pos = s.length; } else { line = s.slice(this.pos, j); this.pos = j + 1; }
    return line;
  }
  rand() {
    // glibc-like LCG (deterministic per seed)
    this.seed = (Math.imul(this.seed, 1103515245) + 12345) >>> 0;
    return (this.seed >>> 1) & 0x7fffffff;
  }
}

// ---------- the compiler ----------
class Scope {
  constructor(parent, fn) { this.parent = parent; this.fn = fn; this.vars = new Map(); }
  lookup(name) {
    for (let s = this; s; s = s.parent) { const v = s.vars.get(name); if (v) return v; }
    return null;
  }
  allNames() {
    const out = [];
    for (let s = this; s; s = s.parent) out.push(...s.vars.keys());
    return out;
  }
}

export function compileProgram(ast, R) {
  const G = []; // global storage
  const structs = new Map();
  const funcs = new Map(); // name -> [fnInfo]
  const warnings = [];
  const usedFns = [];
  const globalInits = [];
  const globalFn = { nSlots: 0, isGlobal: true };
  const globalScope = new Scope(null, globalFn);

  const cerr = (node, msg, hint) => { throw new CppError('compile', msg, node && node.line, node && node.col, hint); };
  const warn = (node, msg) => warnings.push({ line: node.line, col: node.col, message: msg });

  // ----- type resolution -----
  function resolveType(t, node) {
    if (t.k === 'struct') {
      const def = structs.get(t.name);
      if (!def) cerr(node || t, `Unknown type "${t.name}".`);
      return { k: 'struct', name: t.name, def, isConst: t.isConst };
    }
    if (t.k === 'vector') return { k: 'vector', elem: resolveType(t.elem, node), isConst: t.isConst };
    if (t.k === 'array') return { k: 'array', elem: resolveType(t.elem, node) };
    if (t.k === 'iter') return { ...t, elem: resolveType(t.elem, node) };
    if (t.k === 'float') return { k: 'double', float: true, isConst: t.isConst };
    return t;
  }
  const strip = (t) => (t.isConst ? { ...t, isConst: false } : t);

  // ----- conversions -----
  // Returns fn(v)->v' converting a value of type `from` to type `to`, or null if identity.
  function convFn(from, to, node, what = 'store') {
    if (to.k === 'auto') return null;
    if (isNum(to) && isNum(from)) {
      switch (to.k) {
        case 'int':
          if (to.unsigned) return (v) => (typeof v === 'boolean' ? +v : Math.trunc(v)) >>> 0;
          if (from.k === 'int' && !from.unsigned) return null;
          if (from.k === 'char') return null;
          if (from.k === 'bool') return (v) => (v ? 1 : 0);
          if (isFloat(from)) return (v) => (Number.isFinite(v) ? Math.trunc(v) | 0 : -2147483648);
          return (v) => v | 0; // long -> int wraps
        case 'long':
          if (from.k === 'bool') return (v) => (v ? 1 : 0);
          if (isFloat(from)) return (v) => (Number.isFinite(v) ? Math.trunc(v) : -9223372036854775808);
          return null;
        case 'char':
          if (from.k === 'char') return null;
          if (from.k === 'bool') return (v) => (v ? 1 : 0);
          return (v) => (Math.trunc(v) << 24) >> 24;
        case 'bool':
          if (from.k === 'bool') return null;
          return (v) => v !== 0;
        case 'double':
          if (from.k === 'bool') return (v) => (v ? 1 : 0);
          if (to.float) return (v) => Math.fround(v);
          return null;
        default:
      }
    }
    if (to.k === 'string' && from.k === 'string') return null;
    if (to.k === 'string' && from.k === 'char' && what === 'construct') return (v) => String.fromCharCode(v);
    if (sameType(strip(to), strip(from))) return null;
    if (to.k === 'array' && from.k === 'array') return null;
    // nice errors
    if (to.k === 'string' && isNum(from)) {
      if (from.k === 'char') cerr(node, `Can't put a char into a string variable like this.`, 'Use double quotes "a" for text, or string(1, c).');
      cerr(node, `Can't put a number into a string variable.`, 'Use to_string(x) to turn a number into text.');
    }
    if (isNum(to) && from.k === 'string') {
      if (to.k === 'char') cerr(node, `Can't put text (a string) into a char variable.`, "A char holds one character in single quotes, like 'a'.");
      cerr(node, `Can't put text (a string) into ${article(typeName(to))} variable.`, 'Use stoi(s) to turn text into an int, or stod(s) for a double.');
    }
    if (to.k === 'void') cerr(node, 'This function is void, so it cannot return a value.');
    if (from.k === 'void') cerr(node, 'This function is void — it does not give back a value you can use.');
    cerr(node, `Type mismatch: expected ${describeType(to)} but got ${describeType(from)}.`);
  }
  const conv = (c, to, node, what) => {
    const fn = convFn(c.t, to, node, what);
    if (!fn) return c.ev;
    const ev = c.ev;
    return (f) => fn(ev(f));
  };

  // ----- copies and defaults -----
  function copier(t) {
    if (t.k === 'vector' || t.k === 'array') {
      const ce = copier(t.elem);
      return ce ? (v) => v.map(ce) : (v) => v.slice();
    }
    if (t.k === 'struct') {
      return (v) => {
        const o = {};
        for (const fd of t.def.fields) { const c = fd.copy; o[fd.name] = c ? c(v[fd.name]) : v[fd.name]; }
        return o;
      };
    }
    return null;
  }
  function defaultFn(t) {
    switch (t.k) {
      case 'int': case 'long': case 'char': case 'double': return () => 0;
      case 'bool': return () => false;
      case 'string': return () => '';
      case 'vector': return () => [];
      case 'struct': return () => makeStruct(t.def);
      case 'array': {
        const de = defaultFn(t.elem);
        const sz = t.sizeEv;
        if (!sz) return () => [];
        return (f) => {
          const n = sz(f);
          const a = new Array(n);
          for (let i = 0; i < n; i++) a[i] = de(f);
          return a;
        };
      }
      default: return () => undefined;
    }
  }
  function makeStruct(def) {
    const o = {};
    for (const fd of def.fields) o[fd.name] = fd.init ? fd.init() : fd.def();
    return o;
  }

  // ----- declarations -----
  function declareVar(scope, name, type, node, isRef = false) {
    if (scope.vars.has(name)) cerr(node, `"${name}" was already declared in this block.`, 'Give the new variable a different name, or remove the type to change the existing one.');
    if (funcs.has(name) && scope === globalScope) cerr(node, `"${name}" is already the name of a function.`);
    const fn = scope.fn;
    const slot = fn.isGlobal ? G.length : fn.nSlots++;
    if (fn.isGlobal) G.push(undefined);
    const info = { name, type, slot, isRef, isGlobal: !!fn.isGlobal, isConst: !!type.isConst, line: node.line };
    scope.vars.set(name, info);
    return info;
  }

  // Compile an initializer (expression or {list}) into fn(f)->value of type t.
  function compileInit(t, init, scope, node) {
    if (init.type === 'InitList') return initFromList(t, init, scope);
    const c = compileExpr(init, scope);
    if (t.k === 'array') {
      if (c.t.k === 'string') cerr(node, 'C-style char arrays are not supported. Use a string instead: string s = "...";');
      cerr(node, 'An array must be initialized with a { } list.');
    }
    if (t.k === 'string' && c.t.k === 'char') cerr(init, "Can't initialize a string with a single char like 'a'.", 'Use double quotes: "a".');
    const ev = conv(c, t, init);
    if (isAggregate(t)) {
      const cp = copier(t);
      return (f) => cp(ev(f));
    }
    return ev;
  }

  function initFromList(t, list, scope) {
    const items = list.items;
    if (t.k === 'vector' || t.k === 'array') {
      const evs = items.map((it) => compileInit(t.elem, it, scope, it));
      if (t.k === 'vector') return (f) => evs.map((e) => e(f));
      const de = defaultFn(t.elem);
      const sz = t.sizeEv;
      return (f) => {
        const n = sz ? sz(f) : evs.length;
        if (evs.length > n) R.fail(list, `Too many values in { } for an array of size ${n}.`);
        const a = new Array(n);
        for (let i = 0; i < n; i++) a[i] = i < evs.length ? evs[i](f) : de(f);
        return a;
      };
    }
    if (t.k === 'struct') {
      const def = t.def;
      if (def.ctors.length) return compileCtorCall(def, items, scope, list);
      if (items.length > def.fields.length) cerr(list, `Too many values for struct ${def.name} (it has ${def.fields.length} fields).`);
      const evs = items.map((it, i) => compileInit(def.fields[i].type, it, scope, it));
      return (f) => {
        const o = makeStruct(def);
        for (let i = 0; i < evs.length; i++) o[def.fields[i].name] = evs[i](f);
        return o;
      };
    }
    if (t.k === 'string' && items.length === 0) return () => '';
    if (items.length === 0) { const d = defaultFn(t); return d; }
    if (items.length !== 1) cerr(list, `A ${typeName(t)} needs exactly one value in { }.`);
    return compileInit(t, items[0], scope, items[0]);
  }

  function compileCtorArgs(t, args, scope, node) {
    if (t.k === 'vector') {
      if (args.length === 0) return () => [];
      const n = conv(compileExpr(args[0], scope), T.long, args[0]);
      const val = args[1] ? compileInit(t.elem, args[1], scope, args[1]) : defaultFn(t.elem);
      if (args.length > 2) cerr(node, 'vector(n, value) takes at most 2 values.');
      return (f) => {
        const k = n(f);
        if (k < 0 || k > 1e8) R.fail(node, `Can't make a vector of size ${k}.`);
        const a = new Array(k);
        for (let i = 0; i < k; i++) a[i] = val(f);
        return a;
      };
    }
    if (t.k === 'string') {
      if (args.length === 0) return () => '';
      if (args.length === 1) return compileInit(t, args[0], scope, node);
      const n = conv(compileExpr(args[0], scope), T.long, args[0]);
      const c = conv(compileExpr(args[1], scope), T.char, args[1]);
      return (f) => String.fromCharCode(c(f) & 0xff).repeat(Math.max(0, n(f)));
    }
    if (t.k === 'struct') {
      if (t.def.ctors.length) return compileCtorCall(t.def, args, scope, node);
      if (args.length === 0) return () => makeStruct(t.def);
      cerr(node, `Struct ${t.name} has no constructor. Use { } to give values: ${t.name} x = {...};`);
    }
    if (args.length !== 1) cerr(node, `A ${typeName(t)} needs exactly one value.`);
    return compileInit(t, args[0], scope, node);
  }

  function compileVarDecl(stmt, scope) {
    const parts = [];
    for (const d of stmt.decls) {
      let t = resolveType(d.type, d);
      if (t.k === 'void') cerr(d, 'A variable cannot have type void.');
      if (d.dims.length) {
        for (let i = d.dims.length - 1; i >= 0; i--) {
          const dim = d.dims[i];
          let sizeEv = null;
          if (dim) {
            const dc = compileExpr(dim, scope);
            if (!isIntegral(dc.t)) cerr(dim, 'Array size must be a whole number.');
            const de = conv(dc, T.long, dim);
            sizeEv = (f) => {
              const n = de(f);
              if (n < 0 || n > 1e7) R.fail(dim, `Can't make an array of size ${n}.`);
              return n;
            };
          } else if (i !== 0 || !d.init) {
            cerr(d, 'This array needs a size, like int a[5];');
          }
          t = { k: 'array', elem: t, sizeEv };
        }
      }
      if (t.k === 'auto') {
        if (!d.init || d.init.type === 'InitList') cerr(d, 'auto needs a value to figure out the type, like: auto x = 5;');
        const c = compileExpr(d.init, scope);
        if (c.t.k === 'void') cerr(d, 'This function is void — it does not give back a value.');
        t = { ...strip(c.t), lit: false, isConst: d.type.isConst };
        if (c.t.k === 'iter' || c.t.k === 'fnref' || c.t.k === 'ostream' || c.t.k === 'istream') t = c.t;
      }
      if (d.isRef) {
        if (!d.init) cerr(d, `Reference "${d.name}" must be set to a variable when it's created: ${typeName(t)}& ${d.name} = other;`);
        const c = compileExpr(d.init, scope);
        if (!sameType(strip(t), strip(c.t))) cerr(d, `A ${typeName(t)}& reference must refer to a ${typeName(t)}, not ${typeName(c.t)}.`);
        const lv = c.lv || (t.isConst ? ((ev) => (f) => new TempLoc(ev(f)))(c.ev) : null);
        if (!lv) cerr(d, 'A reference must refer to a variable.');
        const info = declareVar(scope, d.name, t, d, true);
        if (info.isGlobal) cerr(d, 'Global references are not supported.');
        const s = info.slot;
        parts.push((f) => { f[s] = lv(f); });
        continue;
      }
      let ev;
      if (d.init) ev = compileInit(t, d.init, scope, d);
      else if (d.ctorArgs) ev = compileCtorArgs(t, d.ctorArgs, scope, d);
      else {
        if (t.isConst) cerr(d, `The constant "${d.name}" needs a value: const ${typeName(t)} ${d.name} = ...;`);
        if (t.k === 'struct' && t.def.ctors.length) ev = compileCtorCall(t.def, [], scope, d);
        else ev = defaultFn(t);
      }
      const info = declareVar(scope, d.name, t, d);
      const s = info.slot;
      if (info.isGlobal) parts.push((f) => { G[s] = ev(f); });
      else parts.push((f) => { f[s] = ev(f); });
    }
    if (parts.length === 1) { const p = parts[0]; return (f) => { p(f); }; }
    return (f) => { for (let i = 0; i < parts.length; i++) parts[i](f); };
  }

  // ----- structs -----
  function compileStruct(node) {
    if (structs.has(node.name)) cerr(node, `Struct ${node.name} is defined twice.`);
    const def = { name: node.name, fields: [], methods: new Map(), ctors: [], node };
    structs.set(node.name, def);
    const selfT = { k: 'struct', name: node.name, def };
    for (const fd of node.fields) {
      let t = resolveType(fd.type, fd);
      if (fd.isRef) cerr(fd, 'Reference fields are not supported.');
      if (fd.dims.length) {
        for (let i = fd.dims.length - 1; i >= 0; i--) {
          if (!fd.dims[i]) cerr(fd, 'Array fields need a size.');
          const dc = compileExpr(fd.dims[i], globalScope);
          const de = conv(dc, T.long, fd.dims[i]);
          t = { k: 'array', elem: t, sizeEv: de };
        }
      }
      if (def.fields.some((x) => x.name === fd.name)) cerr(fd, `Field "${fd.name}" is declared twice.`);
      const entry = { name: fd.name, type: t, copy: null, def: null, init: null };
      def.fields.push(entry);
      entry.copy = copier(t);
      entry.def = (() => { const d = defaultFn(t); return () => d(G); })();
      if (fd.init) {
        const ev = compileInit(t, fd.init, globalScope, fd);
        entry.init = () => ev(G);
      }
    }
    // declare methods first (so they can call each other), then compile bodies
    for (const m of node.methods) {
      const info = makeFnInfo(m, selfT);
      if (!def.methods.has(m.name)) def.methods.set(m.name, []);
      def.methods.get(m.name).push(info);
    }
    for (const c of node.ctors) def.ctors.push(makeFnInfo({ ...c, retType: { k: 'void' } }, selfT));
    for (const c of def.ctors) compileFnBody(c);
    for (const list of def.methods.values()) for (const info of list) compileFnBody(info);
  }

  function compileCtorCall(def, args, scope, node) {
    const info = pickOverload(def.ctors, args, scope, node, `constructor of ${def.name}`);
    const call = compileArgsAndCall(info, args, scope, node);
    return (f) => {
      const o = makeStruct(def);
      call(f, o);
      return o;
    };
  }

  // ----- functions -----
  function makeFnInfo(node, selfT = null) {
    const retType = node.retType ? resolveType(node.retType, node) : T.void;
    const params = node.params.map((p) => {
      let t = resolveType(p.type, p);
      if (p.dims && p.dims.length) for (let i = p.dims.length - 1; i >= 0; i--) t = { k: 'array', elem: t, sizeEv: null };
      if (t.k === 'void') cerr(p, 'A parameter cannot be void.');
      return { name: p.name, type: t, isRef: p.isRef || t.k === 'array', isArray: t.k === 'array', node: p };
    });
    return { name: node.name, node, retType, params, self: selfT, body: null, nSlots: 0, hasBody: !!node.body, isCtor: !!node.isCtor };
  }

  function compileFnBody(info) {
    const node = info.node;
    if (!node.body) return;
    const fnCtx = { nSlots: info.self ? 1 : 0, retType: info.retType, self: info.self, info };
    const scope = new Scope(globalScope, fnCtx);
    info.paramSlots = info.params.map((p) => {
      if (!p.name) return fnCtx.nSlots++;
      return declareVar(scope, p.name, p.type, p.node, p.isRef && !p.isArray).slot;
    });
    const pre = [];
    if (node.isCtor && node.inits) {
      for (const ini of node.inits) {
        const fd = info.self.def.fields.find((x) => x.name === ini.name);
        if (!fd) cerr(ini, `${info.self.name} has no field "${ini.name}".`);
        const ev = ini.value ? compileInit(fd.type, ini.value, scope, ini) : fd.def;
        const nm = ini.name;
        pre.push((f) => { f[0][nm] = ev(f); });
      }
    }
    const body = compileBlock(node.body, scope, true);
    const nonVoid = info.retType.k !== 'void' && !info.isCtor;
    const isMain = info.name === 'main' && !info.self;
    info.nSlots = fnCtx.nSlots;
    const fnName = info.name;
    info.body = (f) => {
      for (let i = 0; i < pre.length; i++) pre[i](f);
      const s = body(f);
      if (s !== RET) {
        if (isMain) { R.retVal = 0; return; }
        if (nonVoid) {
          R.fail(lastLine(node.body), `Function ${fnName}() reached its end without returning a value.`,
            `Add a return statement so ${fnName}() always gives back ${article(typeName(info.retType))}.`);
        }
      }
    };
  }
  const lastLine = (block) => ({ line: block.endLine || (block.body.length ? block.body[block.body.length - 1].line : block.line), col: 1 });

  function declareFunction(node) {
    const info = makeFnInfo(node);
    const list = funcs.get(node.name) || [];
    const sig = (fi) => fi.params.map((p) => typeName(p.type) + (p.isRef ? '&' : '')).join(',');
    const existing = list.find((fi) => sig(fi) === sig(info));
    if (existing) {
      if (existing.hasBody && node.body) cerr(node, `Function ${node.name} is defined twice with the same parameters.`);
      if (!sameType(existing.retType, info.retType)) cerr(node, `Function ${node.name} was declared with a different return type before.`);
      if (node.body) { existing.node = node; existing.hasBody = true; existing.params = info.params; }
      return existing;
    }
    if (globalScope.vars.has(node.name)) cerr(node, `"${node.name}" is already used as a variable name.`);
    list.push(info);
    funcs.set(node.name, list);
    return info;
  }

  function argScore(p, c) {
    const pt = strip(p.type), at = strip(c.t);
    if (p.isRef && !p.type.isConst && !p.isArray && !c.lv) return -1;
    if (sameType(pt, at)) return 3;
    if (pt.k === 'array' && at.k === 'array') return sameType(pt.elem, at.elem) ? 3 : -1;
    if (isNum(pt) && isNum(at)) return p.isRef && !p.type.isConst ? -1 : (isFloat(pt) === isFloat(at) ? 2 : 1);
    if (pt.k === 'string' && at.k === 'string') return 3;
    return -1;
  }

  function pickOverload(list, args, scope, node, what) {
    const cands = list.filter((fi) => fi.params.length === args.length);
    if (!cands.length) {
      const counts = [...new Set(list.map((fi) => fi.params.length))].join(' or ');
      cerr(node, `${what} needs ${counts} value${counts === '1' ? '' : 's'} but you gave ${args.length}.`);
    }
    if (cands.length === 1) return cands[0];
    const cargs = args.map((a) => (a.type === 'InitList' ? null : compileExpr(a, scope)));
    let best = null, bestScore = -1;
    for (const fi of cands) {
      let score = 0;
      for (let i = 0; i < args.length; i++) {
        if (!cargs[i]) continue;
        const s = argScore(fi.params[i], cargs[i]);
        if (s < 0) { score = -1; break; }
        score += s;
      }
      if (score > bestScore) { bestScore = score; best = fi; }
    }
    if (!best) cerr(node, `No version of ${what} accepts these values.`);
    return best;
  }

  // Returns (f, self?) => value
  function compileArgsAndCall(info, args, scope, node) {
    usedFns.push({ info, node });
    const setters = info.params.map((p, i) => {
      const a = args[i];
      if (p.isRef) {
        if (a.type === 'InitList') cerr(a, 'Cannot pass a { } list to a reference parameter.');
        const c = compileExpr(a, scope);
        if (p.isArray) {
          if (c.t.k !== 'array') cerr(a, `Parameter "${p.name}" expects an array, but this is ${describeType(c.t)}.`);
          return c.ev;
        }
        if (!sameType(strip(p.type), strip(c.t))) {
          if (p.type.isConst) {
            const ev = conv(c, strip(p.type), a);
            return (f) => new TempLoc(ev(f));
          }
          cerr(a, `Parameter "${p.name}" is a ${typeName(p.type)}& reference, so you must pass a ${typeName(p.type)} variable (not ${typeName(c.t)}).`);
        }
        if (c.lv) return c.lv;
        if (p.type.isConst) { const ev = c.ev; return (f) => new TempLoc(ev(f)); }
        cerr(a, `Parameter "${p.name}" is a reference (&), so you must pass a variable — not a value or calculation.`);
      }
      return compileInit(strip(p.type), a, scope, a);
    });
    const slots = () => info.paramSlots;
    const n = setters.length;
    const fnName = info.name;
    return (f, self) => {
      const nf = new Array(info.nSlots);
      const ps = slots();
      if (self !== undefined) nf[0] = self;
      for (let i = 0; i < n; i++) nf[ps[i]] = setters[i](f);
      R.callNode = node;
      if (++R.depth > LIMITS.depth) {
        R.fail(node, `Too many nested calls to ${fnName}() — stack overflow!`, 'Does your recursive function have a base case that stops it?');
      }
      R.step(node);
      R.retVal = undefined;
      info.body(nf);
      R.depth--;
      const rv = R.retVal;
      R.retVal = undefined;
      return rv;
    };
  }

  // Call a user function with plain JS values (used by sort comparators).
  function directCaller(info, node) {
    usedFns.push({ info, node });
    return (...vals) => {
      const nf = new Array(info.nSlots);
      for (let i = 0; i < vals.length; i++) nf[info.paramSlots[i]] = info.params[i].isRef ? new TempLoc(vals[i]) : vals[i];
      if (++R.depth > LIMITS.depth) R.fail(node, 'Stack overflow!');
      R.step(node);
      info.body(nf);
      R.depth--;
      const rv = R.retVal;
      R.retVal = undefined;
      return rv;
    };
  }

  // ----- statements -----
  function compileBlock(block, scope, sameScope = false) {
    const inner = sameScope ? scope : new Scope(scope, scope.fn);
    const stmts = [];
    for (const st of block.body) {
      const c = compileStmt(st, inner);
      if (c) stmts.push(c);
    }
    const n = stmts.length;
    if (n === 0) return () => 0;
    if (n === 1) return stmts[0];
    return (f) => {
      for (let i = 0; i < n; i++) { const s = stmts[i](f); if (s) return s; }
      return 0;
    };
  }

  function toBool(c, node) {
    const t = c.t, ev = c.ev;
    if (t.k === 'bool') return ev;
    if (isNum(t)) return (f) => ev(f) !== 0;
    if (t.k === 'istream') return (f) => { ev(f); return !R.failed; };
    if (t.k === 'string') cerr(node, 'Text (a string) cannot be used as a true/false condition.', 'Compare it instead, e.g. s == "yes" or !s.empty()');
    if (t.k === 'void') cerr(node, 'This function is void — it does not give back a value to test.');
    cerr(node, `A ${typeName(t)} cannot be used as a true/false condition.`);
  }

  function compileCond(expr, scope) {
    if (expr.type === 'Assign' && expr.op === '=') warn(expr, 'You used = (assignment) inside a condition. Did you mean == (comparison)?');
    return toBool(compileExpr(expr, scope), expr);
  }

  function compileStmt(st, scope) {
    switch (st.type) {
      case 'Block': return compileBlock(st, scope);
      case 'Empty': return null;
      case 'VarDecl': return compileVarDecl(st, scope);
      case 'Struct': compileStruct(st); return null;
      case 'ExprStmt': {
        const c = compileExpr(st.expr, scope);
        const ev = c.ev;
        const line = st.line;
        if (st.expr.type === 'Binary' && ['==', '<', '>', '!=', '<=', '>='].includes(st.expr.op)) warn(st, 'This comparison does nothing on its own. Did you mean = (assignment)?');
        return (f) => { R.currentLine = line; ev(f); return 0; };
      }
      case 'If': {
        const test = compileCond(st.test, scope);
        const cons = compileStmt(st.cons, new Scope(scope, scope.fn)) || (() => 0);
        const alt = st.alt ? (compileStmt(st.alt, new Scope(scope, scope.fn)) || (() => 0)) : null;
        if (alt) return (f) => (test(f) ? cons(f) : alt(f));
        return (f) => (test(f) ? cons(f) : 0);
      }
      case 'While': {
        const test = compileCond(st.test, scope);
        const body = compileStmt(st.body, new Scope(scope, scope.fn)) || (() => 0);
        return (f) => {
          while (test(f)) {
            R.step(st);
            const s = body(f);
            if (s === BRK) break;
            if (s === RET) return s;
          }
          return 0;
        };
      }
      case 'DoWhile': {
        const body = compileStmt(st.body, new Scope(scope, scope.fn)) || (() => 0);
        const test = compileCond(st.test, scope);
        return (f) => {
          do {
            R.step(st);
            const s = body(f);
            if (s === BRK) break;
            if (s === RET) return s;
          } while (test(f));
          return 0;
        };
      }
      case 'For': {
        const fs = new Scope(scope, scope.fn);
        const init = st.init ? compileStmt(st.init, fs) : null;
        const test = st.test ? compileCond(st.test, fs) : () => true;
        const upd = st.update ? compileExpr(st.update, fs).ev : null;
        const body = compileStmt(st.body, new Scope(fs, scope.fn)) || (() => 0);
        return (f) => {
          if (init) init(f);
          for (; test(f); upd && upd(f)) {
            R.step(st);
            const s = body(f);
            if (s === BRK) break;
            if (s === RET) return s;
          }
          return 0;
        };
      }
      case 'RangeFor': {
        const it = compileExpr(st.iter, scope);
        const fs = new Scope(scope, scope.fn);
        let elemT;
        if (it.t.k === 'vector' || it.t.k === 'array') elemT = it.t.elem;
        else if (it.t.k === 'string') elemT = T.char;
        else cerr(st.iter, `Can't loop over ${describeType(it.t)} with a range-for. Use a vector, array or string.`);
        let vt = resolveType(st.declType, st);
        if (vt.k === 'auto') vt = { ...elemT, isConst: st.declType.isConst };
        const info = declareVar(fs, st.name, vt, st, st.isRef);
        const slot = info.slot;
        const body = compileStmt(st.body, new Scope(fs, scope.fn)) || (() => 0);
        const iev = it.ev;
        if (it.t.k === 'string') {
          if (st.isRef) {
            if (!it.lv) cerr(st.iter, 'Can only loop by reference over a string variable.');
            const lv = it.lv;
            return (f) => {
              const base = lv(f);
              for (let i = 0; i < base.get().length; i++) {
                R.step(st);
                f[slot] = new CharLoc(base, i, R, st);
                const s = body(f);
                if (s === BRK) break;
                if (s === RET) return s;
              }
              return 0;
            };
          }
          const cv = convFn(T.char, vt, st) || ((x) => x);
          return (f) => {
            const str = iev(f);
            for (let i = 0; i < str.length; i++) {
              R.step(st);
              f[slot] = cv(str.charCodeAt(i));
              const s = body(f);
              if (s === BRK) break;
              if (s === RET) return s;
            }
            return 0;
          };
        }
        if (st.isRef && !sameType(strip(vt), strip(elemT))) cerr(st, `The loop variable must be a ${typeName(elemT)}& to refer to these elements.`);
        const cv = st.isRef ? null : (convFn(elemT, vt, st) || null);
        const cp = st.isRef ? null : copier(vt);
        return (f) => {
          const arr = iev(f);
          for (let i = 0; i < arr.length; i++) {
            R.step(st);
            if (st.isRef) f[slot] = new Loc(arr, i);
            else { let v = arr[i]; if (cv) v = cv(v); if (cp) v = cp(v); f[slot] = v; }
            const s = body(f);
            if (s === BRK) break;
            if (s === RET) return s;
          }
          return 0;
        };
      }
      case 'Switch': {
        const d = compileExpr(st.disc, scope);
        if (!isIntegral(d.t)) cerr(st.disc, `switch only works with whole numbers and chars, not ${describeType(d.t)}.`, 'Use if / else if for strings.');
        const dev = conv(d, T.long, st.disc);
        const inner = new Scope(scope, scope.fn);
        const labels = new Map();
        let defaultIdx = -1;
        const flat = [];
        for (const cs of st.cases) {
          if (cs.test) {
            const tc = compileExpr(cs.test, scope);
            if (!isIntegral(tc.t)) cerr(cs, 'A case value must be a whole number or a char.');
            const v = conv(tc, T.long, cs)([]);
            if (labels.has(v)) cerr(cs, `Duplicate case value ${v}.`);
            labels.set(v, flat.length);
          } else {
            if (defaultIdx >= 0) cerr(cs, 'Only one default: is allowed in a switch.');
            defaultIdx = flat.length;
          }
          for (const b of cs.body) { const c = compileStmt(b, inner); if (c) flat.push(c); }
        }
        return (f) => {
          const v = dev(f);
          let start = labels.has(v) ? labels.get(v) : defaultIdx;
          if (start < 0) return 0;
          for (let i = start; i < flat.length; i++) {
            const s = flat[i](f);
            if (s === BRK) return 0;
            if (s) return s;
          }
          return 0;
        };
      }
      case 'Break': return () => BRK;
      case 'Continue': return () => CNT;
      case 'Return': {
        const fn = scope.fn;
        if (fn.isGlobal) cerr(st, 'return can only be used inside a function.');
        const rt = fn.retType;
        if (!st.arg) {
          if (rt.k !== 'void' && !fn.info.isCtor) cerr(st, `This function must return ${article(typeName(rt))} value.`);
          return () => { R.retVal = undefined; return RET; };
        }
        if (rt.k === 'void' || fn.info.isCtor) {
          const c = compileExpr(st.arg, scope);
          if (c.t.k !== 'void') cerr(st, 'This function is void, so it cannot return a value.', `Change "void" to the type you want to return, or just write return;`);
          const ev = c.ev;
          return (f) => { ev(f); R.retVal = undefined; return RET; };
        }
        const ev = compileInit(strip(rt), st.arg, scope, st);
        return (f) => { R.retVal = ev(f); return RET; };
      }
      case 'Function': cerr(st, 'Functions must be written outside of other functions (e.g. above main).');
      // eslint-disable-next-line no-fallthrough
      default: cerr(st, `Unsupported statement ${st.type}.`);
    }
  }

  // ----- expressions -----
  // Each compiled expression: { t, ev(f), lv?(f)->Loc, fast?: {slot, global} }
  function compileExpr(e, scope) {
    switch (e.type) {
      case 'Num': {
        const v = e.value;
        const t = e.isFloat ? T.double : (e.isLong ? T.long : T.int);
        return { t, ev: () => v, isConstExpr: true };
      }
      case 'Str': { const v = e.value; return { t: { k: 'string', lit: true }, ev: () => v }; }
      case 'Char': { const v = e.value; return { t: T.char, ev: () => v }; }
      case 'Bool': { const v = e.value; return { t: T.bool, ev: () => v }; }
      case 'Ident': return compileIdent(e, scope);
      case 'Assign': return compileAssign(e, scope);
      case 'Binary': return compileBinary(e, scope);
      case 'Unary': return compileUnary(e, scope);
      case 'PreInc': case 'PostInc': return compileIncDec(e, scope);
      case 'Ternary': {
        const test = compileCond(e.test, scope);
        const a = compileExpr(e.cons, scope), b = compileExpr(e.alt, scope);
        let t;
        if (isNum(a.t) && isNum(b.t)) t = arithType(a.t, b.t);
        else if (a.t.k === 'string' && b.t.k === 'string') t = T.string;
        else if (sameType(strip(a.t), strip(b.t))) t = strip(a.t);
        else cerr(e, `Both sides of ?: must have the same kind of value (got ${typeName(a.t)} and ${typeName(b.t)}).`);
        if (isNum(a.t) && a.t.k === b.t.k) t = a.t.k === 'bool' ? T.bool : a.t.k === 'char' ? T.char : t;
        const ae = conv(a, t, e), be = conv(b, t, e);
        return { t, ev: (f) => (test(f) ? ae(f) : be(f)) };
      }
      case 'Comma': {
        const a = compileExpr(e.left, scope).ev, b = compileExpr(e.right, scope);
        const bev = b.ev;
        return { t: b.t, ev: (f) => { a(f); return bev(f); } };
      }
      case 'Cast': {
        const to = resolveType(e.to, e);
        const c = compileExpr(e.arg, scope);
        if (to.k === 'string' || !isNum(to) || !isNum(c.t)) {
          if (to.k === 'int' && c.t.k === 'string') cerr(e, 'You cannot cast text to an int.', 'Use stoi(text) to convert a string to a number.');
          cerr(e, `Cannot convert ${describeType(c.t)} to ${typeName(to)}.`);
        }
        return { t: strip(to), ev: conv(c, strip(to), e) };
      }
      case 'Sizeof': {
        const sz = (t) => ({ int: 4, long: 8, double: t.float ? 4 : 8, char: 1, bool: 1, string: 32, vector: 24 }[t.k] || 8);
        if (e.ofType) { const t = resolveType(e.ofType, e); const v = t.k === 'struct' ? t.def.fields.reduce((s, x) => s + sz(x.type), 0) : sz(t); return { t: T.long, ev: () => v }; }
        const c = compileExpr(e.arg, scope);
        if (c.t.k === 'array') {
          const ev = c.ev;
          const measure = (v, t) => (t.k === 'array' ? v.length * (v.length ? measure(v[0], t.elem) : 0) : sz(t));
          return { t: T.long, ev: (f) => measure(ev(f), c.t) };
        }
        const v = sz(c.t);
        return { t: T.long, ev: () => v };
      }
      case 'Index': return compileIndex(e, scope);
      case 'Member': {
        const o = compileExpr(e.object, scope);
        if (o.t.k === 'struct') {
          const fd = o.t.def.fields.find((x) => x.name === e.name);
          if (!fd) {
            if (o.t.def.methods.has(e.name)) cerr(e, `${e.name} is a function — call it with ( ): .${e.name}()`);
            const s = suggest(e.name, o.t.def.fields.map((x) => x.name));
            cerr(e, `${o.t.name} has no field called "${e.name}".`, s ? `Did you mean "${s}"?` : undefined);
          }
          const oev = o.ev, nm = e.name;
          const t = o.t.isConst ? { ...fd.type, isConst: true } : fd.type;
          return { t, ev: (f) => oev(f)[nm], lv: (f) => new Loc(oev(f), nm) };
        }
        if (['size', 'length', 'push_back', 'empty', 'pop_back', 'substr', 'find', 'begin', 'end', 'back', 'front', 'clear'].includes(e.name)) {
          cerr(e, `${e.name} is a function — add brackets: .${e.name}()`);
        }
        cerr(e, `${describeType(o.t)} has no member "${e.name}".`);
        break;
      }
      case 'Call': return compileCall(e, scope);
      case 'InitList': cerr(e, 'A { } list can only be used to give a variable its starting values.'); break;
      case 'Construct': {
        const t = resolveType(e.ctype, e);
        const ev = e.list ? initFromList(t, e.list, scope) : compileCtorArgs(t, e.args, scope, e);
        return { t, ev };
      }
      case 'Limits': {
        const t = resolveType(e.of, e);
        const table = { int: [2147483647, -2147483648], long: [9223372036854775807, -9223372036854775808], char: [127, -128], double: [Number.MAX_VALUE, Number.MIN_VALUE] };
        const pair = table[t.k];
        if (!pair) cerr(e, `numeric_limits<${typeName(t)}> is not supported.`);
        const v = e.which === 'max' ? pair[0] : e.which === 'min' ? pair[1] : cerr(e, 'Only max() and min() are supported.');
        return { t: t.k === 'char' ? T.char : t, ev: () => v };
      }
      case 'Comparator': {
        const w = e.which;
        return { t: { k: 'cmp' }, ev: () => (w === 'greater' ? (a, b) => a > b : (a, b) => a < b) };
      }
      default: cerr(e, `Unsupported expression ${e.type}.`);
    }
  }

  function compileIdent(e, scope) {
    const name = e.name;
    const v = scope.lookup(name);
    if (v) {
      const s = v.slot;
      const t = v.type;
      if (v.isGlobal) return { t, ev: () => G[s], lv: () => new Loc(G, s), fast: { slot: s, global: true }, varInfo: v };
      if (v.isRef) return { t, ev: (f) => f[s].get(), lv: (f) => f[s], varInfo: v };
      return { t, ev: (f) => f[s], lv: (f) => new Loc(f, s), fast: { slot: s, global: false }, varInfo: v };
    }
    // struct field inside a method
    const self = scope.fn.self;
    if (self) {
      const fd = self.def.fields.find((x) => x.name === name);
      if (fd) return { t: fd.type, ev: (f) => f[0][name], lv: (f) => new Loc(f[0], name) };
    }
    if (STD_IDENTS.has(name)) {
      if (!e.std) cerr(e, `"${name}" is part of the std library.`, 'Add `using namespace std;` at the top (after the #includes), or write std::' + name);
      switch (name) {
        case 'cout': return { t: T.ostream, ev: () => R };
        case 'cin': return { t: T.istream, ev: () => R };
        case 'string::npos': return { t: T.long, ev: () => -1 };
        default: return { t: { k: 'manip', name }, ev: () => name };
      }
    }
    if (name in GLOBAL_CONSTS) { const [val, t] = GLOBAL_CONSTS[name]; return { t, ev: () => val }; }
    if (funcs.has(name)) return { t: { k: 'fnref' }, fns: funcs.get(name), ev: () => null };
    if (name === 'cerr' || name === 'clog') {
      if (!e.std) cerr(e, `"${name}" is part of the std library.`, 'Add `using namespace std;`');
      return { t: { k: 'ostream', err: true }, ev: () => null };
    }
    const cands = [...scope.allNames(), ...funcs.keys(), 'cout', 'cin', 'endl', 'main', 'int', 'string', 'double', 'return'];
    const s = suggest(name, cands);
    let hint;
    if (s && s.toLowerCase() === name.toLowerCase()) hint = `C++ is case-sensitive! Did you mean "${s}"?`;
    else if (s) hint = `Did you mean "${s}"?`;
    else hint = 'Variables must be declared with a type before you use them, e.g. int ' + name + ' = 0;';
    cerr(e, `"${name}" has not been declared.`, hint);
  }

  function assertWritable(c, node) {
    if (!c.lv) cerr(node, 'You can only assign to a variable (or an element/field of one).');
    if (c.t.isConst) {
      const nm = c.varInfo ? `"${c.varInfo.name}"` : 'This value';
      cerr(node, `${nm} is const (a constant), so it cannot be changed.`);
    }
  }

  function arithType(a, b) {
    if (isFloat(a) || isFloat(b)) return T.double;
    if (a.k === 'long' || b.k === 'long') return (a.unsigned && a.k === 'long') || (b.unsigned && b.k === 'long') ? { k: 'long', unsigned: true } : T.long;
    if ((a.k === 'int' && a.unsigned) || (b.k === 'int' && b.unsigned)) return { k: 'int', unsigned: true };
    return T.int;
  }

  // Returns (a,b)=>result for numeric op on already-converted operands of type t.
  function numOp(op, t, node) {
    const k = t.k === 'int' ? (t.unsigned ? 'uint' : 'int') : t.k === 'long' ? 'long' : 'double';
    const zero = () => R.fail(node, 'Division by zero!', 'You cannot divide a whole number by 0. Check the value on the right of / or %.');
    switch (op) {
      case '+': return k === 'int' ? (a, b) => (a + b) | 0 : k === 'uint' ? (a, b) => (a + b) >>> 0 : (a, b) => a + b;
      case '-': return k === 'int' ? (a, b) => (a - b) | 0 : k === 'uint' ? (a, b) => (a - b) >>> 0 : (a, b) => a - b;
      case '*': return k === 'int' ? Math.imul : k === 'uint' ? (a, b) => Math.imul(a, b) >>> 0 : (a, b) => a * b;
      case '/':
        if (k === 'double') return (a, b) => a / b;
        if (k === 'int') return (a, b) => (b === 0 ? zero() : (a / b) | 0);
        return (a, b) => (b === 0 ? zero() : Math.trunc(a / b));
      case '%':
        if (k === 'double') cerr(node, 'The % operator only works with whole numbers (int), not doubles.', 'Use fmod(a, b) for decimals.');
        return (a, b) => (b === 0 ? zero() : a % b);
      case '&': return k === 'long' ? (a, b) => Number(BigInt(a) & BigInt(b)) : (a, b) => a & b;
      case '|': return k === 'long' ? (a, b) => Number(BigInt(a) | BigInt(b)) : (a, b) => a | b;
      case '^': return k === 'long' ? (a, b) => Number(BigInt(a) ^ BigInt(b)) : (a, b) => a ^ b;
      case '<<': return k === 'long' ? (a, b) => Number(BigInt.asIntN(64, BigInt(a) << BigInt(b))) : (a, b) => a << b;
      case '>>': return k === 'long' ? (a, b) => Math.floor(a / 2 ** b) : (a, b) => a >> b;
      default: cerr(node, `Unknown operator ${op}`);
    }
  }

  function compileBinary(e, scope) {
    const op = e.op;
    const L = compileExpr(e.left, scope);
    if (L.t.k === 'ostream' && op === '<<') return compileOutput(L, e, scope);
    if (L.t.k === 'istream' && op === '>>') return compileInput(L, e, scope);
    if (L.t.k === 'ostream' && op === '>>') cerr(e, 'cout uses << not >>.', 'Think of the arrows pointing toward cout: cout << "Hi";');
    if (L.t.k === 'istream' && op === '<<') cerr(e, 'cin uses >> not <<.', 'Think of the arrows pointing into your variable: cin >> x;');
    const Rr = compileExpr(e.right, scope);
    if (Rr.t.k === 'ostream' || Rr.t.k === 'istream') cerr(e, `${typeName(Rr.t)} must be on the left side.`);
    const a = L, b = Rr;
    if (op === '&&' || op === '||') {
      const la = toBool(a, e.left), lb = toBool(b, e.right);
      return { t: T.bool, ev: op === '&&' ? (f) => la(f) && lb(f) : (f) => la(f) || lb(f) };
    }
    // strings
    if (a.t.k === 'string' || b.t.k === 'string') {
      if (op === '+') {
        if (a.t.lit && b.t.lit) cerr(e, 'You cannot add two "text" literals together directly.', 'Put them in one literal, or make one a string: string("a") + "b"');
        const conv2 = (c, side) => {
          if (c.t.k === 'string') return c.ev;
          if (c.t.k === 'char') { const ev = c.ev; return (f) => String.fromCharCode(ev(f) & 0xff); }
          if (isNum(c.t)) cerr(side, 'You cannot add a number to text (a string) with +.', 'Use to_string(x) to turn the number into text first.');
          cerr(side, `You cannot add ${describeType(c.t)} to text.`);
        };
        const la = conv2(a, e.left), lb = conv2(b, e.right);
        return { t: T.string, ev: (f) => la(f) + lb(f) };
      }
      if (['==', '!=', '<', '>', '<=', '>='].includes(op)) {
        if (a.t.k !== 'string' || b.t.k !== 'string') {
          const other = a.t.k === 'string' ? b.t : a.t;
          if (other.k === 'char') cerr(e, 'You are comparing a string with a char.', "Use double quotes \"a\" for strings, single quotes 'a' for chars. Is one side s[i] (a char)?");
          cerr(e, `You cannot compare text (a string) with ${describeType(other)}.`);
        }
        if (a.t.lit && b.t.lit) cerr(e, 'Comparing two "text" literals does not work in C++.');
        const la = a.ev, lb = b.ev;
        const cmp = { '==': (x, y) => x === y, '!=': (x, y) => x !== y, '<': (x, y) => x < y, '>': (x, y) => x > y, '<=': (x, y) => x <= y, '>=': (x, y) => x >= y }[op];
        return { t: T.bool, ev: (f) => cmp(la(f), lb(f)) };
      }
      cerr(e, `The operator ${op} doesn't work with text (strings).`);
    }
    // iterators / arrays used as iterators
    if ((a.t.k === 'iter' || a.t.k === 'array') && (op === '+' || op === '-') && isIntegral(b.t)) {
      const ia = asIter(a, e.left), lb = conv(b, T.long, e.right);
      const sign = op === '+' ? 1 : -1;
      return { t: ia.t, ev: (f) => { const it = ia.ev(f); return { ...it, i: it.i + sign * lb(f) }; } };
    }
    if (a.t.k === 'iter' && b.t.k === 'iter') {
      const la = a.ev, lb = b.ev;
      if (op === '-') return { t: T.long, ev: (f) => la(f).i - lb(f).i };
      const cmp = { '==': (x, y) => x === y, '!=': (x, y) => x !== y, '<': (x, y) => x < y, '>': (x, y) => x > y, '<=': (x, y) => x <= y, '>=': (x, y) => x >= y }[op];
      if (cmp) return { t: T.bool, ev: (f) => cmp(la(f).i, lb(f).i) };
    }
    if (!isNum(a.t) || !isNum(b.t)) {
      const bad = !isNum(a.t) ? a.t : b.t;
      if (bad.k === 'vector' || bad.k === 'array') cerr(e, `You can't use ${op} on a whole ${typeName(bad)}.`, 'Work with one element at a time, e.g. v[i].');
      cerr(e, `The operator ${op} can't be used with ${describeType(bad)}.`);
    }
    if (['==', '!=', '<', '>', '<=', '>='].includes(op)) {
      const ct = arithType(a.t, b.t);
      const la = conv(a, ct, e), lb = conv(b, ct, e);
      switch (op) {
        case '==': return { t: T.bool, ev: (f) => la(f) === lb(f) };
        case '!=': return { t: T.bool, ev: (f) => la(f) !== lb(f) };
        case '<': return { t: T.bool, ev: (f) => la(f) < lb(f) };
        case '>': return { t: T.bool, ev: (f) => la(f) > lb(f) };
        case '<=': return { t: T.bool, ev: (f) => la(f) <= lb(f) };
        default: return { t: T.bool, ev: (f) => la(f) >= lb(f) };
      }
    }
    let ct = arithType(a.t, b.t);
    if (['&', '|', '^', '<<', '>>'].includes(op)) {
      if (!isIntegral(a.t) || !isIntegral(b.t)) cerr(e, `The operator ${op} only works with whole numbers.`);
      if (op === '<<' || op === '>>') ct = a.t.k === 'long' ? T.long : T.int;
    }
    const la = conv(a, ct, e), lb = conv(b, ct, e);
    const fn = numOp(op, ct, e);
    if (a.isConstExpr && b.isConstExpr && op !== '/' && op !== '%') {
      const v = fn(la([]), lb([]));
      return { t: ct, ev: () => v, isConstExpr: true };
    }
    return { t: ct, ev: (f) => fn(la(f), lb(f)) };
  }

  function asIter(c, node) {
    if (c.t.k === 'iter') return c;
    if (c.t.k === 'array') { const ev = c.ev; return { t: { k: 'iter', elem: c.t.elem }, ev: (f) => ({ a: ev(f), i: 0 }) }; }
    cerr(node, `Expected an iterator like v.begin() but got ${describeType(c.t)}.`);
  }

  function compileUnary(e, scope) {
    const a = compileExpr(e.arg, scope);
    if (e.op === '!') { const b = toBool(a, e.arg); return { t: T.bool, ev: (f) => !b(f) }; }
    if (e.op === '*') {
      if (a.t.k !== 'iter') cerr(e, 'The * (dereference) operator only works with iterators here. Pointers are not supported.');
      const ev = a.ev;
      if (a.t.str) return { t: T.char, ev: (f) => { const it = ev(f); return it.loc.get().charCodeAt(it.i); } };
      return {
        t: a.t.elem,
        ev: (f) => { const it = ev(f); if (it.i < 0 || it.i >= it.a.length) R.fail(e, 'Iterator is out of range (maybe the vector is empty?).'); return it.a[it.i]; },
        lv: (f) => { const it = ev(f); return new Loc(it.a, it.i); },
      };
    }
    if (!isNum(a.t)) cerr(e, `The operator ${e.op} can't be used with ${describeType(a.t)}.`);
    const t = arithType(a.t, T.int);
    const ev = conv(a, t, e);
    if (e.op === '+') return { t, ev };
    if (e.op === '-') {
      if (a.isConstExpr) { const v = -ev([]); return { t, ev: () => v, isConstExpr: true }; }
      if (t.k === 'int') return { t, ev: (f) => -ev(f) | 0 };
      return { t, ev: (f) => -ev(f) };
    }
    if (e.op === '~') { if (!isIntegral(a.t)) cerr(e, '~ only works with whole numbers.'); return { t, ev: (f) => ~ev(f) }; }
    cerr(e, `Unknown operator ${e.op}`);
  }

  function compileIncDec(e, scope) {
    const a = compileExpr(e.arg, scope);
    assertWritable(a, e);
    const pre = e.type === 'PreInc';
    const d = e.op === '++' ? 1 : -1;
    if (a.t.k === 'iter') {
      const lv = a.lv;
      return { t: a.t, ev: (f) => { const l = lv(f); const old = l.get(); const nw = { ...old, i: old.i + d }; l.set(nw); return pre ? nw : old; } };
    }
    if (!isNum(a.t)) cerr(e, `${e.op} only works with numbers, not ${describeType(a.t)}.`);
    const wrap = convFn(T.double, a.t, e) || ((x) => x);
    const fix = a.t.k === 'bool' ? (x) => x !== 0 : (a.t.k === 'double' ? (x) => x : wrap);
    if (a.fast && !a.fast.global) {
      const s = a.fast.slot;
      if (a.t.k === 'int' && !a.t.unsigned) {
        return { t: a.t, ev: pre ? (f) => (f[s] = (f[s] + d) | 0) : (f) => { const o = f[s]; f[s] = (o + d) | 0; return o; } };
      }
      return { t: a.t, ev: pre ? (f) => (f[s] = fix(+f[s] + d)) : (f) => { const o = f[s]; f[s] = fix(+o + d); return o; } };
    }
    const lv = a.lv;
    return { t: a.t, ev: (f) => { const l = lv(f); const o = l.get(); const n = fix(+o + d); l.set(n); return pre ? n : o; } };
  }

  function compileAssign(e, scope) {
    const tgt = compileExpr(e.target, scope);
    assertWritable(tgt, e.target);
    const t = strip(tgt.t);
    if (t.k === 'array') cerr(e, 'You cannot assign a whole array at once. Copy it element by element, or use a vector.');
    let valEv;
    if (e.op === '=') {
      valEv = compileInit(t, e.value, scope, e.value);
    } else {
      const op = e.op.slice(0, -1);
      const vc = compileExpr(e.value, scope);
      if (t.k === 'string') {
        if (op !== '+') cerr(e, `${e.op} doesn't work with strings. Only += can add text.`);
        let vev;
        if (vc.t.k === 'string') vev = vc.ev;
        else if (isIntegral(vc.t) && e.value.type !== 'Num') { const ev = conv(vc, T.int, e); vev = (f) => String.fromCharCode(ev(f) & 0xff); }
        else cerr(e, 'You can only add text or a char to a string with +=.', 'Use to_string(x) to turn a number into text.');
        const lv = tgt.lv;
        if (tgt.fast && !tgt.fast.global) { const s = tgt.fast.slot; return { t, ev: (f) => (f[s] += vev(f)) }; }
        return { t, ev: (f) => { const l = lv(f); const v = l.get() + vev(f); l.set(v); return v; } };
      }
      if (!isNum(t) || !isNum(vc.t)) cerr(e, `${e.op} only works with numbers here (not ${describeType(isNum(t) ? vc.t : t)}).`);
      const ct = ['<<', '>>'].includes(op) ? (t.k === 'long' ? T.long : T.int) : arithType(t, vc.t);
      const fn = numOp(op, ct, e);
      const toCt = convFn(t, ct, e) || ((x) => x);
      const back = convFn(ct, t, e) || ((x) => x);
      const vev = conv(vc, ct, e);
      if (tgt.fast && !tgt.fast.global) {
        const s = tgt.fast.slot;
        return { t, ev: (f) => { const v = vev(f); return (f[s] = back(fn(toCt(f[s]), v))); } };
      }
      const lv = tgt.lv;
      return { t, ev: (f) => { const l = lv(f); const v = vev(f); const nv = back(fn(toCt(l.get()), v)); l.set(nv); return nv; } };
    }
    if (tgt.fast) {
      const s = tgt.fast.slot;
      if (tgt.fast.global) return { t, ev: (f) => (G[s] = valEv(f)) };
      return { t, ev: (f) => (f[s] = valEv(f)) };
    }
    const lv = tgt.lv;
    return { t, ev: (f) => { const v = valEv(f); lv(f).set(v); return v; } };
  }

  function compileIndex(e, scope) {
    const o = compileExpr(e.object, scope);
    const ic = compileExpr(e.index, scope);
    if (!isIntegral(ic.t)) cerr(e.index, `An index must be a whole number, not ${describeType(ic.t)}.`);
    const iev = conv(ic, T.long, e.index);
    const oev = o.ev;
    if (o.t.k === 'vector' || o.t.k === 'array') {
      const kind = o.t.k;
      const oob = (i, n) => R.fail(e, `Index ${i} is out of range! This ${kind} has ${n} element${n === 1 ? '' : 's'}${n ? ` (valid indexes: 0 to ${n - 1})` : ''}.`,
        n === 0 ? (kind === 'vector' ? 'The vector is empty — use push_back to add elements first.' : undefined) : 'Remember: indexes start at 0, so the last one is size - 1.');
      const t = o.t.isConst ? { ...o.t.elem, isConst: true } : o.t.elem;
      return {
        t,
        ev: (f) => { const a = oev(f), i = iev(f); if (i < 0 || i >= a.length) oob(i, a.length); return a[i]; },
        lv: (f) => { const a = oev(f), i = iev(f); if (i < 0 || i >= a.length) oob(i, a.length); return new Loc(a, i); },
      };
    }
    if (o.t.k === 'string') {
      const olv = o.lv;
      const oob = (i, n) => R.fail(e, `Index ${i} is outside the string! It has ${n} characters${n ? ` (valid indexes: 0 to ${n - 1})` : ''}.`, 'Remember: the first character is at index 0.');
      return {
        t: o.t.isConst ? { k: 'char', isConst: true } : T.char,
        ev: (f) => { const s = oev(f), i = iev(f); if (i < 0 || i > s.length) oob(i, s.length); return i === s.length ? 0 : s.charCodeAt(i); },
        lv: olv ? (f) => { const i = iev(f); const base = olv(f); const n = base.get().length; if (i < 0 || i >= n) oob(i, n); return new CharLoc(base, i, R, e); } : null,
      };
    }
    if (o.t.k === 'struct') cerr(e, `${o.t.name} is a struct — use .field to get its parts, not [ ].`);
    cerr(e, `You can't use [ ] on ${describeType(o.t)}.`, 'Only arrays, vectors and strings can be indexed.');
  }

  // ----- output / input -----
  function formatter(t, node) {
    switch (t.k) {
      case 'int': case 'long': return (v) => String(v);
      case 'char': return (v) => String.fromCharCode(v & 0xff);
      case 'bool': return (v) => (R.boolalpha ? (v ? 'true' : 'false') : (v ? '1' : '0'));
      case 'double': return (v) => {
        if (R.floatMode === 'showpoint') { let s = formatDouble(v, R.prec, 'general'); if (!/[.e]/.test(s) && Number.isFinite(v)) s += '.' + '0'.repeat(Math.max(0, R.prec - s.replace('-', '').length)); return s; }
        return formatDouble(v, R.prec, R.floatMode);
      };
      case 'string': return (v) => v;
      case 'vector': case 'array': cerr(node, `cout can't print a whole ${t.k} at once.`, 'Use a loop to print each element: for (int x : v) cout << x << " ";');
      // eslint-disable-next-line no-fallthrough
      case 'struct': cerr(node, `cout doesn't know how to print a whole ${t.name}.`, 'Print its fields one by one, like p.name');
      // eslint-disable-next-line no-fallthrough
      case 'void': cerr(node, 'This function is void — it does not give back anything to print.');
      // eslint-disable-next-line no-fallthrough
      default: cerr(node, `cout can't print ${describeType(t)}.`);
    }
  }

  function compileOutput(L, e, scope) {
    const left = L.ev;
    const isErr = L.t.err;
    const r = e.right;
    const c = compileExpr(r, scope);
    if (c.t.k === 'manip') {
      const name = c.ev();
      let act;
      switch (name) {
        case 'endl': act = () => R.write('\n'); break;
        case 'fixed': act = () => { R.floatMode = 'fixed'; }; break;
        case 'scientific': act = () => { R.floatMode = 'scientific'; }; break;
        case 'defaultfloat': act = () => { R.floatMode = 'general'; }; break;
        case 'showpoint': act = () => { R.floatMode = 'showpoint'; }; break;
        case 'noshowpoint': act = () => { R.floatMode = 'general'; }; break;
        case 'boolalpha': act = () => { R.boolalpha = true; }; break;
        case 'noboolalpha': act = () => { R.boolalpha = false; }; break;
        case 'left': act = () => { R.leftAlign = true; }; break;
        case 'right': act = () => { R.leftAlign = false; }; break;
        default: cerr(r, `Unknown manipulator ${name}`);
      }
      if (isErr) return { t: L.t, ev: (f) => { left(f); return R; } };
      return { t: T.ostream, ev: (f) => { left(f); act(); return R; } };
    }
    if (c.t.k === 'manipCall') {
      const act = c.ev;
      return { t: T.ostream, ev: (f) => { left(f); const a = act(f); if (!isErr) a(); return R; } };
    }
    if (c.t.k === 'istream' || c.t.k === 'ostream') cerr(r, 'Put cout/cin only at the start of the chain.');
    const fmt = formatter(c.t, r);
    const ev = c.ev;
    if (isErr) return { t: L.t, ev: (f) => { left(f); ev(f); return R; } };
    const line = e.line;
    return { t: T.ostream, ev: (f) => { left(f); const v = ev(f); R.currentLine = line; R.write(fmt(v)); return R; } };
  }

  function readerFor(t, node) {
    switch (t.k) {
      case 'int': case 'long': {
        const re = /[+-]?\d+/y;
        const wrap = t.k === 'int' ? (t.unsigned ? (x) => x >>> 0 : (x) => {
          if (x > 2147483647 || x < -2147483648) { R.failed = true; return x > 0 ? 2147483647 : -2147483648; }
          return x;
        }) : (x) => x;
        return (loc) => { const s = R.readNumber(re); if (s === null) return; loc.set(s === 0 ? 0 : wrap(parseInt(s, 10))); };
      }
      case 'double': {
        const re = /[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/y;
        return (loc) => { const s = R.readNumber(re); if (s === null) return; loc.set(s === 0 ? 0 : (t.float ? Math.fround(parseFloat(s)) : parseFloat(s))); };
      }
      case 'char': return (loc) => { const c = R.readChar(); if (c !== null) loc.set(c); };
      case 'string': return (loc) => { const s = R.readToken(); if (s !== null) loc.set(s); };
      case 'bool': {
        const re = /[+-]?\d+/y;
        return (loc) => { const s = R.readNumber(re); if (s === null) return; const n = parseInt(s, 10); if (n !== 0 && n !== 1) { R.failed = true; loc.set(true); return; } loc.set(n === 1); };
      }
      default: cerr(node, `cin can't read into ${describeType(t)}.`, t.k === 'vector' ? 'Read into a normal variable, then push_back it.' : undefined);
    }
  }

  function compileInput(L, e, scope) {
    const left = L.ev;
    const c = compileExpr(e.right, scope);
    if (c.t.k === 'manip' && c.ev() === 'endl') cerr(e.right, 'You cannot use endl with cin.', 'endl only goes with cout.');
    if (!c.lv) cerr(e.right, 'cin >> needs a variable to store what it reads.');
    if (c.t.isConst) cerr(e.right, 'cin cannot read into a const value.');
    const rd = readerFor(c.t, e.right);
    const lv = c.lv;
    return { t: T.istream, ev: (f) => { left(f); rd(lv(f)); return R; } };
  }

  // ----- calls -----
  function compileCall(e, scope) {
    const callee = e.callee;
    if (callee.type === 'Member') return compileMethodCall(e, scope);
    if (callee.type !== 'Ident') cerr(e, 'This is not something you can call like a function.');
    const name = callee.name;
    // methods of the current struct
    const self = scope.fn.self;
    if (self && self.def.methods.has(name) && !scope.lookup(name)) {
      const info = pickOverload(self.def.methods.get(name), e.args, scope, e, `${name}()`);
      const call = compileArgsAndCall(info, e.args, scope, e);
      return { t: info.retType, ev: (f) => call(f, f[0]) };
    }
    const v = scope.lookup(name);
    if (v) cerr(e, `"${name}" is a variable, not a function.`);
    if (funcs.has(name)) {
      const info = pickOverload(funcs.get(name), e.args, scope, e, `${name}()`);
      if (info.name === 'main') cerr(e, 'Do not call main() yourself — use a loop instead.');
      const call = compileArgsAndCall(info, e.args, scope, e);
      return { t: info.retType, ev: (f) => call(f) };
    }
    if (STD_FUNCS.has(name) && !callee.std) cerr(e, `${name}() is part of the std library.`, 'Add `using namespace std;` at the top, or write std::' + name + '()');
    const b = compileBuiltin(name, e, scope);
    if (b) return b;
    const known = [...funcs.keys(), ...Object.keys(MATH1), ...Object.keys(MATH2), ...STD_FUNCS, 'abs', 'rand', 'srand', 'time'];
    const s = suggest(name, known);
    cerr(e, `There is no function called "${name}".`, s ? `Did you mean ${s}()?` : 'Functions must be declared above the place where you use them.');
  }

  function args(e, scope) { return e.args.map((a) => compileExpr(a, scope)); }
  function argc(e, n, name) {
    const ok = Array.isArray(n) ? n.includes(e.args.length) : e.args.length === n;
    if (!ok) cerr(e, `${name}() needs ${Array.isArray(n) ? n.join(' or ') : n} value${n === 1 ? '' : 's'} but you gave ${e.args.length}.`);
  }

  function compileBuiltin(name, e, scope) {
    if (name in MATH1) {
      argc(e, 1, name);
      const [a] = args(e, scope);
      if (!isNum(a.t)) cerr(e, `${name}() needs a number, not ${describeType(a.t)}.`);
      const ev = conv(a, T.double, e), fn = MATH1[name];
      return { t: T.double, ev: (f) => fn(ev(f)) };
    }
    if (name in MATH2) {
      argc(e, 2, name);
      const [a, b] = args(e, scope);
      if (!isNum(a.t) || !isNum(b.t)) cerr(e, `${name}() needs numbers.`);
      const ea = conv(a, T.double, e), eb = conv(b, T.double, e), fn = MATH2[name];
      return { t: T.double, ev: (f) => fn(ea(f), eb(f)) };
    }
    if (name in CTYPE) {
      argc(e, 1, name);
      const [a] = args(e, scope);
      if (!isIntegral(a.t)) cerr(e, `${name}() needs a char.`);
      const ev = conv(a, T.int, e), fn = CTYPE[name];
      return { t: T.bool, ev: (f) => fn(ev(f)) };
    }
    switch (name) {
      case 'abs': case 'labs': case 'llabs': {
        argc(e, 1, name);
        const [a] = args(e, scope);
        if (!isNum(a.t)) cerr(e, 'abs() needs a number.');
        const t = isFloat(a.t) ? T.double : arithType(a.t, T.int);
        const ev = conv(a, t, e);
        return { t, ev: t.k === 'int' ? (f) => Math.abs(ev(f)) | 0 : (f) => Math.abs(ev(f)) };
      }
      case 'toupper': case 'tolower': {
        argc(e, 1, name);
        const [a] = args(e, scope);
        if (!isIntegral(a.t)) cerr(e, `${name}() works on a single char, not ${describeType(a.t)}.`, a.t.k === 'string' ? 'Loop over the string and change each char: s[i] = toupper(s[i]);' : undefined);
        const ev = conv(a, T.int, e);
        const up = name === 'toupper';
        return { t: T.int, ev: (f) => { const c = ev(f); if (up && c >= 97 && c <= 122) return c - 32; if (!up && c >= 65 && c <= 90) return c + 32; return c; } };
      }
      case 'max': case 'min': {
        let cs;
        if (e.args.length === 1 && e.args[0].type === 'InitList') cs = e.args[0].items.map((a) => compileExpr(a, scope));
        else { argc(e, [2, 3], name); cs = args(e, scope); }
        if (e.args.length === 3 && e.args[0].type !== 'InitList') cerr(e, `${name}() takes 2 values. For more, use ${name}({a, b, c}).`);
        let t;
        if (cs.every((c) => c.t.k === 'string')) t = T.string;
        else if (cs.every((c) => isNum(c.t))) {
          t = cs.reduce((acc, c) => arithType(acc, c.t), cs[0].t);
          if (cs.every((c) => c.t.k === 'char')) t = T.char;
        } else cerr(e, `${name}() needs values of the same kind.`);
        const evs = cs.map((c) => conv(c, t, e));
        const isMax = name === 'max';
        return {
          t,
          ev: (f) => {
            let best = evs[0](f);
            for (let i = 1; i < evs.length; i++) { const v = evs[i](f); if (isMax ? v > best : v < best) best = v; }
            return best;
          },
        };
      }
      case 'swap': {
        argc(e, 2, 'swap');
        const [a, b] = args(e, scope);
        assertWritable(a, e.args[0]); assertWritable(b, e.args[1]);
        if (!sameType(strip(a.t), strip(b.t))) cerr(e, `swap() needs two variables of the same type (got ${typeName(a.t)} and ${typeName(b.t)}).`);
        const la = a.lv, lb = b.lv;
        return { t: T.void, ev: (f) => { const x = la(f), y = lb(f); const tmp = x.get(); x.set(y.get()); y.set(tmp); } };
      }
      case 'sort': case 'reverse': case 'fill': case 'count': case 'accumulate': case 'max_element': case 'min_element': case 'find': {
        if (e.args.length < 2) cerr(e, `${name}() needs a range, like ${name}(v.begin(), v.end()).`);
        const [a, b, ...rest] = args(e, scope);
        const ia = asIter(a, e.args[0]), ib = asIter(b, e.args[1]);
        const isStr = !!ia.t.str;
        const elemT = isStr ? T.char : ia.t.elem;
        const range = (f) => {
          const x = ia.ev(f), y = ib.ev(f);
          const arr = isStr ? x.loc.get() : x.a;
          if ((isStr ? x.loc !== y.loc && x.loc.get() !== y.loc.get() : x.a !== y.a)) R.fail(e, `Both iterators given to ${name}() must belong to the same container.`);
          if (x.i < 0 || y.i > arr.length || x.i > y.i) R.fail(e, `Invalid range given to ${name}().`);
          return [x, y];
        };
        if (name === 'sort' || name === 'reverse') {
          let cmp = null;
          if (name === 'sort' && rest.length) {
            const c = rest[0];
            if (c.t.k === 'cmp') { const g = c.ev(); cmp = () => g; }
            else if (c.t.k === 'fnref') {
              const fi = c.fns.find((x) => x.params.length === 2);
              if (!fi) cerr(e.args[2], 'A sort comparison function must take 2 values and return bool.');
              const call = directCaller(fi, e);
              cmp = () => call;
            } else cerr(e.args[2], 'The third value of sort() must be a comparison function or greater<int>().');
          }
          if (name === 'sort' && !cmp && elemT.k === 'struct') cerr(e, `sort() doesn't know how to compare ${elemT.name} values.`, 'Write a function bool cmp(const T& a, const T& b) and pass it: sort(v.begin(), v.end(), cmp);');
          return {
            t: T.void,
            ev: (f) => {
              const [x, y] = range(f);
              if (isStr) {
                const s = x.loc.get();
                let part = s.slice(x.i, y.i).split('');
                if (name === 'reverse') part.reverse();
                else { const c = cmp && cmp(); part.sort((p, q) => { const pc = p.charCodeAt(0), qc = q.charCodeAt(0); if (c) return c(pc, qc) ? -1 : c(qc, pc) ? 1 : 0; return pc - qc; }); }
                x.loc.set(s.slice(0, x.i) + part.join('') + s.slice(y.i));
                return;
              }
              const arr = x.a;
              const part = arr.slice(x.i, y.i);
              if (name === 'reverse') part.reverse();
              else {
                const c = cmp && cmp();
                R.steps += Math.ceil(part.length * Math.log2(part.length + 2));
                if (c) part.sort((p, q) => (c(p, q) ? -1 : c(q, p) ? 1 : 0));
                else if (elemT.k === 'string') part.sort((p, q) => (p < q ? -1 : p > q ? 1 : 0));
                else part.sort((p, q) => p - q);
              }
              for (let i = 0; i < part.length; i++) arr[x.i + i] = part[i];
            },
          };
        }
        if (name === 'fill' || name === 'count' || name === 'accumulate' || name === 'find') {
          argc(e, 3, name);
          const valT = name === 'accumulate' ? rest[0].t : elemT;
          if (name === 'accumulate' && !isNum(valT) && valT.k !== 'string') cerr(e, 'accumulate() needs a starting number.');
          const vev = conv(rest[0], strip(valT), e.args[2]);
          const get = (x, i) => (isStr ? x.loc.get().charCodeAt(i) : x.a[i]);
          if (name === 'fill') {
            const cp = copier(elemT);
            return { t: T.void, ev: (f) => { const [x, y] = range(f); const v = vev(f); if (isStr) { const s = x.loc.get(); x.loc.set(s.slice(0, x.i) + String.fromCharCode(v).repeat(y.i - x.i) + s.slice(y.i)); return; } for (let i = x.i; i < y.i; i++) x.a[i] = cp ? cp(v) : v; } };
          }
          if (name === 'count') return { t: T.long, ev: (f) => { const [x, y] = range(f); const v = vev(f); let n = 0; for (let i = x.i; i < y.i; i++) if (get(x, i) === v) n++; return n; } };
          if (name === 'find') return { t: ia.t, ev: (f) => { const [x, y] = range(f); const v = vev(f); for (let i = x.i; i < y.i; i++) if (get(x, i) === v) return { ...x, i }; return { ...x, i: y.i }; } };
          const at = strip(valT);
          const addFn = at.k === 'string' ? (s, v) => s + v : numOp('+', arithType(at, elemT), e);
          const back = convFn(arithType(at, elemT), at, e) || ((v) => v);
          return { t: at, ev: (f) => { const [x, y] = range(f); let acc = vev(f); for (let i = x.i; i < y.i; i++) acc = back(addFn(acc, get(x, i))); return acc; } };
        }
        // max_element / min_element
        const isMax = name === 'max_element';
        return {
          t: ia.t,
          ev: (f) => {
            const [x, y] = range(f);
            let best = x.i;
            for (let i = x.i + 1; i < y.i; i++) {
              const v = isStr ? x.loc.get().charCodeAt(i) : x.a[i];
              const bv = isStr ? x.loc.get().charCodeAt(best) : x.a[best];
              if (isMax ? v > bv : v < bv) best = i;
            }
            return { ...x, i: y.i === x.i ? y.i : best };
          },
        };
      }
      case 'to_string': {
        argc(e, 1, 'to_string');
        const [a] = args(e, scope);
        if (!isNum(a.t)) cerr(e, 'to_string() turns a number into text — give it a number.');
        if (isFloat(a.t)) { const ev = a.ev; return { t: T.string, ev: (f) => ev(f).toFixed(6) }; }
        const ev = conv(a, T.long, e);
        return { t: T.string, ev: (f) => String(ev(f)) };
      }
      case 'stoi': case 'stol': case 'stoll': case 'stod': case 'stof': {
        argc(e, 1, name);
        const [a] = args(e, scope);
        if (a.t.k !== 'string') cerr(e, `${name}() needs text (a string).`);
        const ev = a.ev;
        const isD = name === 'stod' || name === 'stof';
        const re = isD ? /^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/ : /^\s*[+-]?\d+/;
        return {
          t: isD ? T.double : name === 'stoi' ? T.int : T.long,
          ev: (f) => {
            const s = ev(f);
            const m = re.exec(s);
            if (!m) R.fail(e, `${name}("${s}") failed: that text does not start with a number.`);
            const v = isD ? parseFloat(m[0]) : parseInt(m[0], 10);
            if (name === 'stoi' && (v > 2147483647 || v < -2147483648)) R.fail(e, `stoi("${s}"): number too big for an int.`);
            return v;
          },
        };
      }
      case 'rand': argc(e, 0, 'rand'); return { t: T.int, ev: () => R.rand() };
      case 'srand': {
        argc(e, 1, 'srand');
        const ev = conv(compileExpr(e.args[0], scope), T.long, e);
        return { t: T.void, ev: (f) => { R.seed = ev(f) >>> 0; } };
      }
      case 'time': return { t: T.long, ev: () => Math.floor(Date.now() / 1000) };
      case 'exit': {
        argc(e, 1, 'exit');
        const ev = conv(compileExpr(e.args[0], scope), T.int, e);
        return { t: T.void, ev: (f) => { throw new ExitSignal(ev(f)); } };
      }
      case 'getline': {
        argc(e, [2, 3], 'getline');
        const [s, str, d] = args(e, scope);
        if (s.t.k !== 'istream') cerr(e, 'getline needs cin first: getline(cin, text);');
        if (str.t.k !== 'string' || !str.lv) cerr(e, 'getline needs a string variable to fill: getline(cin, text);');
        const lv = str.lv;
        const dev = d ? conv(d, T.char, e) : null;
        return { t: T.istream, ev: (f) => { const delim = dev ? String.fromCharCode(dev(f)) : '\n'; const line = R.readLine(delim); if (line !== null) lv(f).set(line); return R; } };
      }
      case 'setprecision': case 'setw': {
        argc(e, 1, name);
        const ev = conv(compileExpr(e.args[0], scope), T.int, e);
        if (name === 'setprecision') return { t: { k: 'manipCall' }, ev: (f) => { const p = ev(f); return () => { R.prec = Math.max(0, p); }; } };
        return { t: { k: 'manipCall' }, ev: (f) => { const w = ev(f); return () => { R.width = w; }; } };
      }
      case 'setfill': {
        argc(e, 1, name);
        const ev = conv(compileExpr(e.args[0], scope), T.char, e);
        return { t: { k: 'manipCall' }, ev: (f) => { const c = ev(f); return () => { R.fill = String.fromCharCode(c); }; } };
      }
      case 'system': return { t: T.int, ev: () => 0 };
      default: return null;
    }
  }

  function compileMethodCall(e, scope) {
    const m = e.callee;
    const name = m.name;
    const o = compileExpr(m.object, scope);
    const t = o.t;
    const oev = o.ev;
    const A = () => args(e, scope);
    const constErr = () => { if (t.isConst) cerr(e, `This ${typeName(t)} is const, so .${name}() can't change it.`); };
    if (t.k === 'struct') {
      const list = t.def.methods.get(name);
      if (!list) {
        if (t.def.fields.some((x) => x.name === name)) cerr(e, `${name} is a field, not a function — remove the ( ).`);
        cerr(e, `${t.name} has no function called ${name}().`);
      }
      const info = pickOverload(list, e.args, scope, e, `${name}()`);
      const call = compileArgsAndCall(info, e.args, scope, e);
      return { t: info.retType, ev: (f) => call(f, oev(f)) };
    }
    if (t.k === 'vector') {
      const elemT = t.elem;
      const emptyErr = (what) => R.fail(e, `Can't use .${what}() on an empty vector!`, 'Check v.empty() or v.size() first.');
      switch (name) {
        case 'size': argc(e, 0, name); return { t: T.long, ev: (f) => oev(f).length };
        case 'empty': argc(e, 0, name); return { t: T.bool, ev: (f) => oev(f).length === 0 };
        case 'push_back': case 'emplace_back': {
          argc(e, 1, name); constErr();
          const vev = compileInit(elemT, e.args[0], scope, e.args[0]);
          return { t: T.void, ev: (f) => { const a = oev(f); if (a.length > 5e6) R.fail(e, 'This vector got way too big!'); a.push(vev(f)); } };
        }
        case 'pop_back': argc(e, 0, name); constErr(); return { t: T.void, ev: (f) => { const a = oev(f); if (!a.length) emptyErr(name); a.pop(); } };
        case 'clear': argc(e, 0, name); constErr(); return { t: T.void, ev: (f) => { oev(f).length = 0; } };
        case 'front': case 'back': {
          argc(e, 0, name);
          const back = name === 'back';
          return {
            t: elemT,
            ev: (f) => { const a = oev(f); if (!a.length) emptyErr(name); return a[back ? a.length - 1 : 0]; },
            lv: (f) => { const a = oev(f); if (!a.length) emptyErr(name); return new Loc(a, back ? a.length - 1 : 0); },
          };
        }
        case 'at': {
          argc(e, 1, name);
          const iev = conv(compileExpr(e.args[0], scope), T.long, e);
          const oob = (i, n) => R.fail(e, `v.at(${i}) is out of range! The vector has ${n} element${n === 1 ? '' : 's'}.`);
          return {
            t: elemT,
            ev: (f) => { const a = oev(f), i = iev(f); if (i < 0 || i >= a.length) oob(i, a.length); return a[i]; },
            lv: (f) => { const a = oev(f), i = iev(f); if (i < 0 || i >= a.length) oob(i, a.length); return new Loc(a, i); },
          };
        }
        case 'begin': case 'end': {
          argc(e, 0, name);
          const end = name === 'end';
          return { t: { k: 'iter', elem: elemT }, ev: (f) => { const a = oev(f); return { a, i: end ? a.length : 0 }; } };
        }
        case 'resize': {
          argc(e, [1, 2], name); constErr();
          const nev = conv(compileExpr(e.args[0], scope), T.long, e);
          const vev = e.args[1] ? compileInit(elemT, e.args[1], scope, e) : defaultFn(elemT);
          return { t: T.void, ev: (f) => { const a = oev(f); const n = nev(f); if (n < 0 || n > 1e7) R.fail(e, 'Bad size for resize().'); if (n < a.length) a.length = n; else while (a.length < n) a.push(vev(f)); } };
        }
        case 'assign': {
          argc(e, 2, name); constErr();
          const nev = conv(compileExpr(e.args[0], scope), T.long, e);
          const vev = compileInit(elemT, e.args[1], scope, e);
          return { t: T.void, ev: (f) => { const a = oev(f); const n = nev(f); a.length = 0; for (let i = 0; i < n; i++) a.push(vev(f)); } };
        }
        case 'insert': {
          argc(e, 2, name); constErr();
          const it = compileExpr(e.args[0], scope);
          if (it.t.k !== 'iter') cerr(e, 'insert needs a position like v.begin() + 2.');
          const vev = compileInit(elemT, e.args[1], scope, e);
          return { t: T.void, ev: (f) => { const p = it.ev(f); const a = oev(f); if (p.a !== a || p.i < 0 || p.i > a.length) R.fail(e, 'Bad position for insert().'); a.splice(p.i, 0, vev(f)); } };
        }
        case 'erase': {
          argc(e, [1, 2], name); constErr();
          const [p1, p2] = A();
          if (p1.t.k !== 'iter') cerr(e, 'erase needs a position like v.begin() + 2.');
          return {
            t: T.void,
            ev: (f) => {
              const a = oev(f); const x = p1.ev(f);
              const y = p2 ? p2.ev(f).i : x.i + 1;
              if (x.a !== a || x.i < 0 || y > a.length || x.i >= y) R.fail(e, 'Bad position for erase().');
              a.splice(x.i, y - x.i);
            },
          };
        }
        default: cerr(e, `vector has no function called ${name}().`, 'Try push_back, pop_back, size, empty, clear, front, back, at.');
      }
    }
    if (t.k === 'string') {
      const lv = o.lv;
      const needLv = () => { constErr(); if (!lv) cerr(e, `.${name}() needs a string variable.`); };
      const str = (c, node) => {
        if (c.t.k === 'string') return c.ev;
        if (c.t.k === 'char') { const ev = c.ev; return (f) => String.fromCharCode(ev(f) & 0xff); }
        if (isIntegral(c.t) && name === 'push_back') { const ev = conv(c, T.int, node); return (f) => String.fromCharCode(ev(f) & 0xff); }
        cerr(node, `Expected text here, not ${describeType(c.t)}.`);
      };
      const num = (i) => conv(compileExpr(e.args[i], scope), T.long, e.args[i]);
      switch (name) {
        case 'size': case 'length': argc(e, 0, name); return { t: T.long, ev: (f) => oev(f).length };
        case 'empty': argc(e, 0, name); return { t: T.bool, ev: (f) => oev(f).length === 0 };
        case 'substr': {
          argc(e, [1, 2], name);
          const p = num(0), n = e.args[1] ? num(1) : null;
          return {
            t: T.string,
            ev: (f) => {
              const s = oev(f), i = p(f);
              if (i < 0 || i > s.length) R.fail(e, `substr(${i}, ...) starts outside the string (size ${s.length}).`);
              const k = n ? n(f) : s.length;
              return s.substr(i, k < 0 ? s.length : k);
            },
          };
        }
        case 'find': case 'rfind': {
          argc(e, [1, 2], name);
          const what = str(compileExpr(e.args[0], scope), e.args[0]);
          const from = e.args[1] ? num(1) : null;
          const rev = name === 'rfind';
          return {
            t: T.long,
            ev: (f) => {
              const s = oev(f), w = what(f);
              const st = from ? from(f) : (rev ? s.length : 0);
              return rev ? s.lastIndexOf(w, st) : s.indexOf(w, st);
            },
          };
        }
        case 'at': case 'front': case 'back': {
          const idx = name === 'at' ? (argc(e, 1, name), num(0)) : (argc(e, 0, name), null);
          const pick = (s, f) => (name === 'at' ? idx(f) : name === 'front' ? 0 : s.length - 1);
          const oob = (i, n) => R.fail(e, `.${name}() index ${i} is outside the string (size ${n}).`);
          return {
            t: T.char,
            ev: (f) => { const s = oev(f); const i = pick(s, f); if (i < 0 || i >= s.length) oob(i, s.length); return s.charCodeAt(i); },
            lv: lv ? (f) => { const base = lv(f); const s = base.get(); const i = pick(s, f); if (i < 0 || i >= s.length) oob(i, s.length); return new CharLoc(base, i, R, e); } : null,
          };
        }
        case 'push_back': case 'append': case '+=': {
          argc(e, 1, name); needLv();
          const v = str(compileExpr(e.args[0], scope), e.args[0]);
          return { t: T.void, ev: (f) => { const l = lv(f); l.set(l.get() + v(f)); } };
        }
        case 'pop_back': argc(e, 0, name); needLv(); return { t: T.void, ev: (f) => { const l = lv(f); const s = l.get(); if (!s.length) R.fail(e, 'pop_back() on an empty string!'); l.set(s.slice(0, -1)); } };
        case 'clear': argc(e, 0, name); needLv(); return { t: T.void, ev: (f) => lv(f).set('') };
        case 'insert': {
          argc(e, 2, name); needLv();
          const p = num(0); const v = str(compileExpr(e.args[1], scope), e.args[1]);
          return { t: T.void, ev: (f) => { const l = lv(f); const s = l.get(); const i = p(f); if (i < 0 || i > s.length) R.fail(e, 'insert position is outside the string.'); l.set(s.slice(0, i) + v(f) + s.slice(i)); } };
        }
        case 'erase': {
          argc(e, [1, 2], name); needLv();
          const p = num(0); const n = e.args[1] ? num(1) : null;
          return { t: T.void, ev: (f) => { const l = lv(f); const s = l.get(); const i = p(f); if (i < 0 || i > s.length) R.fail(e, 'erase position is outside the string.'); const k = n ? n(f) : s.length; l.set(s.slice(0, i) + s.slice(i + k)); } };
        }
        case 'replace': {
          argc(e, 3, name); needLv();
          const p = num(0), n = num(1); const v = str(compileExpr(e.args[2], scope), e.args[2]);
          return { t: T.void, ev: (f) => { const l = lv(f); const s = l.get(); const i = p(f); if (i < 0 || i > s.length) R.fail(e, 'replace position is outside the string.'); l.set(s.slice(0, i) + v(f) + s.slice(i + n(f))); } };
        }
        case 'begin': case 'end': {
          argc(e, 0, name);
          if (!lv) cerr(e, `.${name}() needs a string variable.`);
          const end = name === 'end';
          return { t: { k: 'iter', elem: T.char, str: true }, ev: (f) => { const l = lv(f); return { loc: l, i: end ? l.get().length : 0, s: true }; } };
        }
        case 'c_str': argc(e, 0, name); return { t: T.string, ev: oev };
        case 'compare': {
          argc(e, 1, name);
          const v = str(compileExpr(e.args[0], scope), e.args[0]);
          return { t: T.int, ev: (f) => { const a = oev(f), b = v(f); return a < b ? -1 : a > b ? 1 : 0; } };
        }
        default: cerr(e, `string has no function called ${name}().`, 'Try length, substr, find, push_back, empty, insert, erase.');
      }
    }
    if (t.k === 'istream') {
      switch (name) {
        case 'ignore': {
          const n = e.args[0] ? conv(compileExpr(e.args[0], scope), T.long, e) : () => 1;
          const d = e.args[1] ? conv(compileExpr(e.args[1], scope), T.char, e) : null;
          return {
            t: T.istream,
            ev: (f) => {
              let k = n(f); const delim = d ? d(f) : -1;
              while (k-- > 0 && R.pos < R.stdin.length) { const c = R.stdin.charCodeAt(R.pos++); if (c === delim) break; }
              return R;
            },
          };
        }
        case 'get': {
          if (e.args.length === 0) return { t: T.int, ev: () => (R.pos < R.stdin.length ? R.stdin.charCodeAt(R.pos++) : (R.noteEof(), -1)) };
          const [c] = A();
          if (!c.lv || c.t.k !== 'char') cerr(e, 'cin.get(c) needs a char variable.');
          return { t: T.istream, ev: (f) => { if (R.failed) return R; if (R.pos >= R.stdin.length) { R.noteEof(); return R; } c.lv(f).set(R.stdin.charCodeAt(R.pos++)); return R; } };
        }
        case 'fail': return { t: T.bool, ev: () => R.failed };
        case 'eof': return { t: T.bool, ev: () => R.pos >= R.stdin.length };
        case 'good': return { t: T.bool, ev: () => !R.failed && R.pos < R.stdin.length };
        case 'clear': return { t: T.void, ev: () => { R.failed = false; } };
        case 'tie': case 'sync_with_stdio': return { t: T.void, ev: () => {} };
        default: cerr(e, `cin has no function ${name}().`);
      }
    }
    if (t.k === 'ostream') {
      if (name === 'precision') { const ev = conv(compileExpr(e.args[0], scope), T.int, e); return { t: T.void, ev: (f) => { R.prec = ev(f); } }; }
      if (name === 'flush' || name === 'tie' || name === 'sync_with_stdio') return { t: T.void, ev: () => {} };
      cerr(e, `cout has no function ${name}().`);
    }
    if (t.k === 'iter' || t.k === 'array') cerr(e, `You can't call .${name}() on ${describeType(t)}.`, t.k === 'array' ? 'Arrays have no .size(). Use a vector, or keep the size in a variable.' : undefined);
    cerr(e, `You can't call .${name}() on ${describeType(t)}.`);
  }

  // ----- top level -----
  for (const d of ast.program) {
    if (d.type === 'Struct') compileStruct(d);
    else if (d.type === 'VarDecl') globalInits.push(compileVarDecl(d, globalScope));
    else if (d.type === 'Function') {
      const info = declareFunction(d);
      if (d.body) { info.node = d; compileFnBody(info); }
    }
  }
  for (const { info, node } of usedFns) {
    if (!info.body) cerr(node, `Function ${info.name}() was declared but never written (it has no body { }).`);
  }
  const mains = funcs.get('main');
  if (!mains) throw new CppError('compile', 'Your program needs a main function: int main() { ... }', 1, 1, 'main() is where every C++ program starts.');
  const main = mains[0];
  if (main.retType.k !== 'int') cerr(main.node, 'main must return int: write int main()');
  if (!main.body) cerr(main.node, 'main() needs a body { }.');

  return {
    warnings,
    run() {
      const gf = [];
      for (const gi of globalInits) gi(gf);
      try {
        main.body(new Array(main.nSlots));
        return R.retVal | 0;
      } catch (ex) {
        if (ex instanceof ExitSignal) return ex.code;
        throw ex;
      }
    },
  };
}
