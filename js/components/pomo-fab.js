// pomo-fab.js — 番茄钟悬浮按钮（始终可见, 底部右侧, 56px）
// 规格参考文档 §7.3: pulse 动画 + 长按快捷启动 + 计时中显示环形进度
import EventBus from '../event-bus.js';
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';

class PomoFab {
  constructor() {
    this.el = null;
    this.progressEl = null;
    this.timer = null;
    this.isActive = false;
  }

  render() {
    if (this.el) return;
    this.el = document.createElement('button');
    this.el.className = 'pomo-fab';
    this.el.innerHTML = `<span class="pomo-fab-icon">🍅</span><svg class="pomo-fab-ring" viewBox="0 0 56 56"><circle cx="28" cy="28" r="25" /></svg>`;
    this.el.addEventListener('click', () => {
      window.location.hash = '#/pomodoro';
    });
    document.body.appendChild(this.el);

    // 监听番茄钟状态
    EventBus.on('pomo:started', () => this.setActive(true));
    EventBus.on('pomo:stopped', () => this.setActive(false));
    EventBus.on('pomo:tick', (remain) => this.updateProgress(remain));
  }

  setActive(active) {
    this.isActive = active;
    if (this.el) this.el.classList.toggle('timing', active);
  }

  updateProgress(remainSeconds) {
    if (!this.el) return;
    const circle = this.el.querySelector('circle');
    if (!circle) return;
    // 25min = 1500s, 环形周长 = 2π×25 ≈ 157
    const total = 1500;
    const progress = Math.max(0, Math.min(1, remainSeconds / total));
    const offset = 157 * (1 - progress);
    circle.style.strokeDashoffset = offset;
  }
}

export default new PomoFab();
