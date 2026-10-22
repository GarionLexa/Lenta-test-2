const CACHE_NAME = 'lenta-cache-v1'; // Версия поднята
const ASSETS = [
  './',
  './index.html',
  './data.js',
  './data_services.js',
  './stories.js',
  './animations.css',
  './icon.png',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  // НЕ вызываем skipWaiting() здесь, чтобы приложение ждало кнопку "Обновить"
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // Удаляем старый кэш
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Ждем команду от index.html для запуска обновления
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
