/* ================================================================
   utils.js — 工具函数库
   ================================================================ */

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    var v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  var now = new Date();
  var diffMs = now.getTime() - d.getTime();
  var diffMin = Math.floor(diffMs / 60000);
  var diffHour = Math.floor(diffMs / 3600000);
  var diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return diffMin + '分钟前';
  if (diffHour < 24) return diffHour + '小时前';
  if (diffDay < 7) return diffDay + '天前';

  var y = d.getFullYear();
  var m = padZero(d.getMonth() + 1);
  var day = padZero(d.getDate());
  return y + '-' + m + '-' + day;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  return d.getFullYear() + '-' + padZero(d.getMonth() + 1) + '-' + padZero(d.getDate());
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  return padZero(d.getHours()) + ':' + padZero(d.getMinutes());
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0分钟';
  if (minutes < 60) return minutes + '分钟';
  var h = Math.floor(minutes / 60);
  var m = minutes % 60;
  return m > 0 ? h + '小时' + m + '分钟' : h + '小时';
}

function formatNumber(num) {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  if (num >= 1000) return num.toLocaleString('zh-CN');
  return String(num);
}

function padZero(n) {
  return n < 10 ? '0' + n : '' + n;
}

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(function (item) { return deepClone(item); });
  var cloned = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

function debounce(fn, delay) {
  var timer = null;
  return function () {
    var context = this;
    var args = arguments;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}

function throttle(fn, interval) {
  var lastTime = 0;
  return function () {
    var now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, arguments);
    }
  };
}

function escapeHtml(str) {
  if (!str) return '';
  var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, function (m) { return map[m]; });
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getDayKey(date) {
  var d = date || new Date();
  return d.getFullYear() + '-' + padZero(d.getMonth() + 1) + '-' + padZero(d.getDate());
}

function getTodayKey() {
  return getDayKey(new Date());
}

function getWeekDay(date) {
  var d = date || new Date();
  return d.getDay() === 0 ? 7 : d.getDay();
}

function getWeekdayLabel(day) {
  var labels = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return labels[day] || '';
}

function isSameDay(d1, d2) {
  return getDayKey(d1) === getDayKey(d2);
}

function daysBetween(dateStr1, dateStr2) {
  var d1 = new Date(dateStr1);
  var d2 = dateStr2 ? new Date(dateStr2) : new Date();
  return Math.floor((d2.getTime() - d1.getTime()) / 86400000);
}

function toLocalISO(date) {
  var d = date || new Date();
  var offset = d.getTimezoneOffset();
  var local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().replace('Z', '+08:00');
}

function parseISO(str) {
  if (!str) return new Date();
  return new Date(str);
}

function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toastContainer');
  if (!container) return;
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    return Promise.resolve();
  } catch (e) {
    return Promise.reject(e);
  } finally {
    document.body.removeChild(textarea);
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.add('theme-transitioning');
  setTimeout(function () {
    document.documentElement.classList.remove('theme-transitioning');
  }, 350);
  try { localStorage.setItem('lts-theme', theme); } catch (e) {}
}

function getTheme() {
  try { return localStorage.getItem('lts-theme') || 'light'; } catch (e) { return 'light'; }
}

function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function isMobile() {
  return window.innerWidth < 768;
}