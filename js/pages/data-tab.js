// data-tab.js — 数据Tab：概览摘要 + 图表/成就/热力图/进度
// 读取: STUDY_RECORDS, USER_PROFILE
// 写入: 无（纯展示页）
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

// 可折叠区块通用模板
// id: 用于折叠 body 的 DOM id（fold-{id}）
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

// 概览摘要卡片：总时长/总XP/覆盖学科/本周XP
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

// 最近 3 个已解锁成就 + 全部成就链接
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

// 考试反思卡片：筛选 textbook 含"反思/考试"的记录
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

// 学习日历热力图（最近169天）
function renderHeatmapSection(records) {
  return fold('heatmap', '📅 学习日历 · 最近169天', renderHeatmap(records));
}

// 教材进度：按教材名前4字匹配记录，计算覆盖率%
// 坑: 匹配用 slice(0,4)，教材名太短会误匹配
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

// 网课进度：筛选 textbook 含"网课/课程/课"的记录
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

// §12.2 月度学习报告：本月XP/时长/活跃天数/日均XP/最活跃学科
function renderMonthlyReport(records) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthRecs = records.filter(r => r.timestamp && new Date(r.timestamp).getTime() >= monthStart);
  if (monthRecs.length === 0) return '';

  const totalXP = monthRecs.reduce((s, r) => s + (r.xp || 0), 0);
  const totalMin = monthRecs.reduce((s, r) => s + (r.duration || 0), 0);
  const activeDays = new Set(monthRecs.map(r => new Date(r.timestamp).toISOString().slice(0, 10))).size;
  const daysInMonth = now.getDate();
  const dailyAvgXP = Math.round(totalXP / Math.max(1, activeDays));

  // 最活跃学科
  const bySubject = {};
  for (const r of monthRecs) {
    const subj = r.subject || '未知';
    bySubject[subj] = (bySubject[subj] || 0) + (r.duration || 0);
  }
  const topSubject = Object.entries(bySubject).sort((a, b) => b[1] - a[1])[0];
  const topSubjectName = topSubject ? (SUBJECTS.find(s => s.id === topSubject[0] || s.name === topSubject[0])?.name || topSubject[0]) : '-';

  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;

  return fold('monthly-report', `📅 ${now.getMonth() + 1}月学习报告`, `
    <div class="monthly-report">
      <div class="monthly-report-grid">
        <div class="monthly-stat"><div class="monthly-stat-value">${totalXP}</div><div class="monthly-stat-label">本月XP</div></div>
        <div class="monthly-stat"><div class="monthly-stat-value">${hours}h${mins}m</div><div class="monthly-stat-label">学习时长</div></div>
        <div class="monthly-stat"><div class="monthly-stat-value">${activeDays}/${daysInMonth}</div><div class="monthly-stat-label">活跃天数</div></div>
        <div class="monthly-stat"><div class="monthly-stat-value">${dailyAvgXP}</div><div class="monthly-stat-label">日均XP</div></div>
      </div>
      <div class="monthly-highlight">最活跃学科: <b>${topSubjectName}</b> (${topSubject ? topSubject[1] : 0}分钟)</div>
    </div>
  `);
}

// 薄弱点识别：平均分<60 / 超7天未学 / 总时长<30分
// severity 2=严重（无记录或极低分），1=一般
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

// 6个图表容器占位，XP趋势带7/30/90天切换
function renderChartsSection() {
  const xpToggle = `<div class="chart-period-toggle">
    <button class="period-btn active" data-days="7">7天</button>
    <button class="period-btn" data-days="30">30天</button>
    <button class="period-btn" data-days="90">90天</button>
  </div>`;
  const charts = [
    ['chart-xp-trend', '📈 XP趋势折线图', xpToggle],
    ['chart-subject-duration', '📊 学科时长柱状图', ''],
    ['chart-efficiency', '⏱️ 学习效率散点图', ''],
    ['chart-timeslot', '🗓️ 时段热力图', ''],
    ['chart-score-trend', '📉 得分率趋势', ''],
    ['chart-io-ratio', '⚖️ 输入输出比例', ''],
  ].map(([id, title, extra]) => `<div class="chart-block">
    <div class="chart-title">${title}</div>
    ${extra}
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
    ${renderMonthlyReport(records)}
    ${renderAchievements(records, profile)}
    ${renderExamReflection(records)}
    ${renderWeakPoints(records)}
    ${renderHeatmapSection(records)}
    ${renderTextbookProgress(records)}
    ${renderCourseProgress(records)}
    ${renderChartsSection()}
  </div>`;
}

// charts 模块级数组，afterRender 清理时统一 dispose
let charts = [];
const disposeAllCharts = () => { charts.forEach(c => disposeChart(c)); charts = []; };

// 当前XP趋势周期，默认30天
let xpTrendDays = 30;

// 异步加载 ECharts 并初始化 6 个图表
async function initCharts(records, xpDays) {
  const period = xpDays || xpTrendDays;
  const chartIds = ['chart-xp-trend', 'chart-subject-duration', 'chart-efficiency', 'chart-timeslot', 'chart-score-trend', 'chart-io-ratio'];
  chartIds.forEach(id => { const el = document.getElementById(id); if (el) showChartLoading(el); });

  const ec = await loadECharts();
  if (!ec) { chartIds.forEach(id => { const el = document.getElementById(id); if (el) hideChartLoading(el); }); return; }

  for (const [id, fn, arg] of [
    ['chart-xp-trend', renderXPTrendChart, period],
    ['chart-subject-duration', renderSubjectDurationChart, undefined],
    ['chart-efficiency', renderEfficiencyChart, undefined],
    ['chart-timeslot', renderTimeSlotChart, undefined],
    ['chart-score-trend', renderScoreTrendChart, undefined],
    ['chart-io-ratio', renderIORatioChart, undefined],
  ]) {
    const el = document.getElementById(id);
    if (!el) continue;
    hideChartLoading(el);
    const chart = initChart(el);
    if (chart) { fn(chart, records, arg); charts.push(chart); }
  }
}

// afterRender: 折叠面板交互 + 热力图点击弹窗 + 图表懒加载
// 返回清理函数，dispose 所有 ECharts 实例
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

  // XP趋势 7/30/90天切换
  const periodBtns = document.querySelectorAll('.period-btn');
  const onPeriodToggle = (e) => {
    const btn = e.currentTarget;
    const days = parseInt(btn.dataset.days, 10);
    periodBtns.forEach(b => b.classList.toggle('active', b === btn));
    xpTrendDays = days;
    // 重绘XP趋势图
    const xpChart = charts[0];
    if (xpChart) renderXPTrendChart(xpChart, records, days);
  };
  periodBtns.forEach(b => b.addEventListener('click', onPeriodToggle));

  // 热力图单元格点击 → 弹出当日学习详情+记录列表
  const heatmapGrid = document.querySelector('.heatmap-grid');
  let heatmapPopup = null;
  const onHeatmapClick = (e) => {
    const cell = e.target.closest('.heatmap-cell');
    if (!cell) return;
    if (heatmapPopup) { heatmapPopup.remove(); heatmapPopup = null; }
    const date = cell.dataset.date;
    const xp = parseInt(cell.dataset.xp, 10) || 0;
    const dayRecords = records.filter(r => r.timestamp && new Date(r.timestamp).toISOString().slice(0, 10) === date);
    const totalMin = dayRecords.reduce((s, r) => s + (r.duration || 0), 0);
    const recordList = dayRecords.slice(0, 5).map(r => {
      const icon = getSubjectIcon(SUBJECTS.find(s => s.name === r.subject || s.id === r.subject)?.id || '');
      return `<div class="heatmap-record">${icon} ${r.subject} · ${r.score || 0}分 · ${r.duration || 0}分 · ${r.xp || 0}XP</div>`;
    }).join('');
    const popup = document.createElement('div');
    popup.className = 'heatmap-popup';
    popup.innerHTML = `<div class="heatmap-popup-title">${date}</div>
      <div class="heatmap-popup-row">${totalMin} 分钟 · ${xp} XP · ${dayRecords.length} 条</div>
      ${recordList}${dayRecords.length > 5 ? `<div class="heatmap-popup-more">还有 ${dayRecords.length - 5} 条...</div>` : ''}`;
    cell.style.position = 'relative';
    cell.appendChild(popup);
    heatmapPopup = popup;
    setTimeout(() => { if (heatmapPopup === popup) { popup.remove(); heatmapPopup = null; } }, 5000);
  };
  if (heatmapGrid) heatmapGrid.addEventListener('click', onHeatmapClick);

  return () => {
    foldHeaders.forEach(h => h.removeEventListener('click', onFoldClick));
    if (heatmapGrid) heatmapGrid.removeEventListener('click', onHeatmapClick);
    periodBtns.forEach(b => b.removeEventListener('click', onPeriodToggle));
    disposeAllCharts();
  };
}
