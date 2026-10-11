import { run } from './interpreter.js';

self.onmessage = (e) => {
  const { id, code, stdin } = e.data;
  let result;
  try {
    result = run(code, stdin);
  } catch (err) {
    result = { stdout: '', error: { kind: 'runtime', message: 'Internal error: ' + (err && err.message) }, steps: 0 };
  }
  self.postMessage({ id, result });
};
