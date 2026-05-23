// achievements-check.js — 成就解锁检测
import { calcLevel, calcStreakDays } from './level.js';
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';

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
