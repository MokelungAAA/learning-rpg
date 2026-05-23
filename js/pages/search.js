// search.js — 全局搜索页（学科/教材/知识点/记录/成就/功能页面）
// 读取: STUDY_RECORDS, USER_PROFILE, SEARCH_HISTORY
// 写入: SEARCH_HISTORY（搜索时自动保存，最多5条）
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import { SUBJECTS_DATA } from '../data/subjects.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { getAllSkills } from '../data/skill-tree.js';
import { getSubjectIcon } from '../utils/level.js';
import { checkAchievement } from '../utils/achievements-check.js';

// 搜索历史管理（最多5条，存 localStorage）
const MAX_HISTORY = 5;
const getHistory = () => { try { return JSON.parse(localStorage.getItem(StorageKeys.SEARCH_HISTORY) || '[]'); } catch { return []; } };
const saveHistory = (h) => localStorage.setItem(StorageKeys.SEARCH_HISTORY, JSON.stringify(h.slice(0, MAX_HISTORY)));
// 添加到历史（去重后放首位）
function addToHistory(query) {
  if (!query || query.length < 1) return;
  const history = getHistory().filter(h => h !== query);
  history.unshift(query);
  saveHistory(history);
}

// 拼音首字母简拼映射（支持输入 sx 匹配"数学"）
const PINYIN_MAP = { '数学': 'sx', '语文': 'yw', '英语': 'yy', '物理': 'wl', '化学': 'hx', '生物': 'sw', '政治': 'zz', '历史': 'ls', '地理': 'dl' };

// Levenshtein 编辑距离（模糊匹配，距离<=2 视为匹配）
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(text, query) {
  const t = text.toLowerCase(), q = query.toLowerCase();
  if (t.includes(q)) return true;
  // 前缀匹配
  if (t.startsWith(q.slice(0, Math.ceil(q.length * 0.6)))) return true;
  // Levenshtein: 对短文本做精确模糊，长文本按子串窗口滑动
  if (t.length <= 8 && levenshtein(t, q) <= 2) return true;
  for (let i = 0; i <= t.length - q.length; i++) {
    if (levenshtein(t.slice(i, i + q.length), q) <= 2) return true;
  }
  return false;
}

// 拼音首字母匹配（仅支持9个学科名）
function matchPinyin(text, query) {
  const pinyin = PINYIN_MAP[text];
  return pinyin && pinyin.includes(query.toLowerCase());
}

// 全文搜索：遍历学科/教材/知识点/技能树/记录/成就/功能页
// 坑: 成就只搜已解锁的，避免泄露隐藏成就条件
// 坑: 记录搜索拼接多字段为一个大字符串
function searchAll(query) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  const results = [];

  // 搜索学科（精确+拼音+模糊）
  for (const s of SUBJECTS) {
    if (s.name.includes(q) || s.id.includes(q) || matchPinyin(s.name, q) || fuzzyMatch(s.name, q)) {
      results.push({ type: 'subject', icon: getSubjectIcon(s.id), title: s.name, desc: '学科', hash: `#/subject/${s.id}` });
    }
  }

  // 搜索教材/章节/知识点（精确+模糊）
  for (const [sid, data] of Object.entries(SUBJECTS_DATA)) {
    if (!data.textbooks) continue;
    for (const tb of data.textbooks) {
      if (fuzzyMatch(tb.name, q)) {
        results.push({ type: 'textbook', icon: '📚', title: tb.name, desc: data.name, hash: `#/data/log?q=${encodeURIComponent(tb.name.slice(0, 6))}` });
      }
      for (const ch of (tb.chapters || [])) {
        if (fuzzyMatch(ch.name, q)) {
          results.push({ type: 'chapter', icon: '📖', title: ch.name, desc: tb.name, hash: `#/data/log?q=${encodeURIComponent(ch.name.slice(0, 6))}` });
        }
        for (const sec of (ch.sections || [])) {
          if (fuzzyMatch(sec.name, q)) {
            results.push({ type: 'section', icon: '📝', title: sec.name, desc: ch.name, hash: `#/data/log?q=${encodeURIComponent(sec.name.slice(0, 6))}` });
          }
          for (const kp of (sec.knowledgePoints || [])) {
            if (fuzzyMatch(kp, q)) {
              results.push({ type: 'kp', icon: '💡', title: kp, desc: sec.name, hash: `#/data/log?q=${encodeURIComponent(kp)}` });
            }
          }
        }
      }
    }
  }

  // 搜索技能树知识点（精确+模糊）
  const allSkills = getAllSkills();
  for (const skill of allSkills) {
    for (const kp of skill.kps) {
      if (fuzzyMatch(kp, q)) {
        results.push({ type: 'skill-kp', icon: '🌳', title: kp, desc: `${skill.subjectName} · ${skill.name}`, hash: '#/data/skill-tree' });
      }
    }
  }

  // 搜索学习记录（精确+模糊）
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  for (const r of records) {
    const text = [r.subject, r.textbook, r.section, r.notes, ...(r.knowledgePoints || [])].join(' ');
    if (fuzzyMatch(text, q)) {
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
    if (p.label.includes(q) || matchPinyin(p.label, q) || fuzzyMatch(p.label, q)) {
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

// 搜索历史标签 + 清除按钮
function renderHistory() {
  const history = getHistory();
  if (history.length === 0) return '';
  const items = history.map(h => `<button class="search-history-tag" data-query="${h}">${h}</button>`).join('');
  return `<div class="search-history"><div class="search-history-top"><span class="search-history-label">🕐 最近搜索</span><button class="search-history-clear" id="history-clear">清除</button></div><div class="search-history-tags">${items}</div></div>`;
}

// 搜索结果分组渲染（每组最多8条，超出显示"还有N条"）
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
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.91 · 开发者区</p>
  </div>`;
}

// afterRender: 输入防抖(200ms) + 历史标签 + 清除按钮 + 键盘导航 + 结果点击保存历史
export function afterRender() {
  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');
  const resultsEl = document.getElementById('search-results');
  let debounce = null;
  let activeIdx = -1;

  const doSearch = () => {
    const q = input.value.trim();
    clearBtn.style.display = q ? 'block' : 'none';
    activeIdx = -1;
    if (!q) { resultsEl.innerHTML = ''; return; }
    const results = searchAll(q);
    resultsEl.innerHTML = renderResults(results);
    addToHistory(q);
  };

  const getResultItems = () => resultsEl.querySelectorAll('.search-result-item');

  const updateActive = () => {
    const items = getResultItems();
    items.forEach((el, i) => el.classList.toggle('search-active', i === activeIdx));
    if (items[activeIdx]) items[activeIdx].scrollIntoView({ block: 'nearest' });
  };

  const onInput = () => { clearTimeout(debounce); debounce = setTimeout(doSearch, 200); };
  const onClear = () => { input.value = ''; clearBtn.style.display = 'none'; resultsEl.innerHTML = ''; activeIdx = -1; input.focus(); };
  const onKeydown = (e) => {
    const items = getResultItems();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, items.length - 1);
      updateActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      updateActive();
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && items[activeIdx]) {
        e.preventDefault();
        items[activeIdx].click();
      }
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
