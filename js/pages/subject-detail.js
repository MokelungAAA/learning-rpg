// subject-detail.js — 学科详情页：概览+教材/复习/日志/图表 4折叠卡片
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import { SUBJECTS_DATA } from '../data/subjects.js';
import { getSubjectIcon, formatNumber } from '../utils/level.js';
import { loadECharts, initChart, showChartLoading, hideChartLoading, disposeChart } from '../utils/charts.js';

const getRecords = () => Store.get(StorageKeys.STUDY_RECORDS) || [];
let chartInstances = [];

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

function getTempLevel(temp) {
  if (temp >= 90) return { icon: '🔥', color: '#FF4444', label: '炙热' };
  if (temp >= 70) return { icon: '☀️', color: '#FF8C00', label: '温热' };
  if (temp >= 50) return { icon: '🌤', color: '#FFD700', label: '温暖' };
  if (temp >= 30) return { icon: '⛅', color: '#87CEEB', label: '正常' };
  if (temp >= 10) return { icon: '❄️', color: '#B0C4DE', label: '微凉' };
  return { icon: '🧊', color: '#D3D3D3', label: '冻结' };
}

function calcSubjectOverview(subjectId, records) {
  const recs = records.filter(r => r.subject === subjectId || r.subject === SUBJECTS.find(s => s.id === subjectId)?.name);
  const totalMin = recs.reduce((s, r) => s + (r.duration || 0), 0);
  const totalXP = recs.reduce((s, r) => s + (r.xp || 0), 0);
  const avgScore = recs.length > 0 ? Math.round(recs.reduce((a, r) => a + (r.score || 0), 0) / recs.length) : 0;
  const weekMin = recs.filter(r => r.timestamp && (Date.now() - new Date(r.timestamp).getTime()) < 7 * 86400000)
    .reduce((s, r) => s + (r.duration || 0), 0);
  const temp = Math.min(100, Math.round(avgScore * 0.6 + Math.min(100, recs.length * 3) * 0.4));
  const mastery = Math.min(100, Math.round(avgScore * 0.7 + Math.min(100, recs.length * 2) * 0.3));
  return { totalMin, totalXP, avgScore, weekMin, temp, mastery, count: recs.length, recs };
}

function renderOverview(subjectId) {
  const records = getRecords();
  const subj = SUBJECTS.find(s => s.id === subjectId);
  const ov = calcSubjectOverview(subjectId, records);
  const tLevel = getTempLevel(ov.temp);
  const hours = Math.floor(ov.totalMin / 60);
  const mins = ov.totalMin % 60;
  const weekH = Math.floor(ov.weekMin / 60);
  const weekM = ov.weekMin % 60;

  return `<div class="subject-overview">
    <div class="subject-overview-row">
      <div class="subject-overview-stat">
        <div class="subject-ov-value">${hours}h${mins}m</div>
        <div class="subject-ov-label">总学习</div>
      </div>
      <div class="subject-overview-stat">
        <div class="subject-ov-value" style="color:${tLevel.color}">${tLevel.icon} ${ov.temp}%</div>
        <div class="subject-ov-label">温度</div>
      </div>
      <div class="subject-overview-stat">
        <div class="subject-ov-value">${ov.mastery}%</div>
        <div class="subject-ov-label">掌握度</div>
      </div>
      <div class="subject-overview-stat">
        <div class="subject-ov-value">${weekH}h${weekM}m</div>
        <div class="subject-ov-label">本周</div>
      </div>
    </div>
    <div class="subject-overview-bar">
      <div class="progress-bar"><div class="progress-fill" style="width:${ov.mastery}%"></div></div>
    </div>
  </div>`;
}

function renderTextbooksCard(subjectId) {
  const data = SUBJECTS_DATA[subjectId];
  if (!data || !data.textbooks) return fold('textbooks', '📖 教材/知识点', '<p class="empty-hint">暂无教材数据</p>');
  const records = getRecords();
  const items = data.textbooks.map(tb => {
    const totalKP = tb.chapters.reduce((s, ch) => s + ch.sections.reduce((s2, sec) => s2 + (sec.knowledgePoints?.length || 0), 0), 0);
    const covered = records.filter(r => r.textbook && r.textbook.includes(tb.name.slice(0, 4))).length;
    const pct = totalKP > 0 ? Math.min(100, Math.round((covered / totalKP) * 100)) : 0;
    return `<div class="tb-item">
      <div class="tb-item-header">
        <span class="tb-item-name">${tb.name}</span>
        <span class="tb-item-pct">${pct}%</span>
      </div>
      <div class="tb-item-chapters">${tb.chapters.length} 章 · ${totalKP} 个知识点</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
  return fold('textbooks', `📖 教材/知识点 · ${data.textbooks.length}本`, `<div class="tb-list">${items}</div>`);
}

function renderReviewCard(subjectId) {
  const records = getRecords();
  const subj = SUBJECTS.find(s => s.id === subjectId);
  const subjName = subj?.name || subjectId;
  // Find records that might need review (low score or old)
  const now = Date.now();
  const oldRecs = records.filter(r => {
    const matches = r.subject === subjectId || r.subject === subjName;
    if (!matches || !r.timestamp) return false;
    const days = (now - new Date(r.timestamp).getTime()) / 86400000;
    return days > 3 && (r.score || 0) < 70;
  }).slice(0, 10);

  if (oldRecs.length === 0) {
    return fold('review', '🔄 待复习', '<p class="empty-hint">暂无待复习项目，继续保持！</p>');
  }
  const items = oldRecs.map(r => {
    const days = Math.round((now - new Date(r.timestamp).getTime()) / 86400000);
    const kps = (r.knowledgePoints || []).join('、') || '未分类';
    return `<div class="review-item">
      <div class="review-item-kp">${kps}</div>
      <div class="review-item-meta">得分 ${r.score}% · ${days}天前</div>
    </div>`;
  }).join('');
  return fold('review', `🔄 待复习 · ${oldRecs.length}项`, `<div class="review-list">${items}</div>`);
}

function renderLogCard(subjectId) {
  const records = getRecords();
  const subj = SUBJECTS.find(s => s.id === subjectId);
  const subjName = subj?.name || subjectId;
  const recs = records.filter(r => r.subject === subjectId || r.subject === subjName)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

  if (recs.length === 0) {
    return fold('log', '📋 学习日志', '<p class="empty-hint">暂无学习记录</p>');
  }
  const items = recs.map(r => {
    const date = r.timestamp ? new Date(r.timestamp).toLocaleDateString('zh-CN') : '';
    const kps = (r.knowledgePoints || []).join('、') || '';
    return `<div class="log-item">
      <div class="log-item-top">
        <span class="log-item-dur">${r.duration || 0}分钟</span>
        <span class="log-item-score">${r.score > 0 ? r.score + '%' : '--'}</span>
        <span class="log-item-date">${date}</span>
      </div>
      ${kps ? `<div class="log-item-kps">${kps}</div>` : ''}
    </div>`;
  }).join('');
  return fold('log', `📋 学习日志 · ${recs.length}条`, `<div class="log-list">${items}</div>`);
}

function renderChartCard(subjectId) {
  return fold('charts', '📈 数据图表', `
    <div class="chart-container" id="subject-duration-chart" style="height:200px"></div>
    <div class="chart-container" id="subject-score-chart" style="height:200px;margin-top:var(--sp-2)"></div>
  `);
}

async function initSubjectCharts(subjectId) {
  const ec = await loadECharts();
  if (!ec) return;
  const records = getRecords();
  const subj = SUBJECTS.find(s => s.id === subjectId);
  const subjName = subj?.name || subjectId;
  const recs = records.filter(r => r.subject === subjectId || r.subject === subjName);

  // Duration by day (last 14 days)
  const durEl = document.getElementById('subject-duration-chart');
  if (durEl) {
    showChartLoading(durEl);
    const chart = initChart(durEl);
    if (chart) {
      chartInstances.push(chart);
      const days = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        days[d.toISOString().slice(0, 10)] = 0;
      }
      for (const r of recs) {
        if (r.timestamp) {
          const key = new Date(r.timestamp).toISOString().slice(0, 10);
          if (key in days) days[key] += r.duration || 0;
        }
      }
      chart.setOption({
        title: { text: '每日学习时长', left: 'center', textStyle: { fontSize: 13 } },
        tooltip: { trigger: 'axis', formatter: p => `${p[0].axisValue}<br/>${p[0].value} 分钟` },
        grid: { left: 40, right: 16, top: 36, bottom: 24 },
        xAxis: { type: 'category', data: Object.keys(days).map(d => d.slice(5)), axisLabel: { fontSize: 10 } },
        yAxis: { type: 'value', name: '分钟', axisLabel: { fontSize: 10 } },
        series: [{ type: 'bar', data: Object.values(days), itemStyle: { color: 'var(--color-accent)', borderRadius: [4, 4, 0, 0] } }],
      });
      hideChartLoading(durEl);
    }
  }

  // Score trend
  const scoreEl = document.getElementById('subject-score-chart');
  if (scoreEl) {
    showChartLoading(scoreEl);
    const chart = initChart(scoreEl);
    if (chart) {
      chartInstances.push(chart);
      const scored = recs.filter(r => r.score > 0).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(-20);
      chart.setOption({
        title: { text: '得分率趋势', left: 'center', textStyle: { fontSize: 13 } },
        tooltip: { trigger: 'axis', formatter: p => `${p[0].axisValue}<br/>得分率: ${p[0].value}%` },
        grid: { left: 40, right: 16, top: 36, bottom: 24 },
        xAxis: { type: 'category', data: scored.map(r => new Date(r.timestamp).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })), axisLabel: { fontSize: 10 } },
        yAxis: { type: 'value', min: 0, max: 100, name: '%', axisLabel: { fontSize: 10 } },
        series: [{ type: 'line', data: scored.map(r => r.score), smooth: true, lineStyle: { width: 2 }, areaStyle: { opacity: 0.1 } }],
      });
      hideChartLoading(scoreEl);
    }
  }
}

export function render(params) {
  const subjectId = params?.id || 'math';
  const subj = SUBJECTS.find(s => s.id === subjectId);
  const icon = getSubjectIcon(subjectId);
  const name = subj?.name || subjectId;

  return `<div class="page-enter">
    <a href="#/" class="page-back">← 返回首页</a>
    <div class="subject-detail-header">
      <span class="subject-detail-icon">${icon}</span>
      <div class="subject-detail-title">${name}</div>
    </div>
    ${renderOverview(subjectId)}
    ${renderTextbooksCard(subjectId)}
    ${renderReviewCard(subjectId)}
    ${renderLogCard(subjectId)}
    ${renderChartCard(subjectId)}
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.62 · XP引擎2.0</p>
  </div>`;
}

export function afterRender(params) {
  const subjectId = params?.id || 'math';

  // Init charts after fold is opened
  const chartsHeader = document.querySelector('[data-fold="charts"]');
  let chartsInited = false;
  if (chartsHeader) {
    chartsHeader.addEventListener('click', () => {
      if (!chartsInited) {
        chartsInited = true;
        setTimeout(() => initSubjectCharts(subjectId), 100);
      }
    });
  }

  // Fold toggle
  const foldHeaders = document.querySelectorAll('.fold-header');
  const onFoldClick = (e) => {
    const { fold: foldId } = e.currentTarget.dataset;
    const body = document.getElementById(`fold-${foldId}`);
    const arrow = e.currentTarget.querySelector('.fold-arrow');
    if (body) body.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
  };
  foldHeaders.forEach(h => h.addEventListener('click', onFoldClick));

  return () => {
    foldHeaders.forEach(h => h.removeEventListener('click', onFoldClick));
    chartInstances.forEach(c => disposeChart(c));
    chartInstances = [];
  };
}
