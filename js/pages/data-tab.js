// data-tab.js — 数据Tab：渐进式披露（§12.6）
// 3个Tab分组（概览/进度/图表）+ 3×2图标导航网格 + 横滑摘要 + 折叠区块
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { SUBJECTS_DATA } from '../data/subjects.js';
import { ONLINE_COURSES, STUDY_AIDS } from '../data/textbooks.js';
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
const getReadings = () => Store.get(StorageKeys.READING_RECORDS) || [];
const getProfile = () => Store.get(StorageKeys.USER_PROFILE) || {};

// 折叠区块通用模板
// open: 默认是否展开
// badge: 折叠头右侧摘要数字
function fold(id, title, content, { open = false, badge = '' } = {}) {
  const badgeHtml = badge ? `<span class="fold-badge">${badge}</span>` : '';
  return `<div class="fold-section">
    <div class="fold-header${open ? ' open' : ''}" data-fold="${id}">
      <span class="fold-title">${title}</span>
      ${badgeHtml}
      <span class="fold-arrow${open ? ' open' : ''}">▾</span>
    </div>
    <div class="fold-body${open ? ' open' : ''}" id="fold-${id}">
      <div class="fold-content">${content}</div>
    </div>
  </div>`;
}

// 摘要卡片（移动端横滑，桌面端4列网格）
function renderSummary(profile, records) {
  const readings = getReadings();
  const studyMin = records.reduce((s, r) => s + (r.duration || 0), 0);
  const readingMin = readings.reduce((s, r) => s + (r.durationMinutes || 0), 0);
  const totalMin = studyMin + readingMin;
  const totalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
  const subjects = new Set(records.map(r => r.subject)).size;
  const weekXP = records.filter(r => r.timestamp && (Date.now() - new Date(r.timestamp).getTime()) < 7 * 86400000)
    .reduce((s, r) => s + (r.xp || 0), 0);
  const totalHours = (totalMin / 60).toFixed(1);
  return `<div class="summary-scroll">
    <div class="data-summary">
      <div class="summary-item"><div class="summary-value">${totalHours}h</div><div class="summary-label">总学习时长</div></div>
      <div class="summary-item"><div class="summary-value">${formatNumber(studyMin)}</div><div class="summary-label">学科(分)</div></div>
      <div class="summary-item"><div class="summary-value">${formatNumber(readingMin)}</div><div class="summary-label">阅读(分)</div></div>
      <div class="summary-item"><div class="summary-value">${formatNumber(totalXP)}</div><div class="summary-label">总XP</div></div>
      <div class="summary-item"><div class="summary-value">${subjects}/9</div><div class="summary-label">覆盖学科</div></div>
      <div class="summary-item"><div class="summary-value">${weekXP}</div><div class="summary-label">本周XP</div></div>
    </div>
  </div>`;
}

// 3×2 图标导航网格
function renderNavGrid() {
  const items = [
    ['🌳', '技能树', '#/data/skill-tree'],
    ['📝', '复习中心', '#/data/review'],
    ['📋', '学习日志', '#/data/log'],
    ['📖', '阅读记录', '#/data/reading'],
    ['✍️', '背诵默写', '#/data/recitation'],
    ['📊', '成绩趋势', '#/data/score-trend'],
    ['📦', '数据管理', '#/data/export'],
  ];
  return `<div class="nav-grid">${items.map(([icon, label, href]) =>
    `<a href="${href}" class="nav-grid-item"><span class="nav-grid-icon">${icon}</span><span class="nav-grid-label">${label}</span><span class="nav-grid-arrow">›</span></a>`
  ).join('')}</div>`;
}

// Tab栏
function renderTabBar() {
  return `<div class="data-tab-bar" id="data-tab-bar">
    <button class="data-tab active" data-tab="overview">📊 概览</button>
    <button class="data-tab" data-tab="progress">📈 进度</button>
    <button class="data-tab" data-tab="charts">📉 图表</button>
  </div>`;
}

// === 概览Tab内容 ===

function renderMonthlyReport(records) {
  const readings = getReadings();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthRecs = records.filter(r => r.timestamp && new Date(r.timestamp).getTime() >= monthStart);
  const monthReads = readings.filter(r => r.timestamp && new Date(r.timestamp).getTime() >= monthStart);
  if (monthRecs.length === 0 && monthReads.length === 0) return '';

  const totalXP = monthRecs.reduce((s, r) => s + (r.xp || 0), 0);
  const studyMin = monthRecs.reduce((s, r) => s + (r.duration || 0), 0);
  const readingMin = monthReads.reduce((s, r) => s + (r.durationMinutes || 0), 0);
  const totalMin = studyMin + readingMin;
  const allTimestamps = [
    ...monthRecs.filter(r => r.timestamp).map(r => new Date(r.timestamp).toISOString().slice(0, 10)),
    ...monthReads.filter(r => r.timestamp).map(r => new Date(r.timestamp).toISOString().slice(0, 10)),
  ];
  const activeDays = new Set(allTimestamps).size;
  const daysInMonth = now.getDate();
  const dailyAvgXP = Math.round(totalXP / Math.max(1, activeDays));

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
      <div class="monthly-highlight">最活跃学科: <b>${topSubjectName}</b> (${topSubject ? topSubject[1] : 0}分钟) · 阅读: ${readingMin}分钟</div>
    </div>
  `, { open: true });
}

function renderAchievements(records, profile) {
  const unlocked = ACHIEVEMENTS.filter(a => checkAchievement(a, records, profile));
  const recent = unlocked.slice(-3).reverse();
  if (recent.length === 0) {
    return fold('achievements', '🏆 成就', '<p style="color:var(--color-text-3);font-size:var(--fs-sm)">记录学习数据来解锁成就</p><a href="#/achievement" class="ach-view-all">查看全部成就 →</a>', { open: true, badge: `0/${ACHIEVEMENTS.length}` });
  }
  const badges = recent.map(a => `<div class="achievement-badge ${a.rarity}">
    <div class="achievement-icon">${a.icon}</div>
    <div class="achievement-info"><div class="achievement-name">${a.name}</div><div class="achievement-desc">${a.description}</div></div>
  </div>`).join('');
  return fold('achievements', `🏆 成就`, `<div class="achievement-list">${badges}</div><a href="#/achievement" class="ach-view-all">查看全部成就 →</a>`, { open: true, badge: `${unlocked.length}/${ACHIEVEMENTS.length}` });
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
    return fold('weakpoints', '🔍 薄弱点识别', '<p style="color:var(--color-success);font-size:var(--fs-sm)">各科状态良好，继续保持！</p>', { open: true, badge: '0' });
  }

  const items = weakPoints.map(wp => {
    const icon = getSubjectIcon(wp.id);
    const borderColor = wp.severity >= 2 ? 'var(--color-error)' : 'var(--color-warning)';
    return `<div class="weakpoint-item" style="border-left:3px solid ${borderColor}">
      <div class="weakpoint-header">${icon} <span class="weakpoint-name">${wp.name}</span></div>
      <div class="weakpoint-reasons">${wp.reasons.map(r => `<span class="weakpoint-tag">${r}</span>`).join('')}</div>
    </div>`;
  }).join('');
  return fold('weakpoints', `🔍 薄弱点识别`, `<div class="weakpoint-list">${items}</div>`, { open: true, badge: `${weakPoints.length}科` });
}

// === 进度Tab内容 ===

function renderHeatmapSection(records) {
  const readings = getReadings();
  const allDates = new Set([
    ...records.filter(r => r.timestamp).map(r => new Date(r.timestamp).toISOString().slice(0, 10)),
    ...readings.filter(r => r.timestamp).map(r => new Date(r.timestamp).toISOString().slice(0, 10)),
  ]);
  return fold('heatmap', '📅 学习日历', renderHeatmap(records, readings), { open: true, badge: `${allDates.size}天` });
}

function renderTextbookProgress(records) {
  const progress = [];
  for (const [sid, data] of Object.entries(SUBJECTS_DATA)) {
    if (!data.textbooks) continue;
    for (const tb of data.textbooks) {
      const totalKP = tb.chapters.reduce((s, ch) => s + ch.sections.reduce((s2, sec) => s2 + (sec.knowledgePoints?.length || 0), 0), 0);
      // 匹配方式：学科 + 教材名前缀
      const matchCount = records.filter(r => {
        const subjOk = r.subject === sid || r.subject === data.name;
        return subjOk && r.textbook && r.textbook.includes(tb.name.slice(0, 4));
      }).length;
      if (matchCount === 0) continue; // 无记录的教材不显示
      const pct = totalKP > 0 ? Math.min(100, Math.round((matchCount / totalKP) * 100)) : 0;
      progress.push({ subject: data.name, name: tb.name, pct, sid, count: matchCount });
    }
  }
  if (progress.length === 0) return fold('textbooks', '📚 教材进度', '<p style="color:var(--color-text-3);font-size:var(--fs-sm)">暂无教材学习记录</p>', { badge: '0' });
  progress.sort((a, b) => b.pct - a.pct);
  const items = progress.map(p => `<div class="progress-map-item">
    <div class="progress-map-header"><span class="progress-map-subject">${getSubjectIcon(p.sid)} ${p.subject}</span><span class="progress-map-pct">${p.pct}%</span></div>
    <div class="progress-map-name">${p.name} · ${p.count}次记录</div>
    <div class="progress-bar"><div class="progress-fill" style="width:${p.pct}%"></div></div>
  </div>`).join('');
  return fold('textbooks', '📚 教材进度', `<div class="progress-map-list">${items}</div>`, { badge: `${progress.length}本` });
}

// 匹配网课记录：学科 + (课程名 或 教师名) 精确匹配
function matchCourseRecord(r, course) {
  if (!r.textbook) return false;
  const tb = r.textbook;
  const subjMatch = r.subject === course.subject ||
    SUBJECTS.some(s => s.id === course.subject && s.name === r.subject);
  if (!subjMatch) return false;
  return tb.includes(course.name) || tb.includes(course.teacher);
}

function renderCourseProgress(records) {
  if (ONLINE_COURSES.length === 0) return '';
  const items = [];
  for (const course of ONLINE_COURSES) {
    const matched = records.filter(r => matchCourseRecord(r, course));
    if (matched.length === 0) continue;
    const totalMin = matched.reduce((s, r) => s + (r.duration || 0), 0);
    const sid = course.subject;
    const totalModules = course.modules ? course.modules.length : 0;
    const coveredModules = totalModules > 0 && course.modules
      ? course.modules.filter(m => matched.some(r => r.textbook && r.textbook.includes(m.slice(0, 2)))).length
      : 0;
    const moduleInfo = totalModules > 0 ? ` · ${coveredModules}/${totalModules}模块` : '';
    items.push(`<div class="course-item">
      <span class="course-icon">${getSubjectIcon(sid)}</span>
      <div class="course-info">
        <span class="course-name">${course.name}</span>
        <span class="course-teacher">${course.teacher}</span>
      </div>
      <span class="course-time">${matched.length}节 · ${totalMin}分钟${moduleInfo}</span>
    </div>`);
  }
  if (items.length === 0) return '';
  return fold('courses', '🎓 网课进度', `<div class="course-list">${items.join('')}</div>`, { badge: `${items.length}门课` });
}

// 匹配教辅记录 — 精确匹配：学科 + 教材名 + 版本（同名教辅用版本区分）
function matchStudyAidRecord(r, aid) {
  if (!r.textbook) return false;
  const tb = r.textbook;
  const subjMatch = r.subject === aid.subject ||
    SUBJECTS.some(s => s.id === aid.subject && s.name === r.subject);
  if (!subjMatch) return false;
  // 教材名匹配（去掉中间点·兼容 "53" vs "5·3"）
  const aidName = aid.name.replace(/·/g, '');
  const tbNorm = tb.replace(/·/g, '');
  if (!tbNorm.includes(aidName)) return false;
  // 同名教辅（如多本"解题觉醒"）用版本字段区分
  const sameNameCount = STUDY_AIDS.filter(a => a.name === aid.name).length;
  if (sameNameCount > 1 && aid.version) {
    return tb.includes(aid.version);
  }
  return true;
}

function renderStudyAidProgress(records) {
  if (STUDY_AIDS.length === 0) return '';
  const items = [];
  for (const aid of STUDY_AIDS) {
    const matched = records.filter(r => matchStudyAidRecord(r, aid));
    const sid = aid.subject;
    const totalMin = matched.reduce((s, r) => s + (r.duration || 0), 0);
    const totalSections = aid.chapters
      ? aid.chapters.reduce((s, ch) => s + (ch.sections || []).length, 0)
      : 0;
    // 用匹配记录数估算覆盖章节（每条记录≈1节）
    const coveredEst = Math.min(totalSections, matched.length);
    const pct = totalSections > 0 && matched.length > 0
      ? Math.min(100, Math.round((coveredEst / totalSections) * 100))
      : 0;
    const versionTag = aid.version ? ` (${aid.version})` : '';
    const detail = matched.length > 0
      ? `${matched.length}次 · ${totalMin}分钟 · ≈${coveredEst}/${totalSections}节`
      : '暂无记录';
    items.push(`<div class="study-aid-item">
      <div class="study-aid-header">
        <span class="study-aid-icon">${getSubjectIcon(sid)}</span>
        <span class="study-aid-name">${aid.name}${versionTag}</span>
        <span class="study-aid-pct">${pct}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="study-aid-detail">${detail}</div>
    </div>`);
  }
  const withRecords = items.length > 0 ? STUDY_AIDS.filter(a => records.some(r => matchStudyAidRecord(r, a))).length : 0;
  return fold('study-aids', '📖 教辅进度', `<div class="study-aid-list">${items.join('')}</div>`, { badge: `${withRecords}/${STUDY_AIDS.length}` });
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
  return fold('reflections', '📝 考试反思', `<div class="reflection-list">${cards}</div>`, { badge: `${reflections.length}条` });
}

// === 图表Tab内容 ===

function renderChartsSection() {
  const xpToggle = `<div class="chart-period-toggle">
    <button class="period-btn active" data-days="7">7天</button>
    <button class="period-btn" data-days="30">30天</button>
    <button class="period-btn" data-days="90">90天</button>
  </div>`;
  const chartItems = [
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
  return fold('charts', '📈 数据图表', chartItems, { badge: '6个' });
}

// === 概览Tab：进度速览 ===
function renderProgressOverview(records) {
  // 教材：有记录的教材数
  const tbWithRecords = new Set();
  for (const [sid, data] of Object.entries(SUBJECTS_DATA)) {
    if (!data.textbooks) continue;
    for (const tb of data.textbooks) {
      const has = records.some(r => (r.subject === sid || r.subject === data.name) && r.textbook && r.textbook.includes(tb.name.slice(0, 4)));
      if (has) tbWithRecords.add(tb.name);
    }
  }
  // 网课：有记录的课程数
  const courseWithRecords = ONLINE_COURSES.filter(c => records.some(r => matchCourseRecord(r, c))).length;
  // 教辅：有记录的教辅数
  const aidWithRecords = STUDY_AIDS.filter(a => records.some(r => matchStudyAidRecord(r, a))).length;

  const total = tbWithRecords.size + courseWithRecords + aidWithRecords;
  if (total === 0) return '';

  const items = [];
  if (tbWithRecords.size > 0) items.push(`📚 教材 ${tbWithRecords.size}本`);
  if (courseWithRecords > 0) items.push(`🎓 网课 ${courseWithRecords}门`);
  if (aidWithRecords > 0) items.push(`📖 教辅 ${aidWithRecords}本`);

  return `<div class="progress-overview">
    <div class="progress-overview-title">学习进度速览</div>
    <div class="progress-overview-items">${items.map(t => `<span class="progress-overview-tag">${t}</span>`).join('')}</div>
    <a href="#" class="progress-overview-link" onclick="document.querySelector('[data-tab=progress]').click();return false;">查看详情 →</a>
  </div>`;
}

// === 主渲染 ===

export function render() {
  const profile = getProfile();
  const records = getRecords();
  return `<div class="page-enter">
    <div class="data-page-header">📊 数据</div>
    ${renderSummary(profile, records)}
    ${renderNavGrid()}
    ${renderTabBar()}
    <div class="data-tab-panels">
      <div class="data-tab-panel active" data-panel="overview">
        ${renderProgressOverview(records)}
        ${renderMonthlyReport(records)}
        ${renderAchievements(records, profile)}
        ${renderWeakPoints(records)}
      </div>
      <div class="data-tab-panel" data-panel="progress">
        ${renderHeatmapSection(records)}
        ${renderTextbookProgress(records)}
        ${renderCourseProgress(records)}
        ${renderStudyAidProgress(records)}
        ${renderExamReflection(records)}
      </div>
      <div class="data-tab-panel" data-panel="charts">
        ${renderChartsSection()}
      </div>
    </div>
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

// afterRender: Tab切换 + 折叠交互 + 图表懒加载
export function afterRender() {
  const records = getRecords();

  // Tab切换
  const tabBtns = document.querySelectorAll('.data-tab');
  const panels = document.querySelectorAll('.data-tab-panel');
  const onTabClick = (e) => {
    const tab = e.currentTarget.dataset.tab;
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === tab));
    // 图表Tab激活时懒加载
    if (tab === 'charts' && charts.length === 0) initCharts(records);
  };
  tabBtns.forEach(b => b.addEventListener('click', onTabClick));

  // 折叠面板交互
  const foldHeaders = document.querySelectorAll('.fold-header');
  const onFoldClick = (e) => {
    const { fold: foldId } = e.currentTarget.dataset;
    const body = document.getElementById(`fold-${foldId}`);
    const arrow = e.currentTarget.querySelector('.fold-arrow');
    if (body) body.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
    e.currentTarget.classList.toggle('open');
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
    const xpChart = charts[0];
    if (xpChart) renderXPTrendChart(xpChart, records, days);
  };
  periodBtns.forEach(b => b.addEventListener('click', onPeriodToggle));

  // 热力图单元格点击 → 弹出当日学习详情
  const heatmapGrid = document.querySelector('.heatmap-grid');
  let heatmapPopup = null;
  const onHeatmapClick = (e) => {
    const cell = e.target.closest('.heatmap-cell');
    if (!cell) return;
    if (heatmapPopup) { heatmapPopup.remove(); heatmapPopup = null; }
    const date = cell.dataset.date;
    const xp = parseInt(cell.dataset.xp, 10) || 0;
    const dayRecords = records.filter(r => r.timestamp && new Date(r.timestamp).toISOString().slice(0, 10) === date);
    const dayReadings = getReadings().filter(r => r.timestamp && new Date(r.timestamp).toISOString().slice(0, 10) === date);
    const totalMin = dayRecords.reduce((s, r) => s + (r.duration || 0), 0);
    const readMin = dayReadings.reduce((s, r) => s + (r.durationMinutes || 0), 0);
    const recordList = dayRecords.slice(0, 3).map(r => {
      const icon = getSubjectIcon(SUBJECTS.find(s => s.name === r.subject || s.id === r.subject)?.id || '');
      return `<div class="heatmap-record">${icon} ${r.subject} · ${r.score || 0}分 · ${r.duration || 0}分 · ${r.xp || 0}XP</div>`;
    }).join('');
    const readList = dayReadings.slice(0, 3).map(r =>
      `<div class="heatmap-record">📖 ${r.bookTitle} · ${r.durationMinutes || 0}分钟</div>`
    ).join('');
    const totalItems = dayRecords.length + dayReadings.length;
    const popup = document.createElement('div');
    popup.className = 'heatmap-popup';
    popup.innerHTML = `<div class="heatmap-popup-title">${date}</div>
      <div class="heatmap-popup-row">${totalMin + readMin} 分钟 · ${xp} XP · ${totalItems} 条</div>
      ${recordList}${readList}${totalItems > 6 ? `<div class="heatmap-popup-more">还有 ${totalItems - 6} 条...</div>` : ''}`;
    cell.style.position = 'relative';
    cell.appendChild(popup);
    heatmapPopup = popup;
    setTimeout(() => { if (heatmapPopup === popup) { popup.remove(); heatmapPopup = null; } }, 5000);
  };
  if (heatmapGrid) heatmapGrid.addEventListener('click', onHeatmapClick);

  return () => {
    tabBtns.forEach(b => b.removeEventListener('click', onTabClick));
    foldHeaders.forEach(h => h.removeEventListener('click', onFoldClick));
    if (heatmapGrid) heatmapGrid.removeEventListener('click', onHeatmapClick);
    periodBtns.forEach(b => b.removeEventListener('click', onPeriodToggle));
    disposeAllCharts();
  };
}
