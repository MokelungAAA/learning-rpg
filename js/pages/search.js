// search.js — 全局搜索页（学科/教材/知识点/记录/成就/功能）
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import { SUBJECTS_DATA } from '../data/subjects.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { getAllSkills } from '../data/skill-tree.js';
import { getSubjectIcon } from '../utils/level.js';
import { checkAchievement } from '../utils/achievements-check.js';

const MAX_HISTORY = 5;
const getHistory = () => { try { return JSON.parse(localStorage.getItem(StorageKeys.SEARCH_HISTORY) || '[]'); } catch { return []; } };
const saveHistory = (h) => localStorage.setItem(StorageKeys.SEARCH_HISTORY, JSON.stringify(h.slice(0, MAX_HISTORY)));
function addToHistory(query) {
  if (!query || query.length < 1) return;
  const history = getHistory().filter(h => h !== query);
  history.unshift(query);
  saveHistory(history);
}

// 拼音首字母简拼映射
const PINYIN_MAP = { '数学': 'sx', '语文': 'yw', '英语': 'yy', '物理': 'wl', '化学': 'hx', '生物': 'sw', '政治': 'zz', '历史': 'ls', '地理': 'dl' };

function matchPinyin(text, query) {
  const pinyin = PINYIN_MAP[text];
  return pinyin && pinyin.includes(query.toLowerCase());
}

function searchAll(query) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  const results = [];

  // 搜索学科
  for (const s of SUBJECTS) {
    if (s.name.includes(q) || s.id.includes(q) || matchPinyin(s.name, q)) {
      results.push({ type: 'subject', icon: getSubjectIcon(s.id), title: s.name, desc: '学科', hash: `#/subject/${s.id}` });
    }
  }

  // 搜索教材/章节/知识点
  for (const [sid, data] of Object.entries(SUBJECTS_DATA)) {
    if (!data.textbooks) continue;
    for (const tb of data.textbooks) {
      if (tb.name.toLowerCase().includes(q)) {
        results.push({ type: 'textbook', icon: '📚', title: tb.name, desc: data.name, hash: `#/data/log?q=${encodeURIComponent(tb.name.slice(0, 6))}` });
      }
      for (const ch of (tb.chapters || [])) {
        if (ch.name.toLowerCase().includes(q)) {
          results.push({ type: 'chapter', icon: '📖', title: ch.name, desc: tb.name, hash: `#/data/log?q=${encodeURIComponent(ch.name.slice(0, 6))}` });
        }
        for (const sec of (ch.sections || [])) {
          if (sec.name.toLowerCase().includes(q)) {
            results.push({ type: 'section', icon: '📝', title: sec.name, desc: ch.name, hash: `#/data/log?q=${encodeURIComponent(sec.name.slice(0, 6))}` });
          }
          for (const kp of (sec.knowledgePoints || [])) {
            if (kp.toLowerCase().includes(q)) {
              results.push({ type: 'kp', icon: '💡', title: kp, desc: sec.name, hash: `#/data/log?q=${encodeURIComponent(kp)}` });
            }
          }
        }
      }
    }
  }

  // 搜索技能树知识点
  const allSkills = getAllSkills();
  for (const skill of allSkills) {
    for (const kp of skill.kps) {
      if (kp.toLowerCase().includes(q)) {
        results.push({ type: 'skill-kp', icon: '🌳', title: kp, desc: `${skill.subjectName} · ${skill.name}`, hash: '#/data/skill-tree' });
      }
    }
  }

  // 搜索学习记录
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  for (const r of records) {
    const text = [r.subject, r.textbook, r.section, r.notes, ...(r.knowledgePoints || [])].join(' ').toLowerCase();
    if (text.includes(q)) {
      const date = r.timestamp ? new Date(r.timestamp).toLocaleDateString('zh-CN') : '';
      results.push({ type: 'record', icon: '📋', title: `${r.subject || '学习'} · ${r.duration || 0}分钟`, desc: `${date} ${r.notes || ''}`.trim(), hash: '#/data/log' });
    }
  }

  // 搜索成就（只搜已解锁的，避免泄露隐藏成就条件）
  const profile = Store.get(StorageKeys.USER_PROFILE) || {};
  for (const a of ACHIEVEMENTS) {
    if (!checkAchievement(a, records, profile)) continue;
    if (a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)) {
      results.push({ type: 'achievement', icon: a.icon, title: a.name, desc: a.description, hash: '#/achievement' });
    }
  }

  // 搜索功能页面
  const pages = [
    { label: '首页', icon: '🏠', hash: '#/' },
    { label: '数据', icon: '📊', hash: '#/data' },
    { label: '番茄钟', icon: '🍅', hash: '#/pomodoro' },
    { label: '技能树', icon: '🌳', hash: '#/data/skill-tree' },
    { label: '复习中心', icon: '📝', hash: '#/data/review' },
    { label: '学习日志', icon: '📋', hash: '#/data/log' },
    { label: '阅读记录', icon: '📖', hash: '#/data/reading' },
    { label: '设置', icon: '⚙️', hash: '#/settings' },
  ];
  for (const p of pages) {
    if (p.label.includes(q) || matchPinyin(p.label, q)) {
      results.push({ type: 'page', icon: p.icon, title: p.label, desc: '页面', hash: p.hash });
    }
  }

  // 去重
  const seen = new Set();
  return results.filter(r => {
    const key = r.type + r.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderHistory() {
  const history = getHistory();
  if (history.length === 0) return '';
  const items = history.map(h => `<button class="search-history-tag" data-query="${h}">${h}</button>`).join('');
  return `<div class="search-history"><div class="search-history-top"><span class="search-history-label">🕐 最近搜索</span><button class="search-history-clear" id="history-clear">清除</button></div><div class="search-history-tags">${items}</div></div>`;
}

function renderResults(results) {
  if (results.length === 0) return '<div class="search-empty">无搜索结果</div>';
  const grouped = {};
  for (const r of results) (grouped[r.type] ||= []).push(r);
  const typeLabels = { subject: '学科', textbook: '教材', chapter: '章节', section: '节', kp: '知识点', 'skill-kp': '技能知识点', record: '学习记录', achievement: '成就', page: '功能' };
  let html = '';
  for (const [type, items] of Object.entries(grouped)) {
    html += `<div class="search-group"><div class="search-group-label">${typeLabels[type] || type}</div>`;
    html += items.slice(0, 8).map(r => `<a href="${r.hash}" class="search-result-item">
      <span class="search-result-icon">${r.icon}</span>
      <div class="search-result-text"><div class="search-result-title">${r.title}</div><div class="search-result-desc">${r.desc}</div></div>
    </a>`).join('');
    if (items.length > 8) html += `<div class="search-more">还有 ${items.length - 8} 条结果...</div>`;
    html += '</div>';
  }
  return html;
}

export function render() {
  return `<div class="page-enter">
    <a href="#/" class="page-back">← 返回首页</a>
    <div class="search-page">
      <div class="search-input-wrap">
        <input type="text" id="search-input" class="search-input" placeholder="搜索学科/知识点/记录/功能..." autofocus>
        <button class="search-clear" id="search-clear" style="display:none">✕</button>
      </div>
      ${renderHistory()}
      <div id="search-results" class="search-results"></div>
    </div>
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.58 · 新增图表</p>
  </div>`;
}

export function afterRender() {
  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');
  const resultsEl = document.getElementById('search-results');
  let debounce = null;

  const doSearch = () => {
    const q = input.value.trim();
    clearBtn.style.display = q ? 'block' : 'none';
    if (!q) { resultsEl.innerHTML = ''; return; }
    const results = searchAll(q);
    resultsEl.innerHTML = renderResults(results);
  };

  const onInput = () => { clearTimeout(debounce); debounce = setTimeout(doSearch, 200); };
  const onClear = () => { input.value = ''; clearBtn.style.display = 'none'; resultsEl.innerHTML = ''; input.focus(); };
  const onKeydown = (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      addToHistory(input.value.trim());
    }
  };

  input.addEventListener('input', onInput);
  clearBtn.addEventListener('click', onClear);
  input.addEventListener('keydown', onKeydown);

  // 历史标签点击
  const historyTags = document.querySelectorAll('.search-history-tag');
  const onTag = (e) => {
    input.value = e.currentTarget.dataset.query;
    addToHistory(e.currentTarget.dataset.query);
    doSearch();
  };
  historyTags.forEach(t => t.addEventListener('click', onTag));

  // 清除历史
  const historyClearBtn = document.getElementById('history-clear');
  const onClearHistory = () => {
    saveHistory([]);
    const historyEl = document.querySelector('.search-history');
    if (historyEl) historyEl.remove();
  };
  if (historyClearBtn) historyClearBtn.addEventListener('click', onClearHistory);

  // 点击搜索结果时保存历史
  const onResultClick = (e) => {
    const link = e.target.closest('.search-result-item');
    if (link && input.value.trim()) addToHistory(input.value.trim());
  };
  resultsEl.addEventListener('click', onResultClick);

  return () => {
    input.removeEventListener('input', onInput);
    clearBtn.removeEventListener('click', onClear);
    input.removeEventListener('keydown', onKeydown);
    historyTags.forEach(t => t.removeEventListener('click', onTag));
    if (historyClearBtn) historyClearBtn.removeEventListener('click', onClearHistory);
    resultsEl.removeEventListener('click', onResultClick);
  };
}
