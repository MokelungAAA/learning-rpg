// pomodoro.js — 番茄钟系统（配置+计时+休息+自动录入+历史）
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys, POMODORO_PRESETS } from '../config.js';
import EventBus from '../event-bus.js';
import Toast from '../components/toast.js';
import { playFocusStart, playFocusEnd, playBreakEnd, playLongBreakEnd, sendNotification } from '../utils/sound.js';

// 状态
let timer = null;
let startTime = 0;
let plannedDuration = 0;
let elapsed = 0;
let isRunning = false;
let isPaused = false;
let focusScore = 100;
let backgroundPeriods = [];
let bgStart = 0;
let currentRound = 1;
let totalRounds = 4;
let currentPhase = 'focus'; // 'focus' | 'shortBreak' | 'longBreak'
let selectedSubject = '';

const getReviewContext = () => { try { return JSON.parse(localStorage.getItem('lts_review_context') || 'null'); } catch { return null; } };
const getSettings = () => Store.get(StorageKeys.SETTINGS) || {};
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// 获取当前预设
function getCurrentPreset() {
  const settings = getSettings();
  return POMODORO_PRESETS.find(p => p.id === (settings.pomodoroPreset || 'classic')) || POMODORO_PRESETS[0];
}

// 配置界面
function renderConfig() {
  const ctx = getReviewContext();
  const preset = getCurrentPreset();
  const presetBtns = POMODORO_PRESETS.map(p =>
    `<button class="pomo-preset-btn${p.id === preset.id ? ' active' : ''}" data-minutes="${p.work}" data-id="${p.id}">${p.name} ${p.work}分</button>`
  ).join('');
  const subjectOpts = SUBJECTS.map(s => `<option value="${s.id}" ${ctx?.subject === s.name ? 'selected' : ''}>${s.name}</option>`).join('');
  selectedSubject = '';

  return `<div class="pomo-config" id="pomo-config">
    <div class="pomo-config-header">🍅 番茄钟</div>
    ${ctx ? `<div class="pomo-review-context">复习: ${ctx.kp} (${ctx.subject})</div>` : ''}
    <div class="pomo-round-info" id="pomo-round-info">第 1/${preset.rounds} 轮</div>
    <div class="pomo-presets">${presetBtns}</div>
    <div class="pomo-custom">
      <label class="pomo-label">自定义时长</label>
      <div class="pomo-custom-row">
        <input type="number" id="pomo-minutes" class="pomo-input" min="1" max="120" value="${preset.work}" placeholder="25">
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

// 计时界面
function renderTimer() {
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
        <div class="pomo-time-display" id="pomo-time">25:00</div>
        <div class="pomo-timer-label" id="pomo-label">专注中</div>
        <div class="pomo-timer-round" id="pomo-round-display">第 1/4 轮</div>
      </div>
    </div>
    <div class="pomo-timer-controls">
      <button class="pomo-ctrl-btn" id="pomo-pause">⏸ 暂停</button>
      <button class="pomo-ctrl-btn pomo-stop-btn" id="pomo-stop">⏹ 结束</button>
    </div>
    <div class="pomo-focus-score">专注度: <span id="pomo-focus">100</span>%</div>
  </div>`;
}

// 完成界面（无评分，自动生成记录）
function renderComplete() {
  return `<div class="pomo-complete" id="pomo-complete" style="display:none">
    <div class="pomo-complete-icon">🎉</div>
    <div class="pomo-complete-title" id="pomo-complete-title">专注完成！</div>
    <div class="pomo-complete-stats" id="pomo-stats"></div>
    <div class="pomo-complete-actions">
      <button class="pomo-action-btn" id="pomo-next-round">▶ 下一轮</button>
      <button class="pomo-action-btn pomo-secondary" id="pomo-restart">🔄 重新开始</button>
    </div>
  </div>`;
}

// 历史面板
function renderHistory() {
  const sessions = Store.get(StorageKeys.POMODORO_SESSIONS) || [];
  const completed = sessions.filter(s => s.completed && s.phase === 'focus');
  const totalMin = completed.reduce((s, r) => s + (r.plannedDuration || 0), 0);
  const avgFocus = completed.length > 0 ? Math.round(completed.reduce((s, r) => s + (r.focusScore || 0), 0) / completed.length) : 0;

  const recent = sessions.slice(-10).reverse().map(s => {
    const date = s.startTime ? new Date(s.startTime).toLocaleDateString('zh-CN') : '';
    const phase = s.phase === 'focus' ? '🍅' : '☕';
    const status = s.completed ? phase : '❌';
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
    <a href="#/" class="page-back">← 返回首页</a>
    ${renderConfig()}
    ${renderTimer()}
    ${renderComplete()}
    ${renderHistory()}
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.61 · Bug修复</p>
  </div>`;
}

// 启动计时
function startTimer(minutes, phase) {
  currentPhase = phase;
  plannedDuration = minutes;
  elapsed = 0;
  isRunning = true;
  isPaused = false;
  focusScore = phase === 'focus' ? 100 : focusScore;
  backgroundPeriods = [];
  startTime = Date.now();

  document.getElementById('pomo-config').style.display = 'none';
  document.getElementById('pomo-complete').style.display = 'none';
  document.getElementById('pomo-timer').style.display = 'block';

  const totalSeconds = minutes * 60;
  const circumference = 2 * Math.PI * 90;
  const ring = document.getElementById('pomo-ring');
  const timeDisplay = document.getElementById('pomo-time');
  const focusDisplay = document.getElementById('pomo-focus');
  const label = document.getElementById('pomo-label');
  const roundDisplay = document.getElementById('pomo-round-display');

  // 设置颜色和标签 + 音效
  if (phase === 'focus') {
    ring.setAttribute('stroke', 'var(--color-accent)');
    label.textContent = '专注中';
    playFocusStart();
  } else {
    ring.setAttribute('stroke', 'var(--color-success)');
    label.textContent = phase === 'longBreak' ? '长休息' : '短休息';
  }
  roundDisplay.textContent = `第 ${currentRound}/${totalRounds} 轮`;
  timeDisplay.textContent = fmt(totalSeconds);
  ring.setAttribute('stroke-dashoffset', '0');

  timer = setInterval(() => {
    if (isPaused) return;
    elapsed = Math.floor((Date.now() - startTime) / 1000);
    if (elapsed >= totalSeconds) { completeSession(); return; }
    const remaining = totalSeconds - elapsed;
    timeDisplay.textContent = fmt(remaining);
    ring.setAttribute('stroke-dashoffset', circumference * (1 - elapsed / totalSeconds));
    if (phase === 'focus') focusDisplay.textContent = focusScore;
  }, 1000);

  if (phase === 'focus') document.addEventListener('visibilitychange', onVisibilityChange);
}

function onVisibilityChange() {
  if (!isRunning || currentPhase !== 'focus') return;
  if (document.hidden) { bgStart = Date.now(); }
  else if (bgStart > 0) {
    const bgDuration = Date.now() - bgStart;
    backgroundPeriods.push({ start: bgStart, end: Date.now(), duration: bgDuration });
    if (bgDuration > 30000) focusScore = Math.max(0, focusScore - Math.min(20, Math.round(bgDuration / 10000)));
    bgStart = 0;
  }
}

function pauseTimer() {
  if (isPaused) {
    startTime = Date.now() - elapsed * 1000;
    isPaused = false;
    document.getElementById('pomo-pause').textContent = '⏸ 暂停';
    document.getElementById('pomo-label').textContent = currentPhase === 'focus' ? '专注中' : (currentPhase === 'longBreak' ? '长休息' : '短休息');
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

// 完成处理
function completeSession() {
  clearInterval(timer);
  isRunning = false;
  document.removeEventListener('visibilitychange', onVisibilityChange);

  const preset = getCurrentPreset();
  const ctx = getReviewContext();
  const session = {
    sessionId: 'pom-' + Date.now(),
    startTime, plannedDuration, endTime: Date.now(),
    completed: elapsed >= plannedDuration * 60 * 0.9,
    focusScore, backgroundPeriods, elapsed,
    phase: currentPhase, round: currentRound,
    isReview: !!(ctx && currentPhase === 'focus'),
  };

  // 保存会话
  const sessions = Store.get(StorageKeys.POMODORO_SESSIONS) || [];
  sessions.push(session);
  Store.set(StorageKeys.POMODORO_SESSIONS, sessions);

  // 专注完成 → 自动生成学习记录
  if (currentPhase === 'focus' && session.completed) {
    autoSaveRecord();
  }

  localStorage.removeItem('lts_review_context');

  // 音效 + 通知
  if (currentPhase === 'focus') {
    playFocusEnd();
    sendNotification('🍅 专注完成！', `专注 ${Math.round(elapsed / 60)} 分钟，专注度 ${focusScore}%`);
  } else if (currentPhase === 'longBreak') {
    playLongBreakEnd();
    sendNotification('☕ 长休息结束', '准备开始新一轮专注');
  } else {
    playBreakEnd();
    sendNotification('☕ 短休息结束', '准备开始下一轮专注');
  }

  // 显示完成/休息界面
  document.getElementById('pomo-timer').style.display = 'none';
  const completeEl = document.getElementById('pomo-complete');
  completeEl.style.display = 'block';

  const stats = document.getElementById('pomo-stats');
  const title = document.getElementById('pomo-complete-title');
  const nextBtn = document.getElementById('pomo-next-round');

  if (currentPhase === 'focus') {
    const actualMin = Math.round(elapsed / 60);
    stats.innerHTML = `<span>时长 ${actualMin} 分钟</span><span>专注度 ${focusScore}%</span>`;

    if (currentRound >= totalRounds) {
      title.textContent = '🎉 一轮完成！';
      nextBtn.textContent = '☕ 开始长休息';
      nextBtn.dataset.nextPhase = 'longBreak';
    } else {
      title.textContent = '🍅 专注完成！';
      nextBtn.textContent = '☕ 开始短休息';
      nextBtn.dataset.nextPhase = 'shortBreak';
    }
  } else {
    title.textContent = '☕ 休息结束';
    stats.innerHTML = `<span>休息 ${Math.round(elapsed / 60)} 分钟</span>`;
    if (currentPhase === 'longBreak') {
      currentRound = 1;
      nextBtn.textContent = '▶ 开始新一轮';
      nextBtn.dataset.nextPhase = 'focus';
    } else {
      currentRound++;
      nextBtn.textContent = '▶ 开始下一轮';
      nextBtn.dataset.nextPhase = 'focus';
    }
  }

  EventBus.emit('pomodoro:completed', session);
}

// 自动生成学习记录
function autoSaveRecord() {
  const ctx = getReviewContext();
  const subject = selectedSubject || ctx?.subject || '';
  const duration = Math.round(elapsed / 60);
  const isReview = !!ctx;
  const record = {
    id: 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    subject,
    textbook: '',
    knowledgePoints: ctx?.kp ? [ctx.kp] : [],
    score: Math.round(focusScore * 0.8),
    duration,
    practiceDuration: isReview ? Math.round(duration * 0.3) : Math.round(duration * 0.8),
    reviewDuration: isReview ? Math.round(duration * 0.7) : Math.round(duration * 0.2),
    activityType: isReview ? 'review' : 'practice',
    notes: `番茄钟第${currentRound}轮 · 专注度${focusScore}%${isReview ? ' · 复习' : ''}`,
    xp: Math.max(1, Math.round(focusScore * duration / 20)),
  };
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  records.push(record);
  Store.set(StorageKeys.STUDY_RECORDS, records);
  EventBus.emit('record:added', record);
  Toast.show(`${isReview ? '复习' : '学习'}记录已自动保存 · ${duration}分钟`, 'success');
}

export function afterRender() {
  const preset = getCurrentPreset();
  totalRounds = preset.rounds;
  currentRound = 1;

  // 预设按钮
  const presetBtns = document.querySelectorAll('.pomo-preset-btn');
  const onPreset = (e) => {
    const min = parseInt(e.currentTarget.dataset.minutes, 10);
    const id = e.currentTarget.dataset.id;
    document.getElementById('pomo-minutes').value = min;
    const p = POMODORO_PRESETS.find(pp => pp.id === id);
    if (p) { totalRounds = p.rounds; document.getElementById('pomo-round-info').textContent = `第 1/${totalRounds} 轮`; }
    presetBtns.forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
  };
  presetBtns.forEach(b => b.addEventListener('click', onPreset));

  // 开始
  const startBtn = document.getElementById('pomo-start');
  const onStart = () => {
    const min = parseInt(document.getElementById('pomo-minutes').value, 10) || 25;
    selectedSubject = document.getElementById('pomo-subject')?.value || '';
    startTimer(min, 'focus');
  };
  startBtn.addEventListener('click', onStart);

  const pauseBtn = document.getElementById('pomo-pause');
  if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
  const stopBtn = document.getElementById('pomo-stop');
  if (stopBtn) stopBtn.addEventListener('click', stopTimer);

  // 下一轮/休息
  const nextBtn = document.getElementById('pomo-next-round');
  const onNext = () => {
    const phase = nextBtn.dataset.nextPhase || 'focus';
    const preset = getCurrentPreset();
    const min = phase === 'focus' ? preset.work : phase === 'shortBreak' ? preset.shortBreak : preset.longBreak;
    document.getElementById('pomo-complete').style.display = 'none';
    startTimer(min, phase);
  };
  if (nextBtn) nextBtn.addEventListener('click', onNext);

  // 重新开始
  const restartBtn = document.getElementById('pomo-restart');
  const onRestart = () => {
    document.getElementById('pomo-complete').style.display = 'none';
    document.getElementById('pomo-config').style.display = 'block';
    currentRound = 1;
    document.getElementById('pomo-round-info').textContent = `第 1/${totalRounds} 轮`;
  };
  if (restartBtn) restartBtn.addEventListener('click', onRestart);

  return () => {
    presetBtns.forEach(b => b.removeEventListener('click', onPreset));
    startBtn.removeEventListener('click', onStart);
    if (pauseBtn) pauseBtn.removeEventListener('click', pauseTimer);
    if (stopBtn) stopBtn.removeEventListener('click', stopTimer);
    if (nextBtn) nextBtn.removeEventListener('click', onNext);
    if (restartBtn) restartBtn.removeEventListener('click', onRestart);
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
