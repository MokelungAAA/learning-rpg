// home.js — 首页：智能行动指南
// 设计哲学: 预测用户行为，突出最可能的下一步操作
// 读取: STUDY_RECORDS, USER_PROFILE, POMODORO_SESSIONS, KNOWLEDGE_STATE
// 写入: lts_review_context（一键专注/开始复习时写入）
import EventBus from '../event-bus.js';
import Theme from '../theme.js';
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { checkAndPersist } from '../utils/achievements-check.js';
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

// 预测用户行为：分析最近记录，返回最可能的下一步操作
function predictNextAction(records, queue) {
  const now = new Date();
  const hour = now.getHours();
  const today = now.toISOString().slice(0, 10);
  const todayRecs = records.filter(r => r.timestamp && r.timestamp.slice(0, 10) === today);

  // 1. 有紧急待复习 → 推荐复习
  if (queue.length > 0 && queue[0].temp < 40) {
    const top = queue[0];
    return {
      type: 'review',
      icon: '🔥',
      title: `${top.kp} 快忘了`,
      subtitle: `${top.subjectName} · 温度 ${Math.round(top.temp)}°`,
      action: '立即复习',
      urgency: 'high',
      kp: top.kp,
      subject: top.subjectName,
      skillId: top.skillId,
    };
  }

  // 2. 分析最近7天在这个时间段最常学的学科
  const recent = records.filter(r => {
    const d = (Date.now() - new Date(r.timestamp).getTime()) / 86400000;
    return d <= 7;
  });
  const hourRecs = recent.filter(r => {
    const h = new Date(r.timestamp).getHours();
    return Math.abs(h - hour) <= 1;
  });
  const subjFreq = {};
  for (const r of hourRecs) {
    subjFreq[r.subject] = (subjFreq[r.subject] || 0) + 1;
  }
  const topSubject = Object.entries(subjFreq).sort((a, b) => b[1] - a[1])[0];

  // 3. 今天还没学过 → 推荐开始
  if (todayRecs.length === 0) {
    return {
      type: 'start',
      icon: '📖',
      title: '今天还没开始学习',
      subtitle: topSubject ? `通常这个时间学 ${topSubject[0]}` : '开始新的一天',
      action: '开始专注',
      urgency: 'normal',
    };
  }

  // 4. 有待复习但不紧急 → 推荐复习
  if (queue.length > 0) {
    return {
      type: 'review',
      icon: '📋',
      title: `${queue.length} 个知识点待复习`,
      subtitle: `最近: ${queue[0].kp}`,
      action: '开始复习',
      urgency: 'medium',
      kp: queue[0].kp,
      subject: queue[0].subjectName,
      skillId: queue[0].skillId,
    };
  }

  // 5. 默认 → 继续学习
  const lastRec = todayRecs[todayRecs.length - 1];
  return {
    type: 'continue',
    icon: '⚡',
    title: `继续 ${lastRec.subject || '学习'}`,
    subtitle: `已学 ${todayRecs.reduce((s, r) => s + (r.duration || 0), 0)} 分钟`,
    action: '继续专注',
    urgency: 'normal',
    subject: lastRec.subject,
  };
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

// 1. 紧凑问候栏（一行：问候 + 等级 + 设置）
function renderGreeting(profile, records) {
  const totalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
  const { level } = calcLevelProgress(totalXP);
  const title = getLevelTitle(level);
  const greeting = getGreeting();
  const nick = profile.nickname || '墨澜';
  console.log('[LTS] renderGreeting: records=%d, totalXP=%d, level=%d', records.length, totalXP, level);
  return `<div class="home-greeting">
    <div class="greeting-left">
      <span class="greeting-text">${greeting}，${nick}</span>
      <span class="greeting-level">Lv${level} ${title.cn}</span>
    </div>
    <a href="#/settings" class="greeting-settings" title="设置">⚙️</a>
  </div>`;
}

// 2. 智能行动卡（预测用户下一步，视觉焦点）
function renderSmartAction(prediction, queue) {
  const urgencyClass = prediction.urgency === 'high' ? 'smart-urgent' : prediction.urgency === 'medium' ? 'smart-medium' : 'smart-normal';
  const dataAttrs = prediction.kp
    ? `data-kp="${prediction.kp}" data-subject="${prediction.subject || ''}" data-skill="${prediction.skillId || ''}"`
    : prediction.subject ? `data-subject="${prediction.subject}"` : '';
  return `<div class="smart-action-card ${urgencyClass}" id="smart-action" ${dataAttrs}>
    <div class="smart-action-icon">${prediction.icon}</div>
    <div class="smart-action-body">
      <div class="smart-action-title">${prediction.title}</div>
      <div class="smart-action-subtitle">${prediction.subtitle}</div>
    </div>
    <button class="smart-action-btn" id="smart-action-btn">${prediction.action}</button>
  </div>`;
}

// 3. 今日脉搏条（水平：连续天数 | 今日XP | 等级进度）
function renderPulseBar(profile, records) {
  const totalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
  const todayXP = calcTodayXP(records);
  const streakDays = calcStreakDays(records);
  const { level, percent } = calcLevelProgress(totalXP);
  return `<div class="pulse-bar">
    <div class="pulse-item"><span class="pulse-num" id="stat-streak">${streakDays}</span><span class="pulse-label">🔥连续</span></div>
    <div class="pulse-divider"></div>
    <div class="pulse-item"><span class="pulse-num" id="stat-today-xp">+${todayXP}</span><span class="pulse-label">⚡今日</span></div>
    <div class="pulse-divider"></div>
    <div class="pulse-item"><span class="pulse-num">Lv${level}</span>
      <div class="pulse-progress"><div class="pulse-progress-fill" style="width:${percent}%"></div></div>
    </div>
  </div>`;
}

// 4. 待复习任务（紧凑列表，最多3条）
function renderTodayTasks(queue) {
  if (queue.length === 0) return '';
  const top3 = queue.slice(0, 3);
  const items = top3.map(q => {
    const level = getTempLevel(q.temp);
    const cost = Math.max(5, Math.round(15 - q.temp / 10));
    const urgencyClass = q.temp < 30 ? 'task-urgent-high' : q.temp < 50 ? 'task-urgent-mid' : '';
    return `<div class="task-item ${urgencyClass}">
      <div class="task-left">
        <span class="task-icon" style="color:${level.color}">${level.icon}</span>
        <div class="task-info">
          <div class="task-name">${q.kp}</div>
          <div class="task-meta">${q.subjectName} · ${q.lastDays < 1 ? '今天' : Math.round(q.lastDays) + '天前'} · 约${cost}分</div>
        </div>
      </div>
      <div class="task-right">
        <span class="task-temp" style="color:${level.color}">${Math.round(q.temp)}°</span>
        <button class="task-review-btn" data-kp="${q.kp}" data-subject="${q.subjectName}" data-skill="${q.skillId}">复习</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="section-card tasks-card">
    <div class="section-header">📋 待复习 <span class="section-badge">${queue.length}</span></div>
    <div class="task-list">${items}</div>
  </div>`;
}

// 5. 未完成录入提醒
function renderPendingReminder() {
  const records = getRecords();
  const now = Date.now();
  const pending = records.filter(r => {
    if (r.source !== 'pomodoro') return false;
    if (r.score > 0) return false;
    return (now - new Date(r.timestamp).getTime()) < 86400000;
  });
  if (pending.length === 0) return '';
  const latest = pending[pending.length - 1];
  const mins = Math.round((now - new Date(latest.timestamp).getTime()) / 60000);
  const timeAgo = mins < 60 ? `${mins}分钟前` : `${Math.round(mins / 60)}小时前`;
  return `<div class="section-card pending-reminder">
    <div class="pending-icon">💡</div>
    <div class="pending-text">
      <div class="pending-title">刚完成 ${latest.duration || 25} 分钟${latest.subject || ''}专注，还没记录得分</div>
      <div class="pending-time">${timeAgo}</div>
    </div>
    <button class="pending-btn" id="pending-record">快速记录</button>
  </div>`;
}

// 6. 本周变化（直接展示，不折叠）
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
  return `<div class="section-card weekly-section">
    <div class="section-header">📊 本周变化</div>
    <div class="weekly-grid">${cards}</div>
  </div>`;
}

// 7. 当前规划 + 特长弱项 + 雷达图（合并折叠）
function renderInsights(records, talents) {
  const plan = detectActivePlan(records);
  const strengths = talents.filter(t => t.type === 'strength');
  const weaknesses = talents.filter(t => t.type === 'weakness');

  let content = '';

  // 当前规划
  if (plan) {
    content += `<div class="insight-block">
      <div class="insight-title">🎯 正在刷：${plan.textbook}</div>
      <div class="insight-meta">最近7天 ${plan.count} 条 · ${plan.sectionsDone} 个章节</div>
    </div>`;
  }

  // 特长 & 弱项
  if (strengths.length > 0 || weaknesses.length > 0) {
    content += `<div class="insight-block">`;
    for (const s of strengths) {
      content += `<div class="tw-item tw-strength"><span class="tw-icon">⭐</span><span class="tw-name">${s.name}</span><span class="tw-val">${s.mastery}%</span></div>`;
    }
    for (const w of weaknesses) {
      content += `<div class="tw-item tw-weakness"><span class="tw-icon">⚠️</span><span class="tw-name">${w.name}</span><span class="tw-val">${w.mastery}%</span></div>`;
    }
    content += `</div>`;
  }

  // 雷达图占位
  content += `<div class="chart-container" id="radar-chart" style="height:240px;margin-top:var(--sp-2)"></div>`;

  if (!content) return '';

  const badge = [plan ? '1' : '', strengths.length + weaknesses.length > 0 ? `${strengths.length + weaknesses.length}科` : ''].filter(Boolean).join(' · ');

  return `<div class="fold-section">
    <div class="fold-header" data-fold="insights">
      <span>📈 学习洞察</span>
      ${badge ? `<span class="fold-badge">${badge}</span>` : ''}
      <span class="fold-arrow">▾</span>
    </div>
    <div class="fold-body" id="fold-insights">
      <div class="fold-content">${content}</div>
    </div>
  </div>`;
}

// 8. 更多入口（紧凑网格）
function renderMoreSection(records) {
  const achievements = Store.get(StorageKeys.ACHIEVEMENTS) || {};
  const unlocked = Object.keys(achievements).filter(k => achievements[k]).length;
  return `<div class="more-grid">
    <a href="#/achievement" class="more-item"><span class="more-icon">🏆</span><span class="more-label">成就</span><span class="more-val">${unlocked}</span></a>
    <a href="#/data/log" class="more-item"><span class="more-icon">📋</span><span class="more-label">日志</span><span class="more-val">${records.length}条</span></a>
    <a href="#/data/reading" class="more-item"><span class="more-icon">📖</span><span class="more-label">阅读</span><span class="more-val">书架</span></a>
    <a href="#/data/skill-tree" class="more-item"><span class="more-icon">🌳</span><span class="more-label">技能树</span><span class="more-val">详情</span></a>
  </div>`;
}

export function render() {
  const profile = getProfile();
  const records = getRecords();
  const tempStates = buildTempStates(records, profile);
  const { subjectAbility, talents } = computeAll();
  const queue = calcShadowQueue(tempStates, subjectAbility);
  const prediction = predictNextAction(records, queue);

  return `<div class="page-enter">
    ${renderGreeting(profile, records)}
    ${renderSmartAction(prediction, queue)}
    ${renderPulseBar(profile, records)}
    ${renderPendingReminder()}
    ${renderTodayTasks(queue)}
    ${renderWeeklyChanges(records)}
    ${renderInsights(records, talents)}
    ${renderMoreSection(records)}
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs);text-align:center">v0.126</p>
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

// 成就解锁动画（弹窗 + 金粒子）
function showUnlockToast(ach) {
  const existing = document.querySelector('.ach-unlock-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'ach-unlock-toast';
  toast.innerHTML = `<div class="ach-unlock-icon">${ach.icon}<div class="ach-particles" id="ach-particles"></div></div>
    <div class="ach-unlock-text"><div class="ach-unlock-label">成就解锁！</div><div class="ach-unlock-name">${ach.name}</div></div>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add('show');
    spawnParticles(document.getElementById('ach-particles'));
  });
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 3000);
}

function spawnParticles(container) {
  if (!container) return;
  const colors = ['#FFD700', '#FFA500', '#FF6347', '#FFDAB9', '#FFF8DC'];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'ach-particle';
    const angle = (Math.PI * 2 / 12) * i;
    const dist = 30 + Math.random() * 40;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    p.style.background = colors[i % colors.length];
    container.appendChild(p);
    p.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(0)`, opacity: 0 }
    ], { duration: 800, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)', fill: 'forwards' });
  }
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
    if (todayEl) countUp(todayEl, todayXP, 600);
    if (streakEl) countUp(streakEl, streakDays, 600);
  }, 200);

  // 成就解锁检测 + 动画
  const profile = getProfile();
  const { newlyUnlocked } = checkAndPersist(records, profile, ACHIEVEMENTS);
  if (newlyUnlocked.length > 0) {
    newlyUnlocked.forEach((ach, i) => {
      setTimeout(() => showUnlockToast(ach), 500 + i * 3500);
    });
  }

  // 折叠面板
  const foldHeaders = document.querySelectorAll('.fold-header');
  const onFoldToggle = (e) => {
    const { fold: foldId } = e.currentTarget.dataset;
    const body = document.getElementById('fold-' + foldId);
    const arrow = e.currentTarget.querySelector('.fold-arrow');
    if (body) body.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
    // 雷达图在 insights 展开时初始化
    if (foldId === 'insights' && body?.classList.contains('open')) initRadarChart();
  };
  foldHeaders.forEach(h => h.addEventListener('click', onFoldToggle));

  // 智能行动按钮 → 根据预测类型执行不同操作
  const smartBtn = document.getElementById('smart-action-btn');
  const smartCard = document.getElementById('smart-action');
  const onSmartAction = () => {
    if (!smartCard) return;
    const kp = smartCard.dataset.kp;
    const subject = smartCard.dataset.subject;
    const skill = smartCard.dataset.skill;
    if (kp) {
      Store.set('lts_review_context', { kp, subject, skill, startTime: Date.now() });
    }
    window.location.hash = '#/pomodoro';
  };
  if (smartBtn) smartBtn.addEventListener('click', onSmartAction);

  // 待复习按钮 → 跳转番茄钟
  const reviewBtns = document.querySelectorAll('.task-review-btn');
  const onReviewClick = (e) => {
    const { kp, subject, skill } = e.currentTarget.dataset;
    Store.set('lts_review_context', { kp, subject, skill, startTime: Date.now() });
    window.location.hash = '#/pomodoro';
  };
  reviewBtns.forEach(b => b.addEventListener('click', onReviewClick));

  // 未完成录入提醒 → 打开数据录入
  const pendingBtn = document.getElementById('pending-record');
  const onPendingClick = async () => {
    const { open } = await import('../components/data-entry.js');
    open();
  };
  if (pendingBtn) pendingBtn.addEventListener('click', onPendingClick);

  // record:added → 刷新页面
  const onRecordAdded = () => window.location.reload();
  EventBus.on('record:added', onRecordAdded);

  // data:ready → 数据从云端加载完成后重新渲染首页（解决 XP=0 问题）
  const onDataReady = () => {
    const container = document.getElementById('page-container');
    if (container) {
      container.innerHTML = render();
      afterRender();
    }
  };
  EventBus.on('data:ready', onDataReady);

  return () => {
    foldHeaders.forEach(h => h.removeEventListener('click', onFoldToggle));
    if (smartBtn) smartBtn.removeEventListener('click', onSmartAction);
    reviewBtns.forEach(b => b.removeEventListener('click', onReviewClick));
    if (pendingBtn) pendingBtn.removeEventListener('click', onPendingClick);
    EventBus.off('record:added', onRecordAdded);
    EventBus.off('data:ready', onDataReady);
    chartInstances.forEach(c => disposeChart(c));
    chartInstances = [];
  };
}
