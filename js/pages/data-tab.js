// data-tab.js — 数据Tab：概览摘要 + 图表/成就/热力图/进度
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { SUBJECTS_DATA } from '../data/subjects.js';
import { checkAchievement } from '../utils/achievements-check.js';
import { getSubjectIcon, formatNumber } from '../utils/level.js';
import { renderHeatmap } from '../utils/heatmap.js';
import {
  loadECharts, initChart, showChartLoading, hideChartLoading,
  renderXPTrendChart, renderSubjectDurationChart,
  renderEfficiencyChart, renderTimeSlotChart,
  renderScoreTrendChart, renderIORatioChart, disposeChart
} from '../utils/charts.js';

const getRecords = () => Store.get(StorageKeys.STUDY_RECORDS) || [];
const getProfile = () => Store.get(StorageKeys.USER_PROFILE) || {};

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

function renderSummary(profile, records) {
  const totalMin = records.reduce((s, r) => s + (r.duration || 0), 0);
  const totalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
  const subjects = new Set(records.map(r => r.subject)).size;
  const weekXP = records.filter(r => r.timestamp && (Date.now() - new Date(r.timestamp).getTime()) < 7 * 86400000)
    .reduce((s, r) => s + (r.xp || 0), 0);
  return `<div class="data-summary">
    <div class="summary-item"><div class="summary-value">${formatNumber(totalMin)}</div><div class="summary-label">总时长(分)</div></div>
    <div class="summary-item"><div class="summary-value">${formatNumber(totalXP)}</div><div class="summary-label">总XP</div></div>
    <div class="summary-item"><div class="summary-value">${subjects}/9</div><div class="summary-label">覆盖学科</div></div>
    <div class="summary-item"><div class="summary-value">${weekXP}</div><div class="summary-label">本周XP</div></div>
  </div>`;
}

function renderAchievements(records, profile) {
  const unlocked = ACHIEVEMENTS.filter(a => checkAchievement(a, records, profile));
  const recent = unlocked.slice(-3).reverse();
  if (recent.length === 0) {
    return fold('achievements', '🏆 成就', '<p style="color:var(--color-text-3);font-size:var(--fs-sm)">记录学习数据来解锁成就</p><a href="#/achievement" class="ach-view-all">查看全部成就 →</a>');
  }
  const badges = recent.map(a => `<div class="achievement-badge ${a.rarity}">
    <div class="achievement-icon">${a.icon}</div>
    <div class="achievement-info"><div class="achievement-name">${a.name}</div><div class="achievement-desc">${a.description}</div></div>
  </div>`).join('');
  return fold('achievements', `🏆 成就 · ${unlocked.length}/${ACHIEVEMENTS.length}`, `<div class="achievement-list">${badges}</div><a href="#/achievement" class="ach-view-all">查看全部成就 →</a>`);
}

function renderExamReflection(records) {
  const reflections = records.filter(r => r.textbook && (r.textbook.includes('反思') || r.textbook.includes('考试'))).slice(-5).reverse();
  if (reflections.length === 0) return '';
  const cards = reflections.map(r => {
    const date = r.timestamp ? new Date(r.timestamp).toLocaleDateString('zh-CN') : '';
    return `<div class="reflection-card">
      <div class="reflection-header"><span class="reflection-subject">${r.subject}</span><span class="reflection-date">${date}</span></div>
      <div class="reflection-body"><div class="reflection-score">${r.score > 0 ? r.score + '分' : '--'}</div><div class="reflection-text">${r.textbook}</div></div>
    </div>`;
  }).join('');
  return fold('reflections', '📝 考试反思', `<div class="reflection-list">${cards}</div>`);
}

function renderHeatmapSection(records) {
  return fold('heatmap', '📅 学习日历 · 最近169天', renderHeatmap(records));
}

function renderTextbookProgress(records) {
  const progress = [];
  for (const [sid, data] of Object.entries(SUBJECTS_DATA)) {
    if (!data.textbooks) continue;
    for (const tb of data.textbooks) {
      const totalKP = tb.chapters.reduce((s, ch) => s + ch.sections.reduce((s2, sec) => s2 + (sec.knowledgePoints?.length || 0), 0), 0);
      const covered = records.filter(r => r.textbook && r.textbook.includes(tb.name.slice(0, 4))).length;
      const pct = totalKP > 0 ? Math.min(100, Math.round((covered / totalKP) * 100)) : 0;
      progress.push({ subject: data.name, name: tb.name, pct, sid });
    }
  }
  if (progress.length === 0) return '';
  const items = progress.map(p => `<div class="progress-map-item">
    <div class="progress-map-header"><span class="progress-map-subject">${getSubjectIcon(p.sid)} ${p.subject}</span><span class="progress-map-pct">${p.pct}%</span></div>
    <div class="progress-map-name">${p.name}</div>
    <div class="progress-bar"><div class="progress-fill" style="width:${p.pct}%"></div></div>
  </div>`).join('');
  return fold('textbooks', '📚 教材进度', `<div class="progress-map-list">${items}</div>`);
}

function renderCourseProgress(records) {
  const courses = records.filter(r => r.textbook && (r.textbook.includes('网课') || r.textbook.includes('课程') || r.textbook.includes('课')));
  if (courses.length === 0) return '';
  const bySubject = {};
  for (const r of courses) (bySubject[r.subject] ||= []).push(r);
  const items = Object.entries(bySubject).map(([subj, recs]) => {
    const totalMin = recs.reduce((s, r) => s + (r.duration || 0), 0);
    const sid = SUBJECTS.find(s => s.name === subj)?.id || '';
    return `<div class="course-item"><span class="course-icon">${getSubjectIcon(sid)}</span><span class="course-name">${subj}</span><span class="course-time">${recs.length}节 · ${totalMin}分钟</span></div>`;
  }).join('');
  return fold('courses', '🎓 网课进度', `<div class="course-list">${items}</div>`);
}

function renderWeakPoints(records) {
  if (records.length === 0) return '';
  const now = Date.now();
  const subjectStats = {};
  for (const s of SUBJECTS) {
    const recs = records.filter(r => r.subject === s.id || r.subject === s.name);
    const totalMin = recs.reduce((sum, r) => sum + (r.duration || 0), 0);
    const avgScore = recs.length > 0 ? recs.reduce((a, r) => a + (r.score || 0), 0) / recs.length : 0;
    const lastTimestamp = recs.filter(r => r.timestamp).map(r => new Date(r.timestamp).getTime()).sort((a, b) => b - a)[0] || 0;
    const daysSince = lastTimestamp > 0 ? Math.floor((now - lastTimestamp) / 86400000) : 999;
    subjectStats[s.id] = { name: s.name, count: recs.length, totalMin, avgScore, daysSince };
  }

  const weakPoints = [];
  for (const [id, st] of Object.entries(subjectStats)) {
    const reasons = [];
    if (st.count === 0) reasons.push('无学习记录');
    else {
      if (st.avgScore < 60) reasons.push(`平均分仅 ${Math.round(st.avgScore)}`);
      if (st.daysSince >= 7) reasons.push(`已 ${st.daysSince} 天未学习`);
      if (st.totalMin < 30 && st.count > 0) reasons.push(`总时长仅 ${st.totalMin} 分钟`);
    }
    if (reasons.length > 0) weakPoints.push({ id, name: st.name, reasons, severity: st.count === 0 ? 2 : st.avgScore < 40 ? 2 : 1 });
  }

  weakPoints.sort((a, b) => b.severity - a.severity);
  if (weakPoints.length === 0) {
    return fold('weakpoints', '🔍 薄弱点识别', '<p style="color:var(--color-success);font-size:var(--fs-sm)">各科状态良好，继续保持！</p>');
  }

  const items = weakPoints.map(wp => {
    const icon = getSubjectIcon(wp.id);
    const borderColor = wp.severity >= 2 ? 'var(--color-error)' : 'var(--color-warning)';
    return `<div class="weakpoint-item" style="border-left:3px solid ${borderColor}">
      <div class="weakpoint-header">${icon} <span class="weakpoint-name">${wp.name}</span></div>
      <div class="weakpoint-reasons">${wp.reasons.map(r => `<span class="weakpoint-tag">${r}</span>`).join('')}</div>
    </div>`;
  }).join('');
  return fold('weakpoints', `🔍 薄弱点识别 · ${weakPoints.length}科待加强`, `<div class="weakpoint-list">${items}</div>`);
}

function renderChartsSection() {
  const charts = [
    ['chart-xp-trend', '📈 XP趋势折线图'],
    ['chart-subject-duration', '📊 学科时长柱状图'],
    ['chart-efficiency', '⏱️ 学习效率散点图'],
    ['chart-timeslot', '🗓️ 时段热力图'],
    ['chart-score-trend', '📉 得分率趋势'],
    ['chart-io-ratio', '⚖️ 输入输出比例'],
  ].map(([id, title]) => `<div class="chart-block">
    <div class="chart-title">${title}</div>
    <div class="chart-container" id="${id}"></div>
  </div>`).join('');
  return fold('charts', '📈 数据图表', charts);
}

export function render() {
  const profile = getProfile();
  const records = getRecords();
  return `<div class="page-enter">
    <div class="data-page-header">📊 数据</div>
    ${renderSummary(profile, records)}
    <a href="#/data/skill-tree" class="nav-link-card">🌳 技能树 — 查看学科能力图谱 →</a>
    <a href="#/data/review" class="nav-link-card">📝 复习中心 — 遗忘曲线与智能推荐 →</a>
    <a href="#/data/log" class="nav-link-card">📋 学习日志 — 记录查看与管理 →</a>
    <a href="#/data/reading" class="nav-link-card">📖 阅读记录 — 书架与阅读统计 →</a>
    <a href="#/search" class="nav-link-card">🔍 全局搜索 — 搜索知识点/记录/功能 →</a>
    <a href="#/data/export" class="nav-link-card">📦 数据管理 — 导入导出备份 →</a>
    ${renderAchievements(records, profile)}
    ${renderExamReflection(records)}
    ${renderWeakPoints(records)}
    ${renderHeatmapSection(records)}
    ${renderTextbookProgress(records)}
    ${renderCourseProgress(records)}
    ${renderChartsSection()}
  </div>`;
}

let charts = [];
const disposeAllCharts = () => { charts.forEach(c => disposeChart(c)); charts = []; };

async function initCharts(records) {
  const chartIds = ['chart-xp-trend', 'chart-subject-duration', 'chart-efficiency', 'chart-timeslot', 'chart-score-trend', 'chart-io-ratio'];
  // Show loading on all chart containers
  chartIds.forEach(id => { const el = document.getElementById(id); if (el) showChartLoading(el); });

  const ec = await loadECharts();
  if (!ec) { chartIds.forEach(id => { const el = document.getElementById(id); if (el) hideChartLoading(el); }); return; }

  for (const [id, fn] of [
    ['chart-xp-trend', renderXPTrendChart],
    ['chart-subject-duration', renderSubjectDurationChart],
    ['chart-efficiency', renderEfficiencyChart],
    ['chart-timeslot', renderTimeSlotChart],
    ['chart-score-trend', renderScoreTrendChart],
    ['chart-io-ratio', renderIORatioChart],
  ]) {
    const el = document.getElementById(id);
    if (!el) continue;
    hideChartLoading(el);
    const chart = initChart(el);
    if (chart) { fn(chart, records); charts.push(chart); }
  }
}

export function afterRender() {
  const records = getRecords();
  const foldHeaders = document.querySelectorAll('.fold-header');
  const onFoldClick = (e) => {
    const { fold: foldId } = e.currentTarget.dataset;
    const body = document.getElementById(`fold-${foldId}`);
    const arrow = e.currentTarget.querySelector('.fold-arrow');
    if (body) body.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
    if (foldId === 'charts' && body?.classList.contains('open') && charts.length === 0) initCharts(records);
  };
  foldHeaders.forEach(h => h.addEventListener('click', onFoldClick));

  // Heatmap cell click → show day detail
  const heatmapGrid = document.querySelector('.heatmap-grid');
  let heatmapPopup = null;
  const onHeatmapClick = (e) => {
    const cell = e.target.closest('.heatmap-cell');
    if (!cell) return;
    if (heatmapPopup) { heatmapPopup.remove(); heatmapPopup = null; }
    const date = cell.dataset.date;
    const minutes = parseInt(cell.dataset.minutes, 10) || 0;
    const dayRecords = records.filter(r => r.timestamp && new Date(r.timestamp).toISOString().slice(0, 10) === date);
    const subjects = [...new Set(dayRecords.map(r => r.subject))].join('、') || '无';
    const popup = document.createElement('div');
    popup.className = 'heatmap-popup';
    popup.innerHTML = `<div class="heatmap-popup-title">${date}</div>
      <div class="heatmap-popup-row">学习 ${minutes} 分钟</div>
      <div class="heatmap-popup-row">${dayRecords.length} 条记录</div>
      <div class="heatmap-popup-row">学科：${subjects}</div>`;
    cell.style.position = 'relative';
    cell.appendChild(popup);
    heatmapPopup = popup;
    setTimeout(() => { if (heatmapPopup === popup) { popup.remove(); heatmapPopup = null; } }, 3000);
  };
  if (heatmapGrid) heatmapGrid.addEventListener('click', onHeatmapClick);

  return () => {
    foldHeaders.forEach(h => h.removeEventListener('click', onFoldClick));
    if (heatmapGrid) heatmapGrid.removeEventListener('click', onHeatmapClick);
    disposeAllCharts();
  };
}
