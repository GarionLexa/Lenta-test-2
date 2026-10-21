
const CACHE_NAME = 'lenta-cache-v14'; // Версия поднята для принудительного обновления
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
  // ВАЖНО: Мы убрали self.skipWaiting() отсюда!
  // Теперь новая версия будет терпеливо ждать, пока пользователь сам не нажмет "Обновить".
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

// Слушаем команду от index.html: если пришел сигнал SKIP_WAITING, значит пользователь нажал кнопку.
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
