// sw.js
// --- Bump VERSION on each deploy (or let GitHub Actions rewrite it) ---
const VERSION = 'v2025-09-17-01';

// Figure out the repo subfolder (e.g., /offline-checklist/ on GitHub Pages)
const BASE = self.location.pathname.replace(/sw\.js$/, '');

// Static files to pre-cache (prefix with BASE so it works in subpaths)
const STATIC_ASSETS = [
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}styles.css`,
  `${BASE}app.js`,
  `${BASE}manifest.webmanifest`,
  // Optional icons if you add them:
  // `${BASE}icons/icon-192.png`,
  // `${BASE}icons/icon-512.png`,
];

self.addEventListener('install', (event) => {
  // Start using the new SW immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  // Clear old caches, take control of open tabs
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== VERSION ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// Handle messages from the page (used to trigger skipWaiting)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const accept = req.headers.get('accept') || '';

  // HTML: Network-first (so new deploys are picked up right away)
  if (accept.includes('text/html')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Everything else (CSS/JS/images): Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req));
});

// --- Strategies ---

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req) || await caches.match(`${BASE}index.html`);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then((res) => {
    cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}
