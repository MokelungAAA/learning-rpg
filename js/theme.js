// theme.js — Theme singleton (light/dark/system)
const STORAGE_KEY = 'lts_settings';

class Theme {
  constructor() {
    this._mode = 'system'; // light | dark | system
    this._mq = window.matchMedia('(prefers-color-scheme: dark)');
    this._onMqChange = () => {
      if (this._mode === 'system') this._apply();
    };
  }

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

  toggle() {
    const order = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(this._mode) + 1) % 3];
    this.setTheme(next);
  }

  setTheme(mode) {
    this._mode = mode;
    this._apply();
    this.persist({ themeMode: mode });
  }

  getTheme() {
    return this._mode;
  }

  persist(patch) {
    let settings = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) settings = JSON.parse(raw);
    } catch { /* ignore */ }
    Object.assign(settings, patch);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  _apply() {
    const isDark = this._mode === 'dark' ||
      (this._mode === 'system' && this._mq.matches);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
}

export default new Theme();
