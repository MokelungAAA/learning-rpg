// charts.js — ECharts 图表配置与渲染（VIEW-10~16）
// 功能: 动态加载 ECharts 5.4.3，提供 6 种图表的配置与渲染
// 图表: XP趋势/学科时长/效率散点/时段热力/得分趋势/输入输出比例
// 主题: 自动适配 light/dark 模式，读取 data-theme 属性
// 易错点: CDN 加载失败时返回 null，需调用方做空值判断

import { SUBJECTS } from '../config.js';

let echartsLoaded = false;
let echartsLib = null;

// 动态加载 ECharts（CDN），已加载则直接返回缓存
// @returns {Promise<Object|null>} echarts 实例，加载失败返回 null
export async function loadECharts() {
  if (echartsLoaded) return echartsLib;
  return new Promise((resolve) => {
    if (window.echarts) {
      echartsLib = window.echarts;
      echartsLoaded = true;
      resolve(echartsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
    script.onload = () => {
      echartsLib = window.echarts;
      echartsLoaded = true;
      resolve(echartsLib);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

// 检测当前是否为暗色主题
function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

// 获取当前主题的图表配色方案（自动适配 light/dark）
// @returns {{textColor, subTextColor, gridColor, bgColor, accent, ...}}
function getChartTheme() {
  const dark = isDark();
  return {
    textColor: dark ? '#ccc' : '#666',
    subTextColor: dark ? '#888' : '#999',
    gridColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    bgColor: 'transparent',
    accent: '#2563eb',
    accentLight: '#60a5fa',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
  };
}

// 获取学科对应的图表颜色（英文 key: math/physics 等）
// @param {string} id — 学科英文ID
// @returns {string} 十六进制颜色值
function getSubjectColor(id) {
  const colors = {
    math: '#2563eb', chinese: '#dc2626', english: '#16a34a',
    physics: '#9333ea', chemistry: '#ea580c', biology: '#0d9488',
    politics: '#be185d', history: '#854d0e', geography: '#0284c7',
  };
  return colors[id] || '#6b7280';
}

// 初始化 ECharts 实例（canvas 渲染器）
// @param {HTMLElement} container — 图表容器 DOM 元素
// @returns {Object|null} echarts 实例，未加载返回 null
export function initChart(container) {
  if (!echartsLib) return null;
  const chart = echartsLib.init(container, null, { renderer: 'canvas' });
  return chart;
}

// 显示图表加载动画（防止重复添加）
// @param {HTMLElement} container — 图表容器
export function showChartLoading(container) {
  if (!container || container.querySelector('.chart-loading')) return;
  const loader = document.createElement('div');
  loader.className = 'chart-loading';
  loader.innerHTML = '<div class="chart-loading-spinner"></div><div class="chart-loading-text">加载图表中...</div>';
  container.appendChild(loader);
}

// 隐藏图表加载动画
// @param {HTMLElement} container — 图表容器
export function hideChartLoading(container) {
  if (!container) return;
  const loader = container.querySelector('.chart-loading');
  if (loader) loader.remove();
}

// 30天XP趋势折线图（VIEW-10）
// @param {Object} chart — echarts 实例
// @param {Array} records — 学习记录（需含 timestamp, xp）
export function renderXPTrendChart(chart, records, periodDays = 30) {
  if (!chart) return;
  const theme = getChartTheme();
  const today = new Date();
  const days = [];
  const xpData = [];

  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push(key.slice(5)); // MM-DD
    const dayXP = records
      .filter(r => r.timestamp && new Date(r.timestamp).toISOString().slice(0, 10) === key)
      .reduce((sum, r) => sum + (r.xp || 0), 0);
    xpData.push(dayXP);
  }

  chart.setOption({
    backgroundColor: theme.bgColor,
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.75)', textStyle: { color: '#fff', fontSize: 12 } },
    grid: { left: 40, right: 16, top: 24, bottom: 28 },
    xAxis: {
      type: 'category', data: days, boundaryGap: false,
      axisLine: { lineStyle: { color: theme.gridColor } },
      axisLabel: { color: theme.textColor, fontSize: 10, interval: 4 },
    },
    yAxis: {
      type: 'value', minInterval: 1,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: theme.gridColor } },
      axisLabel: { color: theme.textColor, fontSize: 10 },
    },
    series: [{
      type: 'line', data: xpData, smooth: true, symbol: 'circle', symbolSize: 4,
      lineStyle: { color: theme.accent, width: 2 },
      itemStyle: { color: theme.accent },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
        { offset: 0, color: theme.accent + '40' },
        { offset: 1, color: theme.accent + '05' },
      ]}},
    }],
  });
}

// 学科时长柱状图（VIEW-11），按学习时长降序排列
// @param {Object} chart — echarts 实例
// @param {Array} records — 学习记录（需含 subject, duration）
export function renderSubjectDurationChart(chart, records) {
  if (!chart) return;
  const theme = getChartTheme();

  const durations = SUBJECTS.map(s => {
    const mins = records
      .filter(r => r.subject === s.id || r.subject === s.name)
      .reduce((sum, r) => sum + (r.duration || 0), 0);
    return { name: s.name, value: mins, id: s.id };
  }).sort((a, b) => b.value - a.value);

  chart.setOption({
    backgroundColor: theme.bgColor,
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.75)', textStyle: { color: '#fff', fontSize: 12 } },
    grid: { left: 48, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: 'category', data: durations.map(d => d.name),
      axisLine: { lineStyle: { color: theme.gridColor } },
      axisLabel: { color: theme.textColor, fontSize: 11 },
    },
    yAxis: {
      type: 'value', name: '分钟',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: theme.gridColor } },
      axisLabel: { color: theme.textColor, fontSize: 10 },
    },
    series: [{
      type: 'bar', barWidth: '60%',
      data: durations.map(d => ({
        value: d.value,
        itemStyle: { color: getSubjectColor(d.id), borderRadius: [4, 4, 0, 0] },
      })),
    }],
  });
}

// 效率散点图（VIEW-13）: X=时长, Y=正确率
// @param {Object} chart — echarts 实例
// @param {Array} records — 学习记录（需含 duration, score, subject）
export function renderEfficiencyChart(chart, records) {
  if (!chart) return;
  const theme = getChartTheme();

  const points = records
    .filter(r => r.duration > 0 && r.score > 0)
    .map(r => ({
      value: [r.duration, r.score],
      name: r.subject,
    }));

  chart.setOption({
    backgroundColor: theme.bgColor,
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.75)', textStyle: { color: '#fff', fontSize: 12 },
      formatter: (p) => `${p.name}<br/>时长: ${p.value[0]}分钟<br/>正确率: ${p.value[1]}%`,
    },
    grid: { left: 48, right: 24, top: 16, bottom: 40 },
    xAxis: {
      type: 'value', name: '时长(分钟)', nameLocation: 'center', nameGap: 24,
      axisLine: { lineStyle: { color: theme.gridColor } },
      splitLine: { lineStyle: { color: theme.gridColor } },
      axisLabel: { color: theme.textColor, fontSize: 10 },
    },
    yAxis: {
      type: 'value', name: '正确率(%)', min: 0, max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: theme.gridColor } },
      axisLabel: { color: theme.textColor, fontSize: 10 },
    },
    series: [{
      type: 'scatter', symbolSize: 10,
      data: points,
      itemStyle: { color: theme.accent, opacity: 0.7 },
    }],
  });
}

// 时段热力图（VIEW-14）: 星期×6时段的学习分布
// @param {Object} chart — echarts 实例
// @param {Array} records — 学习记录（需含 timestamp, duration）
// 易错点: 星期计算 (getDay()+6)%7 使周一=0
export function renderTimeSlotChart(chart, records) {
  if (!chart) return;
  const theme = getChartTheme();

  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const slots = ['清晨(5-8)', '上午(8-12)', '午间(12-14)', '下午(14-18)', '晚间(18-22)', '深夜(22-5)'];

  function getSlot(hour) {
    if (hour >= 5 && hour < 8) return 0;
    if (hour >= 8 && hour < 12) return 1;
    if (hour >= 12 && hour < 14) return 2;
    if (hour >= 14 && hour < 18) return 3;
    if (hour >= 18 && hour < 22) return 4;
    return 5;
  }

  const grid = Array.from({ length: 7 }, () => Array(6).fill(0));
  for (const r of records) {
    if (!r.timestamp) continue;
    const d = new Date(r.timestamp);
    const day = (d.getDay() + 6) % 7; // Monday=0
    const slot = getSlot(d.getHours());
    grid[day][slot] += r.duration || 0;
  }

  const data = [];
  for (let day = 0; day < 7; day++) {
    for (let slot = 0; slot < 6; slot++) {
      data.push([slot, day, grid[day][slot]]);
    }
  }

  const maxVal = Math.max(...data.map(d => d[2]), 1);

  chart.setOption({
    backgroundColor: theme.bgColor,
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.75)', textStyle: { color: '#fff', fontSize: 12 },
      formatter: (p) => `${weekdays[p.value[1]]} ${slots[p.value[0]]}<br/>${p.value[2]} 分钟`,
    },
    grid: { left: 48, right: 24, top: 8, bottom: 40 },
    xAxis: {
      type: 'category', data: slots, splitArea: { show: true },
      axisLine: { lineStyle: { color: theme.gridColor } },
      axisLabel: { color: theme.textColor, fontSize: 10, rotate: 30 },
    },
    yAxis: {
      type: 'category', data: weekdays,
      axisLine: { lineStyle: { color: theme.gridColor } },
      axisLabel: { color: theme.textColor, fontSize: 11 },
    },
    visualMap: {
      min: 0, max: maxVal, show: false,
      inRange: { color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'] },
    },
    series: [{
      type: 'heatmap', data,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.3)' } },
    }],
  });
}

// 30天得分率趋势折线图（VIEW-15），含及格线标注
// @param {Object} chart — echarts 实例
// @param {Array} records — 学习记录（需含 timestamp, score）
// 易错点: 无数据的天显示 null，connectNulls 保持连线
export function renderScoreTrendChart(chart, records) {
  if (!chart) return;
  const theme = getChartTheme();
  const today = new Date();
  const days = [];
  const scoreData = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push(key.slice(5));
    const dayRecs = records.filter(r => r.timestamp && new Date(r.timestamp).toISOString().slice(0, 10) === key && r.score > 0);
    const avg = dayRecs.length > 0 ? Math.round(dayRecs.reduce((s, r) => s + r.score, 0) / dayRecs.length) : null;
    scoreData.push(avg);
  }

  chart.setOption({
    backgroundColor: theme.bgColor,
    tooltip: {
      trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.75)', textStyle: { color: '#fff', fontSize: 12 },
      formatter: (p) => {
        const v = p[0].value;
        return `${p[0].axisValue}<br/>得分率: ${v != null ? v + '%' : '无数据'}`;
      },
    },
    grid: { left: 40, right: 16, top: 24, bottom: 28 },
    xAxis: {
      type: 'category', data: days, boundaryGap: false,
      axisLine: { lineStyle: { color: theme.gridColor } },
      axisLabel: { color: theme.textColor, fontSize: 10, interval: 4 },
    },
    yAxis: {
      type: 'value', min: 0, max: 100, name: '%',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: theme.gridColor } },
      axisLabel: { color: theme.textColor, fontSize: 10 },
    },
    series: [{
      type: 'line', data: scoreData, smooth: true, connectNulls: true, symbol: 'circle', symbolSize: 4,
      lineStyle: { color: theme.success, width: 2 },
      itemStyle: { color: theme.success },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
        { offset: 0, color: theme.success + '30' },
        { offset: 1, color: theme.success + '05' },
      ]}},
      markLine: {
        silent: true, lineStyle: { color: theme.warning, type: 'dashed', width: 1 },
        data: [{ yAxis: 60, label: { formatter: '及格线', fontSize: 10, color: theme.textColor } }],
      },
    }],
  });
}

// 输入输出比例环形图（VIEW-16）: 练习/订正/阅读/网课
// @param {Object} chart — echarts 实例
// @param {Array} records — 学习记录（需含 activityType, duration）
// 易错点: activityType 缺失时默认归类为 practice
export function renderIORatioChart(chart, records) {
  if (!chart) return;
  const theme = getChartTheme();
  const activityMap = { practice: '做题', review: '订正', reading: '阅读', video: '网课' };
  const activityColors = { practice: theme.accent, review: theme.success, reading: theme.warning, video: '#9333ea' };

  const byType = {};
  for (const r of records) {
    const type = r.activityType || 'practice';
    byType[type] = (byType[type] || 0) + (r.duration || 0);
  }

  const pieData = Object.entries(byType).map(([type, value]) => ({
    name: activityMap[type] || type,
    value,
    itemStyle: { color: activityColors[type] || '#6b7280' },
  }));

  if (pieData.length === 0) {
    pieData.push({ name: '暂无数据', value: 1, itemStyle: { color: theme.gridColor } });
  }

  chart.setOption({
    backgroundColor: theme.bgColor,
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.75)', textStyle: { color: '#fff', fontSize: 12 },
      formatter: (p) => `${p.name}<br/>${p.value} 分钟 (${p.percent}%)`,
    },
    legend: {
      bottom: 0, textStyle: { color: theme.textColor, fontSize: 11 },
      itemWidth: 10, itemHeight: 10,
    },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
      data: pieData,
      label: { show: true, fontSize: 11, color: theme.textColor, formatter: '{b}\n{d}%' },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
    }],
  });
}

// 销毁 ECharts 实例，释放内存
// @param {Object} chart — echarts 实例
export function disposeChart(chart) {
  try { if (chart && chart.dispose) chart.dispose(); } catch {}
}
