// charts.js — ECharts 图表配置与渲染
import { SUBJECTS } from '../config.js';

let echartsLoaded = false;
let echartsLib = null;

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

function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

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

function getSubjectColor(id) {
  const colors = {
    math: '#2563eb', chinese: '#dc2626', english: '#16a34a',
    physics: '#9333ea', chemistry: '#ea580c', biology: '#0d9488',
    politics: '#be185d', history: '#854d0e', geography: '#0284c7',
  };
  return colors[id] || '#6b7280';
}

export function initChart(container) {
  if (!echartsLib) return null;
  const chart = echartsLib.init(container, null, { renderer: 'canvas' });
  return chart;
}

// VIEW-10: 30天XP趋势折线图
export function renderXPTrendChart(chart, records) {
  if (!chart) return;
  const theme = getChartTheme();
  const today = new Date();
  const days = [];
  const xpData = [];

  for (let i = 29; i >= 0; i--) {
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

// VIEW-11: 学科时长柱状图
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

// VIEW-13: 效率散点图 (时长 vs 正确率)
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

// VIEW-14: 时段热力图 (星期 × 6时段)
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

export function disposeChart(chart) {
  if (chart && chart.dispose) chart.dispose();
}
