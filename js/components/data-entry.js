// data-entry.js — 数据录入弹窗（ENTRY-01~02：UI + 三级联动下拉）
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import { SUBJECTS_DATA, getSubjectById } from '../data/subjects.js';
import EventBus from '../event-bus.js';
import Toast from './toast.js';

let isOpen = false;
let currentSubject = '';
let currentTextbook = '';

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
  return `<div class="entry-overlay" id="entry-overlay">
    <div class="entry-modal">
      <div class="entry-header">
        <span class="entry-title">📝 录入学习记录</span>
        <button class="entry-close" id="entry-close">✕</button>
      </div>
      <form id="entry-form" class="entry-form">
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

    const record = {
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      subject,
      textbook: textbook !== '选择教材' ? textbook : '',
      chapter: chapter !== '选择章节' ? chapter : '',
      section: section !== '选择小节' ? section : '',
      knowledgePoints: selectedKPs,
      score: parseInt(document.getElementById('entry-score').value, 10) || 0,
      duration,
      activityType: document.getElementById('entry-activity').value,
      notes: document.getElementById('entry-notes').value || '',
      xp: Math.max(1, Math.round((parseInt(document.getElementById('entry-score').value, 10) || 50) * duration / 20)),
    };

    const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
    records.push(record);
    Store.set(StorageKeys.STUDY_RECORDS, records);
    EventBus.emit('record:added', record);
    Toast.show('记录已保存', 'success');
    close();
  });
}
