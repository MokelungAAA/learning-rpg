// command-palette.js — 全局命令面板 (Ctrl+K)
// 功能: 快速导航、操作执行、拼音+模糊搜索
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';
import Theme from '../theme.js';
import EventBus from '../event-bus.js';
import { fuzzyMatch as sharedFuzzyMatch } from '../utils/search.js';

const COMMANDS = [
  // 导航
  { id: 'nav-home',     icon: '🏠', label: '去首页',       pinyin: 'shouye', category: '导航', action: () => location.hash = '#/' },
  { id: 'nav-data',     icon: '📊', label: '去数据页',     pinyin: 'shuju', category: '导航', action: () => location.hash = '#/data' },
  { id: 'nav-skill',    icon: '🌳', label: '去技能树',     pinyin: 'jinengshu', category: '导航', action: () => location.hash = '#/data/skill-tree' },
  { id: 'nav-review',   icon: '🔄', label: '去复习中心',   pinyin: 'fuxi', category: '导航', action: () => location.hash = '#/data/review' },
  { id: 'nav-pomo',     icon: '🍅', label: '去番茄钟',     pinyin: 'fanqiezhong', category: '导航', action: () => location.hash = '#/pomodoro' },
  { id: 'nav-log',      icon: '📋', label: '去日志',       pinyin: 'rizhi', category: '导航', action: () => location.hash = '#/data/log' },
  { id: 'nav-reading',  icon: '📖', label: '去阅读',       pinyin: 'yuedu', category: '导航', action: () => location.hash = '#/data/reading' },
  { id: 'nav-ach',      icon: '🏆', label: '去成就',       pinyin: 'chengjiu', category: '导航', action: () => location.hash = '#/achievement' },
  { id: 'nav-settings', icon: '⚙️', label: '去设置',       pinyin: 'shezhi', category: '导航', action: () => location.hash = '#/settings' },
  { id: 'nav-search',   icon: '🔍', label: '去搜索页',     pinyin: 'sousuo', category: '导航', action: () => location.hash = '#/search' },
  { id: 'nav-export',   icon: '📦', label: '去数据管理',   pinyin: 'shuju guanli daoru daochu', category: '导航', action: () => location.hash = '#/data/export' },

  // 操作
  { id: 'act-dark',     icon: '🌙', label: '切换深色模式',  pinyin: 'shense anse mode', category: '操作', action: () => Theme.toggle() },
  { id: 'act-export',   icon: '💾', label: '导出数据',      pinyin: 'daochu shuju backup', category: '操作', action: () => exportData() },
  { id: 'act-new-rec',  icon: '➕', label: '新建学习记录',  pinyin: 'xinjian xuxi jilu', category: '操作', action: () => EventBus.emit('fab:click') },
  { id: 'act-new-read', icon: '📚', label: '新建阅读记录',  pinyin: 'xinjian yuedu jilu', category: '操作', action: () => location.hash = '#/data/reading' },
  { id: 'act-about',    icon: 'ℹ️', label: '关于系统',      pinyin: 'guanyu xitong banben', category: '操作', action: () => location.hash = '#/about' },
];

// 复用共享搜索工具（levenshtein + pinyin + fuzzyMatch）

let paletteEl = null;
let inputEl = null;
let listEl = null;
let activeIndex = 0;
let filteredCmds = [...COMMANDS];

// 打开命令面板
export function openPalette() {
  if (paletteEl) { closePalette(); return; }
  paletteEl = document.createElement('div');
  paletteEl.className = 'cmd-overlay';
  paletteEl.innerHTML = `
    <div class="cmd-palette">
      <div class="cmd-input-wrap">
        <span class="cmd-input-icon">🔍</span>
        <input class="cmd-input" placeholder="输入命令或搜索..." autocomplete="off" />
      </div>
      <div class="cmd-list"></div>
      <div class="cmd-hint">
        <span>↑↓ 导航</span><span>↵ 执行</span><span>Esc 关闭</span>
      </div>
    </div>`;
  document.body.appendChild(paletteEl);

  inputEl = paletteEl.querySelector('.cmd-input');
  listEl = paletteEl.querySelector('.cmd-list');

  inputEl.addEventListener('input', onInput);
  inputEl.addEventListener('keydown', onKeydown);
  paletteEl.addEventListener('click', (e) => { if (e.target === paletteEl) closePalette(); });

  activeIndex = 0;
  filteredCmds = [...COMMANDS];
  renderList();
  requestAnimationFrame(() => inputEl.focus());

  // 记录成就: 使用命令面板
  const profile = Store.get(StorageKeys.USER_PROFILE) || {};
  profile._hasUsedCmdPalette = true;
  Store.set(StorageKeys.USER_PROFILE, profile);
}

// 关闭命令面板
export function closePalette() {
  if (!paletteEl) return;
  paletteEl.remove();
  paletteEl = null;
  inputEl = null;
  listEl = null;
}

function onInput() {
  const q = inputEl.value.trim().toLowerCase();
  if (!q) {
    filteredCmds = [...COMMANDS];
  } else {
    filteredCmds = COMMANDS
      .map(c => ({ cmd: c, score: sharedFuzzyMatch(c.label, q, c.pinyin || '') }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.cmd);
  }
  activeIndex = 0;
  renderList();
}

function onKeydown(e) {
  if (e.key === 'Escape') { e.preventDefault(); closePalette(); return; }
  if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, filteredCmds.length - 1); updateActive(); return; }
  if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); updateActive(); return; }
  if (e.key === 'Enter') { e.preventDefault(); executeActive(); return; }
}

function renderList() {
  if (!listEl) return;
  if (filteredCmds.length === 0) {
    listEl.innerHTML = '<div class="cmd-empty">没有匹配的命令</div>';
    return;
  }
  // 按 category 分组
  const groups = {};
  filteredCmds.forEach(c => { (groups[c.category] = groups[c.category] || []).push(c); });

  let html = '', idx = 0;
  for (const [cat, cmds] of Object.entries(groups)) {
    html += `<div class="cmd-group-label">${cat}</div>`;
    for (const c of cmds) {
      html += `<div class="cmd-item${idx === activeIndex ? ' active' : ''}" data-idx="${idx}">
        <span class="cmd-item-icon">${c.icon}</span>
        <span class="cmd-item-label">${c.label}</span>
      </div>`;
      idx++;
    }
  }
  listEl.innerHTML = html;

  // 点击执行
  listEl.querySelectorAll('.cmd-item').forEach(el => {
    el.addEventListener('click', () => { activeIndex = +el.dataset.idx; executeActive(); });
    el.addEventListener('mouseenter', () => { activeIndex = +el.dataset.idx; updateActive(); });
  });
}

function updateActive() {
  if (!listEl) return;
  listEl.querySelectorAll('.cmd-item').forEach((el, i) => {
    el.classList.toggle('active', +el.dataset.idx === activeIndex);
  });
  const activeEl = listEl.querySelector('.cmd-item.active');
  if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
}

function executeActive() {
  if (activeIndex >= 0 && activeIndex < filteredCmds.length) {
    const cmd = filteredCmds[activeIndex];
    closePalette();
    cmd.action();
  }
}

// 导出数据
function exportData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try { data[key] = JSON.parse(localStorage.getItem(key)); } catch { data[key] = localStorage.getItem(key); }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `learning-rpg-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);

  // 记录成就: 数据导出
  const profile = Store.get(StorageKeys.USER_PROFILE) || {};
  profile._hasExported = true;
  Store.set(StorageKeys.USER_PROFILE, profile);
}
