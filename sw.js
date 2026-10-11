// Brick++ service worker: cache-first for app files so the site works offline.
// Bump VERSION whenever any file changes to make clients pick up the new build.
const VERSION = 'brickpp-v3';
const FONT_CACHE = 'brickpp-fonts';

const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/app.js',
  './js/game.js',
  './js/editor.js',
  './js/curriculum.js',
  './js/ui/dom.js',
  './js/ui/markdown.js',
  './js/ui/toast.js',
  './js/ui/header.js',
  './js/ui/minifig.js',
  './js/ui/home.js',
  './js/ui/world.js',
  './js/ui/exercise.js',
  './js/ui/console.js',
  './js/ui/celebrate.js',
  './js/ui/playground.js',
  './js/ui/quiz.js',
  './js/ui/profile.js',
  './js/engine/compiler.js',
  './js/engine/interpreter.js',
  './js/engine/judge.js',
  './js/engine/lexer.js',
  './js/engine/parser.js',
  './js/engine/runner.js',
  './js/engine/worker.js',
  './js/data/exercises.js',
  './js/data/quiz.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Add one by one so a single missing file can't break the whole install.
    await Promise.all(APP_FILES.map((url) =>
      cache.add(new Request(url, { cache: 'reload' })).catch((e) => console.warn('[sw] skip', url, e))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION && k !== FONT_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: cache at runtime; if offline and not cached, the system fonts take over.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
        return res;
      } catch (e) {
        return new Response('', { status: 504, statusText: 'offline' });
      }
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Network-first: always get the latest version when online, use the cache when offline.
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch (e) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      throw e;
    }
  })());
});
