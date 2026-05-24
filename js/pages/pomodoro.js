// pomodoro.js — 番茄钟系统（v0.122: 删除历史 + 后台计时修复）
// 读取: SETTINGS, POMODORO_SESSIONS, STUDY_RECORDS, USER_PROFILE
// 写入: POMODORO_SESSIONS, STUDY_RECORDS（专注完成后自动录入）
// 坑: 模块级状态变量（isRunning等），页面切换需清理 timer
import Store from '../store.js';
import { SUBJECTS, STORAGE_KEYS as StorageKeys, POMODORO_PRESETS } from '../config.js';
import EventBus from '../event-bus.js';
import Toast from '../components/toast.js';
import { playFocusStart, playFocusEnd, playBreakEnd, playLongBreakEnd, sendNotification } from '../utils/sound.js';
import { calcXP } from '../utils/level.js';

// ── 模块级状态 ──
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
let currentPhase = 'focus';
let selectedSubject = '';
let celebrationDone = false;

const getReviewContext = () => { try { return JSON.parse(localStorage.getItem('lts_review_context') || 'null'); } catch { return null; } };
const getSettings = () => Store.get(StorageKeys.SETTINGS) || {};
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function getCurrentPreset() {
  const settings = getSettings();
  return POMODORO_PRESETS.find(p => p.id === (settings.pomodoroPreset || 'classic')) || POMODORO_PRESETS[0];
}

// ── 配置界面 ──
function renderConfig() {
  const ctx = getReviewContext();
  const preset = getCurrentPreset();
  const subjectChips = SUBJECTS.map(s => {
    const selected = ctx?.subject === s.name ? ' selected' : '';
    return `<button class="pomo-chip${selected}" data-subject="${s.id}">${s.name}</button>`;
  }).join('');

  return `<div class="pomo-config" id="pomo-config">
    ${ctx ? `<div class="pomo-context-tag">复习: ${ctx.kp}</div>` : ''}
    <div class="pomo-time-picker">
      <button class="pomo-time-btn" id="pomo-minus">−</button>
      <div class="pomo-time-value">
        <span class="pomo-time-num" id="pomo-time-num">${preset.work}</span>
        <span class="pomo-time-unit">分钟</span>
      </div>
      <button class="pomo-time-btn" id="pomo-plus">+</button>
    </div>
    <div class="pomo-presets-row">
      ${POMODORO_PRESETS.map(p =>
        `<button class="pomo-preset${p.id === preset.id ? ' active' : ''}" data-id="${p.id}" data-work="${p.work}" data-rounds="${p.rounds}">${p.name}</button>`
      ).join('')}
    </div>
    <div class="pomo-subject-row">
      <div class="pomo-subject-label">学科</div>
      <div class="pomo-chips">${subjectChips}</div>
    </div>
    <div class="pomo-round-indicator" id="pomo-round-indicator">
      ${Array.from({length: totalRounds}, (_, i) => `<span class="pomo-dot${i === 0 ? ' first' : ''}"></span>`).join('')}
    </div>
    <button class="pomo-start" id="pomo-start">
      <span class="pomo-start-icon">▶</span>
      <span>开始专注</span>
    </button>
  </div>`;
}

// ── 计时界面 ──
function renderTimer() {
  const r = 110;
  const circumference = 2 * Math.PI * r;
  return `<div class="pomo-timer-page" id="pomo-timer" style="display:none">
    <div class="pomo-timer-phase" id="pomo-phase-label">专注中</div>
    <div class="pomo-timer-ring">
      <svg class="pomo-svg" viewBox="0 0 240 240">
        <circle cx="120" cy="120" r="${r}" fill="none" stroke="var(--color-surface-variant)" stroke-width="6" opacity="0.5"/>
        <circle id="pomo-ring" cx="120" cy="120" r="${r}" fill="none" stroke="var(--color-accent)" stroke-width="6"
          stroke-dasharray="${circumference}" stroke-dashoffset="0" stroke-linecap="round"
          transform="rotate(-90 120 120)"/>
      </svg>
      <div class="pomo-timer-center">
        <div class="pomo-timer-time" id="pomo-time">25:00</div>
        <div class="pomo-timer-sub" id="pomo-timer-sub">专注度 100%</div>
      </div>
    </div>
    <div class="pomo-timer-rounds" id="pomo-timer-rounds"></div>
    <div class="pomo-timer-controls">
      <button class="pomo-ctrl" id="pomo-pause">
        <span class="pomo-ctrl-icon">⏸</span>
        <span>暂停</span>
      </button>
      <button class="pomo-ctrl pomo-ctrl-stop" id="pomo-stop">
        <span class="pomo-ctrl-icon">■</span>
        <span>结束</span>
      </button>
    </div>
  </div>`;
}

// ── 完成界面（含庆祝动画容器） ──
function renderComplete() {
  return `<div class="pomo-complete" id="pomo-complete" style="display:none">
    <canvas id="pomo-confetti" class="pomo-confetti-canvas"></canvas>
    <div class="pomo-complete-badge" id="pomo-badge"></div>
    <div class="pomo-complete-title" id="pomo-complete-title">专注完成</div>
    <div class="pomo-complete-stats" id="pomo-stats"></div>
    <div class="pomo-complete-actions">
      <button class="pomo-btn-primary" id="pomo-next-round">下一轮</button>
      <button class="pomo-btn-secondary" id="pomo-edit-record">编辑记录</button>
      <button class="pomo-btn-ghost" id="pomo-restart">重新开始</button>
    </div>
  </div>`;
}

// ── 历史面板 ──
function renderHistory() {
  const sessions = Store.get(StorageKeys.POMODORO_SESSIONS) || [];
  const completed = sessions.filter(s => s.completed && s.phase === 'focus');
  const totalMin = completed.reduce((s, r) => s + (r.plannedDuration || 0), 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = completed.filter(s => s.startTime && new Date(s.startTime).toISOString().slice(0, 10) === todayStr).length;

  const recent = sessions.slice(-5).reverse().map(s => {
    const t = s.startTime ? new Date(s.startTime) : null;
    const time = t ? t.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
    const phase = s.phase === 'focus' ? '🍅' : '☕';
    const sid = s.sessionId || s.id || '';
    return `<div class="pomo-hist-item" data-id="${sid}">
      <span class="pomo-hist-icon">${s.completed ? phase : '○'}</span>
      <span class="pomo-hist-dur">${s.plannedDuration || 0}分</span>
      <span class="pomo-hist-score">${s.focusScore || 0}%</span>
      <span class="pomo-hist-time">${time}</span>
      <button class="pomo-hist-delete" data-id="${sid}" title="删除">✕</button>
    </div>`;
  }).join('');

  return `<div class="pomo-history-section">
    <div class="pomo-hist-summary">
      <div class="pomo-hist-stat"><span class="pomo-hist-num">${todayCount}</span><span class="pomo-hint">今日</span></div>
      <div class="pomo-hist-stat"><span class="pomo-hist-num">${completed.length}</span><span class="pomo-hint">总计</span></div>
      <div class="pomo-hist-stat"><span class="pomo-hist-num">${totalMin}</span><span class="pomo-hint">分钟</span></div>
    </div>
    ${recent ? `<div class="pomo-hist-list">${recent}</div>` : ''}
  </div>`;
}

export function render() {
  return `<div class="page-enter pomo-page">
    <a href="#/" class="page-back">← 返回</a>
    ${renderConfig()}
    ${renderTimer()}
    ${renderComplete()}
    ${renderHistory()}
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs);text-align:center">v0.122</p>
  </div>`;
}

// ── 庆祝动画：粒子 + 彩纸 ──
function launchCelebration() {
  const canvas = document.getElementById('pomo-confetti');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * 2;
  canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;

  const colors = ['#62A0EA', '#FF6B6B', '#FFD93D', '#6BCB77', '#C084FC', '#FF8C00'];
  const particles = [];
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: W / 2 + (Math.random() - 0.5) * 60,
      y: H / 2,
      vx: (Math.random() - 0.5) * 8,
      vy: -Math.random() * 10 - 4,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    });
  }

  let frame = 0;
  const maxFrames = 120;
  function animate() {
    if (frame >= maxFrames) { ctx.clearRect(0, 0, W, H); return; }
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.x += p.vx;
      p.vy += 0.25;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.opacity = Math.max(0, 1 - frame / maxFrames);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    frame++;
    requestAnimationFrame(animate);
  }
  animate();
}

// ── 计时器逻辑 ──
function startTimer(minutes, phase) {
  currentPhase = phase;
  plannedDuration = minutes;
  elapsed = 0;
  isRunning = true;
  isPaused = false;
  focusScore = phase === 'focus' ? 100 : focusScore;
  backgroundPeriods = [];
  startTime = Date.now();
  celebrationDone = false;

  document.getElementById('pomo-config').style.display = 'none';
  document.getElementById('pomo-complete').style.display = 'none';
  document.getElementById('pomo-timer').style.display = 'flex';

  const totalSeconds = minutes * 60;
  const r = 110;
  const circumference = 2 * Math.PI * r;
  const ring = document.getElementById('pomo-ring');
  const timeDisplay = document.getElementById('pomo-time');
  const subDisplay = document.getElementById('pomo-timer-sub');
  const phaseLabel = document.getElementById('pomo-phase-label');
  const roundsEl = document.getElementById('pomo-timer-rounds');

  // 更新回合指示器
  if (roundsEl) {
    roundsEl.innerHTML = Array.from({length: totalRounds}, (_, i) =>
      `<span class="pomo-round-dot${i < currentRound ? ' done' : ''}${i === currentRound - 1 && phase === 'focus' ? ' active' : ''}"></span>`
    ).join('');
  }

  if (phase === 'focus') {
    ring.setAttribute('stroke', 'var(--color-accent)');
    phaseLabel.textContent = '专注中';
    playFocusStart();
  } else {
    ring.setAttribute('stroke', 'var(--color-success)');
    phaseLabel.textContent = phase === 'longBreak' ? '长休息' : '短休息';
  }
  timeDisplay.textContent = fmt(totalSeconds);
  subDisplay.textContent = '专注度 100%';
  ring.style.transition = 'none';
  ring.setAttribute('stroke-dashoffset', '0');

  requestAnimationFrame(() => {
    ring.style.transition = 'stroke-dashoffset 1s linear';
  });

  timer = setInterval(() => {
    if (isPaused) return;
    elapsed = Math.floor((Date.now() - startTime) / 1000);
    if (elapsed >= totalSeconds) { completeSession(); return; }
    const remaining = totalSeconds - elapsed;
    timeDisplay.textContent = fmt(remaining);
    ring.setAttribute('stroke-dashoffset', circumference * (elapsed / totalSeconds));
    if (phase === 'focus') {
      subDisplay.textContent = `专注度 ${focusScore}%`;
      EventBus.emit('pomo:tick', remaining);
    }
  }, 1000);

  if (phase === 'focus') {
    document.addEventListener('visibilitychange', onVisibilityChange);
    EventBus.emit('pomo:started', { totalSeconds });
  }
}

function onVisibilityChange() {
  if (!isRunning || currentPhase !== 'focus') return;
  if (document.hidden) { bgStart = Date.now(); }
  else if (bgStart > 0) {
    const bgDuration = Date.now() - bgStart;
    backgroundPeriods.push({ start: bgStart, end: Date.now(), duration: bgDuration });
    if (bgDuration > 10000) focusScore = Math.max(0, focusScore - 10);
    bgStart = 0;
  }
}

function pauseTimer() {
  if (isPaused) {
    startTime = Date.now() - elapsed * 1000;
    isPaused = false;
    document.getElementById('pomo-pause').querySelector('.pomo-ctrl-icon').textContent = '⏸';
    document.getElementById('pomo-pause').querySelector('span:last-child').textContent = '暂停';
    document.getElementById('pomo-phase-label').textContent = currentPhase === 'focus' ? '专注中' : (currentPhase === 'longBreak' ? '长休息' : '短休息');
  } else {
    isPaused = true;
    if (currentPhase === 'focus') focusScore = Math.max(0, focusScore - 5);
    document.getElementById('pomo-pause').querySelector('.pomo-ctrl-icon').textContent = '▶';
    document.getElementById('pomo-pause').querySelector('span:last-child').textContent = '继续';
    document.getElementById('pomo-phase-label').textContent = '已暂停';
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
  EventBus.emit('pomo:stopped');

  const ctx = getReviewContext();
  const plannedSeconds = plannedDuration * 60;
  const completionRatio = Math.min(1, elapsed / plannedSeconds);

  if (currentPhase === 'focus' && completionRatio < 0.9) {
    focusScore = Math.round(focusScore * completionRatio);
  }

  const session = {
    sessionId: 'pom-' + Date.now(),
    startTime, plannedDuration, endTime: Date.now(),
    completed: completionRatio >= 0.9,
    focusScore, backgroundPeriods, elapsed,
    phase: currentPhase, round: currentRound,
    isReview: !!(ctx && currentPhase === 'focus'),
  };

  const sessions = Store.get(StorageKeys.POMODORO_SESSIONS) || [];
  sessions.push(session);
  Store.set(StorageKeys.POMODORO_SESSIONS, sessions);

  if (currentPhase === 'focus' && session.completed) {
    autoSaveRecord();
  }
  localStorage.removeItem('lts_review_context');

  if (currentPhase === 'focus') {
    playFocusEnd();
    sendNotification('专注完成', `${Math.round(elapsed / 60)} 分钟 · 专注度 ${focusScore}%`);
  } else if (currentPhase === 'longBreak') {
    playLongBreakEnd();
    sendNotification('长休息结束', '准备开始新一轮');
  } else {
    playBreakEnd();
    sendNotification('短休息结束', '准备开始下一轮');
  }

  // 切换界面
  document.getElementById('pomo-timer').style.display = 'none';
  const completeEl = document.getElementById('pomo-complete');
  completeEl.style.display = 'flex';

  const badge = document.getElementById('pomo-badge');
  const title = document.getElementById('pomo-complete-title');
  const stats = document.getElementById('pomo-stats');
  const nextBtn = document.getElementById('pomo-next-round');

  if (currentPhase === 'focus') {
    const actualMin = Math.round(elapsed / 60);
    badge.textContent = '🍅';
    badge.className = 'pomo-complete-badge';
    title.textContent = currentRound >= totalRounds ? '一轮完成' : '专注完成';
    stats.innerHTML = `
      <div class="pomo-stat-item"><span class="pomo-stat-val">${actualMin}</span><span class="pomo-stat-lbl">分钟</span></div>
      <div class="pomo-stat-item"><span class="pomo-stat-val">${focusScore}%</span><span class="pomo-stat-lbl">专注度</span></div>
    `;
    if (currentRound >= totalRounds) {
      nextBtn.textContent = '开始长休息';
      nextBtn.dataset.nextPhase = 'longBreak';
    } else {
      nextBtn.textContent = '开始短休息';
      nextBtn.dataset.nextPhase = 'shortBreak';
    }
    // 庆祝动画
    if (!celebrationDone && session.completed) {
      celebrationDone = true;
      setTimeout(() => launchCelebration(), 200);
    }
  } else {
    badge.textContent = '☕';
    title.textContent = '休息结束';
    stats.innerHTML = `<div class="pomo-stat-item"><span class="pomo-stat-val">${Math.round(elapsed / 60)}</span><span class="pomo-stat-lbl">分钟休息</span></div>`;
    if (currentPhase === 'longBreak') {
      currentRound = 1;
      nextBtn.textContent = '开始新一轮';
      nextBtn.dataset.nextPhase = 'focus';
    } else {
      currentRound++;
      nextBtn.textContent = '开始下一轮';
      nextBtn.dataset.nextPhase = 'focus';
    }
  }

  EventBus.emit('pomodoro:completed', session);
}

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
    score: focusScore,
    duration,
    practiceDuration: isReview ? Math.round(duration * 0.3) : Math.round(duration * 0.8),
    reviewDuration: isReview ? Math.round(duration * 0.7) : Math.round(duration * 0.2),
    activityType: isReview ? 'review' : 'practice',
    source: 'pomodoro',
    notes: `番茄钟第${currentRound}轮 · 专注度${focusScore}%${isReview ? ' · 复习' : ''}`,
    xp: 0,
  };
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
  Toast.show(`${isReview ? '复习' : '学习'}记录已保存 · ${duration}分钟`, 'success');
}

// ── afterRender ──
export function afterRender() {
  const preset = getCurrentPreset();
  totalRounds = preset.rounds;
  currentRound = 1;
  selectedSubject = '';

  // 时间 +/- 按钮
  const timeNum = document.getElementById('pomo-time-num');
  const minusBtn = document.getElementById('pomo-minus');
  const plusBtn = document.getElementById('pomo-plus');
  const onMinus = () => { const v = Math.max(1, parseInt(timeNum.textContent) - 5); timeNum.textContent = v; };
  const onPlus = () => { const v = Math.min(120, parseInt(timeNum.textContent) + 5); timeNum.textContent = v; };
  if (minusBtn) minusBtn.addEventListener('click', onMinus);
  if (plusBtn) plusBtn.addEventListener('click', onPlus);

  // 预设按钮
  const presetBtns = document.querySelectorAll('.pomo-preset');
  const onPreset = (e) => {
    const btn = e.currentTarget;
    const work = parseInt(btn.dataset.work);
    const rounds = parseInt(btn.dataset.rounds);
    timeNum.textContent = work;
    totalRounds = rounds;
    updateRoundIndicator();
    presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  };
  presetBtns.forEach(b => b.addEventListener('click', onPreset));

  // 学科选择 chips
  const chips = document.querySelectorAll('.pomo-chip');
  const onChip = (e) => {
    const btn = e.currentTarget;
    const wasSelected = btn.classList.contains('selected');
    chips.forEach(c => c.classList.remove('selected'));
    if (!wasSelected) {
      btn.classList.add('selected');
      selectedSubject = btn.dataset.subject;
    } else {
      selectedSubject = '';
    }
  };
  chips.forEach(c => c.addEventListener('click', onChip));

  // 回合指示器
  function updateRoundIndicator() {
    const el = document.getElementById('pomo-round-indicator');
    if (el) {
      el.innerHTML = Array.from({length: totalRounds}, (_, i) =>
        `<span class="pomo-dot${i === 0 ? ' first' : ''}"></span>`
      ).join('');
    }
  }

  // 开始
  const startBtn = document.getElementById('pomo-start');
  const onStart = () => {
    const min = parseInt(document.getElementById('pomo-time-num').textContent) || 25;
    startTimer(min, 'focus');
  };
  if (startBtn) startBtn.addEventListener('click', onStart);

  // 暂停/停止
  const pauseBtn = document.getElementById('pomo-pause');
  if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
  const stopBtn = document.getElementById('pomo-stop');
  if (stopBtn) stopBtn.addEventListener('click', stopTimer);

  // 下一轮
  const nextBtn = document.getElementById('pomo-next-round');
  const onNext = () => {
    const phase = nextBtn.dataset.nextPhase || 'focus';
    const p = getCurrentPreset();
    const min = phase === 'focus' ? p.work : phase === 'shortBreak' ? p.shortBreak : p.longBreak;
    document.getElementById('pomo-complete').style.display = 'none';
    startTimer(min, phase);
  };
  if (nextBtn) nextBtn.addEventListener('click', onNext);

  // 重新开始
  const restartBtn = document.getElementById('pomo-restart');
  const onRestart = () => {
    clearInterval(timer);
    isRunning = false;
    isPaused = false;
    elapsed = 0;
    currentRound = 1;
    document.getElementById('pomo-complete').style.display = 'none';
    document.getElementById('pomo-timer').style.display = 'none';
    document.getElementById('pomo-config').style.display = 'block';
    updateRoundIndicator();
  };
  if (restartBtn) restartBtn.addEventListener('click', onRestart);

  // 编辑记录 → 打开数据录入弹窗
  const editBtn = document.getElementById('pomo-edit-record');
  const onEditRecord = async () => {
    const { open } = await import('../components/data-entry.js');
    open();
  };
  if (editBtn) editBtn.addEventListener('click', onEditRecord);

  // 删除历史记录
  const onDeleteHist = (e) => {
    const btn = e.target.closest('.pomo-hist-delete');
    if (!btn) return;
    const id = btn.dataset.id;
    const sessions = Store.get(StorageKeys.POMODORO_SESSIONS) || [];
    const filtered = sessions.filter(s => (s.sessionId || s.id) !== id);
    Store.set(StorageKeys.POMODORO_SESSIONS, filtered);
    // 重新渲染历史区域
    const histSection = document.querySelector('.pomo-history-section');
    if (histSection) histSection.outerHTML = renderHistory();
  };
  document.addEventListener('click', onDeleteHist);

  return () => {
    if (minusBtn) minusBtn.removeEventListener('click', onMinus);
    if (plusBtn) plusBtn.removeEventListener('click', onPlus);
    presetBtns.forEach(b => b.removeEventListener('click', onPreset));
    chips.forEach(c => c.removeEventListener('click', onChip));
    if (startBtn) startBtn.removeEventListener('click', onStart);
    if (pauseBtn) pauseBtn.removeEventListener('click', pauseTimer);
    if (stopBtn) stopBtn.removeEventListener('click', stopTimer);
    if (nextBtn) nextBtn.removeEventListener('click', onNext);
    if (restartBtn) restartBtn.removeEventListener('click', onRestart);
    if (editBtn) editBtn.removeEventListener('click', onEditRecord);
    document.removeEventListener('click', onDeleteHist);
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

export function quickStart() {
  const preset = getCurrentPreset();
  startTimer(preset.work, 'focus');
}
