const CACHE_NAME = 'racha-conta-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './history.html',
  './calculator.html',
  './checkout.html',
  './settings.html',
  './js/app.js',
  './manifest.json',
  './icon-512.png'
];

// Instala o Service Worker e adiciona os arquivos ao cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos se a versão mudar
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercepta as requisições (Offline First)
self.addEventListener('fetch', (event) => {
  // Ignora requisições de CDN (Google Fonts, Tailwind)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se encontrar, senão busca da rede
        return response || fetch(event.request);
      })
  );
});
