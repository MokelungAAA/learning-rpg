// app.js — 应用入口：路由注册、数据迁移、成就检测
// 注意：Theme.init() 必须在首屏渲染前调用
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
import { ACHIEVEMENTS } from './data/achievements.js';

const container = document.getElementById('page-container');

// Theme must init before any render (FOUC already handled by inline script)
Theme.init();

// Init data engine + 运行数据迁移（non-blocking, failure won't break the app）
(async () => {
  try {
    const { default: DataEngine } = await import('./data-engine.js');
    const { getDefaultProfile } = await import('./data/defaults.js');
    const { StorageKeys } = await import('./config.js');
    const { migrate, migrateRecordsXP } = await import('./data-migration.js');
    const { calcXP } = await import('./utils/level.js');
    await DataEngine.init({ [StorageKeys.USER_PROFILE]: getDefaultProfile() });
    // 运行用户画像迁移
    const Store = (await import('./store.js')).default;
    const profile = Store.get(StorageKeys.USER_PROFILE);
    if (profile) {
      const migrated = migrate(profile);
      if (migrated !== profile) Store.set(StorageKeys.USER_PROFILE, migrated);
    }
    // 重算所有记录 XP（XP Engine 2.0 迁移）
    migrateRecordsXP(Store, StorageKeys, calcXP);
    // 每日首次打开时运行画像自适应
    const today = new Date().toISOString().slice(0, 10);
    const lastAdapt = localStorage.getItem('lts_last_adapt_date');
    if (lastAdapt !== today) {
      const { adaptProfile } = await import('./utils/profile-adapt.js');
      adaptProfile();
      localStorage.setItem('lts_last_adapt_date', today);
    }
  } catch { /* data engine optional */ }
})();

// Init router
Router.init(container);

// 路由切换：销毁旧页面 → 渲染新页面 → 执行 afterRender
// 返回值 cleanup 函数在下次路由切换时自动调用
let cleanupCurrent = null;
function handleRoute(page, path, params) {
  if (cleanupCurrent) { try { cleanupCurrent(); } catch {} }
  container.innerHTML = page.render(params);
  cleanupCurrent = page.afterRender ? page.afterRender(params) : null;
  EventBus.emit('route:changed', path);
}

// 全局 FAB "+" 点击 → 打开数据录入弹窗（所有页面可用）
EventBus.on('fab:click', async () => {
  const { open } = await import('./components/data-entry.js');
  open();
});

// 路由切换时自动关闭数据录入弹窗
EventBus.on('route:changed', async () => {
  const { close } = await import('./components/data-entry.js');
  close();
});

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

// 番茄钟 FAB（始终可见, 移动端底部右侧）
(async () => {
  try {
    const { default: PomoFab } = await import('./components/pomo-fab.js');
    PomoFab.render();
  } catch {}
})();

// 成就解锁检测：新增记录时异步检查，弹 Toast 通知
// 内部用 dynamic import 避免循环依赖
async function checkAchievements() {
  try {
    const { checkAndPersist } = await import('./utils/achievements-check.js');
    const { default: Toast } = await import('./components/toast.js');
    const Store = (await import('./store.js')).default;
    const { StorageKeys } = await import('./config.js');
    const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
    const profile = Store.get(StorageKeys.USER_PROFILE) || {};
    const { newlyUnlocked } = checkAndPersist(records, profile, ACHIEVEMENTS);
    for (const ach of newlyUnlocked) {
      Toast.success(`🏆 成就解锁: ${ach.name}`);
    }
  } catch { /* achievement check optional */ }
}
EventBus.on('record:added', checkAchievements);
EventBus.on('reading:added', checkAchievements);
EventBus.on('pomodoro:completed', checkAchievements);

// Default route
if (!window.location.hash) {
  window.location.hash = '#/';
}

// 全局快捷键: Ctrl+K 命令面板, Ctrl+D 深色模式
document.addEventListener('keydown', async (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const { openPalette } = await import('./components/command-palette.js');
    openPalette();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
    e.preventDefault();
    Theme.toggle();
  }
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});

  // §13.3: 监听 SW 同步消息
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type === 'SYNC_TRIGGERED') {
      EventBus.emit('sync:triggered');
    }
  });
}

// §13.3: 离线重连 — 恢复网络时自动触发同步
window.addEventListener('online', async () => {
  try {
    const { default: Toast } = await import('./components/toast.js');
    Toast.show('网络已恢复，正在同步...', 'info');
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready;
      if (reg.sync) reg.sync.register('sync-data');
    }
    EventBus.emit('sync:triggered');
  } catch {}
});

window.addEventListener('offline', async () => {
  try {
    const { default: Toast } = await import('./components/toast.js');
    Toast.show('已进入离线模式', 'warning');
  } catch {}
});
