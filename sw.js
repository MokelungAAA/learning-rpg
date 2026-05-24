// sw.js — Service Worker for LTS PWA (§13: Cache First + Background Update)
// 策略: 缓存优先 + 后台静默更新 (stale-while-revalidate)
const CACHE_NAME = 'lts-v3';
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
  './css/components/command-palette.css',
  './css/components/pomo-fab.css',
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
  './css/pages/recitation.css',
  './css/pages/score-trend.css',
  './js/app.js',
  './js/router.js',
  './js/store.js',
  './js/config.js',
  './js/event-bus.js',
  './js/theme.js',
  './js/data-engine.js',
  './js/sync-engine.js',
  './data/lts_study_records.js',
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

// §13.1: Stale-while-revalidate — 返回缓存同时后台更新
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(response => {
          if (response && response.status === 200) {
            cache.put(e.request, response.clone());
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});

// §13.3: 监听 sync 事件（离线重连后触发）
self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-data') {
    e.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SYNC_TRIGGERED' }));
      })
    );
  }
});
