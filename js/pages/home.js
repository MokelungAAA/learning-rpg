// home.js — 首页：Hero Stats + 嵌入式番茄钟 + 智能推荐 + 学科卡片
// 读取: STUDY_RECORDS, USER_PROFILE, POMODORO_SESSIONS
// 写入: 无（只读展示页，数据变更通过其他页面）
import EventBus from '../event-bus.js';
import Theme from '../theme.js';
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import { checkAchievement } from '../utils/achievements-check.js';
import {
  calcLevel, calcLevelProgress, getLevelTitle, getSubjectLevelTitle,
  getSubjectIcon, formatNumber, getDayStatus,
  calcStreakDays, calcTodayXP, countUp
} from '../utils/level.js';
import { ACHIEVEMENTS } from '../data/achievements.js';


const getRecords = () => Store.get(StorageKeys.STUDY_RECORDS) || [];
const getProfile = () => Store.get(StorageKeys.USER_PROFILE) || {};

// 按学科聚合 XP/条数/综合分/总时长
// score = 平均分*0.6 + 条数因子*0.4
function calcSubjectStats(records) {
  const map = {};
  for (const s of SUBJECTS) {
    const recs = records.filter(r => r.subject === s.id || r.subject === s.name);
    const xp = recs.reduce((sum, r) => sum + (r.xp || 0), 0);
    const totalDur = recs.reduce((sum, r) => sum + (r.duration || 0), 0);
    const avgScore = recs.length > 0
      ? recs.reduce((a, r) => a + (r.score || 0), 0) / recs.length : 0;
    const score = recs.length > 0
      ? Math.round(avgScore * 0.6 + Math.min(100, recs.length * 5) * 0.4) : 0;
    map[s.id] = { xp, count: recs.length, score, totalDur };
  }
  return map;
}

// 4.2 顶部状态栏：同步状态 + 搜索入口 + 主题切换
function renderStatusBar() {
  return `<div class="status-bar">
    <div class="status-left"><span class="status-dot offline"></span><span class="status-text">未同步</span></div>
    <div class="status-right">
      <a href="#/search" class="status-btn" title="搜索">🔍</a>
      <button class="status-btn theme-toggle" title="切换主题">☀️</button>
    </div>
  </div>`;
}

// 4.3 Hero Stats：等级卡+今日XP+连续天数+总XP+进度条
// profile/records 由 render() 传入，避免重复读 Store
function renderHeroStats(profile, records) {
  const totalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
  const todayXP = calcTodayXP(records);
  const streakDays = calcStreakDays(records);
  const day = getDayStatus();
  const { level, xpInLevel, xpNeeded, percent } = calcLevelProgress(totalXP);
  const title = getLevelTitle(level);
  return `
    <div class="hero-stats">
      <div class="hero-level-card">
        <div class="hero-level-value">Lv${level}</div>
        <div class="hero-level-title">${title.cn}</div>
        <div class="hero-level-subtitle">${title.name}</div>
      </div>
      <div class="stat-card card-enter"><div class="stat-card-icon">⚡</div>
        <div class="stat-card-value" id="stat-today-xp" style="color:var(--color-success)">+${todayXP}</div>
        <div class="stat-card-label">今日XP</div></div>
      <div class="stat-card card-enter"><div class="stat-card-icon">🔥</div>
        <div class="stat-card-value" id="stat-streak" style="color:var(--color-warning)">${streakDays}天</div>
        <div class="stat-card-label">连续学习</div></div>
      <div class="stat-card card-enter"><div class="stat-card-icon">${day.icon}</div>
        <div class="stat-card-value" style="color:${day.color}">${day.text}</div>
        <div class="stat-card-label">每日状态</div></div>
      <div class="stat-card card-enter"><div class="stat-card-icon">🏆</div>
        <div class="stat-card-value" id="stat-total-xp">${formatNumber(totalXP)}</div>
        <div class="stat-card-label">总XP</div></div>
    </div>
    <div class="level-progress">
      <div class="progress-header">
        <span class="progress-label">总等级进度</span>
        <span class="progress-value">${formatNumber(xpInLevel)} / ${formatNumber(xpNeeded)} XP</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
    </div>`;
}

// 4.4 嵌入式番茄钟 widget：今日统计 + 跳转按钮
// 按钮只做导航，实际计时在 pomodoro.js
function renderPomodoroWidget() {
  const sessions = Store.get(StorageKeys.POMODORO_SESSIONS) || [];
  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter(s =>
    s.completed && s.phase === 'focus' &&
    s.startTime && new Date(s.startTime).toISOString().slice(0, 10) === today
  );
  const count = todaySessions.length;
  const minutes = todaySessions.reduce((s, r) => s + (r.plannedDuration || 0), 0);
  return `
    <div class="pomodoro-widget">
      <div class="pomodoro-header">🍅 番茄钟</div>
      <div class="pomodoro-timer">
        <div class="pomodoro-time" id="pomodoro-display">25:00</div>
        <button class="pomodoro-btn" id="pomodoro-start">▶ 开始</button>
      </div>
      <div class="pomodoro-stats" id="pomodoro-stats">今日: ${count}个 · ${minutes}m</div>
    </div>`;
}

// 4.5 智能推荐：找出>=2天未碰的学科和从未学过的学科
// 坑: subject 用 name 匹配（非 id），需与 SUBJECTS.name 对齐
function renderRecommendations(records) {
  const recentSubjects = {};
  for (const r of records) {
    if (!r.timestamp) continue;
    const day = new Date(r.timestamp).toISOString().slice(0, 10);
    if (!recentSubjects[r.subject] || day > recentSubjects[r.subject].lastDay) {
      recentSubjects[r.subject] = { lastDay: day, count: 0 };
    }
    recentSubjects[r.subject].count++;
  }

  const allSubjects = SUBJECTS.map(s => s.name);
  const neglected = allSubjects.filter(s => !recentSubjects[s]);
  const daysSince = (dateStr) => {
    const d = new Date(dateStr);
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  };

  const stale = Object.entries(recentSubjects)
    .map(([name, data]) => ({ name, days: daysSince(data.lastDay), count: data.count }))
    .filter(s => s.days >= 2)
    .sort((a, b) => b.days - a.days);

  let content = '';
  if (stale.length > 0) {
    const s = stale[0];
    content += `<div class="rec-item">
      <span class="rec-icon">⏰</span>
      <div class="rec-text">
        <div class="rec-title">待复习: ${s.name}</div>
        <div class="rec-desc">已 ${s.days} 天未接触</div>
      </div>
      <button class="rec-action" data-subject="${s.name}">开始 →</button>
    </div>`;
  }
  if (neglected.length > 0) {
    content += `<div class="rec-item">
      <span class="rec-icon">📖</span>
      <div class="rec-text">
        <div class="rec-title">建议学习: ${neglected[0]}</div>
        <div class="rec-desc">尚无学习记录</div>
      </div>
      <button class="rec-action" data-subject="${neglected[0]}">开始 →</button>
    </div>`;
  }
  if (!content) {
    content = `<div class="rec-empty">暂无推荐，记录学习数据后将为你智能推荐</div>`;
  }

  return `<div class="recommendations">
    <div class="rec-header">📋 智能推荐</div>
    ${content}
  </div>`;
}

// 4.6 学科卡片网格/列表：按综合分降序排列
// 点击卡片跳转 #/subject/{id} 详情页
// §4.3: 支持 grid/list 视图切换
function renderSubjectGrid(records) {
  const stats = calcSubjectStats(records);
  const sorted = [...SUBJECTS].sort((a, b) => (stats[b.id]?.score || 0) - (stats[a.id]?.score || 0));
  const gridCards = sorted.map(s => {
    const st = stats[s.id] || { xp: 0, count: 0, score: 0, totalDur: 0 };
    const t = getSubjectLevelTitle(st.score);
    return `<div class="subject-card card-enter" data-subject="${s.id}">
      <div class="subject-card-icon">${getSubjectIcon(s.id)}</div>
      <div class="subject-card-name">${s.name}</div>
      <div class="subject-card-level" style="color:${t.color}">${t.cn} ${t.ja}</div>
      <div class="subject-card-progress"><div class="progress-bar"><div class="progress-fill" style="width:${st.score}%"></div></div></div>
      <div class="subject-card-meta"><span>⭐${st.xp}XP</span><span>${st.count}条</span></div>
    </div>`;
  }).join('');
  const listCards = sorted.map(s => {
    const st = stats[s.id] || { xp: 0, count: 0, score: 0, totalDur: 0 };
    const t = getSubjectLevelTitle(st.score);
    const hours = Math.floor(st.totalDur / 60);
    const mins = st.totalDur % 60;
    return `<div class="subject-list-item" data-subject="${s.id}">
      <span class="subject-list-icon">${getSubjectIcon(s.id)}</span>
      <div class="subject-list-info">
        <div class="subject-list-name">${s.name} <span class="subject-list-level" style="color:${t.color}">${t.cn}</span></div>
        <div class="subject-list-meta">${hours}h${mins}m · ${st.count}条 · ⭐${st.xp}XP</div>
      </div>
      <div class="subject-list-bar"><div class="progress-bar"><div class="progress-fill" style="width:${st.score}%"></div></div></div>
    </div>`;
  }).join('');
  const toggle = `<div class="subject-view-toggle">
    <button class="subject-view-btn active" data-view="grid">网格</button>
    <button class="subject-view-btn" data-view="list">列表</button>
  </div>`;
  return `<div class="section-title">📊 学科等级</div>${toggle}<div class="subject-grid" id="subject-grid">${gridCards}</div><div class="subject-list" id="subject-list" style="display:none">${listCards}</div>`;
}

export function render() {
  const profile = getProfile();
  const records = getRecords();
  return `<div class="page-enter">
    ${renderStatusBar()}
    ${renderHeroStats(profile, records)}
    ${renderPomodoroWidget()}
    ${renderRecommendations(records)}
    ${renderSubjectGrid(records)}
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.99 · 开发者区</p>
  </div>`;
}

// afterRender: 数字动画 + 主题/番茄钟/推荐/学科事件绑定
// 返回清理函数，防止页面切换后内存泄漏
export function afterRender() {
  // 数字滚动动画
  const profile = getProfile();
  const records = getRecords();
  const totalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
  const todayXP = calcTodayXP(records);
  const streakDays = calcStreakDays(records);
  setTimeout(() => {
    const todayEl = document.getElementById('stat-today-xp');
    const streakEl = document.getElementById('stat-streak');
    const totalEl = document.getElementById('stat-total-xp');
    if (todayEl) { countUp(todayEl, todayXP, 600); todayEl.textContent = '+' + todayXP; }
    if (streakEl) { countUp(streakEl, streakDays, 600); }
    if (totalEl) { countUp(totalEl, totalXP, 800); }
  }, 200);

  const themeBtn = document.querySelector('.theme-toggle');
  function updateThemeIcon() {
    const m = Theme.getTheme();
    themeBtn.textContent = m === 'dark' ? '🌙' : m === 'light' ? '☀️' : '💻';
  }
  updateThemeIcon();
  const onThemeBtn = () => { Theme.toggle(); updateThemeIcon(); };
  themeBtn.addEventListener('click', onThemeBtn);
  const onThemeChanged = () => updateThemeIcon();
  EventBus.on('theme:changed', onThemeChanged);

  // 番茄钟按钮 → 全屏页面
  const pomBtn = document.getElementById('pomodoro-start');
  const onPomClick = () => { window.location.hash = '#/pomodoro'; };
  if (pomBtn) pomBtn.addEventListener('click', onPomClick);

  // 智能推荐按钮
  const recBtns = document.querySelectorAll('.rec-action');
  const onRecClick = (e) => {
    const subj = e.currentTarget.dataset.subject;
    window.location.hash = '#/pomodoro';
  };
  recBtns.forEach(b => b.addEventListener('click', onRecClick));

  // 学科卡片点击（网格+列表两种视图都支持）
  const subjectCards = document.querySelectorAll('.subject-card');
  const subjectListItems = document.querySelectorAll('.subject-list-item');
  const onSubjectClick = (e) => {
    const id = e.currentTarget.dataset.subject;
    window.location.hash = `#/subject/${id}`;
  };
  subjectCards.forEach(c => c.addEventListener('click', onSubjectClick));
  subjectListItems.forEach(c => c.addEventListener('click', onSubjectClick));

  // §4.3: 学科视图切换（网格/列表）
  const viewBtns = document.querySelectorAll('.subject-view-btn');
  const gridEl = document.getElementById('subject-grid');
  const listEl = document.getElementById('subject-list');
  const onViewToggle = (e) => {
    const view = e.currentTarget.dataset.view;
    viewBtns.forEach(b => b.classList.toggle('active', b === e.currentTarget));
    if (gridEl) gridEl.style.display = view === 'grid' ? '' : 'none';
    if (listEl) listEl.style.display = view === 'list' ? '' : 'none';
  };
  viewBtns.forEach(b => b.addEventListener('click', onViewToggle));

  // ENTRY-06: 记录保存后整页刷新以更新所有统计
  // 坑: 用 reload 而非局部更新，因为多组件依赖同一批数据
  const onRecordAdded = () => {
    window.location.reload();
  };
  EventBus.on('record:added', onRecordAdded);

  return () => {
    themeBtn.removeEventListener('click', onThemeBtn);
    EventBus.off('theme:changed', onThemeChanged);
    if (pomBtn) pomBtn.removeEventListener('click', onPomClick);
    recBtns.forEach(b => b.removeEventListener('click', onRecClick));
    subjectCards.forEach(c => c.removeEventListener('click', onSubjectClick));
    subjectListItems.forEach(c => c.removeEventListener('click', onSubjectClick));
    viewBtns.forEach(b => b.removeEventListener('click', onViewToggle));
    EventBus.off('record:added', onRecordAdded);
  };
}
