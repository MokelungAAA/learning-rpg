// settings.js — Settings page with theme controls
import Theme from '../theme.js';

const STYLE = `<style>
.settings-section {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--r-md);
  padding: var(--sp-3);
  margin-bottom: var(--sp-3);
}
.settings-section h3 {
  font-size: var(--fs-sm);
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--sp-2);
}
.pill-group {
  display: flex;
  gap: var(--sp-2);
}
.pill {
  flex: 1;
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--glass-border);
  border-radius: var(--r-full);
  background: transparent;
  color: var(--color-text-2);
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease);
  text-align: center;
}
.pill:hover {
  background: var(--color-surface-variant);
}
.pill.active {
  background: var(--color-primary, var(--color-accent));
  color: #fff;
  border-color: transparent;
}
[data-theme="dark"] .settings-section {
  background: rgba(30, 30, 30, 0.72);
  border-color: rgba(255, 255, 255, 0.08);
}
</style>`;

export function render() {
  const mode = Theme.getTheme();
  return `<div class="page-enter">
    ${STYLE}
    <h2>设置</h2>
    <div class="settings-section">
      <h3>外观</h3>
      <div class="pill-group theme-pills">
        <button class="pill${mode === 'light' ? ' active' : ''}" data-theme="light">浅色</button>
        <button class="pill${mode === 'dark' ? ' active' : ''}" data-theme="dark">深色</button>
        <button class="pill${mode === 'system' ? ' active' : ''}" data-theme="system">跟随系统</button>
      </div>
    </div>
    <p style="color:var(--color-text-3);margin-top:var(--sp-3)">v0.3 · 深色模式 + 状态栏</p>
  </div>`;
}

export function afterRender() {
  const pills = document.querySelectorAll('.theme-pills .pill');

  const onClick = (e) => {
    const btn = e.currentTarget;
    Theme.setTheme(btn.dataset.theme);
    pills.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
  };

  pills.forEach(p => p.addEventListener('click', onClick));

  return () => {
    pills.forEach(p => p.removeEventListener('click', onClick));
  };
}
