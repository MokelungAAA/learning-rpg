// navbar.js — 导航组件：移动端底部栏 + 桌面端侧边栏
// 导出单例，监听 route:changed 事件自动高亮
import { NAV_TABS, STORAGE_KEYS as StorageKeys } from '../config.js';
import EventBus from '../event-bus.js';

class Navbar {
  constructor() {
    this.el = null;       // 底部导航 DOM
    this.sidebar = null;  // 侧边栏 DOM
    this.detailPanel = null; // 侧边栏详情面板
    this.activeTab = 'home';
  }

  // 渲染两种导航，绑定路由监听
  render(container) {
    this.renderBottomNav(container);
    this.renderSidebar(container);
    this.setActive(window.location.hash || '#/');
    EventBus.on('route:changed', (hash) => this.setActive(hash));
  }

  // 构建移动端底部导航：首页→数据→设置→+
  renderBottomNav(container) {
    this.el = document.createElement('nav');
    this.el.className = 'bottom-nav';
    this.el.id = 'bottom-nav';

    // 按指定顺序渲染 tab：home, data, settings
    const order = ['home', 'data', 'settings'];
    for (const id of order) {
      const tab = NAV_TABS.find(t => t.id === id);
      if (!tab) continue;
      const btn = document.createElement('button');
      btn.className = 'nav-tab';
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

  // 构建桌面端侧边栏：品牌 + 全部tab + 详情面板 + 新记录按钮
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

    // Detail panel (context-sensitive, shown for data tab)
    this.detailPanel = document.createElement('div');
    this.detailPanel.className = 'sidebar-detail';
    this.detailPanel.id = 'sidebar-detail';
    this.sidebar.appendChild(this.detailPanel);

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

  // 侧边栏详情面板：根据当前 tab 展示上下文信息
  updateDetailPanel(hash) {
    if (!this.detailPanel) return;
    // 只在数据相关页面显示详情
    const dataRoutes = ['#/data', '#/data/skill-tree', '#/data/review', '#/data/log', '#/data/reading'];
    const isDataPage = dataRoutes.some(r => hash === r || hash.startsWith(r + '?'));

    if (!isDataPage) {
      this.detailPanel.style.display = 'none';
      return;
    }

    this.detailPanel.style.display = 'block';
    this.renderDataSidebarDetail();
  }

  // 渲染数据侧边栏详情：今日摘要 + 学科进度
  renderDataSidebarDetail() {
    try {
      const records = JSON.parse(localStorage.getItem(StorageKeys.STUDY_RECORDS) || '[]');
      const now = Date.now();
      const today = new Date().toISOString().slice(0, 10);
      const todayRecs = records.filter(r => r.timestamp && r.timestamp.slice(0, 10) === today);
      const todayMin = todayRecs.reduce((s, r) => s + (r.duration || 0), 0);
      const todayXP = todayRecs.reduce((s, r) => s + (r.xp || 0), 0);
      const totalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
      const totalMin = records.reduce((s, r) => s + (r.duration || 0), 0);

      // 学科时长分布（最近7天）
      const weekRecs = records.filter(r => r.timestamp && (now - new Date(r.timestamp).getTime()) < 7 * 86400000);
      const bySubject = {};
      for (const r of weekRecs) {
        const subj = r.subject || '未知';
        bySubject[subj] = (bySubject[subj] || 0) + (r.duration || 0);
      }
      const topSubjects = Object.entries(bySubject)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const subjectBars = topSubjects.map(([name, min]) => {
        const pct = Math.min(100, Math.round((min / Math.max(...topSubjects.map(s => s[1]))) * 100));
        return `<div class="sidebar-stat-bar">
          <div class="sidebar-stat-label">${name}</div>
          <div class="sidebar-bar-track"><div class="sidebar-bar-fill" style="width:${pct}%"></div></div>
          <div class="sidebar-stat-value">${min}分</div>
        </div>`;
      }).join('');

      // 最近3条记录
      const recent = records.filter(r => r.timestamp).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 3);
      const recentItems = recent.map(r => {
        const time = new Date(r.timestamp).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
        return `<div class="sidebar-recent-item"><span class="sidebar-recent-subj">${r.subject}</span><span class="sidebar-recent-meta">${time} · ${r.duration || 0}分 · ${r.xp || 0}XP</span></div>`;
      }).join('');

      this.detailPanel.innerHTML = `
        <div class="sidebar-detail-title">📊 今日概览</div>
        <div class="sidebar-stats-grid">
          <div class="sidebar-stat-box"><div class="sidebar-stat-num">${todayMin}</div><div class="sidebar-stat-lbl">分钟</div></div>
          <div class="sidebar-stat-box"><div class="sidebar-stat-num">${todayXP}</div><div class="sidebar-stat-lbl">XP</div></div>
          <div class="sidebar-stat-box"><div class="sidebar-stat-num">${Math.floor(totalMin / 60)}h</div><div class="sidebar-stat-lbl">总时长</div></div>
          <div class="sidebar-stat-box"><div class="sidebar-stat-num">${totalXP}</div><div class="sidebar-stat-lbl">总XP</div></div>
        </div>
        ${topSubjects.length > 0 ? `<div class="sidebar-detail-title">📈 本周学科</div>${subjectBars}` : ''}
        ${recent.length > 0 ? `<div class="sidebar-detail-title">🕐 最近记录</div>${recentItems}` : ''}
      `;
    } catch {
      this.detailPanel.innerHTML = '<p class="sidebar-detail-empty">暂无数据</p>';
    }
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
    // Update detail panel
    this.updateDetailPanel(hash);
  }
}

export default new Navbar();
