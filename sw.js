// Shadow Heist - Service Worker
const CACHE_NAME = 'shadow-heist-v1';

// Assets to cache
const assets = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/game.js',
  '/js/tasks.js',
  '/js/ui.js',
  '/manifest.json',
  'https://cdn.socket.io/4.6.0/socket.io.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&display=swap',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap',
  '/assets/favicon.ico',
  '/assets/icon-72x72.png',
  '/assets/icon-96x96.png',
  '/assets/icon-128x128.png',
  '/assets/icon-144x144.png',
  '/assets/icon-152x152.png',
  '/assets/icon-192x192.png',
  '/assets/icon-384x384.png',
  '/assets/icon-512x512.png',
  '/assets/maskable_icon.png',
  '/assets/create-game.png',
  '/assets/join-game.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching Files');
        return cache.addAll(assets);
      })
      .catch(err => console.log('Service Worker: Cache Failed', err))
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  // Claim clients to ensure the service worker controls the page
  return self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and socket connections
  if (
    !event.request.url.startsWith(self.location.origin) || 
    event.request.url.includes('socket.io') ||
    event.request.url.includes('/api/')
  ) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Make network request and cache the response
        return fetch(event.request)
          .then(response => {
            // Make copy of response
            const responseClone = response.clone();
            
            // Open cache
            caches.open(CACHE_NAME)
              .then(cache => {
                // Add response to cache
                cache.put(event.request, responseClone);
              });
            
            return response;
          })
          .catch(err => console.log('Service Worker: Fetch Failed', err));
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Shadow Heist';
  const options = {
    body: data.body || 'A new heist is waiting for you!',
    icon: '/assets/icon-192x192.png',
    badge: '/assets/icon-96x96.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'game-actions-sync') {
    event.waitUntil(
      syncGameActions()
    );
  }
});

// Function to sync pending game actions
function syncGameActions() {
  // In a real implementation, this would retrieve actions from IndexedDB
  // and send them to the server when back online
  console.log('Syncing game actions');
  return Promise.resolve();
} 