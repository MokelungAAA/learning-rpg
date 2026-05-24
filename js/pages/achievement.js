// achievement.js — 成就浏览页（全部成就列表 + 解锁状态 + 进度条 + 解锁动画）
// 读取: STUDY_RECORDS, USER_PROFILE, ACHIEVEMENTS（持久化）
// 解锁逻辑: 持久化ID + 实时检测取并集（防止已解锁成就因数据变化消失）
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { checkAchievement, loadUnlockedIds, loadUnlockData, checkAndPersist } from '../utils/achievements-check.js';
import { calcLevel } from '../utils/level.js';

const RARITY_LABELS = { bronze: '青铜', silver: '白银', gold: '黄金', legendary: '传说', hidden: '隐藏' };
const CATEGORY_LABELS = { persistence: '坚持之力', knowledge: '博学之路', mastery: '精进之魂', explore: '探索之心', legend: '传奇之巅' };
const CATEGORY_ORDER = ['persistence', 'knowledge', 'mastery', 'explore', 'legend'];

// 条件类型 → 可读描述
const CONDITION_LABELS = {
  record_count: v => `累计${v}条记录`,
  streak_days: v => `连续学习${v}天`,
  total_minutes: v => `累计学习${Math.round(v / 60)}小时`,
  unique_subjects: v => `学习${v}个不同学科`,
  level: v => `达到Lv${v}`,
  total_xp: v => `累计${v}XP`,
  pomodoro_count: v => `完成${v}次番茄钟`,
  reading_count: v => `阅读${v}本书`,
};

function formatCondition(condition) {
  const fn = CONDITION_LABELS[condition.type];
  return fn ? fn(condition.value) : '';
}

// 计算单个成就的解锁进度(0-100)
function calcProgress(ach, records, profile) {
  const c = ach.condition;
  let current = 0;
  switch (c.type) {
    case 'record_count': current = records.length; break;
    case 'streak_days': {
      // 计算最长连续天数
      const days = new Set(records.map(r => (r.timestamp || '').slice(0, 10)));
      let maxStreak = 0, streak = 0;
      const sorted = [...days].sort();
      for (let i = 0; i < sorted.length; i++) {
        if (i === 0) { streak = 1; }
        else {
          const prev = new Date(sorted[i - 1]);
          const curr = new Date(sorted[i]);
          streak = (curr - prev) === 86400000 ? streak + 1 : 1;
        }
        maxStreak = Math.max(maxStreak, streak);
      }
      current = maxStreak;
      break;
    }
    case 'total_minutes': current = records.reduce((s, r) => s + (r.duration || 0), 0); break;
    case 'unique_subjects': current = new Set(records.map(r => r.subject)).size; break;
    case 'level': current = calcLevel(profile.totalXP || 0); break;
    case 'total_xp': current = profile.totalXP || 0; break;
    case 'pomodoro_count': {
      const sessions = Store.get(StorageKeys.POMODORO_SESSIONS) || [];
      current = sessions.filter(s => s.completed && s.phase === 'focus').length;
      break;
    }
    case 'reading_count': {
      const readings = Store.get(StorageKeys.READING_RECORDS) || [];
      current = readings.length;
      break;
    }
    default: return null; // 无法计算进度的返回 null
  }
  return Math.min(100, Math.round((current / c.value) * 100));
}

export function render() {
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  const profile = Store.get(StorageKeys.USER_PROFILE) || {};
  const persistedIds = loadUnlockedIds();
  const liveUnlocked = ACHIEVEMENTS.filter(a => checkAchievement(a, records, profile)).map(a => a.id);
  const unlockedIds = new Set([...persistedIds, ...liveUnlocked]);
  const unlockData = loadUnlockData();
  const dateMap = Object.fromEntries(unlockData.filter(d => d.date).map(d => [d.id, d.date]));

  const sections = CATEGORY_ORDER.map(cat => {
    const items = ACHIEVEMENTS.filter(a => a.category === cat).map(a => {
      const isUnlocked = unlockedIds.has(a.id);
      const isHidden = a.hidden && !isUnlocked;
      const displayName = isHidden ? '???' : a.name;
      const displayDesc = isHidden ? '隐藏成就' : a.description;
      const icon = isHidden ? '🔮' : (isUnlocked ? a.icon : '🔒');
      const progress = isUnlocked ? null : calcProgress(a, records, profile);
      const unlockDate = isUnlocked ? dateMap[a.id] : null;

      const progressBar = (progress !== null && progress < 100)
        ? `<div class="ach-progress-bar"><div class="ach-progress-fill" style="width:${progress}%"></div><span class="ach-progress-text">${progress}%</span></div>`
        : '';

      // 已解锁的隐藏成就显示解锁条件
      const conditionText = (isUnlocked && a.rarity === 'hidden') ? formatCondition(a.condition) : '';

      return `<div class="ach-card ${isUnlocked ? 'unlocked' : 'locked'} ${a.rarity}">
        <div class="ach-icon">${icon}</div>
        <div class="ach-info">
          <div class="ach-name">${displayName}</div>
          <div class="ach-desc">${displayDesc}</div>
          ${conditionText ? `<div class="ach-condition">${conditionText}</div>` : ''}
          <div class="ach-rarity">${RARITY_LABELS[a.rarity] || a.rarity}</div>
          ${progressBar}
          ${unlockDate ? `<div class="ach-date">${unlockDate}</div>` : ''}
        </div>
      </div>`;
    }).join('');
    return `<div class="ach-section">
      <div class="ach-section-title">${CATEGORY_LABELS[cat]}</div>
      <div class="ach-grid">${items}</div>
    </div>`;
  }).join('');

  return `<div class="page-enter">
    <a href="#/data" class="ach-back">← 返回数据</a>
    <div class="ach-header">
      <div class="ach-title">🏆 成就</div>
      <div class="ach-count">${unlockedIds.size} / ${ACHIEVEMENTS.length} 已解锁</div>
    </div>
    ${sections}
  </div>`;
}

// afterRender: 成就解锁弹窗动画（如有新解锁成就）
export function afterRender() {
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  const profile = Store.get(StorageKeys.USER_PROFILE) || {};
  const { newlyUnlocked } = checkAndPersist(records, profile, ACHIEVEMENTS);

  // 弹窗显示所有新解锁成就（依次播放）
  if (newlyUnlocked.length > 0) {
    newlyUnlocked.forEach((ach, i) => {
      setTimeout(() => showUnlockToast(ach), i * 3500);
    });
  }
  return () => {};
}

function showUnlockToast(ach) {
  const existing = document.querySelector('.ach-unlock-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'ach-unlock-toast';
  toast.innerHTML = `<div class="ach-unlock-icon">${ach.icon}<div class="ach-particles" id="ach-particles"></div></div>
    <div class="ach-unlock-text"><div class="ach-unlock-label">成就解锁！</div><div class="ach-unlock-name">${ach.name}</div></div>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add('show');
    spawnParticles(document.getElementById('ach-particles'));
  });
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 3000);
}

function spawnParticles(container) {
  if (!container) return;
  const colors = ['#FFD700', '#FFA500', '#FF6347', '#FFDAB9', '#FFF8DC'];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'ach-particle';
    const angle = (Math.PI * 2 / 12) * i;
    const dist = 30 + Math.random() * 40;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    p.style.background = colors[i % colors.length];
    container.appendChild(p);
    // Animate with WAAPI for reliable custom endpoints
    p.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(0)`, opacity: 0 }
    ], { duration: 800, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)', fill: 'forwards' });
  }
}
