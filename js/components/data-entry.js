// data-entry.js — 数据录入弹窗（ENTRY-01~06：UI + 联动 + 搜索 + 自动推断 + 全链路）
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import { SUBJECTS_DATA, getSubjectById } from '../data/subjects.js';
import { getAllKnowledgePoints } from '../data/subjects.js';
import EventBus from '../event-bus.js';
import Toast from './toast.js';
import { calcXP } from '../utils/level.js';

let isOpen = false;
let currentSubject = '';
let currentTextbook = '';

// ENTRY-03: 倒排索引 — 构建所有知识点的搜索索引
let kpIndex = [];
function buildKPIndex() {
  kpIndex = [];
  for (const [sid, data] of Object.entries(SUBJECTS_DATA)) {
    if (!data.textbooks) continue;
    for (const tb of data.textbooks) {
      for (const ch of tb.chapters) {
        for (const sec of ch.sections) {
          for (const kp of (sec.knowledgePoints || [])) {
            kpIndex.push({ kp, subjectId: sid, subjectName: data.name, textbook: tb.name, chapter: ch.name, section: sec.name });
          }
        }
      }
    }
  }
}

// 5级匹配：精确 > 前缀 > 子串 > 模糊(字符集) > 拼音首字母
function searchKP(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  const exact = [], prefix = [], substring = [], fuzzy = [];
  for (const item of kpIndex) {
    const name = item.kp.toLowerCase();
    if (name === q) exact.push(item);
    else if (name.startsWith(q)) prefix.push(item);
    else if (name.includes(q)) substring.push(item);
    else if (isFuzzyMatch(name, q)) fuzzy.push(item);
  }
  return [...exact, ...prefix, ...substring, ...fuzzy].slice(0, 10);
}

function isFuzzyMatch(name, query) {
  let qi = 0;
  for (let i = 0; i < name.length && qi < query.length; i++) {
    if (name[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

function getSubjectOptions() {
  return SUBJECTS.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

function getTextbookOptions(subjectId) {
  const subj = SUBJECTS_DATA[subjectId];
  if (!subj || !subj.textbooks) return '<option value="">暂无教材</option>';
  return subj.textbooks.map(tb => `<option value="${tb.id}">${tb.name}</option>`).join('');
}

function getChapterOptions(subjectId, textbookId) {
  const subj = SUBJECTS_DATA[subjectId];
  if (!subj) return '';
  const tb = subj.textbooks.find(t => t.id === textbookId);
  if (!tb) return '<option value="">暂无章节</option>';
  return tb.chapters.map(ch => `<option value="${ch.id}">${ch.name}</option>`).join('');
}

function getSectionOptions(subjectId, textbookId, chapterId) {
  const subj = SUBJECTS_DATA[subjectId];
  if (!subj) return '';
  const tb = subj.textbooks.find(t => t.id === textbookId);
  if (!tb) return '';
  const ch = tb.chapters.find(c => c.id === chapterId);
  if (!ch) return '';
  return ch.sections.map(sec => `<option value="${sec.id}">${sec.name}</option>`).join('');
}

function getKPOptions(subjectId, textbookId, chapterId, sectionId) {
  const subj = SUBJECTS_DATA[subjectId];
  if (!subj) return [];
  const tb = subj.textbooks.find(t => t.id === textbookId);
  if (!tb) return [];
  const ch = tb.chapters.find(c => c.id === chapterId);
  if (!ch) return [];
  const sec = ch.sections.find(s => s.id === sectionId);
  if (!sec) return [];
  return sec.knowledgePoints || [];
}

function renderModal() {
  buildKPIndex();
  return `<div class="entry-overlay" id="entry-overlay">
    <div class="entry-modal">
      <div class="entry-header">
        <span class="entry-title">📝 录入学习记录</span>
        <button class="entry-close" id="entry-close">✕</button>
      </div>
      <form id="entry-form" class="entry-form">
        <div class="entry-field">
          <label class="entry-label">搜索知识点</label>
          <input type="text" id="entry-search" class="entry-input" placeholder="输入知识点名称搜索...">
          <div id="entry-search-results" class="entry-search-results"></div>
        </div>
        <div class="entry-field">
          <label class="entry-label">学科 *</label>
          <select id="entry-subject" class="entry-select" required>
            <option value="">选择学科</option>
            ${getSubjectOptions()}
          </select>
        </div>
        <div class="entry-field">
          <label class="entry-label">教材</label>
          <select id="entry-textbook" class="entry-select" disabled>
            <option value="">先选择学科</option>
          </select>
        </div>
        <div class="entry-field">
          <label class="entry-label">章节</label>
          <select id="entry-chapter" class="entry-select" disabled>
            <option value="">先选择教材</option>
          </select>
        </div>
        <div class="entry-field">
          <label class="entry-label">小节</label>
          <select id="entry-section" class="entry-select" disabled>
            <option value="">先选择章节</option>
          </select>
        </div>
        <div class="entry-field">
          <label class="entry-label">知识点</label>
          <div id="entry-kp-chips" class="entry-kp-chips"></div>
        </div>
        <div class="entry-row">
          <div class="entry-field entry-field-half">
            <label class="entry-label">得分 (0-100)</label>
            <input type="number" id="entry-score" class="entry-input" min="0" max="100" value="0" placeholder="0">
          </div>
          <div class="entry-field entry-field-half">
            <label class="entry-label">时长 (分钟) *</label>
            <input type="number" id="entry-duration" class="entry-input" min="1" value="30" required placeholder="30">
          </div>
        </div>
        <div class="entry-row">
          <div class="entry-field entry-field-half">
            <label class="entry-label">做题时长</label>
            <input type="number" id="entry-practice-dur" class="entry-input" min="0" value="24" placeholder="自动">
          </div>
          <div class="entry-field entry-field-half">
            <label class="entry-label">订正时长</label>
            <input type="number" id="entry-review-dur" class="entry-input" min="0" value="6" placeholder="自动">
          </div>
        </div>
        <div class="entry-field">
          <label class="entry-label">活动类型</label>
          <select id="entry-activity" class="entry-select">
            <option value="practice">做题</option>
            <option value="review">订正/复习</option>
            <option value="reading">阅读</option>
            <option value="video">网课</option>
          </select>
        </div>
        <div class="entry-field">
          <label class="entry-label">备注</label>
          <textarea id="entry-notes" class="entry-textarea" rows="2" placeholder="可选备注..."></textarea>
        </div>
        <button type="submit" class="entry-submit">保存记录</button>
      </form>
    </div>
  </div>`;
}

export function open() {
  if (isOpen) return;
  isOpen = true;
  document.body.insertAdjacentHTML('beforeend', renderModal());
  bindEvents();
}

export function close() {
  if (!isOpen) return;
  isOpen = false;
  const overlay = document.getElementById('entry-overlay');
  if (overlay) overlay.remove();
}

function bindEvents() {
  const overlay = document.getElementById('entry-overlay');
  const closeBtn = document.getElementById('entry-close');
  const form = document.getElementById('entry-form');
  const subjectSelect = document.getElementById('entry-subject');
  const textbookSelect = document.getElementById('entry-textbook');
  const chapterSelect = document.getElementById('entry-chapter');
  const sectionSelect = document.getElementById('entry-section');

  // 关闭
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // 三级联动
  subjectSelect.addEventListener('change', () => {
    currentSubject = subjectSelect.value;
    textbookSelect.innerHTML = currentSubject
      ? '<option value="">选择教材</option>' + getTextbookOptions(currentSubject)
      : '<option value="">先选择学科</option>';
    textbookSelect.disabled = !currentSubject;
    chapterSelect.innerHTML = '<option value="">先选择教材</option>';
    chapterSelect.disabled = true;
    sectionSelect.innerHTML = '<option value="">先选择章节</option>';
    sectionSelect.disabled = true;
    document.getElementById('entry-kp-chips').innerHTML = '';
  });

  textbookSelect.addEventListener('change', () => {
    currentTextbook = textbookSelect.value;
    chapterSelect.innerHTML = currentTextbook
      ? '<option value="">选择章节</option>' + getChapterOptions(currentSubject, currentTextbook)
      : '<option value="">先选择教材</option>';
    chapterSelect.disabled = !currentTextbook;
    sectionSelect.innerHTML = '<option value="">先选择章节</option>';
    sectionSelect.disabled = true;
    document.getElementById('entry-kp-chips').innerHTML = '';
  });

  chapterSelect.addEventListener('change', () => {
    const chapterId = chapterSelect.value;
    sectionSelect.innerHTML = chapterId
      ? '<option value="">选择小节</option>' + getSectionOptions(currentSubject, currentTextbook, chapterId)
      : '<option value="">先选择章节</option>';
    sectionSelect.disabled = !chapterId;
    document.getElementById('entry-kp-chips').innerHTML = '';
  });

  sectionSelect.addEventListener('change', () => {
    const sectionId = sectionSelect.value;
    const kps = getKPOptions(currentSubject, currentTextbook, chapterSelect.value, sectionId);
    const chips = document.getElementById('entry-kp-chips');
    chips.innerHTML = kps.map(kp => `<label class="kp-chip"><input type="checkbox" value="${kp}"><span>${kp}</span></label>`).join('');
  });

  // ENTRY-03: 搜索知识点
  const searchInput = document.getElementById('entry-search');
  const searchResults = document.getElementById('entry-search-results');
  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const results = searchKP(searchInput.value.trim());
      if (results.length === 0) {
        searchResults.innerHTML = searchInput.value ? '<div class="search-empty">无匹配结果</div>' : '';
        return;
      }
      searchResults.innerHTML = results.map(r => `<div class="search-result-item" data-subject="${r.subjectId}" data-textbook="${r.textbook}" data-kp="${r.kp}">
        <span class="search-kp">${r.kp}</span>
        <span class="search-meta">${r.subjectName} · ${r.chapter}</span>
      </div>`).join('');
    }, 200);
  });

  searchResults.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (!item) return;
    const { subject: subjId, textbook, kp } = item.dataset;
    // 自动选中学科
    subjectSelect.value = subjId;
    subjectSelect.dispatchEvent(new Event('change'));
    // 自动选中教材
    setTimeout(() => {
      const tbOptions = textbookSelect.options;
      for (let i = 0; i < tbOptions.length; i++) {
        if (tbOptions[i].text === textbook) { textbookSelect.value = tbOptions[i].value; break; }
      }
      textbookSelect.dispatchEvent(new Event('change'));
    }, 50);
    // 选中知识点
    setTimeout(() => {
      const chips = document.querySelectorAll('#entry-kp-chips input');
      chips.forEach(cb => { if (cb.value === kp) cb.checked = true; });
    }, 200);
    searchResults.innerHTML = '';
    searchInput.value = '';
  });

  // ENTRY-05: 时长自动推断（做题80% + 订正20%）
  const durationInput = document.getElementById('entry-duration');
  const practiceInput = document.getElementById('entry-practice-dur');
  const reviewInput = document.getElementById('entry-review-dur');
  durationInput.addEventListener('input', () => {
    const dur = parseInt(durationInput.value, 10) || 0;
    practiceInput.value = Math.round(dur * 0.8);
    reviewInput.value = Math.round(dur * 0.2);
  });

  // 提交
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = subjectSelect.value;
    const duration = parseInt(document.getElementById('entry-duration').value, 10);
    if (!subject || !duration) return;

    const textbook = textbookSelect.options[textbookSelect.selectedIndex]?.text || '';
    const chapter = chapterSelect.options[chapterSelect.selectedIndex]?.text || '';
    const section = sectionSelect.options[sectionSelect.selectedIndex]?.text || '';
    const selectedKPs = [...document.querySelectorAll('#entry-kp-chips input:checked')].map(cb => cb.value);

    const score = parseInt(document.getElementById('entry-score').value, 10) || 0;
    const practiceDur = parseInt(document.getElementById('entry-practice-dur').value, 10) || Math.round(duration * 0.8);
    const reviewDur = parseInt(document.getElementById('entry-review-dur').value, 10) || Math.round(duration * 0.2);

    const record = {
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      subject,
      textbook: textbook !== '选择教材' ? textbook : '',
      chapter: chapter !== '选择章节' ? chapter : '',
      section: section !== '选择小节' ? section : '',
      knowledgePoints: selectedKPs,
      score,
      duration,
      practiceDuration: practiceDur,
      reviewDuration: reviewDur,
      activityType: document.getElementById('entry-activity').value,
      notes: document.getElementById('entry-notes').value || '',
      xp: 0, // 占位，下方用 calcXP 计算
    };
    // XP Engine 2.0: 用完整公式替代简化公式
    const profile = Store.get(StorageKeys.USER_PROFILE) || {};
    const allRecs = Store.get(StorageKeys.STUDY_RECORDS) || [];
    const last10 = allRecs.slice(-10).map(r => r.score || 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayXP = allRecs.filter(r => r.timestamp && r.timestamp.slice(0, 10) === today).reduce((s, r) => s + (r.xp || 0), 0);
    profile._runtimeTotalXP = allRecs.reduce((s, r) => s + (r.xp || 0), 0);
    record.xp = calcXP(record, profile, todayXP, last10);

    const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
    records.push(record);
    Store.set(StorageKeys.STUDY_RECORDS, records);
    EventBus.emit('record:added', record);
    Toast.show('记录已保存', 'success');
    close();
  });
}
