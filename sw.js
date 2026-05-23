// sw.js — Service Worker for LTS PWA offline support
const CACHE_NAME = 'lts-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/reset.css',
  './css/base.css',
  './css/glass.css',
  './css/animations.css',
  './css/dark-mode.css',
  './css/responsive.css',
  './css/components/navbar.css',
  './css/components/bottom-sheet.css',
  './css/components/toast.css',
  './css/components/status-bar.css',
  './css/components/data-entry.css',
  './css/pages/home.css',
  './css/pages/data-tab.css',
  './css/pages/skill-tree.css',
  './css/pages/review.css',
  './css/pages/log.css',
  './css/pages/pomodoro.css',
  './css/pages/reading.css',
  './css/pages/settings.css',
  './css/pages/about.css',
  './css/pages/search.css',
  './css/pages/data-io.css',
  './css/pages/achievement.css',
  './css/pages/subject-detail.css',
  './js/app.js',
  './js/router.js',
  './js/store.js',
  './js/config.js',
  './js/event-bus.js',
  './js/theme.js',
  './js/data-engine.js',
  './js/sync-engine.js',
];

// Install: cache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for assets, network-first for API
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Skip non-GET and external requests
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
