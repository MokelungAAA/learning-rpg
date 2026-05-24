// home.js — 首页：每日任务中心（§18.3）
// 设计哲学: 首页不是仪表盘，是行动指南。用户打开app第一眼看到"今天做什么"
// 读取: STUDY_RECORDS, USER_PROFILE, POMODORO_SESSIONS, KNOWLEDGE_STATE
// 写入: lts_review_context（一键专注/开始复习时写入）
import EventBus from '../event-bus.js';
import Theme from '../theme.js';
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import {
  calcLevelProgress, getLevelTitle, getSubjectIcon, formatNumber,
  getDayStatus, calcStreakDays, calcTodayXP, countUp
} from '../utils/level.js';
import { buildTempStates, calcShadowQueue, knapsackRecommend, getTempLevel } from '../utils/review-calc.js';
import { computeAll } from '../utils/skill-tree-calc.js';
import { loadECharts, initChart, disposeChart } from '../utils/charts.js';

const getRecords = () => Store.get(StorageKeys.STUDY_RECORDS) || [];
const getProfile = () => Store.get(StorageKeys.USER_PROFILE) || {};

let chartInstances = [];

// 获取问候语
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

// 获取本周/上周日期范围
function getWeekRanges() {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - dayOfWeek + 1);
  thisMonday.setHours(0, 0, 0, 0);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);
  return { thisMonday, lastMonday, nextMonday };
}

// 计算本周变化：各学科XP/时长对比上周
function calcWeeklyChanges(records) {
  const { thisMonday, lastMonday, nextMonday } = getWeekRanges();
  const thisWeek = records.filter(r => {
    const t = new Date(r.timestamp);
    return t >= thisMonday && t < nextMonday;
  });
  const prevWeek = records.filter(r => {
    const t = new Date(r.timestamp);
    return t >= lastMonday && t < thisMonday;
  });

  const changes = [];
  for (const s of SUBJECTS) {
    const thisXP = thisWeek.filter(r => r.subject === s.id || r.subject === s.name)
      .reduce((sum, r) => sum + (r.xp || 0), 0);
    const prevXP = prevWeek.filter(r => r.subject === s.id || r.subject === s.name)
      .reduce((sum, r) => sum + (r.xp || 0), 0);
    const thisDur = thisWeek.filter(r => r.subject === s.id || r.subject === s.name)
      .reduce((sum, r) => sum + (r.duration || 0), 0);

    if (thisXP === 0 && prevXP === 0) continue;
    let delta = 0;
    if (prevXP > 0) delta = Math.round((thisXP - prevXP) / prevXP * 100);
    else if (thisXP > 0) delta = 100;
    changes.push({ id: s.id, name: s.name, icon: getSubjectIcon(s.id), thisXP, delta, duration: thisDur });
  }
  return changes.sort((a, b) => b.thisXP - a.thisXP).slice(0, 6);
}

// 检测当前正在刷的教辅（最近7天内有连续记录的教材）
function detectActivePlan(records) {
  const recent = records.filter(r => {
    const days = (Date.now() - new Date(r.timestamp).getTime()) / 86400000;
    return days <= 7 && r.textbook;
  });
  if (recent.length === 0) return null;

  const tbCount = {};
  for (const r of recent) {
    const key = `${r.subject}::${r.textbook}`;
    if (!tbCount[key]) tbCount[key] = { subject: r.subject, textbook: r.textbook, count: 0, sections: new Set() };
    tbCount[key].count++;
    if (r.section) tbCount[key].sections.add(r.section);
  }
  const sorted = Object.values(tbCount).sort((a, b) => b.count - a.count);
  if (sorted.length === 0) return null;
  const top = sorted[0];
  return { subject: top.subject, textbook: top.textbook, count: top.count, sectionsDone: top.sections.size };
}

// 1. 问候 + 等级 + 设置按钮
function renderGreeting(profile, records) {
  const totalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
  const { level } = calcLevelProgress(totalXP);
  const title = getLevelTitle(level);
  const greeting = getGreeting();
  return `<div class="home-greeting">
    <div class="greeting-left">
      <div class="greeting-text">${greeting}，墨澜</div>
      <div class="greeting-level">Lv${level} ${title.cn}</div>
    </div>
    <a href="#/settings" class="greeting-settings" title="设置">⚙️</a>
  </div>`;
}

// 2. 核心指标：连续天数 / 今日XP 分开 + 等级进度条
function renderCoreMetrics(profile, records) {
  const totalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
  const todayXP = calcTodayXP(records);
  const streakDays = calcStreakDays(records);
  const { level, xpInLevel, xpNeeded, percent } = calcLevelProgress(totalXP);
  return `<div class="metrics-row">
    <div class="metric-card">
      <div class="metric-icon">🔥</div>
      <div class="metric-value" id="stat-streak">${streakDays}</div>
      <div class="metric-label">连续天数</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon">⚡</div>
      <div class="metric-value" id="stat-today-xp">+${todayXP}</div>
      <div class="metric-label">今日XP</div>
    </div>
  </div>
  <div class="level-progress">
    <div class="progress-header">
      <span class="progress-label">Lv${level} → Lv${level + 1}</span>
      <span class="progress-value">${formatNumber(xpInLevel)} / ${formatNumber(xpNeeded)} XP</span>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
  </div>`;
}

// 3. 今日任务：阴影队列前3条
function renderTodayTasks(queue) {
  if (queue.length === 0) {
    return `<div class="section-card">
      <div class="section-header">📋 今日任务</div>
      <div class="empty-hint">暂无待复习知识点，继续保持学习节奏！</div>
    </div>`;
  }
  const top3 = queue.slice(0, 3);
  const totalMin = top3.reduce((s, q) => s + Math.max(5, Math.round(15 - q.temp / 10)), 0);
  const items = top3.map(q => {
    const level = getTempLevel(q.temp);
    const cost = Math.max(5, Math.round(15 - q.temp / 10));
    const urgencyClass = q.temp < 30 ? 'task-urgent-high' : q.temp < 50 ? 'task-urgent-mid' : '';
    return `<div class="task-item ${urgencyClass}">
      <div class="task-left">
        <span class="task-icon" style="color:${level.color}">${level.icon}</span>
        <div class="task-info">
          <div class="task-name">${q.kp}</div>
          <div class="task-meta">${q.subjectName} · ${q.lastDays < 1 ? '今天' : Math.round(q.lastDays) + '天前'} · 约${cost}分钟</div>
        </div>
      </div>
      <div class="task-right">
        <span class="task-temp" style="color:${level.color}">${Math.round(q.temp)}°</span>
        <button class="task-review-btn" data-kp="${q.kp}" data-subject="${q.subjectName}" data-skill="${q.skillId}">复习</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="section-card">
    <div class="section-header">📋 今日任务</div>
    <div class="task-list">${items}</div>
    <div class="task-footer">
      <span class="task-total">总计 ${totalMin} 分钟 · ${queue.length} 个待复习</span>
      <button class="task-start-all" id="start-all-review">一键全部开始</button>
    </div>
  </div>`;
}

// 4. 一键专注
function renderOneTapFocus(queue) {
  const top = queue[0];
  const subject = top ? top.subjectName : '自动选择';
  return `<div class="section-card onetap-card">
    <div class="section-header">⚡ 一键专注</div>
    <button class="onetap-btn" id="onetap-focus">
      <span class="onetap-icon">▶</span>
      <span class="onetap-text">开始 25 分钟专注</span>
    </button>
    <div class="onetap-hint">${top ? `算法推荐：${subject}` : '记录更多学习数据后自动推荐'}</div>
  </div>`;
}

// 4.5 未完成录入提醒（番茄钟完成后未记录得分）
function renderPendingReminder() {
  const records = getRecords();
  const now = Date.now();
  // 检查最近24小时内是否有 score=0 的番茄钟来源记录
  const pending = records.filter(r => {
    if (r.source !== 'pomodoro') return false;
    if (r.score > 0) return false;
    const age = now - new Date(r.timestamp).getTime();
    return age < 86400000; // 24小时
  });
  if (pending.length === 0) return '';
  const latest = pending[pending.length - 1];
  const mins = Math.round((now - new Date(latest.timestamp).getTime()) / 60000);
  const timeAgo = mins < 60 ? `${mins}分钟前` : `${Math.round(mins / 60)}小时前`;
  return `<div class="section-card pending-reminder">
    <div class="pending-icon">💡</div>
    <div class="pending-text">
      <div class="pending-title">你刚完成 ${latest.duration || 25} 分钟${latest.subject || ''}专注，还没记录得分</div>
      <div class="pending-time">${timeAgo}</div>
    </div>
    <button class="pending-btn" id="pending-record">快速记录</button>
  </div>`;
}

// 5. 本周变化
function renderWeeklyChanges(records) {
  const changes = calcWeeklyChanges(records);
  if (changes.length === 0) return '';
  const cards = changes.map(c => {
    const arrow = c.delta > 0 ? '↑' : c.delta < 0 ? '↓' : '→';
    const color = c.delta > 0 ? 'var(--color-success)' : c.delta < 0 ? 'var(--color-error)' : 'var(--color-text-3)';
    const sign = c.delta > 0 ? '+' : '';
    return `<div class="weekly-card">
      <div class="weekly-icon">${c.icon}</div>
      <div class="weekly-name">${c.name}</div>
      <div class="weekly-delta" style="color:${color}">${sign}${c.delta}% ${arrow}</div>
    </div>`;
  }).join('');
  return `<div class="section-card">
    <div class="section-header">📊 本周变化</div>
    <div class="weekly-grid">${cards}</div>
  </div>`;
}

// 6. 当前规划
function renderCurrentPlan(records) {
  const plan = detectActivePlan(records);
  if (!plan) return '';
  return `<div class="section-card">
    <div class="section-header">🎯 当前规划</div>
    <div class="plan-info">
      <div class="plan-textbook">📖 正在刷：${plan.textbook}</div>
      <div class="plan-progress">最近7天刷了 ${plan.count} 条记录 · 覆盖 ${plan.sectionsDone} 个章节</div>
      <div class="plan-hint">💡 建议保持每天学习节奏，持续积累</div>
    </div>
  </div>`;
}

// 7. 特长 & 弱项
function renderTalentWeakness(talents) {
  if (talents.length === 0) return '';
  const strengths = talents.filter(t => t.type === 'strength');
  const weaknesses = talents.filter(t => t.type === 'weakness');
  let content = '';
  if (strengths.length > 0) {
    content += strengths.map(s =>
      `<div class="tw-item tw-strength"><span class="tw-icon">⭐</span><span class="tw-name">${s.name}</span><span class="tw-val">掌握度 ${s.mastery}%</span></div>`
    ).join('');
  }
  if (weaknesses.length > 0) {
    content += weaknesses.map(w => {
      const impact = Math.round((100 - w.mastery) * 0.15);
      return `<div class="tw-item tw-weakness"><span class="tw-icon">⚠️</span><span class="tw-name">${w.name}</span><span class="tw-val">掌握度 ${w.mastery}%</span></div>
      <div class="tw-impact">💡 弱项影响考试约 ${impact} 分，建议优先复习</div>`;
    }).join('');
  }
  if (!content) return '';
  return `<div class="section-card">
    <div class="section-header">⭐ 特长 & ⚠️ 弱项</div>
    <div class="tw-list">${content}</div>
  </div>`;
}

// 8. 学科平衡雷达图
function renderRadarChart() {
  return `<div class="section-card">
    <div class="section-header">📈 学科平衡</div>
    <div class="chart-container" id="radar-chart" style="height:280px"></div>
  </div>`;
}

// 9. 更多数据（可折叠）
function renderMoreSection(records) {
  const achievements = Store.get(StorageKeys.ACHIEVEMENTS) || {};
  const unlocked = Object.keys(achievements).filter(k => achievements[k]).length;
  return `<div class="fold-section">
    <div class="fold-header" data-fold="more">
      <span>▼ 更多数据</span>
      <span class="fold-arrow">▾</span>
    </div>
    <div class="fold-body" id="fold-more">
      <div class="fold-content">
        <div class="more-grid">
          <a href="#/achievement" class="more-item"><span class="more-icon">🏆</span><span class="more-label">成就</span><span class="more-val">${unlocked} 个已解锁</span></a>
          <a href="#/data/reading" class="more-item"><span class="more-icon">📖</span><span class="more-label">阅读</span><span class="more-val">书架</span></a>
          <a href="#/data/log" class="more-item"><span class="more-icon">📋</span><span class="more-label">日志</span><span class="more-val">${records.length} 条</span></a>
          <a href="#/data/skill-tree" class="more-item"><span class="more-icon">🌳</span><span class="more-label">技能树</span><span class="more-val">详情</span></a>
        </div>
      </div>
    </div>
  </div>`;
}

export function render() {
  const profile = getProfile();
  const records = getRecords();
  const tempStates = buildTempStates(records, profile);
  const { subjectAbility, talents } = computeAll();
  const queue = calcShadowQueue(tempStates, subjectAbility);

  return `<div class="page-enter">
    ${renderGreeting(profile, records)}
    ${renderCoreMetrics(profile, records)}
    ${renderTodayTasks(queue)}
    ${renderOneTapFocus(queue)}
    ${renderPendingReminder()}
    ${renderWeeklyChanges(records)}
    ${renderCurrentPlan(records)}
    ${renderTalentWeakness(talents)}
    ${renderRadarChart()}
    ${renderMoreSection(records)}
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.121 · 每日任务中心</p>
  </div>`;
}

// 初始化雷达图
async function initRadarChart() {
  const ec = await loadECharts();
  if (!ec) return;
  const el = document.getElementById('radar-chart');
  if (!el) return;
  const chart = initChart(el);
  if (!chart) return;
  chartInstances.push(chart);

  const records = getRecords();
  const profile = getProfile();
  const tempStates = buildTempStates(records, profile);
  const { subjectAbility } = computeAll();

  const indicators = [];
  const values = [];
  for (const s of SUBJECTS) {
    const ability = subjectAbility[s.id];
    indicators.push({ name: s.name, max: 100 });
    values.push(ability ? Math.round(ability.mastery) : 0);
  }

  chart.setOption({
    tooltip: { trigger: 'item' },
    radar: {
      indicator: indicators,
      shape: 'polygon',
      splitNumber: 4,
      axisName: { fontSize: 11, color: 'var(--color-text-2)' },
      splitLine: { lineStyle: { color: 'var(--glass-border)' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'var(--glass-border)' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        name: '掌握度',
        areaStyle: { color: 'rgba(98,160,234,0.15)' },
        lineStyle: { color: '#62A0EA', width: 2 },
        itemStyle: { color: '#62A0EA' },
      }],
    }],
  });
}

// afterRender: 事件绑定 + 雷达图初始化
export function afterRender() {
  // 数字滚动动画
  const records = getRecords();
  const todayXP = calcTodayXP(records);
  const streakDays = calcStreakDays(records);
  setTimeout(() => {
    const todayEl = document.getElementById('stat-today-xp');
    const streakEl = document.getElementById('stat-streak');
    if (todayEl) { countUp(todayEl, todayXP, 600); todayEl.textContent = '+' + todayXP; }
    if (streakEl) countUp(streakEl, streakDays, 600);
  }, 200);

  // 雷达图
  initRadarChart();

  // 折叠面板
  const foldHeaders = document.querySelectorAll('.fold-header');
  const onFoldToggle = (e) => {
    const { fold: foldId } = e.currentTarget.dataset;
    const body = document.getElementById('fold-' + foldId);
    const arrow = e.currentTarget.querySelector('.fold-arrow');
    if (body) body.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
  };
  foldHeaders.forEach(h => h.addEventListener('click', onFoldToggle));

  // 复习按钮 → 跳转番茄钟
  const reviewBtns = document.querySelectorAll('.task-review-btn');
  const onReviewClick = (e) => {
    const { kp, subject, skill } = e.currentTarget.dataset;
    Store.set('lts_review_context', { kp, subject, skill, startTime: Date.now() });
    window.location.hash = '#/pomodoro';
  };
  reviewBtns.forEach(b => b.addEventListener('click', onReviewClick));

  // 未完成录入提醒 → 打开NLP快速录入
  const pendingBtn = document.getElementById('pending-record');
  const onPendingClick = () => {
    import('../components/nlp-entry.js').then(m => m.open());
  };
  if (pendingBtn) pendingBtn.addEventListener('click', onPendingClick);

  // 一键全部开始
  const startAllBtn = document.getElementById('start-all-review');
  const onStartAll = () => {
    const profile = getProfile();
    const tempStates = buildTempStates(records, profile);
    const { subjectAbility } = computeAll();
    const queue = calcShadowQueue(tempStates, subjectAbility);
    if (queue.length > 0) {
      Store.set('lts_review_context', { kp: queue[0].kp, subject: queue[0].subjectName, skill: queue[0].skillId, startTime: Date.now() });
      window.location.hash = '#/pomodoro';
    }
  };
  if (startAllBtn) startAllBtn.addEventListener('click', onStartAll);

  // 一键专注
  const onetapBtn = document.getElementById('onetap-focus');
  const onOnetap = () => {
    const profile = getProfile();
    const tempStates = buildTempStates(records, profile);
    const { subjectAbility } = computeAll();
    const queue = calcShadowQueue(tempStates, subjectAbility);
    if (queue.length > 0) {
      Store.set('lts_review_context', { kp: queue[0].kp, subject: queue[0].subjectName, skill: queue[0].skillId, startTime: Date.now() });
    }
    window.location.hash = '#/pomodoro';
  };
  if (onetapBtn) onetapBtn.addEventListener('click', onOnetap);

  // record:added → 刷新页面
  const onRecordAdded = () => window.location.reload();
  EventBus.on('record:added', onRecordAdded);

  return () => {
    foldHeaders.forEach(h => h.removeEventListener('click', onFoldToggle));
    reviewBtns.forEach(b => b.removeEventListener('click', onReviewClick));
    if (pendingBtn) pendingBtn.removeEventListener('click', onPendingClick);
    if (startAllBtn) startAllBtn.removeEventListener('click', onStartAll);
    if (onetapBtn) onetapBtn.removeEventListener('click', onOnetap);
    EventBus.off('record:added', onRecordAdded);
    chartInstances.forEach(c => disposeChart(c));
    chartInstances = [];
  };
}
