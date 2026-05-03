// sw.js

const CACHE_NAME = 'crowdsource-static-v9';

// All static UI assets required for the app to boot and function offline
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/ayuda.html',
    '/privacidad.html',
    '/terminos.html',
    '/css/style.css',
    
    // Updated Modular JavaScript Files
    '/js/categories.js',
    '/js/auth.js',
    '/js/api.js',
    '/js/geolocation.js',
    '/js/db.js',
    '/js/form-ui.js',
    '/js/camera.js',
    '/js/app.js',
    
    '/images/logo_120sq.png',
    '/manifest.json',
    
    // External dependencies must also be cached for offline use
    'https://unpkg.com/dexie/dist/dexie.js'
];

// 1. Install Event - Cache Static Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching static assets during install');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // Force the waiting service worker to become the active service worker immediately
    self.skipWaiting();
});

// 2. Activate Event - Clean up old cache versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting outdated cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Take control of all open pages immediately without waiting for a refresh
    self.clients.claim();
});

// 3. Fetch Event - Intercept network requests
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API & Auth Bypass: Never cache requests going to the Flask backend.
    // The app logic (Dexie.js queue) handles offline API states, not the Service Worker.
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Cache-First Strategy for all other requests (HTML, CSS, JS, Manifest)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return the cached asset if found
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise, attempt to fetch from the network
            return fetch(event.request).catch((error) => {
                console.error('[Service Worker] Fetch failed and no cache found for:', event.request.url, error);
            });
        })
    );
});
