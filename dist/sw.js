
const CACHE_NAME = 'grey-harmonics-cache-v9';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  // Built assets will be hashed and served by Vite; don't pre-cache TS/TSX source files
  '/metadata.json',
  '/initial-data.json',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Optional external assets to cache can be added here
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => console.error('Failed to open cache: ', err))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // For API calls to Gemini, always go to the network.
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return; // Let the browser handle it
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response to cache
            if (!response || response.status !== 200) {
              return response;
            }
            // Can only cache basic and cors requests
            if (response.type !== 'basic' && response.type !== 'cors') {
               return response;
            }

            // Only cache http(s) requests
            const url = new URL(event.request.url);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
