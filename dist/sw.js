
const CACHE_NAME = 'grey-harmonics-cache-v8';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.tsx',
  '/metadata.json',
  '/initial-data.json',
  '/components/AnnualView.tsx',
  '/components/BillingList.tsx',
  '/components/Card.tsx',
  '/components/Dashboard.tsx',
  '/components/DayView.tsx',
  '/components/EditInstructorModal.tsx',
  '/components/EditLessonModal.tsx',
  '/components/EditSessionModal.tsx',
  '/components/EnrollmentPage.tsx',
  '/components/Header.tsx',
  '/components/LoadingSpinner.tsx',
  '/components/MonthView.tsx',
  '/components/StudentDetailView.tsx',
  '/components/StudentsList.tsx',
  '/components/TeacherDetailView.tsx',
  '/components/TeachersList.tsx',
  '/components/WeekView.tsx',
  '/components/TrashPage.tsx',
  '/components/TrashZone.tsx',
  '/components/AdminAuthModal.tsx',
  '/services/scheduleService.ts',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // CDN URLs
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@babel/standalone@7.24.9/babel.min.js',
  'https://esm.sh/react@^18.2.0',
  'https://esm.sh/react-dom@^18.2.0/client',
  'https://api.dicebear.com/8.x/pixel-art/svg?seed=AlexChen',
  'https://api.dicebear.com/8.x/pixel-art/svg?seed=BrendaSmith',
  'https://api.dicebear.com/8.x/pixel-art/svg?seed=ChloeKim',
  'https://api.dicebear.com/8.x/pixel-art/svg?seed=DavidRodriguez',
  'https://api.dicebear.com/8.x/pixel-art/svg?seed=EleanorVance',
  'https://api.dicebear.com/8.x/pixel-art/svg?seed=MarcoDiaz',
  'https://api.dicebear.com/8.x/pixel-art/svg?seed=SamiraAlJamil',
  'https://api.dicebear.com/8.x/pixel-art/svg?seed=KenjiTanaka'
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
