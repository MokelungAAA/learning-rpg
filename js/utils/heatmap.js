// heatmap.js — 学习日历热力图渲染

const HEATMAP_DAYS = 169;
const WEEKDAY_LABELS = ['', '一', '', '三', '', '五', ''];

function buildDateMap(records) {
  const map = {};
  for (const r of records) {
    if (!r.timestamp) continue;
    const day = new Date(r.timestamp).toISOString().slice(0, 10);
    map[day] = (map[day] || 0) + (r.duration || 0);
  }
  return map;
}

function getHeatLevel(minutes) {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  if (minutes < 240) return 4;
  return 5;
}

function getMonthLabel(date) {
  const m = date.getMonth() + 1;
  return m + '月';
}

export function renderHeatmap(records) {
  const dateMap = buildDateMap(records);
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - HEATMAP_DAYS + 1);

  // Align to Sunday
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  const cells = [];
  const labels = [];
  let currentDate = new Date(startDate);
  let lastMonth = -1;

  while (currentDate <= today) {
    const key = currentDate.toISOString().slice(0, 10);
    const minutes = dateMap[key] || 0;
    const level = getHeatLevel(minutes);
    const month = currentDate.getMonth();

    if (currentDate.getDay() === 0 && month !== lastMonth) {
      labels.push(`<div class="heatmap-month">${getMonthLabel(currentDate)}</div>`);
      lastMonth = month;
    }

    cells.push(`<div class="heatmap-cell level-${level}" data-date="${key}" data-minutes="${minutes}" title="${key}: ${minutes}分钟"></div>`);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const weekdays = WEEKDAY_LABELS.map(l =>
    `<div class="heatmap-weekday">${l}</div>`
  ).join('');

  return `
    <div class="heatmap-container">
      <div class="heatmap-weekdays">${weekdays}</div>
      <div class="heatmap-grid">${cells.join('')}</div>
      <div class="heatmap-labels">${labels.join('')}</div>
    </div>
    <div class="heatmap-legend">
      <span class="heatmap-legend-label">少</span>
      <div class="heatmap-cell level-0"></div>
      <div class="heatmap-cell level-1"></div>
      <div class="heatmap-cell level-2"></div>
      <div class="heatmap-cell level-3"></div>
      <div class="heatmap-cell level-4"></div>
      <div class="heatmap-cell level-5"></div>
      <span class="heatmap-legend-label">多</span>
    </div>`;
}
