// skill-tree.js — 技能树页面：力导向图 + 雷达图 + 详情面板
// 读取: STUDY_RECORDS, USER_PROFILE → computeAll() 计算掌握度
// 写入: 无（纯展示）
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import { SKILL_TREE, getAllSkills } from '../data/skill-tree.js';
import { computeAll } from '../utils/skill-tree-calc.js';
import { buildTempStates, getTempLevel } from '../utils/review-calc.js';
import { loadECharts, initChart, disposeChart } from '../utils/charts.js';
import { getSubjectIcon } from '../utils/level.js';

// 模块级 ECharts 实例数组，afterRender 清理时统一 dispose
let chartInstances = [];

// 温度 → 颜色（§9.2: 力导向图节点用温度色）
function getTempColor(temp) {
  if (temp >= 80) return '#FF4500';
  if (temp >= 60) return '#FF8C00';
  if (temp >= 40) return '#FFD700';
  if (temp >= 20) return '#62A0EA';
  if (temp >= 1)  return '#1A5FB4';
  return '#6B7280';
}
// 掌握度 → 颜色（详情面板用）
function getMasteryColor(mastery) {
  if (mastery >= 80) return '#239a3b';
  if (mastery >= 60) return '#7bc96f';
  if (mastery >= 40) return '#e6a817';
  if (mastery >= 20) return '#e67e22';
  return '#e74c3c';
}

// 掌握度 → 等级标签（精通/熟练/入门/初学/未学）
function getMasteryLevel(mastery) {
  if (mastery >= 80) return '精通';
  if (mastery >= 60) return '熟练';
  if (mastery >= 40) return '入门';
  if (mastery >= 20) return '初学';
  return '未学';
}

// 学科筛选下拉框（全部/单科）
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

// 特长/薄弱标签列表（strength=绿/warning=黄）
function renderTalents(talents) {
  if (talents.length === 0) return '';
  const items = talents.map(t => {
    const icon = t.type === 'strength' ? '💪' : '⚠️';
    const color = t.type === 'strength' ? 'var(--color-success)' : 'var(--color-warning)';
    return `<span class="talent-tag" style="border-color:${color}">${icon} ${t.name} ${t.mastery}%</span>`;
  }).join('');
  return `<div class="talent-section"><div class="section-title">🎯 特长与薄弱</div><div class="talent-tags">${items}</div></div>`;
}

// 技能详情浮层容器（初始隐藏，点击节点显示）
function renderSkillDetailPanel() {
  return `<div class="skill-detail-panel" id="skill-detail" style="display:none">
    <button class="detail-close" id="detail-close">✕</button>
    <div class="detail-content" id="detail-content"></div>
  </div>`;
}

// §9.2: 温度图例（6级：炙热→冻结）
function renderLegend() {
  const levels = [
    { label: '炙热 ≥80°', color: '#FF4500', icon: '🔥' },
    { label: '温热 60-79°', color: '#FF8C00', icon: '🟠' },
    { label: '温暖 40-59°', color: '#FFD700', icon: '🟡' },
    { label: '正常 20-39°', color: '#62A0EA', icon: '🟢' },
    { label: '微凉 1-19°', color: '#1A5FB4', icon: '🔵' },
    { label: '冻结 0°', color: '#6B7280', icon: '⚫' },
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
    <div class="skill-radar-section" id="sub-radar-section" style="display:none">
      <div class="section-title" id="sub-radar-title">📊 子技能雷达</div>
      <div class="chart-container" id="sub-radar-chart" style="height:280px"></div>
    </div>
    ${renderLegend()}
    ${renderSkillDetailPanel()}
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.129 · 开发者区</p>
  </div>`;
}

// 构建力导向图节点/连线/分类数据（§9.2: 节点颜色=温度等级色）
// filterSubject='all' 时显示全部学科
function buildForceGraphData(skillMastery, filterSubject, tempStates) {
  const nodes = [];
  const links = [];
  const allSkills = getAllSkills();

  for (const skill of allSkills) {
    if (filterSubject !== 'all' && skill.subjectKey !== filterSubject) continue;
    const m = skillMastery[skill.id] || { avgMastery: 0, count: 0 };
    // 计算该技能知识点的平均温度
    const kps = skill.kps || [];
    let avgTemp = 0;
    if (tempStates && kps.length > 0) {
      const temps = kps.map(kp => { const key = `${skill.id}::${kp}`; return tempStates[key]?.temp || 0; });
      avgTemp = temps.reduce((s, t) => s + t, 0) / temps.length;
    }
    nodes.push({
      id: skill.id,
      name: skill.name,
      symbolSize: Math.max(20, 8 + m.avgMastery * 0.5),
      itemStyle: { color: getTempColor(avgTemp) },
      category: skill.subjectKey,
      value: m.avgMastery,
      subjectName: skill.subjectName,
      desc: skill.desc,
      count: m.count,
      mastery: m.avgMastery,
      temp: Math.round(avgTemp),
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

// 异步初始化力导向图（ECharts graph + force 布局）
// 点击节点 → showSkillDetail 打开详情面板
async function initForceGraph(skillMastery, filterSubject, tempStates) {
  const ec = await loadECharts();
  if (!ec) return;
  const el = document.getElementById('skill-force-graph');
  if (!el) return;
  const chart = initChart(el);
  if (!chart) return;
  chartInstances.push(chart);

  const data = buildForceGraphData(skillMastery, filterSubject, tempStates);
  chart.setOption({
    tooltip: {
      formatter: (p) => {
        if (p.dataType !== 'node') return '';
        const d = p.data;
        return `<b>${d.name}</b><br/>学科: ${d.subjectName}<br/>温度: ${d.temp || 0}°<br/>掌握度: ${d.mastery}%<br/>记录: ${d.count}条`;
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
      force: { repulsion: 200, edgeLength: [80, 160], gravity: 0.1 },
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

// 显示技能详情面板：温度/掌握度/等级/记录数/半衰期/累计XP/最近复习/知识点列表
function showSkillDetail(nodeData, skillMastery) {
  const panel = document.getElementById('skill-detail');
  const content = document.getElementById('detail-content');
  if (!panel || !content) return;

  const allSkills = getAllSkills();
  const skill = allSkills.find(s => s.id === nodeData.id);
  if (!skill) return;

  const m = skillMastery[skill.id] || {};
  const records = (window._skillRecords || []).filter(r => {
    // 匹配该技能的知识点
    const kps = skill.kps || [];
    return r.skillId === skill.id || kps.some(kp => (r.knowledgePoints || []).includes(kp));
  });

  // 计算累计XP和最近复习时间
  const totalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
  const lastReview = records.length > 0
    ? records.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))[0].timestamp
    : null;
  const lastReviewStr = lastReview ? new Date(lastReview).toLocaleDateString('zh-CN') : '无';

  // 计算平均半衰期
  const tempStates = window._tempStates || {};
  const kps = skill.kps || [];
  const halfLives = kps.map(kp => {
    const key = `${skill.id}::${kp}`;
    return tempStates[key]?.halfLife || 0;
  }).filter(h => h > 0);
  const avgHalfLife = halfLives.length > 0
    ? (halfLives.reduce((s, h) => s + h, 0) / halfLives.length).toFixed(1)
    : '-';

  // 最近10条记录的XP趋势（迷你图）
  const recentXP = records.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))
    .slice(-10).map(r => r.xp || 0);
  const sparkline = recentXP.length > 1
    ? `<div class="detail-sparkline">${recentXP.map((v, i) => {
        const max = Math.max(...recentXP, 1);
        const h = Math.round((v / max) * 24);
        return `<div class="spark-bar" style="height:${h}px" title="${v}XP"></div>`;
      }).join('')}</div>`
    : '';

  const kpList = skill.kps.map(kp => {
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
      <div class="detail-stat"><div class="detail-stat-value" style="color:${getTempColor(nodeData.temp || 0)}">${nodeData.temp || 0}°</div><div class="detail-stat-label">温度</div></div>
      <div class="detail-stat"><div class="detail-stat-value" style="color:${getMasteryColor(m.avgMastery || 0)}">${m.avgMastery || 0}%</div><div class="detail-stat-label">掌握度</div></div>
      <div class="detail-stat"><div class="detail-stat-value">${getMasteryLevel(m.avgMastery || 0)}</div><div class="detail-stat-label">等级</div></div>
      <div class="detail-stat"><div class="detail-stat-value">${m.count || 0}</div><div class="detail-stat-label">记录数</div></div>
    </div>
    <div class="detail-stats detail-stats-secondary">
      <div class="detail-stat"><div class="detail-stat-value">${avgHalfLife}天</div><div class="detail-stat-label">半衰期</div></div>
      <div class="detail-stat"><div class="detail-stat-value">${totalXP}</div><div class="detail-stat-label">累计XP</div></div>
      <div class="detail-stat"><div class="detail-stat-value">${lastReviewStr}</div><div class="detail-stat-label">最近复习</div></div>
    </div>
    ${sparkline}
    <div class="detail-desc">${skill.desc}</div>
    <div class="detail-kps-title">知识点 (${skill.kps.length})</div>
    <div class="detail-kps">${kpList}</div>
  `;
  panel.style.display = 'block';
}

// 异步初始化学科能力雷达图（circle 形状，max=100，点击学科可下钻）
async function initRadarChart(subjectAbility, onSubjectClick) {
  const ec = await loadECharts();
  if (!ec) return;
  const el = document.getElementById('skill-radar-chart');
  if (!el) return;
  const chart = initChart(el);
  if (!chart) return;
  chartInstances.push(chart);

  const entries = Object.entries(subjectAbility);
  const subjectKeys = entries.map(([k]) => k);
  const indicators = entries.map(([, v]) => ({ name: v.name, max: 100 }));
  const values = entries.map(([, v]) => v.mastery);

  chart.setOption({
    tooltip: {},
    radar: {
      indicator: indicators,
      shape: 'circle',
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

  // 点击雷达图坐标轴名称 → 筛选到该学科
  if (onSubjectClick) {
    chart.on('click', (params) => {
      if (params.componentType === 'radar' && params.name) {
        const idx = indicators.findIndex(ind => ind.name === params.name);
        if (idx >= 0) onSubjectClick(subjectKeys[idx]);
      }
    });
  }
}

// §9.3: 初始化子技能雷达图（点击主雷达学科后显示该学科的技能详情）
async function initSubRadarChart(subjectKey, skillMastery, subjectAbility) {
  const ec = await loadECharts();
  if (!ec) return;
  const section = document.getElementById('sub-radar-section');
  const el = document.getElementById('sub-radar-chart');
  const titleEl = document.getElementById('sub-radar-title');
  if (!el || !section) return;

  const subj = SKILL_TREE.subjects[subjectKey];
  if (!subj) return;

  section.style.display = 'block';
  titleEl.textContent = `📊 ${subj.name} · 子技能雷达`;

  // 清理旧实例
  const existingIdx = chartInstances.findIndex(c => c.getDom() === el);
  if (existingIdx >= 0) { disposeChart(chartInstances[existingIdx]); chartInstances.splice(existingIdx, 1); }

  const chart = initChart(el);
  if (!chart) return;
  chartInstances.push(chart);

  const skillIds = Object.keys(subj.skills);
  const indicators = skillIds.map(id => {
    const sk = subj.skills[id];
    return { name: sk.name, max: 100 };
  });
  const values = skillIds.map(id => {
    const m = skillMastery[id];
    return m ? m.avgMastery : 0;
  });

  chart.setOption({
    tooltip: {},
    radar: {
      indicator: indicators,
      shape: 'circle',
      splitNumber: 4,
      axisName: { fontSize: 11 },
    },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        name: subj.name,
        areaStyle: { opacity: 0.25 },
        lineStyle: { width: 2 },
      }],
    }],
  });
}

// afterRender: 初始化图表 + 学科筛选 + 详情面板关闭
// 坑: window._knowledgeStates 用于详情面板读取知识点掌握度
// 切换学科时需先 dispose 旧图再重建
export function afterRender() {
  const { knowledgeStates, skillMastery, subjectAbility, talents } = computeAll();
  window._knowledgeStates = knowledgeStates;

  // 构建温度状态用于节点着色 + 详情面板
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  const profile = Store.get(StorageKeys.USER_PROFILE) || {};
  const tempStates = buildTempStates(records, profile);
  window._tempStates = tempStates;
  window._skillRecords = records;

  let currentFilter = 'all';
  initForceGraph(skillMastery, currentFilter, tempStates);
  initRadarChart(subjectAbility, (subjectKey) => {
    // 雷达图点击学科 → 切换筛选 + 显示子技能雷达
    currentFilter = subjectKey;
    if (select) select.value = subjectKey;
    const old = chartInstances[0];
    if (old) { disposeChart(old); chartInstances.shift(); }
    initForceGraph(skillMastery, currentFilter, tempStates);
    initSubRadarChart(subjectKey, skillMastery, subjectAbility);
  });

  // 学科筛选
  const select = document.getElementById('skill-subject-filter');
  const onSelect = () => {
    currentFilter = select.value;
    const old = chartInstances[0];
    if (old) { disposeChart(old); chartInstances.shift(); }
    initForceGraph(skillMastery, currentFilter, tempStates);
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
    window._tempStates = null;
    window._skillRecords = null;
  };
}
