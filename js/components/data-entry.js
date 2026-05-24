// data-entry.js — 数据录入弹窗组件
// 功能：学科四级联动 + 知识点搜索 + 时长推断 + XP计算
// 注意：模块级状态 isOpen/currentSubject，关闭时需清理DOM
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys } from '../config.js';
import { SUBJECTS_DATA, getSubjectById } from '../data/subjects.js';
import { getAllKnowledgePoints } from '../data/subjects.js';
import EventBus from '../event-bus.js';
import Toast from './toast.js';
import { calcXP } from '../utils/level.js';
import { levenshtein, matchPinyin } from '../utils/search.js';

let isOpen = false;        // 防止重复打开
let currentSubject = '';   // 当前选中学科id
let currentTextbook = '';  // 当前选中教材id

// ENTRY-03: 倒排索引 — 构建所有知识点的搜索索引
let kpIndex = [];
// 遍历全部学科→教材→章节→小节→知识点，扁平化到kpIndex
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

// 5级匹配搜索知识点，返回最多10条
// §10.2: 精确→前缀→子串→模糊(Levenshtein+逐字)→拼音
function searchKP(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  const exact = [], prefix = [], substring = [], fuzzy = [], pinyin = [];
  for (const item of kpIndex) {
    const name = item.kp.toLowerCase();
    if (name === q) exact.push(item);
    else if (name.startsWith(q)) prefix.push(item);
    else if (name.includes(q)) substring.push(item);
    else if (isFuzzyMatch(name, q) || (name.length <= 10 && levenshtein(name, q) <= 2)) fuzzy.push(item);
    else if (matchPinyin(item.subjectName, q)) pinyin.push(item);
  }
  return [...exact, ...prefix, ...substring, ...fuzzy, ...pinyin].slice(0, 10);
}

// 逐字符匹配，query中每个字符需在name中按序出现
function isFuzzyMatch(name, query) {
  let qi = 0;
  for (let i = 0; i < name.length && qi < query.length; i++) {
    if (name[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

// 以下5个函数：生成级联select的option HTML
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

// 生成完整弹窗HTML，内部调用buildKPIndex初始化搜索索引
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
            <label class="entry-label">得分 <span id="entry-score-display" class="score-display">0</span></label>
            <input type="range" id="entry-score" class="entry-range" min="0" max="100" value="0" step="5">
          </div>
          <div class="entry-field entry-field-half">
            <label class="entry-label">时长 (分钟) *</label>
            <input type="number" id="entry-duration" class="entry-input" min="1" value="30" required placeholder="30">
          </div>
        </div>
        <div class="entry-row">
          <div class="entry-field entry-field-half">
            <label class="entry-label">总题数</label>
            <input type="number" id="entry-total-q" class="entry-input" min="0" placeholder="可选">
          </div>
          <div class="entry-field entry-field-half">
            <label class="entry-label">正确题数</label>
            <input type="number" id="entry-correct-q" class="entry-input" min="0" placeholder="可选">
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

// 打开弹窗，插入DOM并绑定事件，isOpen防重入
export function open() {
  if (isOpen) return;
  isOpen = true;
  document.body.insertAdjacentHTML('beforeend', renderModal());
  bindEvents();
}

// 关闭弹窗，移除DOM元素释放内存
export function close() {
  if (!isOpen) return;
  isOpen = false;
  const overlay = document.getElementById('entry-overlay');
  if (overlay) overlay.remove();
}

// 绑定所有事件：级联select、搜索防抖、时长推断、表单提交
// 注意：搜索点击结果用setTimeout链式等待级联渲染完成
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

  // §10.3: 得分滑块同步显示
  const scoreRange = document.getElementById('entry-score');
  const scoreDisplay = document.getElementById('entry-score-display');
  scoreRange.addEventListener('input', () => { scoreDisplay.textContent = scoreRange.value; });

  // §10.3: 时长自动推断（EMA学习用户习惯，默认80/20）
  const durationInput = document.getElementById('entry-duration');
  const practiceInput = document.getElementById('entry-practice-dur');
  const reviewInput = document.getElementById('entry-review-dur');
  // 从历史记录计算EMA做题比例（alpha=0.3，最近的记录权重更高）
  const allRecs = Store.get(StorageKeys.STUDY_RECORDS) || [];
  let practiceRatio = 0.8;
  const recsWithRatio = allRecs.filter(r => r.practiceDuration > 0 && r.duration > 0).slice(-20);
  if (recsWithRatio.length >= 3) {
    let ema = recsWithRatio[0].practiceDuration / recsWithRatio[0].duration;
    for (let i = 1; i < recsWithRatio.length; i++) {
      const r = recsWithRatio[i].practiceDuration / recsWithRatio[i].duration;
      ema = 0.3 * r + 0.7 * ema;
    }
    practiceRatio = Math.max(0.5, Math.min(0.95, ema));
  }
  durationInput.addEventListener('input', () => {
    const dur = parseInt(durationInput.value, 10) || 0;
    practiceInput.value = Math.round(dur * practiceRatio);
    reviewInput.value = Math.round(dur * (1 - practiceRatio));
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

    const totalQ = parseInt(document.getElementById('entry-total-q').value, 10) || 0;
    const correctQ = parseInt(document.getElementById('entry-correct-q').value, 10) || 0;

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
      totalQuestions: totalQ,
      correctQuestions: correctQ,
      xp: 0,
    };
    // XP Engine 2.0: 用完整公式替代简化公式
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
    Toast.show('记录已保存', 'success');
    close();
  });
}
