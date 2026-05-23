// heatmap.js — 学习日历热力图渲染（GitHub 贡献图风格）
// 功能: 将学习记录按日聚合，生成 24 周（168天+今天）的热力图 HTML
// 热力等级: 0=无学习, 1=<30min, 2=<60min, 3=<120min, 4=<240min, 5=240min+
// 易错点: 日期对齐到周日（周起始），月份标签只在周日列显示

const HEATMAP_DAYS = 169;
const WEEKDAY_LABELS = ['', '一', '', '三', '', '五', ''];

// 将记录按日期聚合为 {YYYY-MM-DD → 总分钟数}
// @param {Array} records — 学习记录（需含 timestamp, duration）
// @returns {Object} 日期到分钟数的映射
function buildDateMap(records) {
  const map = {};
  for (const r of records) {
    if (!r.timestamp) continue;
    const day = new Date(r.timestamp).toISOString().slice(0, 10);
    map[day] = (map[day] || 0) + (r.duration || 0);
  }
  return map;
}

// 分钟数→热力等级（0-5，对应 CSS class level-0 ~ level-5）
// @param {number} minutes — 学习分钟数
// @returns {number} 热力等级
function getHeatLevel(minutes) {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  if (minutes < 240) return 4;
  return 5;
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
