const CACHE_NAME = 'lenta-cache-v13'; // Повышаем версию при каждом обновлении
const ASSETS = [
  './',
  './index.html',
  './data.js',
  './data_services.js',
  './stories.js',
  './animations.css',
  './icon.png',
  './manifest.json',
  './offline.html' // создадим ниже
];

// Установка: кэшируем все основные ресурсы
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Активация: удаляем старые кэши
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : null))
    ).then(() => self.clients.claim())
  );
});

// Стратегия кэширования
self.addEventListener('fetch', (e) => {
  const request = e.request;
  const url = new URL(request.url);

  // 1. Навигационные запросы (HTML) — Network First с fallback на кэш и offline.html
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('./offline.html'))
        )
    );
    return;
  }

  // 2. Статика (CSS, JS, изображения, шрифты) — Stale-While-Revalidate
  if (url.origin === location.origin || url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|woff2?|ttf|eot)$/)) {
    e.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 3. Остальные запросы — просто из сети
  e.respondWith(fetch(request));
});
