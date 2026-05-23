// review.js — 复习中心：遗忘曲线 + 阴影队列 + 智能推荐
// 读取: STUDY_RECORDS, USER_PROFILE → buildTempStates 计算温度状态
// 写入: lts_review_context（复习按钮点击时写入，番茄钟读取）
// v0.68: 引入 subjectAbility 用于阴影队列优先级计算
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import { buildTempStates, calcShadowQueue, knapsackRecommend, calcImprovementPotential, detectFalseMastery, calcForgettingCurvePoints, getTempLevel } from '../utils/review-calc.js';
import { computeAll } from '../utils/skill-tree-calc.js';
import { loadECharts, initChart, disposeChart } from '../utils/charts.js';

const getRecords = () => Store.get(StorageKeys.STUDY_RECORDS) || [];
const getProfile = () => Store.get(StorageKeys.USER_PROFILE) || {};

// 模块级 ECharts 实例，afterRender 清理时 dispose
let chartInstances = [];

// 可折叠区块通用模板（与 data-tab.js 同结构）
function fold(id, title, content) {
  return `<div class="fold-section">
    <div class="fold-header" data-fold="${id}">
      <span>${title}</span>
      <span class="fold-arrow">▾</span>
    </div>
    <div class="fold-body" id="fold-${id}">
      <div class="fold-content">${content}</div>
    </div>
  </div>`;
}

// 遗忘曲线图表容器（ECharts 在 afterRender 异步初始化）
function renderForgettingCurveSection() {
  return fold('forgetting', '📉 遗忘曲线', '<div class="chart-container" id="forgetting-curve-chart" style="height:250px"></div><p class="chart-note">基于艾宾浩斯遗忘曲线 — 温度降至80%时为最佳复习时机</p>');
}

// 阴影队列：待复习知识点列表（按温度排序，最多显示20个）
// 点击"复习"→ 跳转番茄钟并写入 lts_review_context
function renderShadowQueue(queue) {
  if (queue.length === 0) {
    return fold('shadow-queue', '🌙 待复习知识点', '<p class="empty-hint">暂无待复习知识点，继续保持学习节奏！</p>');
  }
  const items = queue.slice(0, 20).map(q => {
    const level = getTempLevel(q.temp);
    const urgencyClass = q.temp < 20 ? 'urgent-high' : q.temp < 40 ? 'urgent-mid' : '';
    return `<div class="queue-item ${urgencyClass}">
      <div class="queue-item-left">
        <span class="queue-temp-icon">${level.icon}</span>
        <div>
          <div class="queue-kp-name">${q.kp}</div>
          <div class="queue-meta">${q.subjectName} · 上次 ${q.lastDays < 1 ? '今天' : Math.round(q.lastDays) + '天前'}</div>
        </div>
      </div>
      <div class="queue-item-right">
        <span class="queue-temp" style="color:${level.color}">${Math.round(q.temp)}°</span>
        <button class="queue-review-btn" data-kp="${q.kp}" data-subject="${q.subjectName}" data-skill="${q.skillId}">复习</button>
      </div>
    </div>`;
  }).join('');
  return fold('shadow-queue', `🌙 待复习知识点 · ${queue.length}个`, `<div class="queue-list">${items}</div>`);
}

// 智能推荐：背包算法在60分钟预算内选最优知识点组合
// 坑: budget 硬编码60分钟，暂未做用户可配置
function renderRecommendations(queue) {
  const budget = 60; // 60分钟预算
  const recommended = knapsackRecommend(queue, budget);
  if (recommended.length === 0) {
    return fold('recommend', '🎯 智能复习推荐', '<p class="empty-hint">暂无推荐，记录更多学习数据后将为你智能推荐</p>');
  }
  const totalCost = recommended.reduce((s, r) => s + r.cost, 0);
  const items = recommended.map(r => {
    const level = getTempLevel(r.temp);
    return `<div class="rec-review-item">
      <span class="rec-review-icon">${level.icon}</span>
      <div class="rec-review-info">
        <div class="rec-review-name">${r.kp}</div>
        <div class="rec-review-meta">${r.subjectName} · 约${r.cost}分钟</div>
      </div>
      <span class="rec-review-temp" style="color:${level.color}">${Math.round(r.temp)}°</span>
    </div>`;
  }).join('');
  return fold('recommend', `🎯 智能复习推荐 · ${budget}分钟预算`, `<div class="rec-review-list"><div class="rec-review-header">推荐 ${recommended.length} 个知识点，预计 ${totalCost} 分钟</div>${items}</div>`);
}

// 提分潜力诊断：按潜力值排序的技能列表
function renderPotential(potentials) {
  if (potentials.length === 0) return '';
  const items = potentials.map((p, i) => `<div class="potential-item">
    <span class="potential-rank">#${i + 1}</span>
    <div class="potential-info">
      <div class="potential-name">${p.skillName}</div>
      <div class="potential-meta">${p.subjectName} · 掌握度 ${p.mastery}%</div>
    </div>
    <div class="potential-bar-wrap"><div class="potential-bar" style="width:${Math.min(100, p.potential * 10)}%"></div></div>
  </div>`).join('');
  return fold('potential', '📈 提分潜力诊断', `<div class="potential-list">${items}</div>`);
}

// 假性熟练检测：高正确率但温度高的知识点（可能只是短期记忆）
function renderFalseMastery(falseItems) {
  if (falseItems.length === 0) return '';
  const items = falseItems.map(f => `<div class="false-mastery-item">
    <div class="false-mastery-header">⚠️ ${f.kp}</div>
    <div class="false-mastery-detail">${f.subjectName} · 正确率 ${f.highScoreRate}% · 温度 ${Math.round(f.temp)}°</div>
    <div class="false-mastery-reason">${f.reason}</div>
  </div>`).join('');
  return fold('false-mastery', `⚠️ 假性熟练检测 · ${falseItems.length}个`, `<div class="false-mastery-list">${items}</div>`);
}

// 考试推荐：温度<40的知识点按学科分组，建议安排单元测试
function renderExamRecommend(queue) {
  const urgent = queue.filter(q => q.temp < 40);
  if (urgent.length === 0) return '';
  const bySubject = {};
  for (const q of urgent) {
    (bySubject[q.subjectName] ||= []).push(q);
  }
  const items = Object.entries(bySubject).map(([name, kps]) => {
    return `<div class="exam-rec-item">
      <div class="exam-rec-subject">${name}</div>
      <div class="exam-rec-detail">${kps.length}个知识点温度低于40°，建议安排一次单元测试</div>
      <div class="exam-rec-kps">${kps.slice(0, 3).map(k => `<span class="exam-rec-tag">${k.kp}</span>`).join('')}${kps.length > 3 ? `<span class="exam-rec-tag">+${kps.length - 3}</span>` : ''}</div>
    </div>`;
  }).join('');
  return fold('exam-rec', `📋 考试推荐 · ${Object.keys(bySubject).length}科`, `<div class="exam-rec-list">${items}</div>`);
}

export function render() {
  const records = getRecords();
  const profile = getProfile();
  const tempStates = buildTempStates(records, profile);
  const { subjectAbility } = computeAll(); // v0.68: 获取学科评分
  const queue = calcShadowQueue(tempStates, subjectAbility);
  const potentials = calcImprovementPotential(tempStates, records); // v0.69: 传入 records
  const falseItems = detectFalseMastery(tempStates, records);

  return `<div class="page-enter">
    <a href="#/data" class="page-back">← 返回数据</a>
    <div class="review-header">
      <div class="section-title">📝 复习中心</div>
      <div class="review-summary">
        <span class="review-stat">待复习 <b>${queue.length}</b></span>
        <span class="review-stat">紧急 <b>${queue.filter(q => q.temp < 40).length}</b></span>
      </div>
    </div>
    ${renderForgettingCurveSection()}
    ${renderRecommendations(queue)}
    ${renderShadowQueue(queue)}
    ${renderPotential(potentials)}
    ${renderFalseMastery(falseItems)}
    ${renderExamRecommend(queue)}
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.90 · 开发者区</p>
  </div>`;
}

// 异步初始化遗忘曲线图表（半衰期3天，80%阈值线）
async function initForgettingCurveChart() {
  const ec = await loadECharts();
  if (!ec) return;
  const el = document.getElementById('forgetting-curve-chart');
  if (!el) return;
  const chart = initChart(el);
  if (!chart) return;
  chartInstances.push(chart);

  // 默认半衰期3天的遗忘曲线
  const points = calcForgettingCurvePoints(3, 80);
  const days = points.map(p => p.day);
  const retentions = points.map(p => p.retention);

  chart.setOption({
    tooltip: { trigger: 'axis', formatter: (params) => `第 ${params[0].axisValue} 天<br/>保留率: ${params[0].value}%` },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: days, name: '天数', axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', min: 0, max: 100, name: '保留率%', axisLabel: { fontSize: 11 } },
    series: [
      {
        type: 'line', data: retentions, smooth: true,
        lineStyle: { color: '#62A0EA', width: 2 },
        areaStyle: { color: 'rgba(98,160,234,0.1)' },
        markLine: {
          data: [{ yAxis: 80, name: '复习阈值' }],
          lineStyle: { color: '#FF8C00', type: 'dashed' },
          label: { formatter: '80% 阈值', fontSize: 11 },
        },
      },
    ],
  });
}

// afterRender: 遗忘曲线初始化 + 折叠面板 + 复习按钮跳转番茄钟
// 坑: 复习按钮写 localStorage 供番茄钟读取（非 EventBus）
export function afterRender() {
  initForgettingCurveChart();

  // 折叠面板交互
  const foldHeaders = document.querySelectorAll('.fold-header');
  const onFoldClick = (e) => {
    const { fold: foldId } = e.currentTarget.dataset;
    const body = document.getElementById(`fold-${foldId}`);
    const arrow = e.currentTarget.querySelector('.fold-arrow');
    if (body) body.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
  };
  foldHeaders.forEach(h => h.addEventListener('click', onFoldClick));

  // REV-06: 开始复习流程 — 跳转番茄钟并预填上下文
  const reviewBtns = document.querySelectorAll('.queue-review-btn');
  const onReviewClick = (e) => {
    const { kp, subject, skill } = e.currentTarget.dataset;
    // 存储复习上下文到 localStorage，番茄钟页面读取
    Store.set('lts_review_context', { kp, subject, skill, startTime: Date.now() });
    window.location.hash = '#/pomodoro';
  };
  reviewBtns.forEach(b => b.addEventListener('click', onReviewClick));

  return () => {
    foldHeaders.forEach(h => h.removeEventListener('click', onFoldClick));
    reviewBtns.forEach(b => b.removeEventListener('click', onReviewClick));
    chartInstances.forEach(c => disposeChart(c));
    chartInstances = [];
  };
}
