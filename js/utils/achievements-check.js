// achievements-check.js — 成就解锁检测 + 持久化
// 功能: 检测 11 种成就条件，持久化已解锁状态，支持 Toast 通知新解锁
// 易错点: 成就一旦解锁就永久保持，即使条件后来不再满足（如连续天数中断）

import { calcLevel, calcStreakDays } from './level.js';
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';

// 检测单个成就是否满足条件
export function checkAchievement(ach, records, profile) {
  const c = ach.condition;
  switch (c.type) {
    case 'record_count': return records.length >= c.value;
    case 'streak_days': return calcStreakDays(records) >= c.value;
    case 'total_minutes':
      return records.reduce((s, r) => s + (r.duration || 0), 0) >= c.value;
    case 'unique_subjects':
      return new Set(records.map(r => r.subject)).size >= c.value;
    case 'level': return calcLevel(profile.totalXP || 0) >= c.value;
    case 'max_score_rate': return records.some(r => (r.score || 0) >= 100);
    case 'study_at_night':
      return records.some(r => { const h = new Date(r.timestamp).getHours(); return h >= 0 && h < 5; });
    case 'study_at_dawn':
      return records.some(r => { const h = new Date(r.timestamp).getHours(); return h >= 5 && h < 7; });
    case 'pomodoro_count': {
      const sessions = Store.get(StorageKeys.POMODORO_SESSIONS) || [];
      return sessions.filter(s => s.completed && s.phase === 'focus').length >= c.value;
    }
    case 'reading_count': {
      const readings = Store.get(StorageKeys.READING_RECORDS) || [];
      return readings.length >= c.value;
    }
    case 'review_count': {
      const sessions = Store.get(StorageKeys.POMODORO_SESSIONS) || [];
      return sessions.filter(s => s.completed && s.isReview).length >= c.value;
    }
    case 'fast_pomodoro': {
      const sessions = Store.get(StorageKeys.POMODORO_SESSIONS) || [];
      return sessions.some(s => s.completed && s.phase === 'focus' && s.elapsed < 15 * 60);
    }
    default: return false;
  }
}

// 加载已解锁成就 ID 集合
export function loadUnlockedIds() {
  const data = Store.get(StorageKeys.ACHIEVEMENTS) || [];
  return new Set(Array.isArray(data) ? data : []);
}

// 保存已解锁成就 ID 集合
export function saveUnlockedIds(ids) {
  Store.set(StorageKeys.ACHIEVEMENTS, [...ids]);
}

// 检测并持久化: 合并已解锁 + 新满足的成就，返回新解锁列表
export function checkAndPersist(records, profile, achievements) {
  const unlocked = loadUnlockedIds();
  const newlyUnlocked = [];
  for (const ach of achievements) {
    if (unlocked.has(ach.id)) continue; // 已解锁跳过
    if (checkAchievement(ach, records, profile)) {
      unlocked.add(ach.id);
      newlyUnlocked.push(ach);
    }
  }
  if (newlyUnlocked.length > 0) saveUnlockedIds(unlocked);
  return { unlocked, newlyUnlocked };
}
