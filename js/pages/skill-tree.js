// skill-tree.js — 技能树页面：力导向图 + 雷达图 + 详情面板
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import { SKILL_TREE, getAllSkills } from '../data/skill-tree.js';
import { computeAll } from '../utils/skill-tree-calc.js';
import { loadECharts, initChart, disposeChart } from '../utils/charts.js';
import { getSubjectIcon } from '../utils/level.js';

let chartInstances = [];

function getMasteryColor(mastery) {
  if (mastery >= 80) return '#239a3b';
  if (mastery >= 60) return '#7bc96f';
  if (mastery >= 40) return '#e6a817';
  if (mastery >= 20) return '#e67e22';
  return '#e74c3c';
}

function getMasteryLevel(mastery) {
  if (mastery >= 80) return '精通';
  if (mastery >= 60) return '熟练';
  if (mastery >= 40) return '入门';
  if (mastery >= 20) return '初学';
  return '未学';
}

function renderSubjectSelector() {
  const options = [
    { key: 'all', label: '全部学科' },
    ...Object.entries(SKILL_TREE.subjects).map(([k, v]) => ({ key: k, label: v.name })),
  ];
  const opts = options.map(o => `<option value="${o.key}">${o.label}</option>`).join('');
  return `<div class="skill-tree-controls">
    <select id="skill-subject-filter" class="skill-filter-select">${opts}</select>
  </div>`;
}

function renderTalents(talents) {
  if (talents.length === 0) return '';
  const items = talents.map(t => {
    const icon = t.type === 'strength' ? '💪' : '⚠️';
    const color = t.type === 'strength' ? 'var(--color-success)' : 'var(--color-warning)';
    return `<span class="talent-tag" style="border-color:${color}">${icon} ${t.name} ${t.mastery}%</span>`;
  }).join('');
  return `<div class="talent-section"><div class="section-title">🎯 特长与薄弱</div><div class="talent-tags">${items}</div></div>`;
}

function renderSkillDetailPanel() {
  return `<div class="skill-detail-panel" id="skill-detail" style="display:none">
    <button class="detail-close" id="detail-close">✕</button>
    <div class="detail-content" id="detail-content"></div>
  </div>`;
}

function renderLegend() {
  const levels = [
    { label: '精通 80%+', color: '#239a3b' },
    { label: '熟练 60-79%', color: '#7bc96f' },
    { label: '入门 40-59%', color: '#e6a817' },
    { label: '初学 20-39%', color: '#e67e22' },
    { label: '未学 <20%', color: '#e74c3c' },
  ];
  return `<div class="skill-legend">${levels.map(l =>
    `<span class="legend-item"><span class="legend-dot" style="background:${l.color}"></span>${l.label}</span>`
  ).join('')}</div>`;
}

export function render() {
  const { subjectAbility, talents } = computeAll();
  return `<div class="page-enter">
    <a href="#/data" class="page-back">← 返回数据</a>
    <div class="skill-tree-header">
      <div class="section-title">🌳 技能树</div>
      ${renderSubjectSelector()}
    </div>
    ${renderTalents(talents)}
    <div class="skill-graph-container">
      <div class="chart-container" id="skill-force-graph" style="height:400px"></div>
    </div>
    <div class="skill-radar-section">
      <div class="section-title">📊 学科能力雷达</div>
      <div class="chart-container" id="skill-radar-chart" style="height:300px"></div>
    </div>
    ${renderLegend()}
    ${renderSkillDetailPanel()}
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.59 · 响应式增强</p>
  </div>`;
}

// 构建力导向图数据
function buildForceGraphData(skillMastery, filterSubject) {
  const nodes = [];
  const links = [];
  const allSkills = getAllSkills();

  for (const skill of allSkills) {
    if (filterSubject !== 'all' && skill.subjectKey !== filterSubject) continue;
    const m = skillMastery[skill.id] || { avgMastery: 0, count: 0 };
    nodes.push({
      id: skill.id,
      name: skill.name,
      symbolSize: Math.max(20, 8 + m.avgMastery * 0.5),
      itemStyle: { color: getMasteryColor(m.avgMastery) },
      category: skill.subjectKey,
      value: m.avgMastery,
      subjectName: skill.subjectName,
      desc: skill.desc,
      count: m.count,
      mastery: m.avgMastery,
    });
  }

  // 同学科技能之间连线
  for (const [subjKey, subj] of Object.entries(SKILL_TREE.subjects)) {
    if (filterSubject !== 'all' && subjKey !== filterSubject) continue;
    const skillIds = Object.keys(subj.skills);
    for (let i = 0; i < skillIds.length - 1; i++) {
      links.push({ source: skillIds[i], target: skillIds[i + 1] });
    }
  }

  const categories = Object.entries(SKILL_TREE.subjects)
    .filter(([k]) => filterSubject === 'all' || k === filterSubject)
    .map(([k, v]) => ({ name: v.name }));

  return { nodes, links, categories };
}

async function initForceGraph(skillMastery, filterSubject) {
  const ec = await loadECharts();
  if (!ec) return;
  const el = document.getElementById('skill-force-graph');
  if (!el) return;
  const chart = initChart(el);
  if (!chart) return;
  chartInstances.push(chart);

  const data = buildForceGraphData(skillMastery, filterSubject);
  chart.setOption({
    tooltip: {
      formatter: (p) => {
        if (p.dataType !== 'node') return '';
        const d = p.data;
        return `<b>${d.name}</b><br/>学科: ${d.subjectName}<br/>掌握度: ${d.mastery}%<br/>记录: ${d.count}条<br/><span style="color:#999;font-size:12px">${d.desc}</span>`;
      },
    },
    series: [{
      type: 'graph',
      layout: 'force',
      data: data.nodes,
      links: data.links,
      categories: data.categories,
      roam: true,
      draggable: true,
      force: { repulsion: 300, edgeLength: [80, 160], gravity: 0.1 },
      label: { show: true, fontSize: 11, position: 'bottom' },
      lineStyle: { color: '#ccc', curveness: 0.1 },
      emphasis: { focus: 'adjacency', lineStyle: { width: 3 } },
    }],
  });

  chart.on('click', (params) => {
    if (params.dataType !== 'node') return;
    showSkillDetail(params.data, skillMastery);
  });
}

function showSkillDetail(nodeData, skillMastery) {
  const panel = document.getElementById('skill-detail');
  const content = document.getElementById('detail-content');
  if (!panel || !content) return;

  const allSkills = getAllSkills();
  const skill = allSkills.find(s => s.id === nodeData.id);
  if (!skill) return;

  const m = skillMastery[skill.id] || {};
  const kps = skill.kps.map(kp => {
    const key = `${skill.id}::${kp}`;
    const ks = (window._knowledgeStates || {})[key];
    return `<div class="detail-kp">
      <span class="detail-kp-name">${kp}</span>
      <span class="detail-kp-mastery" style="color:${getMasteryColor(ks?.mastery || 0)}">${ks?.mastery || 0}%</span>
    </div>`;
  }).join('');

  content.innerHTML = `
    <div class="detail-header">
      <span class="detail-subject-icon">${getSubjectIcon(skill.subjectId)}</span>
      <div>
        <div class="detail-skill-name">${skill.name}</div>
        <div class="detail-subject-name">${skill.subjectName}</div>
      </div>
    </div>
    <div class="detail-stats">
      <div class="detail-stat"><div class="detail-stat-value" style="color:${getMasteryColor(m.avgMastery || 0)}">${m.avgMastery || 0}%</div><div class="detail-stat-label">掌握度</div></div>
      <div class="detail-stat"><div class="detail-stat-value">${getMasteryLevel(m.avgMastery || 0)}</div><div class="detail-stat-label">等级</div></div>
      <div class="detail-stat"><div class="detail-stat-value">${m.count || 0}</div><div class="detail-stat-label">记录数</div></div>
    </div>
    <div class="detail-desc">${skill.desc}</div>
    <div class="detail-kps-title">知识点 (${skill.kps.length})</div>
    <div class="detail-kps">${kps}</div>
  `;
  panel.style.display = 'block';
}

async function initRadarChart(subjectAbility) {
  const ec = await loadECharts();
  if (!ec) return;
  const el = document.getElementById('skill-radar-chart');
  if (!el) return;
  const chart = initChart(el);
  if (!chart) return;
  chartInstances.push(chart);

  const entries = Object.entries(subjectAbility);
  const indicators = entries.map(([, v]) => ({ name: v.name, max: 100 }));
  const values = entries.map(([, v]) => v.mastery);

  chart.setOption({
    tooltip: {},
    radar: {
      indicator: indicators,
      shape: 'polygon',
      splitNumber: 5,
      axisName: { fontSize: 12 },
    },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        name: '学科能力',
        areaStyle: { opacity: 0.2 },
        lineStyle: { width: 2 },
      }],
    }],
  });
}

export function afterRender() {
  const { knowledgeStates, skillMastery, subjectAbility, talents } = computeAll();
  window._knowledgeStates = knowledgeStates;

  let currentFilter = 'all';
  initForceGraph(skillMastery, currentFilter);
  initRadarChart(subjectAbility);

  // 学科筛选
  const select = document.getElementById('skill-subject-filter');
  const onSelect = () => {
    currentFilter = select.value;
    // 重建力导向图
    const old = chartInstances[0];
    if (old) { disposeChart(old); chartInstances.shift(); }
    initForceGraph(skillMastery, currentFilter);
  };
  if (select) select.addEventListener('change', onSelect);

  // 关闭详情面板
  const closeBtn = document.getElementById('detail-close');
  const onClose = () => {
    const panel = document.getElementById('skill-detail');
    if (panel) panel.style.display = 'none';
  };
  if (closeBtn) closeBtn.addEventListener('click', onClose);

  return () => {
    if (select) select.removeEventListener('change', onSelect);
    if (closeBtn) closeBtn.removeEventListener('click', onClose);
    chartInstances.forEach(c => disposeChart(c));
    chartInstances = [];
    window._knowledgeStates = null;
  };
}
