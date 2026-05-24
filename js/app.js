// app.js — 应用入口：路由注册、数据迁移、成就检测
// 注意：Theme.init() 必须在首屏渲染前调用
// 页面模块全部用动态 import 懒加载，减少首屏 JS 解析量
import Router from './router.js';
import Navbar from './components/navbar.js';
import BrandedHeader from './components/branded-header.js';
import EventBus from './event-bus.js';
import Theme from './theme.js';
import { createLaunchOverlay } from './components/launch-screen.js';

const container = document.getElementById('page-container');

// Theme must init before any render (FOUC already handled by inline script)
Theme.init();

// 开屏动画：同步创建 overlay 立即盖住屏幕，数据初始化在遮罩下并行进行
const _launchSettings = JSON.parse(localStorage.getItem('lts_settings') || '{}');
const _launchOverlay = _launchSettings.launchScreen !== false ? createLaunchOverlay() : null;
// 移除 HTML 内联预遮罩（动画 overlay 已接管）
const _preOverlay = document.getElementById('launch-pre-overlay');
if (_preOverlay) _preOverlay.remove();

// 工具：让出主线程（让点击事件有机会执行）
const yieldToMain = () => new Promise(r => setTimeout(r, 0));

// Init data engine + 运行数据迁移（non-blocking, failure won't break the app）
// 数据架构: 内嵌JS(即时可用) → GitHub云端(后台合并) → localStorage(缓存)
(async () => {
  try {
    const { STORAGE_KEYS: StorageKeys } = await import('./config.js');
    const Store = (await import('./store.js')).default;

    // ── 第一步: 立即加载内嵌数据（确保首屏有数据） ──
    const fileData = window.LTS_RECORDS_DATA;
    let fromEmbedded = false;
    if (fileData?.records?.length > 0) {
      const existing = Store.get(StorageKeys.STUDY_RECORDS) || [];
      if (existing.length === 0) {
        Store.set(StorageKeys.STUDY_RECORDS, fileData.records);
        fromEmbedded = true;
        console.log('[LTS] loaded', fileData.records.length, 'records from embedded data');
      }
    }

    await yieldToMain(); // 让出主线程，确保点击事件可以响应

    // 初始化用户画像
    const { default: DataEngine } = await import('./data-engine.js');
    const { getDefaultProfile } = await import('./data/defaults.js');
    await DataEngine.init({ [StorageKeys.USER_PROFILE]: getDefaultProfile() });

    await yieldToMain();

    // 运行用户画像迁移
    const { migrate, migrateRecordsXP } = await import('./data-migration.js');
    const { calcXP } = await import('./utils/level.js');
    const profile = Store.get(StorageKeys.USER_PROFILE);
    if (profile) {
      const migrated = migrate(profile);
      if (migrated !== profile) Store.set(StorageKeys.USER_PROFILE, migrated);
    }

    // 重算所有记录 XP
    const profileForXP = Store.get(StorageKeys.USER_PROFILE);
    if (profileForXP && profileForXP._xpMigrated) {
      delete profileForXP._xpMigrated;
      Store.set(StorageKeys.USER_PROFILE, profileForXP);
    }
    migrateRecordsXP(Store, StorageKeys, calcXP);

    await yieldToMain();

    // 通知页面重新渲染（内嵌数据已就绪）
    const _records = Store.get(StorageKeys.STUDY_RECORDS) || [];
    console.log('[LTS] data:ready (local): records=%d, totalXP=%d', _records.length, _records.reduce((s, r) => s + (r.xp || 0), 0));
    EventBus.emit('data:ready');

    // ── 第二步: 后台从 GitHub 云端同步（不阻塞渲染，不用 await） ──
    try {
      const { default: SyncEngine } = await import('./sync-engine.js');
      const builtInCfg = window.LTS_SYNC_CONFIG || {};
      const userCfg = Store.get('lts_sync_config') || {};
      const syncCfg = { ...builtInCfg, ...userCfg };
      if (syncCfg.token && syncCfg.owner && syncCfg.repo) {
        SyncEngine.configure(syncCfg.token, syncCfg.owner, syncCfg.repo);
        if (!userCfg.token) Store.set('lts_sync_config', syncCfg);
        // fire-and-forget: 不 await，让同步在后台运行
        SyncEngine.startupLoad(fromEmbedded).then(cloudOk => {
          if (cloudOk) {
            const _cloudRecords = Store.get(StorageKeys.STUDY_RECORDS) || [];
            console.log('[LTS] cloud sync OK: records=%d, totalXP=%d', _cloudRecords.length, _cloudRecords.reduce((s, r) => s + (r.xp || 0), 0));
            EventBus.emit('data:ready');
          } else {
            console.log('[LTS] cloud sync returned false (no data or network error)');
          }
        }).catch(e => console.warn('[LTS] cloud sync error:', e.message || e));
      }
    } catch (e) { console.warn('[LTS] cloud sync failed:', e.message || e); }

    // 每日首次打开时运行画像自适应
    const today = new Date().toISOString().slice(0, 10);
    const lastAdapt = localStorage.getItem('lts_last_adapt_date');
    if (lastAdapt !== today) {
      try {
        const { adaptProfile } = await import('./utils/profile-adapt.js');
        adaptProfile();
        localStorage.setItem('lts_last_adapt_date', today);
      } catch {}
    }
  } catch (e) { console.error('[LTS] init failed:', e); }
})();

// Init router
Router.init(container);

// §4.2/§6.3: 品牌头部栏（桌面端显示）
BrandedHeader.render(document.body);

// 路由切换：销毁旧页面 → 渲染新页面 → 执行 afterRender
// 返回值 cleanup 函数在下次路由切换时自动调用
let cleanupCurrent = null;
function handleRoute(page, path, params) {
  if (cleanupCurrent) { try { cleanupCurrent(); } catch {} }
  container.innerHTML = page.render(params);
  cleanupCurrent = page.afterRender ? page.afterRender(params) : null;
  EventBus.emit('route:changed', path);
}

// 懒加载路由：先 import 模块再渲染（减少首屏 JS 解析量）
function lazyRoute(importFn, path, params) {
  importFn().then(mod => handleRoute(mod, path, params));
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

// Register routes — 全部懒加载
Router.register('#/', () => lazyRoute(() => import('./pages/home.js'), '#/'));
Router.register('#/data', () => lazyRoute(() => import('./pages/data-tab.js'), '#/data'));
Router.register('#/pomodoro', () => lazyRoute(() => import('./pages/pomodoro.js'), '#/pomodoro'));
Router.register('#/settings', () => lazyRoute(() => import('./pages/settings.js'), '#/settings'));
Router.register('#/data/skill-tree', () => lazyRoute(() => import('./pages/skill-tree.js'), '#/data/skill-tree'));
Router.register('#/data/review', () => lazyRoute(() => import('./pages/review.js'), '#/data/review'));
Router.register('#/data/log', () => lazyRoute(() => import('./pages/log.js'), '#/data/log'));
Router.register('#/data/reading', () => lazyRoute(() => import('./pages/reading.js'), '#/data/reading'));
Router.register('#/about', () => lazyRoute(() => import('./pages/about.js'), '#/about'));
Router.register('#/search', () => lazyRoute(() => import('./pages/search.js'), '#/search'));
Router.register('#/data/export', () => lazyRoute(() => import('./pages/data-io.js'), '#/data/export'));
Router.register('#/achievement', () => lazyRoute(() => import('./pages/achievement.js'), '#/achievement'));
Router.register('#/subject/:id', (params) => {
  lazyRoute(() => import('./pages/subject-detail.js'), '#/subject/' + params.id, params);
});
Router.register('#/debug', () => lazyRoute(() => import('./pages/debug.js'), '#/debug'));
Router.register('#/data/recitation', () => lazyRoute(() => import('./pages/recitation.js'), '#/data/recitation'));
Router.register('#/data/score-trend', () => lazyRoute(() => import('./pages/score-trend.js'), '#/data/score-trend'));

// Render navbar
Navbar.render(document.body);

// 成就解锁检测：新增记录时异步检查，弹 Toast 通知
// 内部用 dynamic import 避免循环依赖
// _achLock 防止并发执行导致重复 Toast
let _achLock = false;
async function checkAchievements() {
  if (_achLock) return;
  _achLock = true;
  try {
    const { checkAndPersist } = await import('./utils/achievements-check.js');
    const { ACHIEVEMENTS } = await import('./data/achievements.js');
    const { default: Toast } = await import('./components/toast.js');
    const Store = (await import('./store.js')).default;
    const { STORAGE_KEYS: StorageKeys } = await import('./config.js');
    const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
    const profile = Store.get(StorageKeys.USER_PROFILE) || {};
    const { newlyUnlocked } = checkAndPersist(records, profile, ACHIEVEMENTS);
    for (const ach of newlyUnlocked) {
      Toast.success(`🏆 成就解锁: ${ach.name}`);
    }
  } catch { /* achievement check optional */ }
  finally { _achLock = false; }
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

// §13.3: 离线重连 — 恢复网络时自动触发同步 + 刷新离线队列
window.addEventListener('online', async () => {
  try {
    const { default: Toast } = await import('./components/toast.js');
    const { getQueue, clearQueue, queueSize } = await import('./utils/offline-queue.js');
    const size = queueSize();
    if (size > 0) {
      Toast.show(`网络已恢复，${size} 条离线记录已就绪`, 'info');
      clearQueue();
    } else {
      Toast.show('网络已恢复，正在同步...', 'info');
    }
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready;
      if (reg.sync) reg.sync.register('sync-data');
    }
    EventBus.emit('sync:triggered');
  } catch {}
});

// §13.3: 记录添加时，如果离线则加入队列
EventBus.on('record:added', async (record) => {
  if (!navigator.onLine) {
    const { enqueue } = await import('./utils/offline-queue.js');
    enqueue(record);
  }
});

window.addEventListener('offline', async () => {
  try {
    const { default: Toast } = await import('./components/toast.js');
    Toast.show('已进入离线模式', 'warning');
  } catch {}
});
