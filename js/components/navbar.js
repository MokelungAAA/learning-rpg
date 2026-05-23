// navbar.js — Bottom navigation bar component (L-shape: pomodoro above FAB)
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

    // Separate pomodoro from the main row
    const mainTabs = NAV_TABS.filter(t => t.id !== 'pomodoro');
    const pomodoroTab = NAV_TABS.find(t => t.id === 'pomodoro');

    // Main row: home, data, [FAB], settings
    mainTabs.forEach((tab, i) => {
      // Divider before the last tab (settings)
      if (i === mainTabs.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'nav-divider';
        this.el.appendChild(divider);
      }
      const btn = document.createElement('button');
      btn.className = 'nav-tab';
      btn.dataset.tab = tab.id;
      btn.innerHTML = `<span class="nav-icon">${tab.icon}</span><span class="nav-label">${tab.label}</span>`;
      btn.addEventListener('click', () => { window.location.hash = tab.hash; });
      this.el.appendChild(btn);
    });

    // FAB "+" button in the center
    const fab = document.createElement('button');
    fab.className = 'nav-fab';
    fab.textContent = '+';
    fab.addEventListener('click', () => EventBus.emit('fab:click'));
    this.el.appendChild(fab);

    // Pomodoro tab floating above the FAB (L-shape)
    if (pomodoroTab) {
      const pomBtn = document.createElement('button');
      pomBtn.className = 'nav-tab nav-tab-float';
      pomBtn.dataset.tab = pomodoroTab.id;
      pomBtn.innerHTML = `<span class="nav-icon">${pomodoroTab.icon}</span><span class="nav-label">${pomodoroTab.label}</span>`;
      pomBtn.addEventListener('click', () => { window.location.hash = pomodoroTab.hash; });
      this.el.appendChild(pomBtn);
    }

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
