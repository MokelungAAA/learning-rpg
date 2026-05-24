// log.js — 日志管理页（列表+筛选+搜索+编辑+删除）
// 读取: STUDY_RECORDS, USER_PROFILE
// 写入: STUDY_RECORDS（编辑/删除时）
// 坑: 模块级 filteredRecords/currentPage 状态，页面切换需重置
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import EventBus from '../event-bus.js';
import Toast from '../components/toast.js';
import { getSubjectIcon, calcXP } from '../utils/level.js';

// 分页参数 + 模块级筛选结果缓存
const PAGE_SIZE = 20;
let currentPage = 1;
let filteredRecords = [];

function getRecords() {
  return Store.get(StorageKeys.STUDY_RECORDS) || [];
}

function saveRecords(records) {
  Store.set(StorageKeys.STUDY_RECORDS, records);
}

// subject id/name 双向查找（记录中两种格式混用）
function getSubjectName(id) {
  const s = SUBJECTS.find(s => s.id === id || s.name === id);
  return s ? s.name : id;
}

function getSubjectId(name) {
  const s = SUBJECTS.find(s => s.id === name || s.name === name);
  return s ? s.id : name;
}

// 多条件筛选：学科/类型/日期范围/全文搜索
// 坑: dateTo 需 +86400000（包含当天）
function filterRecords(records, filters) {
  let result = [...records];
  if (filters.subject) {
    result = result.filter(r => r.subject === filters.subject || getSubjectName(r.subject) === filters.subject);
  }
  if (filters.activityType) {
    result = result.filter(r => r.activityType === filters.activityType);
  }
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    result = result.filter(r => r.timestamp && new Date(r.timestamp).getTime() >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime() + 86400000;
    result = result.filter(r => r.timestamp && new Date(r.timestamp).getTime() <= to);
  }
  // LOG-03: 搜索
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(r => {
      const text = [r.subject, r.textbook, r.section, r.notes, ...(r.knowledgePoints || [])].join(' ').toLowerCase();
      return text.includes(q);
    });
  }
  return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// 搜索结果高亮：用 <mark> 包裹第一个匹配子串
function highlightText(text, query) {
  if (!query || !text) return text || '';
  const q = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;
  return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + q.length) + '</mark>' + text.slice(idx + q.length);
}

// 筛选 UI：搜索框 + 学科/类型下拉 + 日期范围
function renderFilters() {
  const subjectOpts = SUBJECTS.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  return `<div class="log-filters">
    <div class="log-filter-row">
      <input type="text" id="log-search" class="log-search-input" placeholder="搜索知识点/学科/备注...">
    </div>
    <div class="log-filter-row">
      <select id="log-filter-subject" class="log-filter-select">
        <option value="">全部学科</option>
        ${subjectOpts}
      </select>
      <select id="log-filter-activity" class="log-filter-select">
        <option value="">全部类型</option>
        <option value="practice">做题</option>
        <option value="review">订正</option>
        <option value="reading">阅读</option>
        <option value="video">网课</option>
      </select>
      <input type="date" id="log-filter-from" class="log-filter-date" title="开始日期">
      <input type="date" id="log-filter-to" class="log-filter-date" title="结束日期">
    </div>
    <div class="log-filter-summary" id="log-filter-summary"></div>
  </div>`;
}

// 单条记录卡片：学科图标+高亮匹配+编辑/删除按钮
// query 用于搜索高亮
function renderRecordItem(record, query) {
  const date = record.timestamp ? new Date(record.timestamp).toLocaleDateString('zh-CN') : '';
  const time = record.timestamp ? new Date(record.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
  const subject = getSubjectName(record.subject);
  const sid = getSubjectId(record.subject);
  const icon = getSubjectIcon(sid);
  const kps = (record.knowledgePoints || []).map(k => highlightText(k, query)).join(', ');
  const activityMap = { practice: '做题', review: '订正', reading: '阅读', video: '网课' };

  return `<div class="log-item" data-id="${record.id}">
    <div class="log-item-header">
      <span class="log-item-icon">${icon}</span>
      <span class="log-item-subject">${highlightText(subject, query)}</span>
      <span class="log-item-activity">${activityMap[record.activityType] || '学习'}</span>
      <span class="log-item-date">${date} ${time}</span>
    </div>
    <div class="log-item-body">
      ${record.textbook ? `<span class="log-item-textbook">${highlightText(record.textbook, query)}</span>` : ''}
      ${kps ? `<span class="log-item-kps">${kps}</span>` : ''}
    </div>
    <div class="log-item-footer">
      <span class="log-item-score">${record.score > 0 ? record.score + '分' : '--'}</span>
      <span class="log-item-duration">${record.duration}分钟</span>
      <span class="log-item-xp">+${record.xp || 0}XP</span>
      <div class="log-item-actions">
        <button class="log-edit-btn" data-id="${record.id}" title="编辑">✏️</button>
        <button class="log-delete-btn" data-id="${record.id}" title="删除">🗑️</button>
      </div>
    </div>
  </div>`;
}

// 渲染分页列表 + 更新筛选摘要 + 控制"加载更多"按钮
function renderList() {
  const query = document.getElementById('log-search')?.value || '';
  const start = 0;
  const end = currentPage * PAGE_SIZE;
  const pageRecords = filteredRecords.slice(start, end);
  const hasMore = end < filteredRecords.length;

  const list = document.getElementById('log-list');
  if (!list) return;
  list.innerHTML = pageRecords.map(r => renderRecordItem(r, query)).join('');

  const summary = document.getElementById('log-filter-summary');
  if (summary) summary.textContent = `共 ${filteredRecords.length} 条记录${filteredRecords.length > end ? `，显示前 ${end} 条` : ''}`;

  const loadMore = document.getElementById('log-load-more');
  if (loadMore) loadMore.style.display = hasMore ? 'block' : 'none';
}

export function render() {
  const records = getRecords();
  filteredRecords = filterRecords(records, {});
  currentPage = 1;

  return `<div class="page-enter">
    <a href="#/data" class="page-back">← 返回数据</a>
    <div class="log-header">
      <div class="section-title">📋 学习日志</div>
    </div>
    ${renderFilters()}
    <div id="log-list" class="log-list"></div>
    <button id="log-load-more" class="log-load-more" style="display:none">加载更多</button>
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.126 · 开发者区</p>
  </div>`;
}

// 编辑弹窗：动态创建 overlay，修改后重算 XP 并保存
// 坑: XP 用 calcXP 重算，需构造 profile._runtimeTotalXP
// 坑: overlay 挂在 document.body 上，不是页面容器内
function openEditModal(recordId) {
  const records = getRecords();
  const record = records.find(r => r.id === recordId);
  if (!record) return;

  const subjectOpts = SUBJECTS.map(s =>
    `<option value="${s.id}"${(record.subject === s.id || record.subject === s.name) ? ' selected' : ''}>${s.name}</option>`
  ).join('');
  const activityOpts = [
    { value: 'practice', label: '做题' },
    { value: 'review', label: '订正' },
    { value: 'reading', label: '阅读' },
    { value: 'video', label: '网课' },
  ].map(a => `<option value="${a.value}"${record.activityType === a.value ? ' selected' : ''}>${a.label}</option>`).join('');

  const overlay = document.createElement('div');
  overlay.className = 'entry-overlay';
  overlay.id = 'edit-overlay';
  overlay.innerHTML = `<div class="entry-modal">
    <div class="entry-header">
      <span class="entry-title">✏️ 编辑记录</span>
      <button class="entry-close" id="edit-close">✕</button>
    </div>
    <form id="edit-form" class="entry-form">
      <div class="entry-row">
        <div class="entry-field entry-field-half">
          <label class="entry-label">学科</label>
          <select id="edit-subject" class="entry-select">${subjectOpts}</select>
        </div>
        <div class="entry-field entry-field-half">
          <label class="entry-label">类型</label>
          <select id="edit-activity" class="entry-select">${activityOpts}</select>
        </div>
      </div>
      <div class="entry-field">
        <label class="entry-label">教材</label>
        <input type="text" id="edit-textbook" class="entry-input" value="${record.textbook || ''}" placeholder="教材名">
      </div>
      <div class="entry-row">
        <div class="entry-field entry-field-half">
          <label class="entry-label">得分</label>
          <input type="number" id="edit-score" class="entry-input" min="0" max="100" value="${record.score || 0}">
        </div>
        <div class="entry-field entry-field-half">
          <label class="entry-label">时长 (分钟)</label>
          <input type="number" id="edit-duration" class="entry-input" min="1" value="${record.duration || 30}">
        </div>
      </div>
      <div class="entry-field">
        <label class="entry-label">知识点（逗号分隔）</label>
        <input type="text" id="edit-kps" class="entry-input" value="${(record.knowledgePoints || []).join(', ')}" placeholder="知识点1, 知识点2">
      </div>
      <div class="entry-field">
        <label class="entry-label">备注</label>
        <textarea id="edit-notes" class="entry-textarea" rows="2">${record.notes || ''}</textarea>
      </div>
      <button type="submit" class="entry-submit">保存修改</button>
    </form>
  </div>`;

  document.body.appendChild(overlay);

  document.getElementById('edit-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const idx = records.findIndex(r => r.id === recordId);
    if (idx === -1) return;
    const duration = parseInt(document.getElementById('edit-duration').value, 10) || 30;
    const score = parseInt(document.getElementById('edit-score').value, 10) || 0;
    records[idx].subject = document.getElementById('edit-subject').value;
    records[idx].activityType = document.getElementById('edit-activity').value;
    records[idx].textbook = document.getElementById('edit-textbook').value || '';
    records[idx].score = score;
    records[idx].duration = duration;
    records[idx].knowledgePoints = document.getElementById('edit-kps').value.split(',').map(s => s.trim()).filter(Boolean);
    records[idx].notes = document.getElementById('edit-notes').value;
    records[idx].practiceDuration = Math.round(duration * 0.8);
    records[idx].reviewDuration = Math.round(duration * 0.2);
    // XP Engine 2.0: 编辑时用新公式重算
    const profile = Store.get(StorageKeys.USER_PROFILE) || {};
    const last10 = records.slice(-10).map(r => r.score || 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayXP = records.filter(r => r.timestamp && r.timestamp.slice(0, 10) === today).reduce((s, r) => s + (r.xp || 0), 0);
    profile._runtimeTotalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
    const talentSet = profile._talentSubjects ? new Set(profile._talentSubjects) : null;
    records[idx].xp = calcXP(records[idx], profile, todayXP, last10, talentSet);
    saveRecords(records);
    overlay.remove();
    Toast.show('记录已更新', 'success');
    EventBus.emit('record:updated', records[idx]);
    applyFilters();
  });
}

// 删除确认弹窗：不可撤销，删除后触发 record:deleted 事件
function confirmDelete(recordId) {
  const overlay = document.createElement('div');
  overlay.className = 'entry-overlay';
  overlay.id = 'delete-overlay';
  overlay.innerHTML = `<div class="entry-modal" style="max-width:360px">
    <div class="entry-header">
      <span class="entry-title">确认删除</span>
      <button class="entry-close" id="delete-close">✕</button>
    </div>
    <p style="color:var(--color-text-2);margin-bottom:var(--sp-3)">确定要删除这条学习记录吗？此操作不可撤销。</p>
    <div style="display:flex;gap:var(--sp-2)">
      <button id="delete-cancel" class="entry-submit" style="flex:1;background:var(--color-surface-variant);color:var(--color-text-1)">取消</button>
      <button id="delete-confirm" class="entry-submit" style="flex:1;background:#e74c3c">删除</button>
    </div>
  </div>`;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  document.getElementById('delete-close').addEventListener('click', close);
  document.getElementById('delete-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  document.getElementById('delete-confirm').addEventListener('click', () => {
    let records = getRecords();
    records = records.filter(r => r.id !== recordId);
    saveRecords(records);
    close();
    Toast.show('记录已删除', 'success');
    EventBus.emit('record:deleted', recordId);
    applyFilters();
  });
}

// 重新读取记录 + 应用当前筛选条件 + 重置到第1页
function applyFilters() {
  const records = getRecords();
  const subject = document.getElementById('log-filter-subject')?.value || '';
  const activityType = document.getElementById('log-filter-activity')?.value || '';
  const dateFrom = document.getElementById('log-filter-from')?.value || '';
  const dateTo = document.getElementById('log-filter-to')?.value || '';
  const search = document.getElementById('log-search')?.value || '';
  filteredRecords = filterRecords(records, { subject, activityType, dateFrom, dateTo, search });
  currentPage = 1;
  renderList();
}

// afterRender: 筛选事件 + 搜索防抖(300ms) + 分页 + 编辑/删除委托
// 支持 URL 参数 ?q= 预填搜索（从搜索页跳转时使用）
export function afterRender() {
  // Read ?q= from hash for search pre-fill
  const hashParts = window.location.hash.split('?');
  const params = hashParts[1] ? new URLSearchParams(hashParts[1]) : null;
  const prefillQuery = params?.get('q') || '';

  renderList();

  // 筛选事件
  const searchInput = document.getElementById('log-search');
  const subjectFilter = document.getElementById('log-filter-subject');
  const activityFilter = document.getElementById('log-filter-activity');
  const dateFrom = document.getElementById('log-filter-from');
  const dateTo = document.getElementById('log-filter-to');
  const loadMore = document.getElementById('log-load-more');

  // Pre-fill search from URL param
  if (prefillQuery && searchInput) {
    searchInput.value = prefillQuery;
    applyFilters();
  }

  let searchTimer = null;
  const onSearch = () => { clearTimeout(searchTimer); searchTimer = setTimeout(applyFilters, 300); };
  searchInput.addEventListener('input', onSearch);
  subjectFilter.addEventListener('change', applyFilters);
  activityFilter.addEventListener('change', applyFilters);
  dateFrom.addEventListener('change', applyFilters);
  dateTo.addEventListener('change', applyFilters);

  // 加载更多
  const onLoadMore = () => { currentPage++; renderList(); };
  loadMore.addEventListener('click', onLoadMore);

  // 事件委托：编辑/删除按钮（列表动态渲染，不能直接绑）
  const list = document.getElementById('log-list');
  const onListClick = (e) => {
    const editBtn = e.target.closest('.log-edit-btn');
    const deleteBtn = e.target.closest('.log-delete-btn');
    if (editBtn) openEditModal(editBtn.dataset.id);
    if (deleteBtn) confirmDelete(deleteBtn.dataset.id);
  };
  list.addEventListener('click', onListClick);

  return () => {
    searchInput.removeEventListener('input', onSearch);
    subjectFilter.removeEventListener('change', applyFilters);
    activityFilter.removeEventListener('change', applyFilters);
    dateFrom.removeEventListener('change', applyFilters);
    dateTo.removeEventListener('change', applyFilters);
    loadMore.removeEventListener('click', onLoadMore);
    list.removeEventListener('click', onListClick);
  };
}
