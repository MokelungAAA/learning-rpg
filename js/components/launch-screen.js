// launch-screen.js — 简约开屏：几何装饰 + 时间色调 + 优雅文字动画
// 早晨(5-12): 暖米色 / 下午(12-17): 淡蓝灰 / 傍晚(17-20): 暖灰紫 / 深夜(20-5): 深蓝灰
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';
import { calcLevelProgress, getLevelTitle } from '../utils/level.js';

function getTimePeriod() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 20) return 'evening';
  return 'night';
}

function isDarkMode() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

function createLines(container, period) {
  const lines = document.createElement('div');
  lines.className = 'launch-lines';
  for (let i = 1; i <= 3; i++) {
    const line = document.createElement('div');
    line.className = `launch-line launch-line-${period} launch-line-${i}`;
    lines.appendChild(line);
  }
  container.appendChild(lines);
}

function createDots(container, period, count) {
  const dots = document.createElement('div');
  dots.className = 'launch-dots';
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.className = `launch-dot launch-dot-${period}`;
    dot.style.left = (10 + Math.random() * 80) + '%';
    dot.style.top = (10 + Math.random() * 80) + '%';
    dot.style.setProperty('--delay', (Math.random() * 3) + 's');
    dots.appendChild(dot);
  }
  container.appendChild(dots);
}

// 同步创建开屏 overlay（立即盖住屏幕，返回 overlay 元素）
// 内置点击关闭 + 超时自动关闭，不依赖外部调用 dismiss
export function createLaunchOverlay() {
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  const totalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
  const { level } = calcLevelProgress(totalXP);
  const title = getLevelTitle(level);
  const streak = (() => {
    const days = new Set();
    for (const r of records) {
      if (r.timestamp) days.add(new Date(r.timestamp).toISOString().slice(0, 10));
    }
    let s = 0;
    const d = new Date();
    while (true) {
      if (days.has(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return s;
  })();

  const period = isDarkMode() ? 'night' : getTimePeriod();

  const overlay = document.createElement('div');
  overlay.className = 'launch-overlay';
  // 立即设置背景色，防止预遮罩移除时闪烁
  const bgColors = {
    morning: '#f5ede3', afternoon: '#e8eef4', evening: '#e8e2ed', night: '#1e2130'
  };
  overlay.style.background = bgColors[period] || bgColors.night;

  // 背景
  const bg = document.createElement('div');
  bg.className = `launch-bg launch-bg-${period}`;
  overlay.appendChild(bg);

  // 几何线
  createLines(overlay, period);

  // 微光点（移动端减少数量）
  const isMobile = window.innerWidth <= 768;
  createDots(overlay, period, isMobile ? 4 : 12);

  // 内容
  const content = document.createElement('div');
  content.className = 'launch-content';
  content.innerHTML = `
    <div class="launch-mark launch-mark-${period}">
      <span class="launch-mark-text">LTS</span>
    </div>
    <div class="launch-title launch-title-${period}">学习RPG</div>
    <div class="launch-subtitle launch-subtitle-${period}">认 知 操 作 系 统</div>
    <div class="launch-info launch-info-${period}">
      <span>Lv${level} ${title.cn}</span>
      <span class="launch-info-divider">&middot;</span>
      <span>${totalXP.toLocaleString()} XP</span>
      ${streak > 0 ? `<span class="launch-info-divider">&middot;</span><span>${streak} 天连续</span>` : ''}
    </div>
    <div class="launch-hint launch-hint-${period}">点击进入</div>
  `;
  overlay.appendChild(content);

  // 进度条
  const progress = document.createElement('div');
  progress.className = 'launch-progress';
  const bar = document.createElement('div');
  bar.className = `launch-progress-bar launch-progress-${period}`;
  progress.appendChild(bar);
  overlay.appendChild(progress);

  document.body.appendChild(overlay);

  // 内置关闭逻辑（双保险：点击 + 超时）
  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    overlay.classList.add('launch-fade-out');
    setTimeout(() => overlay.remove(), 600);
  };

  overlay.addEventListener('click', dismiss);
  overlay.addEventListener('touchend', (e) => { e.preventDefault(); dismiss(); }, { passive: false });
  setTimeout(dismiss, 3500);

  return overlay;
}
