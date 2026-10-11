// Runs C++ programs inside a Web Worker so infinite loops can never freeze the page.
let worker = null;

function freshWorker() {
  return new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
}

/**
 * Run a program.
 * @returns {Promise<{stdout:string, error:null|{kind:'compile'|'runtime'|'timeout', message:string, line?:number, col?:number, hint?:string}, steps:number, timeMs:number}>}
 */
export function runProgram(code, stdin = '', { timeoutMs = 4000 } = {}) {
  if (!worker) worker = freshWorker();
  const w = worker;
  const id = Math.random().toString(36).slice(2);
  const started = performance.now();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      // Kill the stuck worker; a new one is created next time.
      w.terminate();
      if (worker === w) worker = null;
      resolve({
        stdout: '',
        error: {
          kind: 'timeout',
          message: 'Your program took too long and was stopped.',
          hint: 'Is there a loop that never ends? Check that your loop condition eventually becomes false.',
        },
        steps: 0,
        timeMs: performance.now() - started,
      });
    }, timeoutMs);
    const onMsg = (e) => {
      if (e.data.id !== id) return;
      clearTimeout(timer);
      w.removeEventListener('message', onMsg);
      resolve({ ...e.data.result, timeMs: performance.now() - started });
    };
    w.addEventListener('message', onMsg);
    w.postMessage({ id, code, stdin });
  });
}
