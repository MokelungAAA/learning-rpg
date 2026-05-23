// pomodoro.js — 番茄钟系统（POM-01~05：配置+计时+评分+追踪+历史）
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys, POMODORO_PRESETS } from '../config.js';
import EventBus from '../event-bus.js';
import Toast from '../components/toast.js';

let timer = null;
let startTime = 0;
let plannedDuration = 0;
let elapsed = 0;
let isRunning = false;
let isPaused = false;
let focusScore = 100;
let backgroundPeriods = [];
let bgStart = 0;

// 读取复习上下文（从复习中心跳转）
function getReviewContext() {
  try { return JSON.parse(localStorage.getItem('lts_review_context') || 'null'); } catch { return null; }
}

// POM-01: 配置界面
function renderConfig() {
  const ctx = getReviewContext();
  const presetBtns = POMODORO_PRESETS.map(p =>
    `<button class="pomo-preset-btn" data-minutes="${p.work}" data-name="${p.name}">${p.name} ${p.work}分</button>`
  ).join('');
  const subjectOpts = SUBJECTS.map(s => `<option value="${s.id}" ${ctx?.subject === s.name ? 'selected' : ''}>${s.name}</option>`).join('');

  return `<div class="pomo-config" id="pomo-config">
    <div class="pomo-config-header">🍅 番茄钟</div>
    ${ctx ? `<div class="pomo-review-context">复习: ${ctx.kp} (${ctx.subject})</div>` : ''}
    <div class="pomo-presets">${presetBtns}</div>
    <div class="pomo-custom">
      <label class="pomo-label">自定义时长</label>
      <div class="pomo-custom-row">
        <input type="number" id="pomo-minutes" class="pomo-input" min="1" max="120" value="${ctx ? 25 : 25}" placeholder="25">
        <span class="pomo-unit">分钟</span>
      </div>
    </div>
    <div class="pomo-subject-select">
      <label class="pomo-label">学科</label>
      <select id="pomo-subject" class="pomo-select">
        <option value="">选择学科（可选）</option>
        ${subjectOpts}
      </select>
    </div>
    <button class="pomo-start-btn" id="pomo-start">▶ 开始专注</button>
  </div>`;
}

// POM-02: 计时界面（SVG环形进度）
function renderTimer(minutes) {
  const circumference = 2 * Math.PI * 90;
  return `<div class="pomo-timer-page" id="pomo-timer" style="display:none">
    <div class="pomo-timer-ring">
      <svg class="pomo-svg" viewBox="0 0 200 200">
        <circle class="pomo-ring-bg" cx="100" cy="100" r="90" fill="none" stroke="var(--color-surface-variant)" stroke-width="8"/>
        <circle id="pomo-ring" class="pomo-ring-progress" cx="100" cy="100" r="90" fill="none" stroke="var(--color-accent)" stroke-width="8"
          stroke-dasharray="${circumference}" stroke-dashoffset="0" stroke-linecap="round"
          transform="rotate(-90 100 100)"/>
      </svg>
      <div class="pomo-timer-center">
        <div class="pomo-time-display" id="pomo-time">${String(minutes).padStart(2, '0')}:00</div>
        <div class="pomo-timer-label" id="pomo-label">专注中</div>
      </div>
    </div>
    <div class="pomo-timer-controls">
      <button class="pomo-ctrl-btn" id="pomo-pause">⏸ 暂停</button>
      <button class="pomo-ctrl-btn pomo-stop-btn" id="pomo-stop">⏹ 结束</button>
    </div>
    <div class="pomo-focus-score">专注度: <span id="pomo-focus">100</span>%</div>
  </div>`;
}

// POM-03: 完成界面
function renderComplete() {
  return `<div class="pomo-complete" id="pomo-complete" style="display:none">
    <div class="pomo-complete-icon">🎉</div>
    <div class="pomo-complete-title">专注完成！</div>
    <div class="pomo-complete-stats" id="pomo-stats"></div>
    <div class="pomo-rating">
      <div class="pomo-label">本次专注评分</div>
      <div class="pomo-stars" id="pomo-stars">
        ${[1,2,3,4,5].map(i => `<button class="pomo-star" data-rating="${i}">⭐</button>`).join('')}
      </div>
    </div>
    <div class="pomo-complete-actions">
      <button class="pomo-action-btn" id="pomo-save-record">📝 生成学习记录</button>
      <button class="pomo-action-btn pomo-secondary" id="pomo-restart">🔄 再来一个</button>
    </div>
  </div>`;
}

// POM-05: 历史面板
function renderHistory() {
  const sessions = Store.get(StorageKeys.POMODORO_SESSIONS) || [];
  const completed = sessions.filter(s => s.completed);
  const totalMin = completed.reduce((s, r) => s + (r.plannedDuration || 0), 0);
  const avgFocus = completed.length > 0 ? Math.round(completed.reduce((s, r) => s + (r.focusScore || 0), 0) / completed.length) : 0;

  const recent = sessions.slice(-10).reverse().map(s => {
    const date = s.startTime ? new Date(s.startTime).toLocaleDateString('zh-CN') : '';
    const status = s.completed ? '✅' : '❌';
    return `<div class="pomo-history-item">
      <span>${status}</span>
      <span>${s.plannedDuration || 0}分</span>
      <span>专注 ${s.focusScore || 0}%</span>
      <span>${date}</span>
    </div>`;
  }).join('');

  return `<div class="pomo-history">
    <div class="pomo-history-header">📊 番茄钟统计</div>
    <div class="pomo-history-stats">
      <span>完成 <b>${completed.length}</b> 个</span>
      <span>总时长 <b>${totalMin}</b> 分钟</span>
      <span>平均专注 <b>${avgFocus}</b>%</span>
    </div>
    ${recent ? `<div class="pomo-history-list">${recent}</div>` : '<p class="pomo-empty">暂无番茄钟记录</p>'}
  </div>`;
}

export function render() {
  return `<div class="page-enter">
    ${renderConfig()}
    ${renderTimer(25)}
    ${renderComplete()}
    ${renderHistory()}
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.17 · 番茄钟系统</p>
  </div>`;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startTimer(minutes) {
  plannedDuration = minutes;
  elapsed = 0;
  isRunning = true;
  isPaused = false;
  focusScore = 100;
  backgroundPeriods = [];
  startTime = Date.now();

  document.getElementById('pomo-config').style.display = 'none';
  document.getElementById('pomo-timer').style.display = 'block';

  const totalSeconds = minutes * 60;
  const circumference = 2 * Math.PI * 90;
  const ring = document.getElementById('pomo-ring');
  const timeDisplay = document.getElementById('pomo-time');
  const focusDisplay = document.getElementById('pomo-focus');

  timer = setInterval(() => {
    if (isPaused) return;
    elapsed = Math.floor((Date.now() - startTime) / 1000);

    if (elapsed >= totalSeconds) {
      completeSession();
      return;
    }

    const remaining = totalSeconds - elapsed;
    timeDisplay.textContent = formatTime(remaining);
    const progress = elapsed / totalSeconds;
    ring.setAttribute('stroke-dashoffset', circumference * (1 - progress));
    focusDisplay.textContent = focusScore;
  }, 1000);

  // POM-04: 切出检测
  document.addEventListener('visibilitychange', onVisibilityChange);
}

function onVisibilityChange() {
  if (!isRunning) return;
  if (document.hidden) {
    bgStart = Date.now();
  } else if (bgStart > 0) {
    const bgDuration = Date.now() - bgStart;
    backgroundPeriods.push({ start: bgStart, end: Date.now(), duration: bgDuration });
    // 超过30秒切出扣专注分
    if (bgDuration > 30000) {
      focusScore = Math.max(0, focusScore - Math.min(20, Math.round(bgDuration / 10000)));
    }
    bgStart = 0;
  }
}

function pauseTimer() {
  if (isPaused) {
    // 恢复
    startTime = Date.now() - elapsed * 1000;
    isPaused = false;
    document.getElementById('pomo-pause').textContent = '⏸ 暂停';
    document.getElementById('pomo-label').textContent = '专注中';
  } else {
    isPaused = true;
    document.getElementById('pomo-pause').textContent = '▶ 继续';
    document.getElementById('pomo-label').textContent = '已暂停';
  }
}

function stopTimer() {
  clearInterval(timer);
  isRunning = false;
  document.removeEventListener('visibilitychange', onVisibilityChange);
  completeSession();
}

function completeSession() {
  clearInterval(timer);
  isRunning = false;
  document.removeEventListener('visibilitychange', onVisibilityChange);

  const session = {
    sessionId: 'pom-' + Date.now(),
    startTime,
    plannedDuration,
    endTime: Date.now(),
    completed: elapsed >= plannedDuration * 60 * 0.9,
    focusScore,
    backgroundPeriods,
    elapsed,
  };

  // 保存会话
  const sessions = Store.get(StorageKeys.POMODORO_SESSIONS) || [];
  sessions.push(session);
  Store.set(StorageKeys.POMODORO_SESSIONS, sessions);

  // 清除复习上下文
  localStorage.removeItem('lts_review_context');

  // 显示完成界面
  document.getElementById('pomo-timer').style.display = 'none';
  document.getElementById('pomo-complete').style.display = 'block';
  const stats = document.getElementById('pomo-stats');
  const actualMin = Math.round(elapsed / 60);
  stats.innerHTML = `<span>时长 ${actualMin} 分钟</span><span>专注度 ${focusScore}%</span>`;

  EventBus.emit('pomodoro:completed', session);
}

let selectedRating = 0;

export function afterRender() {
  // 预设按钮
  const presetBtns = document.querySelectorAll('.pomo-preset-btn');
  const onPreset = (e) => {
    const min = parseInt(e.currentTarget.dataset.minutes, 10);
    document.getElementById('pomo-minutes').value = min;
  };
  presetBtns.forEach(b => b.addEventListener('click', onPreset));

  // 开始
  const startBtn = document.getElementById('pomo-start');
  const onStart = () => {
    const min = parseInt(document.getElementById('pomo-minutes').value, 10) || 25;
    startTimer(min);
  };
  startBtn.addEventListener('click', onStart);

  // 暂停/继续
  const pauseBtn = document.getElementById('pomo-pause');
  if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);

  // 停止
  const stopBtn = document.getElementById('pomo-stop');
  if (stopBtn) stopBtn.addEventListener('click', stopTimer);

  // 评分
  const stars = document.querySelectorAll('.pomo-star');
  const onStar = (e) => {
    selectedRating = parseInt(e.currentTarget.dataset.rating, 10);
    stars.forEach((s, i) => s.style.opacity = i < selectedRating ? '1' : '0.3');
  };
  stars.forEach(s => s.addEventListener('click', onStar));

  // 生成学习记录
  const saveBtn = document.getElementById('pomo-save-record');
  const onSave = () => {
    const ctx = getReviewContext();
    const subject = document.getElementById('pomo-subject')?.value || ctx?.subject || '';
    const record = {
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      subject,
      textbook: '',
      knowledgePoints: ctx?.kp ? [ctx.kp] : [],
      score: selectedRating * 20,
      duration: Math.round(elapsed / 60),
      practiceDuration: Math.round(elapsed / 60 * 0.8),
      reviewDuration: Math.round(elapsed / 60 * 0.2),
      activityType: 'practice',
      notes: '番茄钟完成',
      xp: Math.max(1, Math.round(selectedRating * 20 * elapsed / 60 / 20)),
    };
    const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
    records.push(record);
    Store.set(StorageKeys.STUDY_RECORDS, records);
    EventBus.emit('record:added', record);
    Toast.show('学习记录已生成', 'success');
  };
  if (saveBtn) saveBtn.addEventListener('click', onSave);

  // 再来一个
  const restartBtn = document.getElementById('pomo-restart');
  const onRestart = () => {
    document.getElementById('pomo-complete').style.display = 'none';
    document.getElementById('pomo-config').style.display = 'block';
    selectedRating = 0;
    document.querySelectorAll('.pomo-star').forEach(s => s.style.opacity = '1');
  };
  if (restartBtn) restartBtn.addEventListener('click', onRestart);

  return () => {
    presetBtns.forEach(b => b.removeEventListener('click', onPreset));
    startBtn.removeEventListener('click', onStart);
    if (pauseBtn) pauseBtn.removeEventListener('click', pauseTimer);
    if (stopBtn) stopBtn.removeEventListener('click', stopTimer);
    stars.forEach(s => s.removeEventListener('click', onStar));
    if (saveBtn) saveBtn.removeEventListener('click', onSave);
    if (restartBtn) restartBtn.removeEventListener('click', onRestart);
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
