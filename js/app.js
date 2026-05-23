// app.js — Application entry point
import Router from './router.js';
import Navbar from './components/navbar.js';
import EventBus from './event-bus.js';
import Theme from './theme.js';
import * as home from './pages/home.js';
import * as dataTab from './pages/data-tab.js';
import * as pomodoro from './pages/pomodoro.js';
import * as settings from './pages/settings.js';
import * as skillTree from './pages/skill-tree.js';
import * as review from './pages/review.js';
import * as logPage from './pages/log.js';
import * as reading from './pages/reading.js';
import * as about from './pages/about.js';
import * as search from './pages/search.js';
import * as dataIO from './pages/data-io.js';
import * as achievement from './pages/achievement.js';
import * as subjectDetail from './pages/subject-detail.js';

const container = document.getElementById('page-container');

// Theme must init before any render (FOUC already handled by inline script)
Theme.init();

// Init data engine (non-blocking, failure won't break the app)
(async () => {
  try {
    const { default: DataEngine } = await import('./data-engine.js');
    const { getDefaultProfile } = await import('./data/defaults.js');
    const { StorageKeys } = await import('./config.js');
    await DataEngine.init({ [StorageKeys.USER_PROFILE]: getDefaultProfile() });
  } catch { /* data engine optional */ }
})();

// Init router
Router.init(container);

// afterRender lifecycle pattern
let cleanupCurrent = null;
function handleRoute(page, path, params) {
  if (cleanupCurrent) { try { cleanupCurrent(); } catch {} }
  container.innerHTML = page.render(params);
  cleanupCurrent = page.afterRender ? page.afterRender(params) : null;
  EventBus.emit('route:changed', path);
}

// Register routes
Router.register('#/', () => handleRoute(home, '#/'));
Router.register('#/data', () => handleRoute(dataTab, '#/data'));
Router.register('#/pomodoro', () => handleRoute(pomodoro, '#/pomodoro'));
Router.register('#/settings', () => handleRoute(settings, '#/settings'));
Router.register('#/data/skill-tree', () => handleRoute(skillTree, '#/data/skill-tree'));
Router.register('#/data/review', () => handleRoute(review, '#/data/review'));
Router.register('#/data/log', () => handleRoute(logPage, '#/data/log'));
Router.register('#/data/reading', () => handleRoute(reading, '#/data/reading'));
Router.register('#/about', () => handleRoute(about, '#/about'));
Router.register('#/search', () => handleRoute(search, '#/search'));
Router.register('#/data/export', () => handleRoute(dataIO, '#/data/export'));
Router.register('#/achievement', () => handleRoute(achievement, '#/achievement'));
Router.register('#/subject/:id', (params) => {
  handleRoute(subjectDetail, '#/subject/' + params.id, params);
});

// Render navbar
Navbar.render(document.body);

// Default route
if (!window.location.hash) {
  window.location.hash = '#/';
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
