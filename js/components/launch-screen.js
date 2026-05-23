// launch-screen.js — 启动页（§4.2）
// 显示 logo + 系统名 + 等级进度 + 开始按钮，点击后淡出移除
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';
import { calcLevel, calcLevelProgress, getLevelTitle } from '../utils/level.js';

export function showLaunchScreen() {
  return new Promise((resolve) => {
    const profile = Store.get(StorageKeys.USER_PROFILE) || {};
    const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
    const totalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
    const { level, percent } = calcLevelProgress(totalXP);
    const title = getLevelTitle(level);
    const nickname = profile.nickname || '墨澜';
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

    const overlay = document.createElement('div');
    overlay.className = 'launch-overlay';
    overlay.innerHTML = `
      <div class="launch-content">
        <div class="launch-logo">🎮</div>
        <div class="launch-title">学习RPG</div>
        <div class="launch-subtitle">认知操作系统</div>
        <div class="launch-card">
          <div class="launch-card-row">
            <span class="launch-card-label">欢迎回来，${nickname}</span>
          </div>
          <div class="launch-card-row">
            <span class="launch-level">Lv${level} ${title.cn}</span>
            <span class="launch-xp">${totalXP.toLocaleString()} XP</span>
          </div>
          <div class="launch-progress">
            <div class="launch-progress-bar"><div class="launch-progress-fill" style="width:${percent}%"></div></div>
            <span class="launch-progress-text">${percent}%</span>
          </div>
          ${streak > 0 ? `<div class="launch-card-row"><span class="launch-streak">🔥 连续学习 ${streak} 天</span></div>` : ''}
        </div>
        <button class="launch-start-btn" id="launch-start">开始学习</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const btn = document.getElementById('launch-start');
    const dismiss = () => {
      overlay.classList.add('launch-fade-out');
      setTimeout(() => { overlay.remove(); resolve(); }, 500);
    };
    btn.addEventListener('click', dismiss);
    // 3秒后自动进入
    setTimeout(dismiss, 3000);
  });
}
