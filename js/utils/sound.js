// sound.js — 番茄钟音效（Web Audio API，无外部文件依赖）
// 功能: 番茄钟开始/结束/休息结束的音效 + 振动反馈 + 浏览器通知
// 实现: 使用 OscillatorNode 合成音调，无需加载音频文件
// 设置: 读取 settings.pomodoroSound / settings.pomodoroVibration 控制开关
// 易错点: AudioContext 需用户交互后才能创建（Chrome 自动播放策略）

import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';

let audioCtx = null;

// 获取或创建 AudioContext 单例（懒初始化）
// @returns {AudioContext} 音频上下文
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// 检查音效是否启用（默认启用）
// @returns {boolean}
function isEnabled() {
  const settings = Store.get(StorageKeys.SETTINGS) || {};
  return settings.pomodoroSound !== false;
}

// 检查振动反馈是否启用（默认启用）
// @returns {boolean}
function isVibrationEnabled() {
  const settings = Store.get(StorageKeys.SETTINGS) || {};
  return settings.pomodoroVibration !== false;
}

// 播放单个音调（使用 OscillatorNode + GainNode 包络）
// @param {number} freq — 频率 Hz（如 523=C5, 880=A5）
// @param {number} duration — 时长秒
// @param {string} type — 波形类型（sine/square/sawtooth/triangle）
// @param {number} volume — 音量 0-1
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

// 触发设备振动（需设备支持 Vibration API）
// @param {Array} pattern — 振动模式 [振动ms, 停顿ms, ...]
function vibrate(pattern) {
  if (!isVibrationEnabled()) return;
  try { navigator.vibrate?.(pattern); } catch {}
}

// 专注开始音效: C5→E5→G5 上行三和弦（轻柔）
export function playFocusStart() {
  playTone(523, 0.15, 'sine', 0.2); // C5
  setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 100); // E5
  setTimeout(() => playTone(784, 0.2, 'sine', 0.2), 200); // G5
  vibrate([50]);
}

// 专注结束音效: A5→C6→E6 上行琶音（清脆）
export function playFocusEnd() {
  playTone(880, 0.2, 'sine', 0.3); // A5
  setTimeout(() => playTone(1047, 0.3, 'sine', 0.3), 150); // C6
  setTimeout(() => playTone(1319, 0.4, 'sine', 0.25), 350); // E6
  vibrate([100, 50, 100]);
}

// 短休息结束音效: E5→G5 双音提示
export function playBreakEnd() {
  playTone(659, 0.2, 'sine', 0.2); // E5
  setTimeout(() => playTone(784, 0.25, 'sine', 0.2), 150); // G5
  vibrate([80]);
}

// 长休息结束音效: C5→E5→G5→C6 渐强四音阶
export function playLongBreakEnd() {
  playTone(523, 0.15, 'sine', 0.15); // C5
  setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 200);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 400);
  setTimeout(() => playTone(1047, 0.4, 'sine', 0.3), 600); // C6
  vibrate([100, 50, 100, 50, 200]);
}

// 发送浏览器通知（首次会请求权限）
// @param {string} title — 通知标题
// @param {string} body — 通知内容
// 易错点: 需 HTTPS 或 localhost，部分浏览器会静默拒绝
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
