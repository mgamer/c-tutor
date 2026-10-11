# Brick++ 🧱

**Learn C++ one brick at a time.** Brick++ is a LEGO-themed playground that teaches C++ to beginners
(it's built with a 14-year-old in mind). You write real C++ in the browser, run it, and
"snap" each solved exercise into your own brick tower.

It is a fully static site: plain HTML, CSS and JavaScript ES modules, **no build step and no
runtime dependencies**. It runs on GitHub Pages and works offline as an installable PWA.

## Features

- **Build map**: 10 worlds laid out as a path of big bricks on a green baseplate. Worlds unlock one
  after another, and each one shows progress and stars.
- **Exercises**: a story, a collapsible "🧠 Learn" concept card, a mission, hints that you reveal
  one at a time, and a solution you can unlock after 3 failed checks (it costs studs).
- **Code editor** (`js/editor.js`), written from scratch with no libraries:
  - C++ syntax highlighting and a line-number gutter.
  - Tab and Shift+Tab indent and outdent. Enter keeps your indentation and adds a level after `{`.
  - Typing `}` on a blank line dedents it.
  - Ctrl/Cmd+Enter runs the program. Ctrl/Cmd+Shift+Enter checks it.
  - Clicking an error jumps to the line with the problem.
  - On phones, a symbol bar inserts `{ } ( ) ; << >> " cout cin endl …` without closing the keyboard.
- **Run and Check**: programs run in a Web Worker, so an infinite loop can't freeze the page.
  Errors show up in a friendly red box with the line number and a hint. Check shows each visible
  test's input, the expected output and your output, with differing lines highlighted. Hidden
  tests only show pass or fail.
- **Celebrations**: little bricks rain down as confetti, then you see your stars, XP, studs and any
  new badges.
- **Gamification** (`js/game.js`):
  - XP and 9 ranks, from *Brick Rookie* to *Legendary Builder*.
  - Studs, the in-game currency.
  - A daily streak 🔥.
  - 18 badges.
  - Star ratings: 3★ means no hints and at most 2 checks. 2★ means at most 1 hint or at most
    4 checks. Viewing the solution caps you at 1★. Only your best result counts.
- **Quiz**: 10 shuffled questions per topic, answered by tapping big answer bricks. You get
  instant feedback with an explanation, and your best score is saved.
- **Playground**: a free editor with an input box, example snippets and autosave.
- **Profile**:
  - Your minifig, which you can dress up with hats, hair, torso and legs bought with studs.
  - Your stats, badges and the rank ladder.
  - Export and import your progress as a save code, or reset it.
- **Mobile first**:
  - On phones, the exercise screen has Task, Code and Output tabs and a sticky Run/Check bar.
  - The editor text is at least 16px so iOS doesn't zoom in.
  - Autocorrect and spellcheck are off in the editor.
- **Accessible**:
  - Keyboard friendly, with focus rings and ARIA labels.
  - Press Esc then Tab to leave the editor.
  - Respects `prefers-reduced-motion`.
- **Offline**: a cache-first service worker (`sw.js`). Fonts come from Google Fonts and fall back
  to system fonts when they can't be loaded.

## Run it locally

ES modules and the service worker need a real web server, so opening `index.html` as a file won't
work. From the repository root, run:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

> The service worker caches files aggressively. While developing, tick *Update on reload*
> (DevTools → Application → Service Workers) or bump `VERSION` in `sw.js`.

## Deploy

Push the repository to GitHub and turn on **Pages** for the branch you want (root folder). All paths
are relative, so the site also works from a sub-path like `https://user.github.io/c-tutor/`.

**When you release, bump `VERSION` in `sw.js`** so that installed copies pick up the new files. If
you add a new JavaScript file, add it to `APP_FILES` in `sw.js` as well.

## Project structure

```
index.html              App shell: top bar, <main id="view">, mobile bottom nav
manifest.webmanifest    PWA manifest
sw.js                   Service worker (offline cache-first, versioned)
css/style.css           The whole LEGO theme (bricks, studs, baseplates, layout, editor)
icons/                  icon.svg (red 2x2 brick) + 192/512 PNGs
js/
  app.js                Entry: loads data, hash router, HUD + toast wiring, SW registration
  game.js               State in localStorage ('brickpp:v1'): XP, ranks, studs, streak,
                        badges, stars, minifig shop, saved code, export/import/reset
  curriculum.js         Loads js/data/*, progression rules (unlocks, next exercise)
  editor.js             The code editor + C++ highlighter
  ui/
    dom.js              Small helpers (escaping, stars, confirm dialog, colour contrast)
    markdown.js         Tiny safe mini-markdown renderer (escapes HTML first)
    header.js           Top bar: streak, studs, rank, XP bar, avatar
    home.js             #/home     – build map, Continue button, brick tower
    world.js            #/world/:id – world intro + exercise bricks
    exercise.js         #/play/:id  – the exercise screen
    console.js          Output console, error box, test results + diff
    celebrate.js        Success modal + falling-brick confetti (canvas)
    playground.js       #/playground
    quiz.js             #/quiz, #/quiz/:topic
    profile.js          #/profile
    minifig.js          SVG minifig built from layers
    toast.js            Toast notifications
  engine/               C++ interpreter, runs in a Web Worker
    runner.js           runProgram(code, stdin, {timeoutMs})
    judge.js            judge(code, exercise, runFn)
  data/
    exercises.js        export const WORLDS = [...]
    quiz.js             export const QUIZ_TOPICS = [...]
tests/, tools/          Engine and content checks (Node)
```

### Routes

| Hash             | Screen                          |
| ---------------- | ------------------------------- |
| `#/home`         | Build map                       |
| `#/world/w1`     | A world's exercises             |
| `#/play/w1e1`    | An exercise                     |
| `#/playground`   | Free editor                     |
| `#/quiz`         | Quiz topics                     |
| `#/quiz/<topic>` | Run a quiz                      |
| `#/profile`      | Profile, badges, shop, save     |

### Content format

`js/data/exercises.js` exports `WORLDS`, an array of worlds:
`{ id, title, color, icon, intro, exercises: [{ id, title, story, concept, task, starter, solution, hints, tests: [{stdin, expected, hidden?}], require?, forbid?, xp }] }`.

`js/data/quiz.js` exports `QUIZ_TOPICS`, an array of topics:
`{ id, title, icon, color, unlockAfterWorld, questions: [{ q, code?, options, answer, explain }] }`.

Text fields use a mini-markdown: blank-line paragraphs, `` `inline code` ``, `**bold**`,
```` ```cpp ```` fenced blocks and `- ` bullet lists.

## The C++ engine

Programs never leave the browser. `js/engine/` is a C++ interpreter written for teaching:

- `lexer.js` → `parser.js` (AST) → `compiler.js` (statically typed closures with real C++ semantics: integer
  division, 32-bit `int` overflow, `char` arithmetic, value vs. reference parameters, `printf`-exact `double` printing).
- Supported subset: `iostream`/`iomanip` I/O, `string`, `vector` (incl. 2D), arrays, `struct`s with methods and
  constructors, functions/overloading/recursion, `cmath`, `sort`/`reverse`/`max_element`/… from `<algorithm>`.
  Not supported: pointers, `new`, templates, `map`/`set`, lambdas, classes with inheritance.
- Kid-friendly errors with line numbers and hints ("C++ is case-sensitive! Did you mean `cout`?"), bounds-checked
  vectors/strings, infinite-loop and stack-overflow detection, and warnings such as `=` inside an `if`.

## Tests

```sh
node tests/engine-diff.mjs      # interpreter output must match real g++ byte-for-byte (needs g++)
node tests/engine-errors.mjs    # beginner mistakes give friendly errors on the right line
node tests/content-engine.mjs   # every exercise solution passes in the interpreter, every starter fails
node tools/check-content.mjs    # content schema + solutions verified with real g++
```
