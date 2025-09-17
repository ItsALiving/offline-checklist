// Very small “cache first for app shell” SW.
// If you only need online behavior, you can delete this file and the registration.

const CACHE_VERSION = 'v3'; // bump to refresh old caches
const CACHE_NAME = `server-checklist-${CACHE_VERSION}`;
const ASSETS = [
  './',                 // index.html
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Only handle GET
  if (req.method !== 'GET') return;

  e.respondWith((async () => {
    // Try cache first
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    // Else fetch and (best-effort) cache
    try{
      const res = await fetch(req);
      const c = await caches.open(CACHE_NAME);
      c.put(req, res.clone());
      return res;
    }catch{
      // Offline fallback: serve index for navigations
      if (req.mode === 'navigate') return caches.match('./index.html');
      throw err;
    }
  })());
});
