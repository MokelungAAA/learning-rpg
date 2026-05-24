// nlp-entry.js — 自然语言快速录入对话框（§18.6.2）
// 长按+号打开，输入一句话 → 自动解析 → 确认录入
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import EventBus from '../event-bus.js';
import Toast from './toast.js';
import { calcXP } from '../utils/level.js';
import { parseNaturalLanguage, getConfidence, formatResult } from '../utils/nlp-parser.js';

let isOpen = false;

// 活动类型中文映射
const ACTIVITY_LABELS = {
  practice: '刷题', review: '复习', recitation: '背诵',
  exam: '考试', lecture: '听课',
};

// 获取最近学科（用于优先匹配）
function getRecentSubjects() {
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  const recent = records.filter(r => {
    const days = (Date.now() - new Date(r.timestamp).getTime()) / 86400000;
    return days <= 3;
  });
  const counts = {};
  for (const r of recent) {
    counts[r.subject] = (counts[r.subject] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

// 预填数据（从番茄钟/首页任务传入）
let prefillData = null;
export function setPrefill(data) { prefillData = data; }

function renderModal() {
  const prefillText = prefillData ? `${prefillData.subject || ''}${prefillData.duration ? prefillData.duration + '分钟' : ''}` : '';
  return `<div class="nlp-overlay" id="nlp-overlay">
    <div class="nlp-modal">
      <div class="nlp-header">
        <span>📝 快速记录</span>
        <button class="nlp-close" id="nlp-close">✕</button>
      </div>
      <div class="nlp-body">
        <textarea id="nlp-input" class="nlp-input" placeholder="用一句话描述你的学习...&#10;例: 数学30分钟函数单调性75分" rows="2">${prefillText}</textarea>
        <div id="nlp-preview" class="nlp-preview"></div>
        <div class="nlp-hint">💡 示例: "数学30分钟函数单调性75分" · "背了20分钟英语单词" · "物理刷了一个小时力学"</div>
      </div>
      <div class="nlp-footer">
        <button class="nlp-btn nlp-btn-cancel" id="nlp-cancel">取消</button>
        <button class="nlp-btn nlp-btn-confirm" id="nlp-confirm" disabled>确认录入</button>
      </div>
    </div>
  </div>`;
}

export function open() {
  if (isOpen) return;
  isOpen = true;
  document.body.insertAdjacentHTML('beforeend', renderModal());
  bindEvents();
  // 如果有预填数据，立即解析
  if (prefillData) {
    const input = document.getElementById('nlp-input');
    if (input && input.value) parseInput(input.value);
  }
  // 自动聚焦输入框
  setTimeout(() => {
    const input = document.getElementById('nlp-input');
    if (input) input.focus();
  }, 100);
}

export function close() {
  if (!isOpen) return;
  isOpen = false;
  prefillData = null;
  const overlay = document.getElementById('nlp-overlay');
  if (overlay) overlay.remove();
}

let currentResult = null;

function parseInput(text) {
  const preview = document.getElementById('nlp-preview');
  const confirmBtn = document.getElementById('nlp-confirm');
  if (!text.trim()) {
    preview.innerHTML = '';
    confirmBtn.disabled = true;
    currentResult = null;
    return;
  }
  const result = parseNaturalLanguage(text);
  currentResult = result;
  const confidence = getConfidence(result);
  if (!result || confidence < 0.3) {
    preview.innerHTML = '<div class="nlp-parse-fail">⚠️ 信息不足，请补充学科或时长</div>';
    confirmBtn.disabled = true;
    return;
  }
  const subjLabel = result.subjectName || '未识别';
  const durLabel = result.duration ? `${result.duration}分钟` : '未识别';
  const scoreLabel = result.score !== null ? `${result.score}分` : '默认75分';
  const kpLabel = result.knowledgePoints.length > 0 ? result.knowledgePoints.join(', ') : '未指定';
  const actLabel = ACTIVITY_LABELS[result.activityType] || '刷题';
  preview.innerHTML = `<div class="nlp-result">
    <div class="nlp-result-row"><span class="nlp-tag">${subjLabel}</span> · <span>${durLabel}</span> · <span>${scoreLabel}</span></div>
    <div class="nlp-result-row">知识点: ${kpLabel} · 类型: ${actLabel}</div>
  </div>`;
  confirmBtn.disabled = false;
}

function saveRecord(result) {
  if (!result || !result.subject) return;
  const duration = result.duration || 30;
  const score = result.score !== null ? result.score : 75;
  const record = {
    id: 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    subject: result.subject,
    textbook: '',
    chapter: '',
    section: '',
    knowledgePoints: result.knowledgePoints,
    score,
    duration,
    practiceDuration: result.activityType === 'practice' ? duration : Math.round(duration * 0.8),
    reviewDuration: result.activityType === 'practice' ? 0 : Math.round(duration * 0.2),
    activityType: result.activityType,
    notes: '',
    totalQuestions: 0,
    correctQuestions: 0,
    xp: 0,
  };
  // XP Engine 2.0
  const profile = Store.get(StorageKeys.USER_PROFILE) || {};
  const allRecs = Store.get(StorageKeys.STUDY_RECORDS) || [];
  const last10 = allRecs.slice(-10).map(r => r.score || 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayXP = allRecs.filter(r => r.timestamp && r.timestamp.slice(0, 10) === today).reduce((s, r) => s + (r.xp || 0), 0);
  profile._runtimeTotalXP = allRecs.reduce((s, r) => s + (r.xp || 0), 0);
  const talentSet = profile._talentSubjects ? new Set(profile._talentSubjects) : null;
  record.xp = calcXP(record, profile, todayXP, last10, talentSet);

  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  records.push(record);
  Store.set(StorageKeys.STUDY_RECORDS, records);
  EventBus.emit('record:added', record);
  Toast.show(`+${record.xp} XP · ${result.subjectName}`, 'success');
}

function bindEvents() {
  const overlay = document.getElementById('nlp-overlay');
  const closeBtn = document.getElementById('nlp-close');
  const cancelBtn = document.getElementById('nlp-cancel');
  const confirmBtn = document.getElementById('nlp-confirm');
  const input = document.getElementById('nlp-input');

  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // 输入防抖解析
  let timer = null;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => parseInput(input.value), 300);
  });

  // 确认录入
  confirmBtn.addEventListener('click', () => {
    if (!currentResult) return;
    saveRecord(currentResult);
    close();
  });

  // Enter 键确认
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && currentResult) {
      e.preventDefault();
      saveRecord(currentResult);
      close();
    }
    if (e.key === 'Escape') close();
  });
}
