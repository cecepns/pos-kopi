const CACHE_NAME = 'kopi-pos-v3-' + Date.now();

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

// Fetch handler: Network-First for HTML/Navigation, robust fallback for assets
self.addEventListener('fetch', (event) => {
  // Pass through non-GET, API calls, and non-http schemes directly
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith('http') ||
    event.request.url.includes('/api/')
  ) {
    return;
  }

  // Network-First for Navigation (HTML page loads & regular reloads)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = (await caches.match('/index.html')) || (await caches.match('/'));
        if (cached) return cached;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  // For other requests (images, assets), try network first, fallback to cache, never resolve undefined
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response('', { status: 408, statusText: 'Request Timeout' });
      })
  );
});
