// reading.js — 阅读记录页（READ-01：弹窗+列表+筛选+书架+图表）
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';
import EventBus from '../event-bus.js';
import Toast from '../components/toast.js';
import { loadECharts, initChart, disposeChart } from '../utils/charts.js';

const getRecords = () => Store.get(StorageKeys.READING_RECORDS) || [];
const saveRecords = (r) => Store.set(StorageKeys.READING_RECORDS, r);

const CATEGORIES = ['文学小说','历史','哲学','科普/科学','技术/编程','心理学','社会学','经济学','传记','个人成长','教材/教辅','其他'];
const FORMATS = [{ value: 'paper', label: '纸质书' }, { value: 'ebook', label: '电子书' }, { value: 'audio', label: '有声书' }];

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

// 书架视图
function renderBookshelf(records) {
  const books = {};
  for (const r of records) {
    const key = r.bookTitle;
    if (!books[key]) books[key] = { title: key, author: r.author || '', category: r.category || '', sessions: 0, totalMin: 0, pages: 0, lastDate: '', format: r.format || 'paper' };
    books[key].sessions++;
    books[key].totalMin += r.durationMinutes || 0;
    books[key].pages += r.pagesRead || 0;
    if (r.timestamp > books[key].lastDate) books[key].lastDate = r.timestamp;
  }
  const entries = Object.values(books).sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  if (entries.length === 0) return fold('bookshelf', '📚 书架', '<p class="pomo-empty">暂无阅读记录</p>');

  const items = entries.map(b => {
    const date = b.lastDate ? new Date(b.lastDate).toLocaleDateString('zh-CN') : '';
    return `<div class="book-card">
      <div class="book-cover">📖</div>
      <div class="book-info">
        <div class="book-title">${b.title}</div>
        <div class="book-meta">${b.author ? b.author + ' · ' : ''}${b.category}</div>
        <div class="book-stats">${b.sessions}次 · ${b.totalMin}分钟${b.pages > 0 ? ' · ' + b.pages + '页' : ''}</div>
      </div>
      <div class="book-date">${date}</div>
    </div>`;
  }).join('');
  return fold('bookshelf', `📚 书架 · ${entries.length}本`, `<div class="book-list">${items}</div>`);
}

// 阅读记录列表
function renderRecordList(records) {
  if (records.length === 0) return '';
  const items = records.slice(0, 20).map(r => {
    const date = r.timestamp ? new Date(r.timestamp).toLocaleDateString('zh-CN') : '';
    const rating = r.rating ? '⭐'.repeat(r.rating) : '';
    return `<div class="reading-item">
      <div class="reading-item-header">
        <span class="reading-item-title">${r.bookTitle}</span>
        <span class="reading-item-date">${date}</span>
      </div>
      <div class="reading-item-body">
        ${r.category ? `<span class="reading-tag">${r.category}</span>` : ''}
        ${r.format ? `<span class="reading-tag">${FORMATS.find(f => f.value === r.format)?.label || r.format}</span>` : ''}
        ${rating ? `<span class="reading-rating">${rating}</span>` : ''}
      </div>
      <div class="reading-item-footer">
        <span>${r.durationMinutes || 0}分钟</span>
        ${r.pagesRead ? `<span>${r.pagesRead}页</span>` : ''}
        ${r.notes ? `<span class="reading-notes">${r.notes}</span>` : ''}
      </div>
    </div>`;
  }).join('');
  return fold('records', `📝 阅读记录 · ${records.length}条`, `<div class="reading-list">${items}</div>`);
}

// 月度图表
function renderChartSection() {
  return fold('reading-charts', '📈 阅读统计', '<div class="chart-container" id="reading-monthly-chart" style="height:220px"></div><div class="chart-container" id="reading-category-chart" style="height:220px;margin-top:var(--sp-2)"></div>');
}

export function render() {
  const records = getRecords();
  return `<div class="page-enter">
    <a href="#/data" class="page-back">← 返回数据</a>
    <div class="reading-header">
      <div class="section-title">📖 阅读记录</div>
      <button class="reading-add-btn" id="reading-add">+ 记录阅读</button>
    </div>
    ${renderBookshelf(records)}
    ${renderRecordList(records)}
    ${renderChartSection()}
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.18 · 阅读系统</p>
  </div>`;
}

// 录入弹窗
function openAddModal() {
  const catOpts = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  const fmtOpts = FORMATS.map(f => `<option value="${f.value}">${f.label}</option>`).join('');

  const overlay = document.createElement('div');
  overlay.className = 'entry-overlay';
  overlay.id = 'reading-overlay';
  overlay.innerHTML = `<div class="entry-modal">
    <div class="entry-header">
      <span class="entry-title">📖 记录阅读</span>
      <button class="entry-close" id="reading-close">✕</button>
    </div>
    <form id="reading-form" class="entry-form">
      <div class="entry-field">
        <label class="entry-label">书名 *</label>
        <input type="text" id="rd-title" class="entry-input" required placeholder="书名">
      </div>
      <div class="entry-row">
        <div class="entry-field entry-field-half">
          <label class="entry-label">作者</label>
          <input type="text" id="rd-author" class="entry-input" placeholder="作者">
        </div>
        <div class="entry-field entry-field-half">
          <label class="entry-label">分类</label>
          <select id="rd-category" class="entry-select">${catOpts}</select>
        </div>
      </div>
      <div class="entry-row">
        <div class="entry-field entry-field-half">
          <label class="entry-label">时长 (分钟) *</label>
          <input type="number" id="rd-duration" class="entry-input" min="1" value="30" required>
        </div>
        <div class="entry-field entry-field-half">
          <label class="entry-label">页数</label>
          <input type="number" id="rd-pages" class="entry-input" min="0" placeholder="0">
        </div>
      </div>
      <div class="entry-row">
        <div class="entry-field entry-field-half">
          <label class="entry-label">格式</label>
          <select id="rd-format" class="entry-select">${fmtOpts}</select>
        </div>
        <div class="entry-field entry-field-half">
          <label class="entry-label">评分</label>
          <select id="rd-rating" class="entry-select">
            <option value="">不评分</option>
            ${[1,2,3,4,5].map(i => `<option value="${i}">${'⭐'.repeat(i)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="entry-field">
        <label class="entry-label">笔记</label>
        <textarea id="rd-notes" class="entry-textarea" rows="2" placeholder="阅读感想..."></textarea>
      </div>
      <button type="submit" class="entry-submit">保存</button>
    </form>
  </div>`;

  document.body.appendChild(overlay);

  document.getElementById('reading-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('reading-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const record = {
      recordID: 'rd-' + Date.now(),
      timestamp: new Date().toISOString(),
      bookTitle: document.getElementById('rd-title').value,
      author: document.getElementById('rd-author').value || '',
      category: document.getElementById('rd-category').value,
      durationMinutes: parseInt(document.getElementById('rd-duration').value, 10) || 30,
      pagesRead: parseInt(document.getElementById('rd-pages').value, 10) || 0,
      format: document.getElementById('rd-format').value,
      rating: parseInt(document.getElementById('rd-rating').value, 10) || 0,
      notes: document.getElementById('rd-notes').value || '',
    };
    const records = getRecords();
    records.push(record);
    saveRecords(records);
    overlay.remove();
    Toast.show('阅读记录已保存', 'success');
    EventBus.emit('reading:added', record);
    window.location.reload();
  });
}

async function initCharts() {
  const ec = await loadECharts();
  if (!ec) return;
  const records = getRecords();
  if (records.length === 0) return;

  // 月度柱状图
  const monthlyEl = document.getElementById('reading-monthly-chart');
  if (monthlyEl) {
    const chart = initChart(monthlyEl);
    if (chart) {
      chartInstances.push(chart);
      const byMonth = {};
      for (const r of records) {
        const m = r.timestamp ? r.timestamp.slice(0, 7) : '';
        if (m) byMonth[m] = (byMonth[m] || 0) + (r.durationMinutes || 0);
      }
      const months = Object.keys(byMonth).sort().slice(-6);
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 10, top: 10, bottom: 30 },
        xAxis: { type: 'category', data: months.map(m => m.slice(5)) },
        yAxis: { type: 'value', name: '分钟' },
        series: [{ type: 'bar', data: months.map(m => byMonth[m] || 0), itemStyle: { color: '#62A0EA', borderRadius: [4, 4, 0, 0] } }],
      });
    }
  }

  // 分类饼图
  const catEl = document.getElementById('reading-category-chart');
  if (catEl) {
    const chart = initChart(catEl);
    if (chart) {
      chartInstances.push(chart);
      const byCat = {};
      for (const r of records) {
        const c = r.category || '其他';
        byCat[c] = (byCat[c] || 0) + (r.durationMinutes || 0);
      }
      chart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie', radius: ['40%', '70%'],
          data: Object.entries(byCat).map(([name, value]) => ({ name, value })),
          label: { fontSize: 11 },
        }],
      });
    }
  }
}

export function afterRender() {
  const addBtn = document.getElementById('reading-add');
  const onAdd = () => openAddModal();
  addBtn.addEventListener('click', onAdd);

  // 折叠面板
  const foldHeaders = document.querySelectorAll('.fold-header');
  const onFold = (e) => {
    const { fold: fid } = e.currentTarget.dataset;
    const body = document.getElementById(`fold-${fid}`);
    const arrow = e.currentTarget.querySelector('.fold-arrow');
    if (body) body.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
    if (fid === 'reading-charts' && body?.classList.contains('open') && chartInstances.length === 0) initCharts();
  };
  foldHeaders.forEach(h => h.addEventListener('click', onFold));

  return () => {
    addBtn.removeEventListener('click', onAdd);
    foldHeaders.forEach(h => h.removeEventListener('click', onFold));
    chartInstances.forEach(c => disposeChart(c));
    chartInstances = [];
  };
}
