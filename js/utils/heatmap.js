// heatmap.js — 学习日历热力图渲染（GitHub 贡献图风格）
// §12.1: 热力等级基于每日 XP（0/1-25/26-50/51-100/100+）
// 易错点: 日期对齐到周日（周起始），月份标签只在周日列显示

const HEATMAP_DAYS = 169;
const WEEKDAY_LABELS = ['', '一', '', '三', '', '五', ''];

// 将记录按日期聚合为 {YYYY-MM-DD → 总 XP}
// @param {Array} records — 学习记录（需含 timestamp, xp）
// @param {Array} [readingRecords] — 阅读记录（需含 timestamp, durationMinutes），按 1分钟=1XP 换算
// @returns {Object} 日期到 XP 的映射
function buildDateMap(records, readingRecords) {
  const map = {};
  for (const r of records) {
    if (!r.timestamp) continue;
    const day = new Date(r.timestamp).toISOString().slice(0, 10);
    map[day] = (map[day] || 0) + (r.xp || 0);
  }
  if (readingRecords) {
    for (const r of readingRecords) {
      if (!r.timestamp) continue;
      const day = new Date(r.timestamp).toISOString().slice(0, 10);
      map[day] = (map[day] || 0) + Math.round((r.durationMinutes || 0) / 10);
    }
  }
  return map;
}

// XP→热力等级（§12.1: 0/1-25/26-50/51-100/100+，对应 CSS class level-0 ~ level-4）
// @param {number} xp — 当日 XP
// @returns {number} 热力等级
function getHeatLevel(xp) {
  if (xp <= 0) return 0;
  if (xp <= 25) return 1;
  if (xp <= 50) return 2;
  if (xp <= 100) return 3;
  return 4;
}

// 日期→月份标签（如"5月"）
// @param {Date} date — 日期对象
// @returns {string} 月份标签
function getMonthLabel(date) {
  const m = date.getMonth() + 1;
  return m + '月';
}

// 渲染完整热力图 HTML（含网格、月份标签、图例）
// @param {Array} records — 学习记录数组
// @returns {string} 热力图 HTML 字符串
export function renderHeatmap(records, readingRecords) {
  const dateMap = buildDateMap(records, readingRecords);
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
    const xp = dateMap[key] || 0;
    const level = getHeatLevel(xp);
    const month = currentDate.getMonth();

    if (currentDate.getDay() === 0 && month !== lastMonth) {
      labels.push(`<div class="heatmap-month">${getMonthLabel(currentDate)}</div>`);
      lastMonth = month;
    }

    cells.push(`<div class="heatmap-cell level-${level}" data-date="${key}" data-xp="${xp}" title="${key}: ${xp} XP"></div>`);
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
      <span class="heatmap-legend-label">多</span>
    </div>`;
}
