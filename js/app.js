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
function handleRoute(page, path) {
  if (cleanupCurrent) cleanupCurrent();
  container.innerHTML = page.render();
  cleanupCurrent = page.afterRender ? page.afterRender() : null;
  EventBus.emit('route:changed', path);
}

// Register routes
Router.register('#/', () => handleRoute(home, '#/'));
Router.register('#/data', () => handleRoute(dataTab, '#/data'));
Router.register('#/pomodoro', () => handleRoute(pomodoro, '#/pomodoro'));
Router.register('#/settings', () => handleRoute(settings, '#/settings'));
Router.register('#/data/skill-tree', () => handleRoute(skillTree, '#/data/skill-tree'));

// Render navbar
Navbar.render(document.body);

// Default route
if (!window.location.hash) {
  window.location.hash = '#/';
}
