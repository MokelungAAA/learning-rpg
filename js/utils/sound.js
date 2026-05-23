// sound.js — 番茄钟音效（Web Audio API，无外部文件依赖）
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';

let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function isEnabled() {
  const settings = Store.get(StorageKeys.SETTINGS) || {};
  return settings.pomodoroSound !== false;
}

function isVibrationEnabled() {
  const settings = Store.get(StorageKeys.SETTINGS) || {};
  return settings.pomodoroVibration !== false;
}

// 播放音调（频率Hz，时长秒，类型）
function playTone(freq, duration, type = 'sine', volume = 0.3) {
  if (!isEnabled()) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

// 振动反馈
function vibrate(pattern) {
  if (!isVibrationEnabled()) return;
  try { navigator.vibrate?.(pattern); } catch {}
}

// 专注开始 — 轻柔木琴音
export function playFocusStart() {
  playTone(523, 0.15, 'sine', 0.2); // C5
  setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 100); // E5
  setTimeout(() => playTone(784, 0.2, 'sine', 0.2), 200); // G5
  vibrate([50]);
}

// 专注结束 — 清脆铃声
export function playFocusEnd() {
  playTone(880, 0.2, 'sine', 0.3); // A5
  setTimeout(() => playTone(1047, 0.3, 'sine', 0.3), 150); // C6
  setTimeout(() => playTone(1319, 0.4, 'sine', 0.25), 350); // E6
  vibrate([100, 50, 100]);
}

// 休息结束 — 柔和提示音
export function playBreakEnd() {
  playTone(659, 0.2, 'sine', 0.2); // E5
  setTimeout(() => playTone(784, 0.25, 'sine', 0.2), 150); // G5
  vibrate([80]);
}

// 长休息结束 — 渐强铃声
export function playLongBreakEnd() {
  playTone(523, 0.15, 'sine', 0.15); // C5
  setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 200);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 400);
  setTimeout(() => playTone(1047, 0.4, 'sine', 0.3), 600); // C6
  vibrate([100, 50, 100, 50, 200]);
}

// 浏览器通知
export function sendNotification(title, body) {
  try {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '🍅', tag: 'pomodoro' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => {
        if (p === 'granted') new Notification(title, { body, icon: '🍅', tag: 'pomodoro' });
      });
    }
  } catch {}
}
