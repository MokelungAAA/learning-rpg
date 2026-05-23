// home.js — Home page with status bar
import EventBus from '../event-bus.js';
import Theme from '../theme.js';

export function render() {
  return `<div class="page-enter">
    <div class="status-bar">
      <div class="status-left">
        <span class="status-dot offline"></span>
        <span class="status-text">未同步</span>
      </div>
      <div class="status-right">
        <button class="status-btn theme-toggle" title="切换主题">☀️</button>
      </div>
    </div>
    <h2>首页</h2>
    <p style="color:var(--color-text-3);margin-top:var(--sp-3)">v0.3 · 深色模式 + 状态栏</p>
  </div>`;
}

export function afterRender() {
  const themeBtn = document.querySelector('.theme-toggle');

  // Update theme button icon
  function updateThemeIcon() {
    const mode = Theme.getTheme();
    themeBtn.textContent = mode === 'dark' ? '🌙' : mode === 'light' ? '☀️' : '💻';
  }
  updateThemeIcon();

  const onThemeBtn = () => {
    Theme.toggle();
    updateThemeIcon();
  };
  themeBtn.addEventListener('click', onThemeBtn);

  const onThemeChanged = () => updateThemeIcon();
  EventBus.on('theme:changed', onThemeChanged);

  return () => {
    themeBtn.removeEventListener('click', onThemeBtn);
    EventBus.off('theme:changed', onThemeChanged);
  };
}
