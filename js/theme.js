// theme.js — 主题管理：light/dark/system 三态切换
// 单例模式，init() 必须在首屏渲染前调用以避免 FOUC
const STORAGE_KEY = 'lts_settings';

class Theme {
  constructor() {
    this._mode = 'system'; // light | dark | system
    this._mq = window.matchMedia('(prefers-color-scheme: dark)');
    this._onMqChange = () => {
      if (this._mode === 'system') this._apply();
    };
  }

  // 初始化：从 localStorage 读取主题偏好并应用
  // 监听系统主题变化（system 模式下自动跟随）
  init() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.themeMode) this._mode = s.themeMode;
      }
    } catch { /* ignore */ }
    this._mq.addEventListener('change', this._onMqChange);
    this._apply();
  }

  // 循环切换：light → dark → system → light
  toggle() {
    const order = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(this._mode) + 1) % 3];
    this.setTheme(next);
  }

  // 设置指定主题模式并持久化
  // mode: 'light' | 'dark' | 'system'
  setTheme(mode) {
    this._mode = mode;
    this._apply();
    this.persist({ themeMode: mode });
  }

  // 获取当前主题模式（注意：不是实际渲染的明暗）
  getTheme() {
    return this._mode;
  }

  // 合并 patch 到 lts_settings 并写入 localStorage
  // 注意：与其他设置共享同一个 storage key
  persist(patch) {
    let settings = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) settings = JSON.parse(raw);
    } catch { /* ignore */ }
    Object.assign(settings, patch);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  // 应用主题：设置 data-theme 属性，CSS 变量自动响应
  // §14.3: 添加 theme-transitioning 类实现 0.3s 过渡动画
  _apply() {
    const isDark = this._mode === 'dark' ||
      (this._mode === 'system' && this._mq.matches);
    document.documentElement.classList.add('theme-transitioning');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350);
  }
}

export default new Theme();
