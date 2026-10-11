// Free-build playground: editor + stdin + run + example snippets.
import { runProgram } from '../engine/runner.js';
import * as game from '../game.js';
import { createEditor } from '../editor.js';
import { renderConsole } from './console.js';
import { esc, confirmDialog, isMobile } from './dom.js';

export const EXAMPLES = [
  { name: 'Hello, world!', stdin: '', code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, builder!" << endl;
    return 0;
}
` },
  { name: 'Ask for a name (cin)', stdin: 'Emmet', code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    cout << "What's your name? ";
    cin >> name;
    cout << "Welcome to Brick++, " << name << "!" << endl;
    return 0;
}
` },
  { name: 'Count bricks (for loop)', stdin: '', code: `#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 5; i++) {
        cout << "Brick #" << i << " placed" << endl;
    }
    return 0;
}
` },
  { name: 'Tower of stars (nested loops)', stdin: '4', code: `#include <iostream>
using namespace std;

int main() {
    int height;
    cin >> height;
    for (int row = 1; row <= height; row++) {
        for (int i = 0; i < row; i++) {
            cout << "[]";
        }
        cout << endl;
    }
    return 0;
}
` },
  { name: 'Even or odd (if/else)', stdin: '7', code: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    if (n % 2 == 0) {
        cout << n << " is even" << endl;
    } else {
        cout << n << " is odd" << endl;
    }
    return 0;
}
` },
  { name: 'Brick colours (vector)', stdin: '', code: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    vector<string> colors = {"red", "yellow", "blue", "green"};
    for (int i = 0; i < colors.size(); i++) {
        cout << i << ": " << colors[i] << endl;
    }
    return 0;
}
` },
  { name: 'Studs to coins (function)', stdin: '3 4', code: `#include <iostream>
using namespace std;

int studs(int width, int length) {
    return width * length;
}

int main() {
    int w, l;
    cin >> w >> l;
    cout << "A " << w << "x" << l << " brick has " << studs(w, l) << " studs" << endl;
    return 0;
}
` },
];

export function renderPlayground(root) {
  const saved = game.getPlayground();
  root.innerHTML = `
    <div class="pg">
      <header class="pg-head">
        <h1>🛠️ Playground</h1>
        <p class="muted">Free build! Write any C++ program and run it. Your code is saved automatically.</p>
      </header>
      <div class="pg-cols">
        <section class="pg-code brick-card card-flat">
          <div class="toolbar">
            <button type="button" class="btn btn-green" data-act="run" title="Run (Ctrl+Enter)">▶ Run</button>
            <label class="select-wrap"><span class="sr-only">Load an example</span>
              <select class="examples">
                <option value="">📚 Examples…</option>
                ${EXAMPLES.map((e, i) => `<option value="${i}">${esc(e.name)}</option>`).join('')}
              </select>
            </label>
            <span class="spacer"></span>
            <button type="button" class="btn btn-white btn-sm" data-act="clear" title="Start from an empty program">🗑 New</button>
          </div>
          <div class="editor-host"></div>
          <label class="stdin-box">
            <span class="stdin-label">⌨️ Program input (cin)</span>
            <textarea class="stdin" rows="2" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"
              placeholder="Type what the program reads with cin…"></textarea>
          </label>
        </section>
        <section class="pg-out"><div class="console-host"></div></section>
      </div>
    </div>`;

  const stdinEl = root.querySelector('.stdin');
  const host = root.querySelector('.console-host');
  const initial = saved && saved.code != null ? saved : { code: EXAMPLES[0].code, stdin: '' };
  stdinEl.value = initial.stdin || '';
  let busy = false;
  const editor = createEditor(root.querySelector('.editor-host'), { value: initial.code, onRun: () => run(), label: 'Playground code editor' });
  const persist = () => game.savePlayground({ code: editor.getValue(), stdin: stdinEl.value });
  editor.onChange(persist);
  stdinEl.addEventListener('input', persist);
  renderConsole(host, null);

  async function run() {
    if (busy) return;
    busy = true;
    const btn = root.querySelector('[data-act=run]');
    btn.disabled = true;
    btn.classList.add('loading');
    editor.clearError();
    renderConsole(host, { running: true });
    const res = await runProgram(editor.getValue(), stdinEl.value);
    game.recordRun(null, res);
    if (res.error && res.error.line) editor.markError(res.error.line);
    renderConsole(host, { result: res, stdin: stdinEl.value, onErrorLine: (l, c) => editor.goToLine(l, c) });
    if (isMobile()) host.scrollIntoView({ behavior: 'smooth', block: 'start' });
    btn.disabled = false;
    btn.classList.remove('loading');
    busy = false;
  }

  root.querySelector('.examples').addEventListener('change', async (e) => {
    const ex = EXAMPLES[+e.target.value];
    e.target.value = '';
    if (!ex) return;
    if (editor.getValue().trim() && !(await confirmDialog({ title: 'Load example?', body: `<p>This replaces your current code with “${esc(ex.name)}”.</p>`, ok: 'Load it' }))) return;
    editor.setValue(ex.code);
    stdinEl.value = ex.stdin;
    persist();
    renderConsole(host, null);
  });

  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'run') run();
    if (b.dataset.act === 'clear' && (await confirmDialog({ title: 'New program?', body: '<p>Clear the editor and start fresh?</p>', ok: 'Clear', danger: true }))) {
      editor.setValue('#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n');
      stdinEl.value = '';
      persist();
      editor.goToLine(5, 5);
    }
  });
}
