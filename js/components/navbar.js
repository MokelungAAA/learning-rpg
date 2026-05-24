// navbar.js — 导航组件：移动端底部栏 + 桌面端侧边栏
// v0.121: 长按打开NLP快速录入，短按扇形菜单
import { NAV_TABS, STORAGE_KEYS as StorageKeys } from '../config.js';
import EventBus from '../event-bus.js';
import * as NlpEntry from './nlp-entry.js';

// 扇形菜单配置：5个快捷操作（番茄钟居中）
const FAN_ITEMS = [
  { id: 'home',     icon: '🏠', label: '首页', hash: '#/' },
  { id: 'data',     icon: '📊', label: '数据', hash: '#/data' },
  { id: 'pomodoro', icon: '🍅', label: '番茄钟', hash: '#/pomodoro' },
  { id: 'search',   icon: '🔍', label: '搜索', hash: '#/search' },
  { id: 'settings', icon: '⚙️', label: '设置', hash: '#/settings' },
];

class Navbar {
  constructor() {
    this.el = null;
    this.sidebar = null;
    this.detailPanel = null;
    this.activeTab = 'home';
    this.fanOpen = false;
    this.fanOverlay = null;
    this.fanBtns = [];
  }

  render(container) {
    this.renderBottomNav(container);
    this.renderSidebar(container);
    this.setActive(window.location.hash || '#/');
    EventBus.on('route:changed', (hash) => {
      this.setActive(hash);
      this.closeFan(); // 路由切换时自动关闭扇形菜单
    });

    // ESC 键关闭扇形菜单
    this._onKeydown = (e) => {
      if (e.key === 'Escape' && this.fanOpen) this.closeFan();
    };
    document.addEventListener('keydown', this._onKeydown);
  }

  // 底部导航：只有 + 按钮
  renderBottomNav(container) {
    this.el = document.createElement('nav');
    this.el.className = 'bottom-nav';
    this.el.id = 'bottom-nav';

    // 中央：+ 按钮（56px）
    const fabWrap = document.createElement('div');
    fabWrap.className = 'nav-fab-wrap';

    const fab = document.createElement('button');
    fab.className = 'nav-fab-center';
    fab.innerHTML = '<span class="nav-fab-icon">+</span>';
    fab.setAttribute('aria-label', '快捷操作');

    // 长按500ms → 打开NLP快速录入；短按 → 切换扇形菜单
    let pressTimer = null;
    let isLongPress = false;
    fab.addEventListener('pointerdown', () => {
      isLongPress = false;
      pressTimer = setTimeout(() => {
        isLongPress = true;
        this.closeFan();
        NlpEntry.open();
      }, 500);
    });
    fab.addEventListener('pointerup', () => {
      clearTimeout(pressTimer);
    });
    fab.addEventListener('pointerleave', () => {
      clearTimeout(pressTimer);
      isLongPress = false;
    });
    fab.addEventListener('click', (e) => {
      if (isLongPress) {
        isLongPress = false;
        return;
      }
      this.toggleFan();
    });

    fabWrap.appendChild(fab);
    this.el.appendChild(fabWrap);
    container.appendChild(this.el);

    // 创建扇形菜单
    this.renderFanMenu(container);
  }

  // 扇形菜单：4个快捷按钮
  renderFanMenu(container) {
    // 半透明遮罩
    this.fanOverlay = document.createElement('div');
    this.fanOverlay.className = 'fan-overlay';
    this.fanOverlay.addEventListener('click', () => this.closeFan());

    // 扇形容器
    const fanContainer = document.createElement('div');
    fanContainer.className = 'fan-container';
    fanContainer.id = 'fan-container';

    FAN_ITEMS.forEach((item, i) => {
      const btn = document.createElement('button');
      btn.className = 'fan-item';
      btn.dataset.idx = i;
      btn.innerHTML = `<span class="fan-item-icon">${item.icon}</span><span class="fan-item-label">${item.label}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeFan();
        window.location.hash = item.hash;
      });
      fanContainer.appendChild(btn);
      this.fanBtns.push(btn);
    });

    this.fanOverlay.appendChild(fanContainer);
    container.appendChild(this.fanOverlay);
  }

  toggleFan() {
    if (this.fanOpen) this.closeFan();
    else this.openFan();
  }

  openFan() {
    if (this.fanOpen) return;
    this.fanOpen = true;
    this.fanOverlay.classList.add('open');

    // 更新+按钮旋转
    const fab = this.el.querySelector('.nav-fab-center');
    if (fab) fab.classList.add('rotated');

    // 展开按钮
    this.fanBtns.forEach((btn, i) => {
      btn.style.transitionDelay = `${i * 50}ms`;
      btn.classList.add('open');
    });
  }

  closeFan() {
    if (!this.fanOpen) return;
    this.fanOpen = false;

    const fab = this.el.querySelector('.nav-fab-center');
    if (fab) fab.classList.remove('rotated');

    // 反向收起
    this.fanBtns.forEach((btn, i) => {
      btn.style.transitionDelay = `${(this.fanBtns.length - 1 - i) * 30}ms`;
      btn.classList.remove('open');
    });

    setTimeout(() => {
      if (this.fanOverlay) this.fanOverlay.classList.remove('open');
    }, 300);
  }

  // 桌面端侧边栏（保持不变）
  renderSidebar(container) {
    this.sidebar = document.createElement('nav');
    this.sidebar.className = 'sidebar-nav';

    const brand = document.createElement('div');
    brand.className = 'sidebar-brand';
    brand.innerHTML = '<span class="sidebar-brand-icon">🎮</span> 学习RPG';
    this.sidebar.appendChild(brand);

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

    this.detailPanel = document.createElement('div');
    this.detailPanel.className = 'sidebar-detail';
    this.detailPanel.id = 'sidebar-detail';
    this.sidebar.appendChild(this.detailPanel);

    const divider = document.createElement('div');
    divider.className = 'sidebar-divider';
    this.sidebar.appendChild(divider);

    const fab = document.createElement('button');
    fab.className = 'sidebar-fab';
    fab.innerHTML = '+ 新记录';
    fab.addEventListener('click', () => EventBus.emit('fab:click'));
    this.sidebar.appendChild(fab);

    container.appendChild(this.sidebar);
  }

  updateDetailPanel(hash) {
    if (!this.detailPanel) return;
    const dataRoutes = ['#/data', '#/data/skill-tree', '#/data/review', '#/data/log', '#/data/reading'];
    const isDataPage = dataRoutes.some(r => hash === r || hash.startsWith(r + '?'));
    if (!isDataPage) {
      this.detailPanel.style.display = 'none';
      return;
    }
    this.detailPanel.style.display = 'block';
    this.renderDataSidebarDetail();
  }

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

      const weekRecs = records.filter(r => r.timestamp && (now - new Date(r.timestamp).getTime()) < 7 * 86400000);
      const bySubject = {};
      for (const r of weekRecs) {
        const subj = r.subject || '未知';
        bySubject[subj] = (bySubject[subj] || 0) + (r.duration || 0);
      }
      const topSubjects = Object.entries(bySubject).sort((a, b) => b[1] - a[1]).slice(0, 5);

      const subjectBars = topSubjects.map(([name, min]) => {
        const pct = Math.min(100, Math.round((min / Math.max(...topSubjects.map(s => s[1]))) * 100));
        return `<div class="sidebar-stat-bar">
          <div class="sidebar-stat-label">${name}</div>
          <div class="sidebar-bar-track"><div class="sidebar-bar-fill" style="width:${pct}%"></div></div>
          <div class="sidebar-stat-value">${min}分</div>
        </div>`;
      }).join('');

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

  setActive(hash) {
    if (this.sidebar) {
      this.sidebar.querySelectorAll('.sidebar-item').forEach(btn => {
        const tabHash = NAV_TABS.find(t => t.id === btn.dataset.tab)?.hash;
        btn.classList.toggle('active', tabHash === hash || (hash === '#/' && tabHash === '#/'));
      });
    }
    this.updateDetailPanel(hash);
  }
}

export default new Navbar();
