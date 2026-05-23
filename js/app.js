// app.js — Application entry point
import Router from './router.js';
import Navbar from './components/navbar.js';
import EventBus from './event-bus.js';
import * as home from './pages/home.js';
import * as dataTab from './pages/data-tab.js';
import * as pomodoro from './pages/pomodoro.js';
import * as settings from './pages/settings.js';

const container = document.getElementById('page-container');

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

// Register routes
Router.register('#/', () => {
  container.innerHTML = home.render();
  EventBus.emit('route:changed', '#/');
});
Router.register('#/data', () => {
  container.innerHTML = dataTab.render();
  EventBus.emit('route:changed', '#/data');
});
Router.register('#/pomodoro', () => {
  container.innerHTML = pomodoro.render();
  EventBus.emit('route:changed', '#/pomodoro');
});
Router.register('#/settings', () => {
  container.innerHTML = settings.render();
  EventBus.emit('route:changed', '#/settings');
});

// Render navbar
Navbar.render(document.body);

// Default route
if (!window.location.hash) {
  window.location.hash = '#/';
}
