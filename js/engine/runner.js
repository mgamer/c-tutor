// Runs C++ programs inside a Web Worker so infinite loops can never freeze the page.
// If the browser can't start the worker (some iOS Safari versions), we fall back to
// running on the main thread — the interpreter has its own step limit, so that is safe.
let worker = null;
let workerReady = false;
let useMainThread = false;

function freshWorker() {
  const w = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  workerReady = false;
  w.addEventListener('message', (e) => { if (e.data && e.data.ready) workerReady = true; });
  return w;
}

async function runOnMainThread(code, stdin, started) {
  const { run } = await import('./interpreter.js');
  // Let the UI paint the "building…" state before we block the thread.
  await new Promise((r) => setTimeout(r, 30));
  let result;
  try {
    result = run(code, stdin);
  } catch (err) {
    result = { stdout: '', error: { kind: 'runtime', message: 'Internal error: ' + (err && err.message) }, steps: 0 };
  }
  return { ...result, timeMs: performance.now() - started };
}

/**
 * Run a program.
 * @returns {Promise<{stdout:string, error:null|{kind:'compile'|'runtime'|'timeout', message:string, line?:number, col?:number, hint?:string}, warnings?:{line?:number,message:string}[], steps:number, timeMs:number}>}
 */
export function runProgram(code, stdin = '', { timeoutMs = 6000 } = {}) {
  const started = performance.now();
  if (useMainThread || typeof Worker === 'undefined') return runOnMainThread(code, stdin, started);
  try {
    if (!worker) worker = freshWorker();
  } catch {
    useMainThread = true;
    return runOnMainThread(code, stdin, started);
  }
  const w = worker;
  const id = Math.random().toString(36).slice(2);
  return new Promise((resolve) => {
    let gotReply = false;
    const cleanup = () => {
      clearTimeout(timer);
      clearTimeout(helloTimer);
      w.removeEventListener('message', onMsg);
      w.removeEventListener('error', onErr);
    };
    // If the worker never even says hello, it can't run here: fall back.
    const helloTimer = setTimeout(() => { if (!workerReady && !gotReply) onErr(null); }, 2500);
    const timer = setTimeout(() => {
      cleanup();
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
      if (!e.data || e.data.id !== id) return;
      gotReply = true;
      cleanup();
      resolve({ ...e.data.result, timeMs: performance.now() - started });
    };
    const onErr = (e) => {
      // The worker script failed to load/parse: switch to main-thread mode for good.
      if (gotReply) return;
      if (e && e.preventDefault) e.preventDefault();
      cleanup();
      w.terminate();
      if (worker === w) worker = null;
      useMainThread = true;
      resolve(runOnMainThread(code, stdin, started));
    };
    w.addEventListener('message', onMsg);
    w.addEventListener('error', onErr);
    w.postMessage({ id, code, stdin });
  });
}
