// score-trend.js — 成绩趋势页：按学科追踪考试分数 + 题型拆分 + ECharts 图表
// 读取/写入: EXAM_SCORES
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys, SUBJECTS } from '../config.js';
import { QUESTION_TYPES, DEFAULT_MAX_SCORES, createExamEntry } from '../data/exam-scores.js';
import Toast from '../components/toast.js';
import { loadECharts, initChart, showChartLoading, hideChartLoading, disposeChart } from '../utils/charts.js';

const getScores = () => Store.get(StorageKeys.EXAM_SCORES) || [];
const saveScores = (s) => Store.set(StorageKeys.EXAM_SCORES, s);
let chartInstances = [];
let currentSubject = 'english';

function fold(id, title, content, opts) {
  opts = opts || {};
  var oc = opts.open ? ' open' : '';
  var badge = opts.badge ? '<span class="fold-badge">' + opts.badge + '</span>' : '';
  return '<div class="fold-section"><div class="fold-header' + oc + '" data-fold="' + id + '">' +
    '<span class="fold-title">' + title + '</span>' + badge +
    '<span class="fold-arrow' + oc + '">▾</span></div>' +
    '<div class="fold-body' + oc + '" id="fold-' + id + '"><div class="fold-content">' + content + '</div></div></div>';
}

function renderSubjectSelector() {
  return '<div class="st-subject-bar">' + SUBJECTS.map(function(s) {
    return '<button class="st-subject-btn' + (s.id === currentSubject ? ' active' : '') + '" data-subject="' + s.id + '">' + s.name + '</button>';
  }).join('') + '</div>';
}

function renderOverview(exams) {
  if (exams.length === 0) return '';
  var sorted = exams.slice().sort(function(a, b) { return a.timestamp.localeCompare(b.timestamp); });
  var latest = sorted[sorted.length - 1];
  var best = sorted.reduce(function(m, e) { return e.totalScore > m.totalScore ? e : m; }, sorted[0]);
  var avg = Math.round(sorted.reduce(function(s, e) { return s + e.totalScore / e.maxScore * 100; }, 0) / sorted.length);
  var imp = '';
  if (sorted.length >= 2) {
    var diff = Math.round(latest.totalScore / latest.maxScore * 100) - Math.round(sorted[0].totalScore / sorted[0].maxScore * 100);
    imp = (diff >= 0 ? '+' : '') + diff + '%';
  }
  return '<div class="st-overview">' +
    '<div class="st-stat"><div class="st-stat-value">' + sorted.length + '</div><div class="st-stat-label">考试次数</div></div>' +
    '<div class="st-stat"><div class="st-stat-value">' + avg + '%</div><div class="st-stat-label">平均得分率</div></div>' +
    '<div class="st-stat"><div class="st-stat-value">' + Math.round(best.totalScore / best.maxScore * 100) + '%</div><div class="st-stat-label">最高得分率</div></div>' +
    '<div class="st-stat"><div class="st-stat-value">' + (imp || '--') + '</div><div class="st-stat-label">进步幅度</div></div></div>';
}

function renderExamList(exams) {
  if (exams.length === 0) return fold('exam-list', '📋 考试记录', '<p class="st-empty">暂无考试记录，点击上方按钮录入</p>', { open: true });
  var sorted = exams.slice().sort(function(a, b) { return b.timestamp.localeCompare(a.timestamp); });
  var items = sorted.map(function(e) {
    var pct = Math.round(e.totalScore / e.maxScore * 100);
    var date = e.timestamp ? new Date(e.timestamp).toLocaleDateString('zh-CN') : '';
    var c = pct >= 80 ? 'var(--color-success)' : pct >= 60 ? 'var(--color-warning)' : 'var(--color-error)';
    var types = (e.questionTypeScores || []).map(function(q) {
      return '<span class="st-type-tag">' + q.type + ' ' + q.score + '/' + q.maxScore + '</span>';
    }).join('');
    return '<div class="st-exam-card" data-id="' + e.id + '">' +
      '<div class="st-exam-header"><span class="st-exam-name">' + e.examName + '</span><span class="st-exam-date">' + date + '</span></div>' +
      '<div class="st-exam-body"><div class="st-exam-score">' + e.totalScore + '<span class="st-exam-max">/' + e.maxScore + '</span></div>' +
      '<div class="st-exam-pct" style="color:' + c + '">' + pct + '%</div></div>' +
      '<div class="st-exam-bar"><div class="st-exam-bar-fill" style="width:' + pct + '%;background:' + c + '"></div></div>' +
      (types ? '<div class="st-exam-types">' + types + '</div>' : '') +
      '<button class="st-delete-btn" data-id="' + e.id + '" title="删除">✕</button></div>';
  }).join('');
  return fold('exam-list', '📋 考试记录 · ' + exams.length + '次', '<div class="st-exam-list">' + items + '</div>', { open: true, badge: exams.length + '次' });
}

function renderChartSection() {
  return fold('score-charts', '📈 成绩趋势图',
    '<div class="chart-container" id="st-score-line" style="height:260px"></div>' +
    '<div class="chart-container" id="st-type-radar" style="height:260px;margin-top:var(--sp-3)"></div>',
    { open: true, badge: '2图' });
}

export function render() {
  var scores = getScores();
  var exams = scores.filter(function(s) { return s.subject === currentSubject; });
  return '<div class="page-enter"><a href="#/data" class="page-back">← 返回数据</a>' +
    '<div class="st-header"><div class="section-title">📊 成绩趋势</div>' +
    '<button class="st-add-btn" id="st-add-exam">+ 录入成绩</button></div>' +
    renderSubjectSelector() + renderOverview(exams) + renderChartSection() + renderExamList(exams) + '</div>';
}

async function initCharts(exams) {
  var lineEl = document.getElementById('st-score-line');
  var radarEl = document.getElementById('st-type-radar');
  if (lineEl) showChartLoading(lineEl);
  if (radarEl) showChartLoading(radarEl);
  var ec = await loadECharts();
  if (!ec) { if (lineEl) hideChartLoading(lineEl); if (radarEl) hideChartLoading(radarEl); return; }
  if (lineEl && exams.length > 0) {
    hideChartLoading(lineEl);
    var c = initChart(lineEl);
    if (c) { chartInstances.push(c); renderScoreLineChart(c, exams); }
  } else if (lineEl) { hideChartLoading(lineEl); }
  if (radarEl && exams.length > 0) {
    hideChartLoading(radarEl);
    var r = initChart(radarEl);
    if (r) { chartInstances.push(r); renderTypeRadarChart(r, exams); }
  } else if (radarEl) { hideChartLoading(radarEl); }
}

function renderScoreLineChart(chart, exams) {
  var sorted = exams.slice().sort(function(a, b) { return a.timestamp.localeCompare(b.timestamp); });
  var dark = document.documentElement.getAttribute('data-theme') === 'dark';
  var tc = dark ? '#ccc' : '#666', gc = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.75)', textStyle: { color: '#fff', fontSize: 12 },
      formatter: function(p) { var e = sorted[p[0].dataIndex]; return e.examName + '<br/>得分率: ' + p[0].value + '%<br/>分数: ' + e.totalScore + '/' + e.maxScore; } },
    grid: { left: 40, right: 16, top: 24, bottom: 40 },
    xAxis: { type: 'category', data: sorted.map(function(e) { return e.examName; }),
      axisLine: { lineStyle: { color: gc } }, axisLabel: { color: tc, fontSize: 10, rotate: sorted.length > 6 ? 30 : 0 } },
    yAxis: { type: 'value', min: 0, max: 100, name: '%', axisLine: { show: false },
      splitLine: { lineStyle: { color: gc } }, axisLabel: { color: tc, fontSize: 10 } },
    series: [{ type: 'line', data: sorted.map(function(e) { return Math.round(e.totalScore / e.maxScore * 100); }),
      smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { color: '#2563eb', width: 2 }, itemStyle: { color: '#2563eb' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(37,99,235,0.25)' }, { offset: 1, color: 'rgba(37,99,235,0.02)' }] } },
      markLine: { silent: true, lineStyle: { color: '#F59E0B', type: 'dashed', width: 1 },
        data: [{ yAxis: 60, label: { formatter: '及格线', fontSize: 10, color: tc } }] } }],
  });
}

function renderTypeRadarChart(chart, exams) {
  var sorted = exams.slice().sort(function(a, b) { return a.timestamp.localeCompare(b.timestamp); });
  var latest = sorted[sorted.length - 1];
  if (!latest.questionTypeScores || latest.questionTypeScores.length === 0) return;
  var dark = document.documentElement.getAttribute('data-theme') === 'dark';
  var tc = dark ? '#ccc' : '#666';
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: { backgroundColor: 'rgba(0,0,0,0.75)', textStyle: { color: '#fff', fontSize: 12 } },
    radar: { indicator: latest.questionTypeScores.map(function(q) { return { name: q.type, max: 100 }; }),
      shape: 'polygon', axisName: { color: tc, fontSize: 11 },
      splitArea: { areaStyle: { color: dark ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'] : ['rgba(0,0,0,0.01)', 'rgba(0,0,0,0.03)'] } },
      axisLine: { lineStyle: { color: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' } },
      splitLine: { lineStyle: { color: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' } } },
    series: [{ type: 'radar', data: [{ value: latest.questionTypeScores.map(function(q) { return Math.round(q.score / q.maxScore * 100); }),
      name: latest.examName, areaStyle: { color: 'rgba(37,99,235,0.2)' }, lineStyle: { color: '#2563eb', width: 2 }, itemStyle: { color: '#2563eb' } }] }],
  });
}

function openAddModal() {
  var subjectOpts = SUBJECTS.map(function(s) {
    return '<option value="' + s.id + '"' + (s.id === currentSubject ? ' selected' : '') + '>' + s.name + '</option>';
  }).join('');
  var overlay = document.createElement('div');
  overlay.className = 'entry-overlay';
  overlay.innerHTML = '<div class="entry-modal"><div class="entry-header"><span class="entry-title">📝 录入考试成绩</span>' +
    '<button class="entry-close" id="st-close">✕</button></div>' +
    '<form id="st-form" class="entry-form">' +
    '<div class="entry-row"><div class="entry-field entry-field-half"><label class="entry-label">学科 *</label>' +
    '<select id="st-subject" class="entry-select">' + subjectOpts + '</select></div>' +
    '<div class="entry-field entry-field-half"><label class="entry-label">考试名称 *</label>' +
    '<input type="text" id="st-exam-name" class="entry-input" required placeholder="如: 英语套卷3"></div></div>' +
    '<div class="entry-row"><div class="entry-field entry-field-half"><label class="entry-label">总分 *</label>' +
    '<input type="number" id="st-total" class="entry-input" min="0" required placeholder="120"></div>' +
    '<div class="entry-field entry-field-half"><label class="entry-label">满分 *</label>' +
    '<input type="number" id="st-max" class="entry-input" min="1" required placeholder="150"></div></div>' +
    '<div class="entry-field"><label class="entry-label">题型得分（可选）</label><div id="st-type-inputs"></div></div>' +
    '<button type="submit" class="entry-submit">保存成绩</button></form></div>';
  document.body.appendChild(overlay);

  function updateTypeInputs(sid) {
    var types = QUESTION_TYPES[sid] || [];
    var el = document.getElementById('st-type-inputs');
    if (!el) return;
    if (types.length === 0) { el.innerHTML = '<p class="st-empty" style="font-size:var(--fs-xs)">该学科暂无题型定义</p>'; return; }
    var maxIn = document.getElementById('st-max');
    if (maxIn && DEFAULT_MAX_SCORES[sid]) maxIn.value = DEFAULT_MAX_SCORES[sid];
    el.innerHTML = types.map(function(t) {
      return '<div class="st-type-row"><span class="st-type-label">' + t.type + ' (满' + t.maxScore + ')</span>' +
        '<input type="number" class="entry-input st-type-input" data-type="' + t.type + '" data-max="' + t.maxScore + '" min="0" max="' + t.maxScore + '" placeholder="0"></div>';
    }).join('');
  }
  var sel = document.getElementById('st-subject');
  sel.addEventListener('change', function() { updateTypeInputs(sel.value); });
  updateTypeInputs(sel.value);
  document.getElementById('st-close').addEventListener('click', function() { overlay.remove(); });
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.getElementById('st-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var qts = [];
    document.querySelectorAll('.st-type-input').forEach(function(inp) {
      var sc = parseInt(inp.value, 10);
      if (!isNaN(sc) && sc >= 0) qts.push({ type: inp.dataset.type, score: sc, maxScore: parseInt(inp.dataset.max, 10) });
    });
    var entry = createExamEntry(sel.value, document.getElementById('st-exam-name').value.trim(),
      parseInt(document.getElementById('st-total').value, 10) || 0, parseInt(document.getElementById('st-max').value, 10) || 150, qts);
    var scores = getScores(); scores.push(entry); saveScores(scores);
    overlay.remove(); Toast.show('成绩已录入', 'success'); window.location.reload();
  });
}

function deleteExam(id) {
  var scores = getScores();
  var target = scores.find(function(s) { return s.id === id; });
  if (!target) return;
  var overlay = document.createElement('div');
  overlay.className = 'entry-overlay';
  overlay.innerHTML = '<div class="entry-modal" style="max-width:300px"><div class="entry-header"><span class="entry-title">确认删除</span></div>' +
    '<p style="padding:var(--sp-2);color:var(--color-text-2);font-size:var(--fs-sm)">删除「' + target.examName + '」的成绩记录？</p>' +
    '<div style="display:flex;gap:var(--sp-2);padding:var(--sp-2);justify-content:flex-end">' +
    '<button class="settings-btn" id="st-del-cancel">取消</button><button class="settings-btn" id="st-del-confirm" style="color:var(--color-error)">删除</button></div></div>';
  document.body.appendChild(overlay);
  document.getElementById('st-del-cancel').addEventListener('click', function() { overlay.remove(); });
  document.getElementById('st-del-confirm').addEventListener('click', function() {
    saveScores(scores.filter(function(s) { return s.id !== id; }));
    overlay.remove(); Toast.show('成绩已删除', 'success'); window.location.reload();
  });
}

export function afterRender() {
  var subjectBtns = document.querySelectorAll('.st-subject-btn');
  var onSubject = function(e) {
    currentSubject = e.currentTarget.dataset.subject;
    subjectBtns.forEach(function(b) { b.classList.toggle('active', b.dataset.subject === currentSubject); });
    var ct = document.getElementById('page-container');
    if (ct) { chartInstances.forEach(function(c) { disposeChart(c); }); chartInstances = []; ct.innerHTML = render(); afterRender(); }
  };
  subjectBtns.forEach(function(b) { b.addEventListener('click', onSubject); });
  var addBtn = document.getElementById('st-add-exam');
  var onAdd = function() { openAddModal(); };
  if (addBtn) addBtn.addEventListener('click', onAdd);
  var deleteBtns = document.querySelectorAll('.st-delete-btn');
  var onDel = function(e) { e.stopPropagation(); deleteExam(e.currentTarget.dataset.id); };
  deleteBtns.forEach(function(b) { b.addEventListener('click', onDel); });
  var foldHeaders = document.querySelectorAll('.fold-header');
  var onFold = function(e) {
    var fid = e.currentTarget.dataset.fold;
    var body = document.getElementById('fold-' + fid);
    var arrow = e.currentTarget.querySelector('.fold-arrow');
    if (body) body.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
    e.currentTarget.classList.toggle('open');
    if (fid === 'score-charts' && body && body.classList.contains('open') && chartInstances.length === 0) {
      initCharts(getScores().filter(function(s) { return s.subject === currentSubject; }));
    }
  };
  foldHeaders.forEach(function(h) { h.addEventListener('click', onFold); });
  var exams = getScores().filter(function(s) { return s.subject === currentSubject; });
  if (exams.length > 0) initCharts(exams);
  return function() {
    subjectBtns.forEach(function(b) { b.removeEventListener('click', onSubject); });
    if (addBtn) addBtn.removeEventListener('click', onAdd);
    deleteBtns.forEach(function(b) { b.removeEventListener('click', onDel); });
    foldHeaders.forEach(function(h) { h.removeEventListener('click', onFold); });
    chartInstances.forEach(function(c) { disposeChart(c); }); chartInstances = [];
  };
}
