// gestures.js — 手势支持（§18.9）
// 左滑/右滑页面切换，底部区域排除（避免与导航栏冲突）
// 阈值: 80px 滑动距离，300ms 时间限制

const SWIPE_THRESHOLD = 80;
const SWIPE_TIMEOUT = 300;
const BOTTOM_EXCLUDE = 120; // 底部120px不触发手势

// 页面路由顺序（用于左右切换）
const PAGE_ORDER = ['#/', '#/data', '#/pomodoro', '#/search', '#/settings'];

let startX = 0;
let startY = 0;
let startTime = 0;
let enabled = true;

function getCurrentPageIndex() {
  const hash = window.location.hash || '#/';
  const idx = PAGE_ORDER.indexOf(hash);
  return idx >= 0 ? idx : 0;
}

function onTouchStart(e) {
  if (!enabled) return;
  const touch = e.touches[0];
  // 排除底部导航区域
  if (touch.clientY > window.innerHeight - BOTTOM_EXCLUDE) return;
  startX = touch.clientX;
  startY = touch.clientY;
  startTime = Date.now();
}

function onTouchEnd(e) {
  if (!enabled || startX === 0) return;
  const touch = e.changedTouches[0];
  const dx = touch.clientX - startX;
  const dy = touch.clientY - startY;
  const dt = Date.now() - startTime;
  startX = 0;

  // 必须是水平滑动且超过阈值
  if (dt > SWIPE_TIMEOUT) return;
  if (Math.abs(dx) < SWIPE_THRESHOLD) return;
  if (Math.abs(dy) > Math.abs(dx) * 0.5) return; // 垂直滑动太多则忽略

  const currentIdx = getCurrentPageIndex();
  if (dx < 0 && currentIdx < PAGE_ORDER.length - 1) {
    // 左滑 → 下一页
    window.location.hash = PAGE_ORDER[currentIdx + 1];
  } else if (dx > 0 && currentIdx > 0) {
    // 右滑 → 上一页
    window.location.hash = PAGE_ORDER[currentIdx - 1];
  }
}

export function initGestures() {
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchend', onTouchEnd, { passive: true });
}

export function enableGestures() { enabled = true; }
export function disableGestures() { enabled = false; }
