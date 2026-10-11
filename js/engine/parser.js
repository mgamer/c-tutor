// Recursive-descent parser for the C++ teaching subset. Produces a plain AST.
import { CppError, tokenize } from './lexer.js';

const BASE_TYPES = new Set(['int', 'double', 'float', 'char', 'bool', 'void', 'string', 'auto', 'long', 'short', 'unsigned', 'signed', 'size_t', 'const', 'vector', 'struct', 'static']);
const STD_TYPE_NAMES = new Set(['string', 'vector', 'size_t']);
const KEYWORDS = new Set([
  'int', 'double', 'float', 'char', 'bool', 'void', 'auto', 'long', 'short', 'unsigned', 'signed', 'const', 'struct', 'class',
  'if', 'else', 'while', 'do', 'for', 'switch', 'case', 'default', 'break', 'continue', 'return', 'true', 'false',
  'using', 'namespace', 'static_cast', 'sizeof', 'static', 'new', 'delete', 'public', 'private', 'nullptr', 'this',
]);

const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=']);
const BIN_PREC = {
  '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6,
  '<': 7, '>': 7, '<=': 7, '>=': 7, '<<': 8, '>>': 8, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10,
};

function describe(tok) {
  if (tok.t === 'eof') return 'the end of the program';
  if (tok.t === 'str') return `"${tok.v}"`;
  if (tok.t === 'char') return `'${String.fromCharCode(tok.v)}'`;
  return `'${tok.v}'`;
}

export function parse(src) {
  const { tokens, includes } = tokenize(src);
  let pos = 0;
  const typeNames = new Set(); // struct names
  let usingStd = false;

  const peek = (k = 0) => tokens[Math.min(pos + k, tokens.length - 1)];
  const next = () => tokens[pos++];
  const is = (v, k = 0) => { const t = peek(k); return (t.t === 'op' || t.t === 'id') && t.v === v; };
  const err = (msg, tok = peek(), hint) => { throw new CppError('compile', msg, tok.line, tok.col, hint); };
  const accept = (v) => { if (is(v)) { return next(); } return null; };
  const expect = (v, what) => {
    if (is(v)) return next();
    const tok = peek();
    if (v === ';') {
      // Point at the end of the previous token — that's where the ; is missing.
      const prev = tokens[pos - 1] || tok;
      throw new CppError('compile', `Missing semicolon ;${what ? ' ' + what : ''}`, prev.line, prev.col,
        'In C++ every statement ends with a semicolon ;');
    }
    if (v === '>' && is('>>')) {
      // split '>>' into two '>' (vector<vector<int>>)
      const t = next();
      tokens.splice(pos, 0, { t: 'op', v: '>', line: t.line, col: t.col + 1 });
      return t;
    }
    err(`Expected '${v}'${what ? ' ' + what : ''} but found ${describe(tok)}.`, tok,
      v === ')' ? 'Check that every ( has a matching ).' : v === '}' ? 'Check that every { has a matching }.' : undefined);
  };
  const ident = (what = 'a name') => {
    const t = peek();
    if (t.t !== 'id' || KEYWORDS.has(t.v)) err(`Expected ${what} but found ${describe(t)}.`, t,
      t.t === 'id' ? `"${t.v}" is a reserved word in C++ and can't be used as a name.` : undefined);
    return next();
  };
  const node = (type, tok, props) => ({ type, line: tok.line, col: tok.col, ...props });

  // ---------- types ----------
  function isStdPrefixed() { return is('std') && is('::', 1); }
  function startsType(k = 0) {
    let t = peek(k);
    if (t.t !== 'id') return false;
    if (t.v === 'std' && peek(k + 1).v === '::') { t = peek(k + 2); return t.t === 'id' && STD_TYPE_NAMES.has(t.v); }
    if (BASE_TYPES.has(t.v) || typeNames.has(t.v)) return true;
    return false;
  }

  function parseType() {
    const tok = peek();
    let isConst = false, unsigned = false, longs = 0, short = false, base = null;
    let std = false;
    for (;;) {
      if (accept('const')) { isConst = true; continue; }
      if (accept('static')) continue;
      if (accept('struct')) continue;
      if (accept('unsigned')) { unsigned = true; continue; }
      if (accept('signed')) continue;
      if (accept('long')) { longs++; continue; }
      if (accept('short')) { short = true; continue; }
      if (isStdPrefixed()) { next(); next(); std = true; continue; }
      break;
    }
    const t = peek();
    let type;
    if (t.t === 'id' && ['int', 'double', 'float', 'char', 'bool', 'void', 'auto'].includes(t.v)) {
      next();
      base = t.v;
    } else if (t.t === 'id' && (t.v === 'string' || t.v === 'size_t' || t.v === 'vector')) {
      if (!std && !usingStd) err(`"${t.v}" lives in the std namespace.`, t, 'Add `using namespace std;` after your #includes, or write std::' + t.v + '.');
      next();
      base = t.v;
    } else if (t.t === 'id' && typeNames.has(t.v)) {
      next();
      type = { k: 'struct', name: t.v };
    } else if (longs || unsigned || short) {
      base = 'int';
    } else {
      err(`Expected a type (like int, double or string) but found ${describe(t)}.`, t);
    }
    if (!type) {
      if (base === 'vector') {
        expect('<', 'after vector');
        const elem = parseType();
        expect('>', 'to close vector<...>');
        type = { k: 'vector', elem };
      } else if (base === 'int') {
        type = { k: longs >= 1 ? 'long' : 'int' };
        if (unsigned) type.unsigned = true;
      } else if (base === 'size_t') {
        type = { k: 'long', unsigned: true };
      } else if (base === 'double' && longs) {
        type = { k: 'double' };
      } else {
        type = { k: base === 'float' ? 'float' : base };
      }
    }
    // nested type names: vector<int>::size_type, string::iterator
    if (is('::') && (type.k === 'vector' || type.k === 'string') && peek(1).t === 'id' && /^(size_type|iterator|const_iterator)$/.test(peek(1).v)) {
      next();
      const nm = next().v;
      if (nm === 'size_type') type = { k: 'long', unsigned: true };
      else type = type.k === 'string' ? { k: 'iter', elem: { k: 'char' }, str: true } : { k: 'iter', elem: type.elem };
    }
    // const after type: `int const`
    if (accept('const')) isConst = true;
    if (isConst) type = { ...type, isConst: true };
    type.line = tok.line; type.col = tok.col;
    return type;
  }

  // ---------- expressions ----------
  function parseExpr() {
    let e = parseAssign();
    while (is(',')) {
      const t = next();
      e = node('Comma', t, { left: e, right: parseAssign() });
    }
    return e;
  }

  function parseAssign() {
    const left = parseTernary();
    const t = peek();
    if (t.t === 'op' && ASSIGN_OPS.has(t.v)) {
      next();
      const value = is('{') ? parseInitList() : parseAssign();
      return node('Assign', t, { op: t.v, target: left, value });
    }
    return left;
  }

  function parseTernary() {
    const test = parseBinary(1);
    if (is('?')) {
      const t = next();
      const cons = parseAssign();
      expect(':', 'in the ?: operator');
      const alt = parseAssign();
      return node('Ternary', t, { test, cons, alt });
    }
    return test;
  }

  function parseBinary(minPrec) {
    let left = parseUnary();
    for (;;) {
      const t = peek();
      if (t.t !== 'op') break;
      const prec = BIN_PREC[t.v];
      if (!prec || prec < minPrec) break;
      next();
      const right = parseBinary(prec + 1);
      left = node('Binary', t, { op: t.v, left, right });
    }
    return left;
  }

  function parseUnary() {
    const t = peek();
    if (t.t === 'op') {
      if (t.v === '++' || t.v === '--') { next(); return node('PreInc', t, { op: t.v, arg: parseUnary() }); }
      if (t.v === '-' || t.v === '+' || t.v === '!' || t.v === '~' || t.v === '*') { next(); return node('Unary', t, { op: t.v, arg: parseUnary() }); }
      if (t.v === '&') err('Pointers and addresses (&x) are not part of this playground.', t, 'Use references in function parameters instead: void f(int& x)');
      if (t.v === '(' && startsType(1)) {
        // C-style cast: (double)x — only if the type is followed by ')'
        const save = pos;
        next();
        let type = null;
        try { type = parseType(); } catch { type = null; }
        if (type && is(')')) {
          next();
          return node('Cast', t, { to: type, arg: parseUnary() });
        }
        pos = save;
      }
    }
    if (t.t === 'id' && t.v === 'sizeof') {
      next();
      expect('(', 'after sizeof');
      let res;
      if (startsType()) res = node('Sizeof', t, { ofType: parseType() });
      else res = node('Sizeof', t, { arg: parseExpr() });
      expect(')', 'to close sizeof(...)');
      return res;
    }
    if (t.t === 'id' && (t.v === 'new' || t.v === 'delete')) err(`"${t.v}" (dynamic memory) is not part of this playground. Use a vector instead!`, t);
    return parsePostfix(parsePrimary());
  }

  function parseArgs() {
    const args = [];
    if (!is(')')) {
      do { args.push(is('{') ? parseInitList() : parseAssign()); } while (accept(','));
    }
    expect(')', 'to close the argument list');
    return args;
  }

  function parsePostfix(e) {
    for (;;) {
      const t = peek();
      if (is('(')) { next(); e = node('Call', t, { callee: e, args: parseArgs() }); continue; }
      if (is('[')) {
        next();
        const index = parseExpr();
        expect(']', 'to close the index [...]');
        e = node('Index', t, { object: e, index });
        continue;
      }
      if (is('.') || is('->')) {
        next();
        const name = ident('a member name after "."');
        e = node('Member', t, { object: e, name: name.v });
        continue;
      }
      if (is('++') || is('--')) { next(); e = node('PostInc', t, { op: t.v, arg: e }); continue; }
      break;
    }
    return e;
  }

  function parseInitList() {
    const t = expect('{');
    const items = [];
    if (!is('}')) {
      do {
        if (is('}')) break; // trailing comma
        items.push(is('{') ? parseInitList() : parseAssign());
      } while (accept(','));
    }
    expect('}', 'to close the { ... } list');
    return node('InitList', t, { items });
  }

  function parsePrimary() {
    const t = peek();
    if (t.t === 'num') { next(); return node('Num', t, { value: t.v, isFloat: t.isFloat, isLong: t.isLong }); }
    if (t.t === 'str') { next(); return node('Str', t, { value: t.v }); }
    if (t.t === 'char') { next(); return node('Char', t, { value: t.v }); }
    if (is('(')) {
      next();
      const e = parseExpr();
      expect(')', 'to close the bracket');
      return e;
    }
    if (is('{')) return parseInitList();
    if (t.t === 'id') {
      if (t.v === 'true' || t.v === 'false') { next(); return node('Bool', t, { value: t.v === 'true' }); }
      if (t.v === 'static_cast') {
        next();
        expect('<', 'after static_cast');
        const to = parseType();
        expect('>', 'to close static_cast<...>');
        expect('(', 'after static_cast<...>');
        const arg = parseExpr();
        expect(')', 'to close static_cast(...)');
        return node('Cast', t, { to, arg });
      }
      // functional cast: int(x), double(x), string(3, 'a')
      if (['int', 'double', 'float', 'char', 'bool', 'long'].includes(t.v) && (is('(', 1) || (t.v === 'long' && is('long', 1)))) {
        const to = parseType();
        expect('(', 'after the type');
        const arg = parseExpr();
        expect(')', 'to close the cast');
        return node('Cast', t, { to, arg });
      }
      let std = false;
      if (isStdPrefixed()) { next(); next(); std = true; }
      const id = ident('a value or variable');
      // templates used as values: greater<int>(), numeric_limits<int>::max(), vector<int>(n)
      if ((id.v === 'greater' || id.v === 'less' || id.v === 'numeric_limits' || id.v === 'vector') && is('<')) {
        next();
        let targ;
        if (is('streamsize')) { next(); targ = { k: 'long' }; } else targ = parseType();
        expect('>', 'to close <...>');
        if (id.v === 'numeric_limits') {
          expect('::');
          const which = ident('max or min');
          expect('('); expect(')');
          return node('Limits', t, { of: targ, which: which.v });
        }
        if (id.v === 'vector') {
          if (!std && !usingStd) err('"vector" lives in the std namespace.', id, 'Add `using namespace std;`');
          if (is('{')) return node('Construct', t, { ctype: { k: 'vector', elem: targ }, list: parseInitList() });
          expect('(');
          return node('Construct', t, { ctype: { k: 'vector', elem: targ }, args: parseArgs() });
        }
        expect('('); expect(')');
        return node('Comparator', t, { which: id.v });
      }
      if (id.v === 'string' && (is('(') || is('{')) && (std || usingStd)) {
        if (is('{')) return node('Construct', t, { ctype: { k: 'string' }, list: parseInitList() });
        next();
        return node('Construct', t, { ctype: { k: 'string' }, args: parseArgs() });
      }
      if (typeNames.has(id.v) && is('{')) {
        return node('Construct', t, { ctype: { k: 'struct', name: id.v }, list: parseInitList() });
      }
      // Scoped names: string::npos
      if (is('::')) {
        next();
        const member = ident();
        return node('Ident', t, { name: id.v + '::' + member.v, std: std || usingStd });
      }
      return node('Ident', t, { name: id.v, std: std || usingStd, line: id.line, col: id.col });
    }
    err(`Expected a value but found ${describe(t)}.`, t);
  }

  // ---------- statements ----------
  function parseDeclarators(type, tok, allowFunc) {
    const decls = [];
    do {
      const isRef = !!accept('&');
      if (is('&&')) err('Rvalue references (&&) are not supported.', peek());
      if (is('*')) err('Pointers are not part of this playground. Use references (&) or vectors instead.', peek());
      const name = ident('a variable name');
      const dims = [];
      while (is('[')) {
        const bt = next();
        if (is(']')) { next(); dims.push(null); continue; }
        dims.push(parseExpr());
        expect(']', 'to close the array size');
        void bt;
      }
      let init = null, ctorArgs = null;
      if (accept('=')) {
        init = is('{') ? parseInitList() : parseAssign();
      } else if (is('{')) {
        init = parseInitList();
      } else if (is('(')) {
        if (!dims.length && allowFunc && decls.length === 0 && (startsType(1) || is(')', 1))) return { func: name };
        next();
        ctorArgs = parseArgs();
      }
      decls.push({ type, name: name.v, isRef, dims, init, ctorArgs, line: name.line, col: name.col });
    } while (accept(','));
    return { decls };
  }

  function parseVarDecl(tok, needSemi = true) {
    const type = parseType();
    const r = parseDeclarators(type, tok, false);
    if (needSemi) expect(';', 'after the variable declaration');
    return node('VarDecl', tok, { decls: r.decls });
  }

  function parseBlock() {
    const t = expect('{');
    const body = [];
    while (!is('}')) {
      if (peek().t === 'eof') err('Missing } at the end of the program.', t, 'Every { needs a matching }. This one opened on line ' + t.line + '.');
      body.push(parseStatement());
    }
    next();
    return node('Block', t, { body });
  }

  function parseStatement() {
    const t = peek();
    if (is('{')) return parseBlock();
    if (is(';')) { next(); return node('Empty', t, {}); }
    if (t.t === 'id') {
      switch (t.v) {
        case 'if': {
          next();
          expect('(', 'after if');
          const test = parseCondition();
          expect(')', 'to close the if condition');
          if (is(';')) err('There is a ; right after if(...) — that ends the if immediately!', peek(), 'Remove the semicolon after the condition.');
          const cons = parseStatement();
          let alt = null;
          if (accept('else')) alt = parseStatement();
          return node('If', t, { test, cons, alt });
        }
        case 'else':
          err('This "else" has no matching "if".', t, 'Check the { } braces around the if before it.');
          break;
        case 'while': {
          next();
          expect('(', 'after while');
          const test = parseCondition();
          expect(')', 'to close the while condition');
          if (is(';')) err('There is a ; right after while(...) — that makes an empty loop!', peek(), 'Remove the semicolon after the condition.');
          return node('While', t, { test, body: parseStatement() });
        }
        case 'do': {
          next();
          const body = parseStatement();
          expect('while', 'after the do { ... } block');
          expect('(', 'after while');
          const test = parseExpr();
          expect(')', 'to close the condition');
          expect(';', 'after do { } while (...)');
          return node('DoWhile', t, { body, test });
        }
        case 'for': {
          next();
          expect('(', 'after for');
          // range-for?
          if (startsType()) {
            const save = pos;
            const type = parseType();
            const isRef = !!accept('&');
            if (peek().t === 'id' && is(':', 1)) {
              const name = next();
              next();
              const iter = parseExpr();
              expect(')', 'to close the for (...)');
              return node('RangeFor', t, { declType: type, isRef, name: name.v, iter, body: parseStatement() });
            }
            pos = save;
          }
          let init = null;
          if (!is(';')) init = startsType() ? parseVarDecl(peek(), false) : node('ExprStmt', peek(), { expr: parseExpr() });
          expect(';', 'after the start part of the for loop');
          const test = is(';') ? null : parseExpr();
          expect(';', 'after the condition of the for loop');
          const update = is(')') ? null : parseExpr();
          expect(')', 'to close the for (...)');
          if (is(';')) err('There is a ; right after for(...) — that makes an empty loop!', peek(), 'Remove the semicolon.');
          return node('For', t, { init, test, update, body: parseStatement() });
        }
        case 'switch': {
          next();
          expect('(', 'after switch');
          const disc = parseExpr();
          expect(')', 'to close switch (...)');
          expect('{', 'to open the switch body');
          const cases = [];
          let cur = null;
          while (!is('}')) {
            const ct = peek();
            if (accept('case')) {
              const test = parseTernary();
              expect(':', 'after the case value');
              cur = { test, body: [], line: ct.line, col: ct.col };
              cases.push(cur);
            } else if (accept('default')) {
              expect(':', 'after default');
              cur = { test: null, body: [], line: ct.line, col: ct.col };
              cases.push(cur);
            } else {
              if (!cur) err('Statements inside a switch must come after a "case ...:" label.', ct);
              if (peek().t === 'eof') err('Missing } to close the switch.', t);
              cur.body.push(parseStatement());
            }
          }
          next();
          return node('Switch', t, { disc, cases });
        }
        case 'case': case 'default':
          err(`"${t.v}" can only be used inside a switch.`, t);
          break;
        case 'break': next(); expect(';', 'after break'); return node('Break', t, {});
        case 'continue': next(); expect(';', 'after continue'); return node('Continue', t, {});
        case 'return': {
          next();
          const arg = is(';') ? null : (is('{') ? parseInitList() : parseExpr());
          expect(';', 'after return');
          return node('Return', t, { arg });
        }
        case 'using': return parseUsing();
        case 'struct': case 'class':
          if (peek(2).v === '{') return parseStruct();
          break;
        default:
      }
      if (startsType() && !(is('(', 1) && ['int', 'double', 'float', 'char', 'bool'].includes(t.v)) && !(t.v === 'string' && is('(', 1)) && !(is('::', 1) && !isStdPrefixed() && peek(2).v === 'npos')) {
        // vector<int>(n) used as an expression is rare; treat type-start as declaration
        return parseVarDecl(t);
      }
    }
    const expr = parseExpr();
    if (!is(';')) {
      const nt = peek();
      if (nt.t === 'id' && expr.type === 'Ident') {
        err(`I don't know the type "${expr.name}".`, expr,
          /^(String|Int|integer|Double|Bool|boolean)$/.test(expr.name)
            ? 'C++ is case-sensitive and uses: int, double, string, bool, char.'
            : 'Did you misspell a type like int, double or string?');
      }
    }
    expect(';', 'at the end of this line');
    return node('ExprStmt', t, { expr });
  }

  function parseCondition() {
    // allow `if (int x = ...)` rarely; just parse expressions
    if (is(')')) err('The condition is empty.', peek());
    return parseExpr();
  }

  function parseUsing() {
    const t = next();
    if (accept('namespace')) {
      const ns = ident('a namespace name');
      if (ns.v !== 'std') err(`Unknown namespace "${ns.v}".`, ns);
      expect(';', 'after using namespace std');
      usingStd = true;
      return node('Empty', t, {});
    }
    // using std::cout;
    if (isStdPrefixed()) {
      next(); next();
      ident();
      expect(';');
      usingStd = true; // close enough for a teaching tool
      return node('Empty', t, {});
    }
    err('Only `using namespace std;` is supported here.', t);
  }

  function parseStruct() {
    const t = next(); // struct/class
    const name = ident('a struct name');
    typeNames.add(name.v);
    expect('{', 'to open the struct');
    const fields = [], methods = [], ctors = [];
    while (!is('}')) {
      if (peek().t === 'eof') err('Missing } to close the struct.', t);
      if ((is('public') || is('private') || is('protected')) && is(':', 1)) { next(); next(); continue; }
      // constructor: Name(...)
      if (is(name.v) && is('(', 1)) {
        const ct = next();
        next();
        const params = parseParams();
        const inits = [];
        if (accept(':')) {
          do {
            const f = ident('a field name');
            const open = accept('(') ? ')' : (expect('{'), '}');
            const val = is(open) ? null : parseExpr();
            expect(open);
            inits.push({ name: f.v, value: val, line: f.line, col: f.col });
          } while (accept(','));
        }
        const body = parseBlock();
        ctors.push(node('Function', ct, { name: name.v, params, inits, body, isCtor: true }));
        continue;
      }
      const ft = peek();
      const type = parseType();
      const r = parseDeclarators(type, ft, true);
      if (r.func) {
        next(); // (
        const params = parseParams();
        accept('const');
        const body = parseBlock();
        methods.push(node('Function', r.func, { retType: type, name: r.func.v, params, body }));
        continue;
      }
      expect(';', 'after the struct field');
      fields.push(...r.decls);
    }
    next();
    expect(';', 'after the struct\'s closing }');
    return node('Struct', t, { name: name.v, fields, methods, ctors });
  }

  function parseParams() {
    const params = [];
    if (is('void') && is(')', 1)) next();
    if (!is(')')) {
      do {
        const pt = peek();
        const type = parseType();
        const isRef = !!accept('&');
        if (is('*')) err('Pointers are not part of this playground. Use references (&) instead.', peek());
        let name = null;
        if (peek().t === 'id' && !KEYWORDS.has(peek().v)) name = next().v;
        const dims = [];
        while (accept('[')) {
          if (is(']')) dims.push(null); else dims.push(parseExpr());
          expect(']');
        }
        if (is('=')) err('Default argument values are not supported here.', peek());
        params.push({ type, name, isRef, dims, line: pt.line, col: pt.col });
      } while (accept(','));
    }
    expect(')', 'to close the parameter list');
    return params;
  }

  function parseTopLevel() {
    const t = peek();
    if (is('using')) return parseUsing();
    if ((is('struct') || is('class')) && (is('{', 2))) return parseStruct();
    if (is(';')) { next(); return null; }
    if (!startsType()) {
      if (t.t === 'id' && t.v === 'main') err('main needs a return type: write `int main()`.', t);
      if (t.t === 'id' && /^(cout|cin|if|for|while|return)$/.test(t.v)) err(`"${t.v}" must be inside a function such as main() { ... }.`, t);
      if (t.t === 'id' && peek(1).t === 'id') err(`I don't know the type "${t.v}".`, t, 'Did you misspell a type like int, double or string?');
      err(`Expected a function or a variable declaration but found ${describe(t)}.`, t);
    }
    const type = parseType();
    const r = parseDeclarators(type, t, true);
    if (r.func) {
      next(); // (
      const params = parseParams();
      if (accept(';')) return node('Function', r.func, { retType: type, name: r.func.v, params, body: null });
      if (!is('{')) err(`Expected { to start the body of function ${r.func.v}.`, peek());
      const body = parseBlock();
      return node('Function', r.func, { retType: type, name: r.func.v, params, body });
    }
    expect(';', 'after the global variable');
    return node('VarDecl', t, { decls: r.decls });
  }

  const program = [];
  while (peek().t !== 'eof') {
    const d = parseTopLevel();
    if (d) program.push(d);
  }
  return { program, includes, usingStd };
}
