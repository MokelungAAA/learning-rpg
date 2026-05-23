// navbar.js — 导航组件：移动端底部栏 + 桌面端侧边栏
// 导出单例，监听 route:changed 事件自动高亮
import { NAV_TABS } from '../config.js';
import EventBus from '../event-bus.js';

class Navbar {
  constructor() {
    this.el = null;       // 底部导航 DOM
    this.sidebar = null;  // 侧边栏 DOM
    this.activeTab = 'home';
  }

  // 渲染两种导航，绑定路由监听
  render(container) {
    this.renderBottomNav(container);
    this.renderSidebar(container);
    this.setActive(window.location.hash || '#/');
    EventBus.on('route:changed', (hash) => this.setActive(hash));
  }

  // 构建移动端底部导航：首页→数据→番茄钟→设置→+
  renderBottomNav(container) {
    this.el = document.createElement('nav');
    this.el.className = 'bottom-nav';
    this.el.id = 'bottom-nav';

    // 按指定顺序渲染 tab：home, data, pomodoro, settings
    const order = ['home', 'data', 'pomodoro', 'settings'];
    for (const id of order) {
      const tab = NAV_TABS.find(t => t.id === id);
      if (!tab) continue;
      const btn = document.createElement('button');
      btn.className = 'nav-tab' + (id === 'pomodoro' ? ' nav-tab-pomo' : '');
      btn.dataset.tab = tab.id;
      btn.innerHTML = `<span class="nav-icon">${tab.icon}</span><span class="nav-label">${tab.label}</span>`;
      btn.addEventListener('click', () => { window.location.hash = tab.hash; });
      this.el.appendChild(btn);
    }

    // FAB 新记录按钮
    const fab = document.createElement('button');
    fab.className = 'nav-fab';
    fab.textContent = '+';
    fab.addEventListener('click', () => EventBus.emit('fab:click'));
    this.el.appendChild(fab);

    container.appendChild(this.el);
  }

  // 构建桌面端侧边栏：品牌 + 全部tab + 新记录按钮
  renderSidebar(container) {
    this.sidebar = document.createElement('nav');
    this.sidebar.className = 'sidebar-nav';

    // Brand
    const brand = document.createElement('div');
    brand.className = 'sidebar-brand';
    brand.innerHTML = '<span class="sidebar-brand-icon">🎮</span> 学习RPG';
    this.sidebar.appendChild(brand);

    // Nav items
    const items = document.createElement('div');
    items.className = 'sidebar-items';

    NAV_TABS.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'sidebar-item';
      btn.dataset.tab = tab.id;
      btn.innerHTML = `<span class="sidebar-item-icon">${tab.icon}</span>${tab.label}`;
      btn.addEventListener('click', () => { window.location.hash = tab.hash; });
      items.appendChild(btn);
    });

    this.sidebar.appendChild(items);

    // Divider
    const divider = document.createElement('div');
    divider.className = 'sidebar-divider';
    this.sidebar.appendChild(divider);

    // FAB as full-width button
    const fab = document.createElement('button');
    fab.className = 'sidebar-fab';
    fab.innerHTML = '+ 新记录';
    fab.addEventListener('click', () => EventBus.emit('fab:click'));
    this.sidebar.appendChild(fab);

    container.appendChild(this.sidebar);
  }

  // 根据当前路由hash高亮对应tab，底部栏和侧边栏同步
  setActive(hash) {
    // Bottom nav
    if (this.el) {
      this.el.querySelectorAll('.nav-tab').forEach(btn => {
        const tabHash = NAV_TABS.find(t => t.id === btn.dataset.tab)?.hash;
        btn.classList.toggle('active', tabHash === hash || (hash === '#/' && tabHash === '#/'));
      });
    }
    // Sidebar
    if (this.sidebar) {
      this.sidebar.querySelectorAll('.sidebar-item').forEach(btn => {
        const tabHash = NAV_TABS.find(t => t.id === btn.dataset.tab)?.hash;
        btn.classList.toggle('active', tabHash === hash || (hash === '#/' && tabHash === '#/'));
      });
    }
  }
}

export default new Navbar();
