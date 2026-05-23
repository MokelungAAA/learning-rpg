// navbar.js — Bottom navigation bar component
import { NAV_TABS } from '../config.js';
import EventBus from '../event-bus.js';

class Navbar {
  constructor() {
    this.el = null;
    this.activeTab = 'home';
  }

  render(container) {
    this.el = document.createElement('nav');
    this.el.className = 'bottom-nav';
    this.el.id = 'bottom-nav';

    NAV_TABS.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'nav-tab';
      btn.dataset.tab = tab.id;
      btn.innerHTML = `<span class="nav-icon">${tab.icon}</span><span class="nav-label">${tab.label}</span>`;
      btn.addEventListener('click', () => {
        window.location.hash = tab.hash;
      });
      this.el.appendChild(btn);
    });

    // FAB "+" button in the middle
    const fab = document.createElement('button');
    fab.className = 'nav-fab';
    fab.textContent = '+';
    fab.addEventListener('click', () => EventBus.emit('fab:click'));
    this.el.appendChild(fab);

    container.appendChild(this.el);
    this.setActive(window.location.hash || '#/');
    EventBus.on('route:changed', (hash) => this.setActive(hash));
  }

  setActive(hash) {
    if (!this.el) return;
    this.el.querySelectorAll('.nav-tab').forEach(btn => {
      const tabHash = NAV_TABS.find(t => t.id === btn.dataset.tab)?.hash;
      btn.classList.toggle('active', tabHash === hash || (hash === '#/' && tabHash === '#/'));
    });
  }
}

export default new Navbar();
