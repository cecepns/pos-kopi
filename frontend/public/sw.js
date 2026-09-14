const CACHE_NAME = 'kopi-pos-v2-' + Date.now();

// Install: Immediately activate new worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: Clear all previous caches so user never gets stuck with old assets
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch handler: Network-First for HTML/Navigation to prevent stale index.html cache
self.addEventListener('fetch', (event) => {
  // Pass through non-GET and API calls directly to network
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  // Network-First for Navigation (HTML page loads & regular reloads)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // For other requests (images, assets), try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
