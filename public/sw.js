// ============================================================
// public/sw.js — Clothza service worker
// App shell precached; product/store images cached on first view.
// Network-first for navigation so new deploys are picked up.
// ============================================================

const VERSION = 'clothza-v1';
const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache Supabase (auth, data) or anything cross-origin API-like
  if (url.origin !== self.location.origin) return;

  // Navigations: network first, fall back to the cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(VERSION).then(c => c.put('/', copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match('/').then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // Static assets: cache first, then network
  if (/\.(?:js|css|woff2|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then(c => c.put(request, copy)).catch(() => {});
          }
          return response;
        });
      })
    );
  }
});
