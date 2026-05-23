// reading.js — 阅读记录页（弹窗录入+书架+记录列表+图表）
// 读取: READING_RECORDS
// 写入: READING_RECORDS（增/改/删）
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';
import EventBus from '../event-bus.js';
import Toast from '../components/toast.js';
import { loadECharts, initChart, showChartLoading, hideChartLoading, disposeChart } from '../utils/charts.js';

const getRecords = () => Store.get(StorageKeys.READING_RECORDS) || [];
const saveRecords = (r) => Store.set(StorageKeys.READING_RECORDS, r);

// 阅读分类和格式常量
const CATEGORIES = ['文学小说','历史','哲学','科普/科学','技术/编程','心理学','社会学','经济学','传记','个人成长','教材/教辅','其他'];
const FORMATS = [{ value: 'paper', label: '纸质书' }, { value: 'ebook', label: '电子书' }, { value: 'audio', label: '有声书' }];
const BOOK_STATUSES = [
  { value: 'reading', label: '📖 当前阅读', color: '#3B82F6' },
  { value: 'finished', label: '✅ 已完成', color: '#10B981' },
  { value: 'paused', label: '⏸ 暂停', color: '#F59E0B' },
  { value: 'abandoned', label: '❌ 放弃', color: '#EF4444' },
];

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

// 书架视图：按书名聚合，显示阅读次数/总时长/页数/最近日期
function renderBookshelf(records) {
  const books = {};
  for (const r of records) {
    const key = r.bookTitle;
    if (!books[key]) books[key] = { title: key, author: r.author || '', category: r.category || '', sessions: 0, totalMin: 0, pages: 0, lastDate: '', format: r.format || 'paper', status: 'reading', completion: 0 };
    books[key].sessions++;
    books[key].totalMin += r.durationMinutes || 0;
    books[key].pages += r.pagesRead || 0;
    if (r.timestamp > books[key].lastDate) {
      books[key].lastDate = r.timestamp;
      if (r.status) books[key].status = r.status;
      if (r.completion) books[key].completion = r.completion;
    }
  }
  const entries = Object.values(books).sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  if (entries.length === 0) return fold('bookshelf', '📚 书架', '<p class="pomo-empty">暂无阅读记录</p>');

  const statusMap = Object.fromEntries(BOOK_STATUSES.map(s => [s.value, s]));
  const items = entries.map(b => {
    const date = b.lastDate ? new Date(b.lastDate).toLocaleDateString('zh-CN') : '';
    const st = statusMap[b.status] || statusMap.reading;
    const badge = `<span class="book-status-badge" style="color:${st.color}">${st.label}</span>`;
    const pct = b.completion > 0 ? `<div class="book-completion"><div class="book-completion-fill" style="width:${b.completion}%"></div></div>` : '';
    return `<div class="book-card">
      <div class="book-cover">📖</div>
      <div class="book-info">
        <div class="book-title">${b.title} ${badge}</div>
        <div class="book-meta">${b.author ? b.author + ' · ' : ''}${b.category}</div>
        <div class="book-stats">${b.sessions}次 · ${b.totalMin}分钟${b.pages > 0 ? ' · ' + b.pages + '页' : ''}</div>
        ${pct}
      </div>
      <div class="book-date">${date}</div>
    </div>`;
  }).join('');
  return fold('bookshelf', `📚 书架 · ${entries.length}本`, `<div class="book-list">${items}</div>`);
}

// 阅读记录列表（最多显示20条）+ 编辑/删除按钮
function renderRecordList(records) {
  if (records.length === 0) return '';
  const items = records.slice(0, 20).map(r => {
    const date = r.timestamp ? new Date(r.timestamp).toLocaleDateString('zh-CN') : '';
    const rating = r.rating ? '⭐'.repeat(r.rating) : '';
    return `<div class="reading-item" data-id="${r.recordID}">
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
      <div class="reading-item-actions">
        <button class="reading-edit-btn" data-id="${r.recordID}" title="编辑">✏️</button>
        <button class="reading-delete-btn" data-id="${r.recordID}" title="删除">🗑️</button>
      </div>
    </div>`;
  }).join('');
  return fold('records', `📝 阅读记录 · ${records.length}条`, `<div class="reading-list">${items}</div>`);
}

// 图表容器占位（月度柱状图+分类饼图，折叠展开时懒加载）
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
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.65 · 开发者区</p>
  </div>`;
}

// 新增阅读记录弹窗：动态创建 overlay，提交后 reload 整页
// 坑: overlay 挂 body 上，提交后 window.location.reload() 刷新
function openAddModal() {
  const catOpts = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  const fmtOpts = FORMATS.map(f => `<option value="${f.value}">${f.label}</option>`).join('');
  const statusOpts = BOOK_STATUSES.map(s => `<option value="${s.value}">${s.label}</option>`).join('');

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
          <label class="entry-label">状态</label>
          <select id="rd-status" class="entry-select">${statusOpts}</select>
        </div>
      </div>
      <div class="entry-row">
        <div class="entry-field entry-third">
          <label class="entry-label">起始页</label>
          <input type="number" id="rd-page-start" class="entry-input" min="0" placeholder="0">
        </div>
        <div class="entry-field entry-third">
          <label class="entry-label">结束页</label>
          <input type="number" id="rd-page-end" class="entry-input" min="0" placeholder="0">
        </div>
        <div class="entry-field entry-third">
          <label class="entry-label">完成%</label>
          <input type="number" id="rd-completion" class="entry-input" min="0" max="100" placeholder="0">
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
      status: document.getElementById('rd-status')?.value || 'reading',
      durationMinutes: parseInt(document.getElementById('rd-duration').value, 10) || 30,
      pageStart: parseInt(document.getElementById('rd-page-start')?.value, 10) || 0,
      pageEnd: parseInt(document.getElementById('rd-page-end')?.value, 10) || 0,
      completion: parseInt(document.getElementById('rd-completion')?.value, 10) || 0,
      format: document.getElementById('rd-format').value,
      rating: parseInt(document.getElementById('rd-rating').value, 10) || 0,
      notes: document.getElementById('rd-notes').value || '',
    };
    // 如果填写了起止页但没填完成百分比，自动计算
    if (record.pageStart > 0 && record.pageEnd > 0 && record.completion === 0) {
      record.completion = Math.min(100, Math.round((record.pageEnd - record.pageStart) / Math.max(1, record.pageEnd) * 100));
    }
    const records = getRecords();
    records.push(record);
    saveRecords(records);
    overlay.remove();
    Toast.show('阅读记录已保存', 'success');
    EventBus.emit('reading:added', record);
    window.location.reload();
  });
}

// 编辑阅读记录弹窗：回填表单，提交后原地更新并 reload
function openEditModal(recordID) {
  const records = getRecords();
  const r = records.find(rec => rec.recordID === recordID);
  if (!r) return;

  const catOpts = CATEGORIES.map(c => `<option value="${c}"${r.category === c ? ' selected' : ''}>${c}</option>`).join('');
  const fmtOpts = FORMATS.map(f => `<option value="${f.value}"${r.format === f.value ? ' selected' : ''}>${f.label}</option>`).join('');

  const overlay = document.createElement('div');
  overlay.className = 'entry-overlay';
  overlay.id = 'reading-overlay';
  overlay.innerHTML = `<div class="entry-modal">
    <div class="entry-header">
      <span class="entry-title">✏️ 编辑阅读记录</span>
      <button class="entry-close" id="reading-close">✕</button>
    </div>
    <form id="reading-form" class="entry-form">
      <div class="entry-field">
        <label class="entry-label">书名 *</label>
        <input type="text" id="rd-title" class="entry-input" required value="${r.bookTitle}">
      </div>
      <div class="entry-row">
        <div class="entry-field entry-field-half">
          <label class="entry-label">作者</label>
          <input type="text" id="rd-author" class="entry-input" value="${r.author || ''}">
        </div>
        <div class="entry-field entry-field-half">
          <label class="entry-label">分类</label>
          <select id="rd-category" class="entry-select">${catOpts}</select>
        </div>
      </div>
      <div class="entry-row">
        <div class="entry-field entry-field-half">
          <label class="entry-label">时长 (分钟) *</label>
          <input type="number" id="rd-duration" class="entry-input" min="1" value="${r.durationMinutes || 30}" required>
        </div>
        <div class="entry-field entry-field-half">
          <label class="entry-label">页数</label>
          <input type="number" id="rd-pages" class="entry-input" min="0" value="${r.pagesRead || 0}">
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
            ${[1,2,3,4,5].map(i => `<option value="${i}"${r.rating === i ? ' selected' : ''}>${'⭐'.repeat(i)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="entry-field">
        <label class="entry-label">笔记</label>
        <textarea id="rd-notes" class="entry-textarea" rows="2">${r.notes || ''}</textarea>
      </div>
      <button type="submit" class="entry-submit">保存修改</button>
    </form>
  </div>`;

  document.body.appendChild(overlay);
  document.getElementById('reading-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('reading-form').addEventListener('submit', (e) => {
    e.preventDefault();
    r.bookTitle = document.getElementById('rd-title').value;
    r.author = document.getElementById('rd-author').value || '';
    r.category = document.getElementById('rd-category').value;
    r.durationMinutes = parseInt(document.getElementById('rd-duration').value, 10) || 30;
    r.pagesRead = parseInt(document.getElementById('rd-pages').value, 10) || 0;
    r.format = document.getElementById('rd-format').value;
    r.rating = parseInt(document.getElementById('rd-rating').value, 10) || 0;
    r.notes = document.getElementById('rd-notes').value || '';
    saveRecords(records);
    overlay.remove();
    Toast.show('阅读记录已更新', 'success');
    window.location.reload();
  });
}

// 删除确认弹窗：不可撤销，删除后 reload
function deleteRecord(recordID) {
  const records = getRecords();
  const r = records.find(rec => rec.recordID === recordID);
  if (!r) return;

  const overlay = document.createElement('div');
  overlay.className = 'entry-overlay';
  overlay.id = 'reading-overlay';
  overlay.innerHTML = `<div class="entry-modal" style="max-width:300px">
    <div class="entry-header"><span class="entry-title">确认删除</span></div>
    <p style="padding:var(--sp-2);color:var(--color-text-2);font-size:var(--fs-sm)">删除「${r.bookTitle}」的阅读记录？此操作不可撤销。</p>
    <div style="display:flex;gap:var(--sp-2);padding:var(--sp-2);justify-content:flex-end">
      <button class="settings-btn" id="del-cancel">取消</button>
      <button class="settings-btn" id="del-confirm" style="color:var(--color-error)">删除</button>
    </div>
  </div>`;

  document.body.appendChild(overlay);
  document.getElementById('del-cancel').addEventListener('click', () => overlay.remove());
  document.getElementById('del-confirm').addEventListener('click', () => {
    const updated = records.filter(rec => rec.recordID !== recordID);
    saveRecords(updated);
    overlay.remove();
    Toast.show('阅读记录已删除', 'success');
    window.location.reload();
  });
}

// 异步初始化图表：月度阅读时长柱状图 + 分类饼图
// 坑: 记录为空时需隐藏 loading spinner
async function initCharts() {
  const monthlyEl = document.getElementById('reading-monthly-chart');
  const catEl = document.getElementById('reading-category-chart');
  if (monthlyEl) showChartLoading(monthlyEl);
  if (catEl) showChartLoading(catEl);

  const ec = await loadECharts();
  if (!ec) { if (monthlyEl) hideChartLoading(monthlyEl); if (catEl) hideChartLoading(catEl); return; }
  const records = getRecords();
  if (records.length === 0) { if (monthlyEl) hideChartLoading(monthlyEl); if (catEl) hideChartLoading(catEl); return; }

  // 月度柱状图
  if (monthlyEl) {
    hideChartLoading(monthlyEl);
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
  if (catEl) {
    hideChartLoading(catEl);
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

// afterRender: 新增按钮 + 编辑/删除按钮 + 折叠面板 + 图表懒加载
// 返回清理函数，dispose 所有 ECharts 实例
export function afterRender() {
  const addBtn = document.getElementById('reading-add');
  const onAdd = () => openAddModal();
  addBtn.addEventListener('click', onAdd);

  // 编辑/删除按钮
  const editBtns = document.querySelectorAll('.reading-edit-btn');
  const deleteBtns = document.querySelectorAll('.reading-delete-btn');
  const onEdit = (e) => openEditModal(e.currentTarget.dataset.id);
  const onDelete = (e) => deleteRecord(e.currentTarget.dataset.id);
  editBtns.forEach(b => b.addEventListener('click', onEdit));
  deleteBtns.forEach(b => b.addEventListener('click', onDelete));

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
    editBtns.forEach(b => b.removeEventListener('click', onEdit));
    deleteBtns.forEach(b => b.removeEventListener('click', onDelete));
    foldHeaders.forEach(h => h.removeEventListener('click', onFold));
    chartInstances.forEach(c => disposeChart(c));
    chartInstances = [];
  };
}
