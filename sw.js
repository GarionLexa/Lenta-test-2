const CACHE_VERSION = 'lenta-v15-2026-10-21';
const CORE_ASSETS = ['./', './index.html', './manifest.json', './icon.png', './data.js', './data_services.js', './road-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.hostname.includes('open-meteo.com')) {
    e.respondWith(fetch(req).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  if (url.hostname.includes('cdn.tailwindcss.com') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('hits.sh')) {
    e.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
      const clone = res.clone();
      caches.open(CACHE_VERSION).then(c => c.put(req, clone)).catch(() => {});
      return res;
    }).catch(() => new Response('', { status: 503 }))));
    return;
  }
  if (url.pathname.endsWith('/data.js') || url.pathname === '/data.js' || url.pathname.endsWith('/data_services.js') || url.pathname === '/data_services.js') {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(res => {
      const clone = res.clone();
      caches.open(CACHE_VERSION).then(c => c.put(req, clone)).catch(() => {});
      return res;
    }).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    if (res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
      const clone = res.clone();
      caches.open(CACHE_VERSION).then(c => c.put(req, clone)).catch(() => {});
    }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
