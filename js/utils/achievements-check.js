// achievements-check.js — 成就解锁检测 + 持久化
// 功能: 检测 20+ 种成就条件，持久化已解锁状态，支持 Toast 通知新解锁
// 易错点: 成就一旦解锁就永久保持，即使条件后来不再满足（如连续天数中断）
// 条件类型: record_count/streak_days/total_minutes/unique_subjects/level/
//           max_score_rate/study_at_night/study_at_dawn/pomodoro_count/
//           reading_count/review_count/fast_pomodoro/total_xp/
//           perfect_in_a_row/subject_level/single_subject_hours/
//           score_improvement/all_subject_legendary/export_data/
//           use_command_palette/study_at_3am/speedrun_500xp

import { calcLevel, calcStreakDays } from './level.js';
import { calcSubjectLevel } from './level.js';
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys, SUBJECTS } from '../config.js';

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
    case 'total_xp':
      return (profile.totalXP || 0) >= c.value;

    case 'perfect_in_a_row': {
      let maxStreak = 0, streak = 0;
      for (const r of records) {
        if ((r.score || 0) >= 100) { streak++; maxStreak = Math.max(maxStreak, streak); }
        else streak = 0;
      }
      return maxStreak >= c.value;
    }
    case 'subject_level': {
      const subjKey = c.subject;
      const subjRecords = records.filter(r => r.subject === subjKey);
      if (subjRecords.length === 0) return false;
      const avgScore = subjRecords.reduce((s, r) => s + (r.score || 0), 0) / subjRecords.length;
      const totalMin = subjRecords.reduce((s, r) => s + (r.duration || 0), 0);
      const lvl = calcSubjectLevel(totalMin, avgScore);
      return lvl >= c.value;
    }
    case 'single_subject_hours': {
      const minutesBySubject = {};
      for (const r of records) {
        minutesBySubject[r.subject] = (minutesBySubject[r.subject] || 0) + (r.duration || 0);
      }
      return Object.values(minutesBySubject).some(m => m >= c.value * 60);
    }
    case 'score_improvement': {
      for (let i = 1; i < records.length; i++) {
        if ((records[i].score || 0) - (records[i - 1].score || 0) >= c.value) return true;
      }
      return false;
    }
    case 'all_subject_legendary': {
      const subjectKeys = Object.keys(SUBJECTS);
      return subjectKeys.every(k => {
        const subjRecords = records.filter(r => r.subject === k);
        if (subjRecords.length === 0) return false;
        const avgScore = subjRecords.reduce((s, r) => s + (r.score || 0), 0) / subjRecords.length;
        const totalMin = subjRecords.reduce((s, r) => s + (r.duration || 0), 0);
        return calcSubjectLevel(totalMin, avgScore) >= 6; // 达人级
      });
    }
    case 'export_data':
      return (profile._hasExported || false) === true;
    case 'use_command_palette':
      return (profile._hasUsedCmdPalette || false) === true;
    case 'study_at_3am':
      return records.some(r => { const h = new Date(r.timestamp).getHours(); return h === 3; });
    case 'speedrun_500xp': {
      const xpByDay = {};
      for (const r of records) {
        const day = (r.timestamp || '').slice(0, 10);
        xpByDay[day] = (xpByDay[day] || 0) + (r.xp || 0);
      }
      return Object.values(xpByDay).some(xp => xp >= 500);
    }
    default: return false;
  }
}

// 加载已解锁成就 ID 集合
export function loadUnlockedIds() {
  const data = Store.get(StorageKeys.ACHIEVEMENTS) || [];
  return new Set(Array.isArray(data) ? data : []);
}

// 保存已解锁成就 ID 集合（转为数组存储）
export function saveUnlockedIds(ids) {
  Store.set(StorageKeys.ACHIEVEMENTS, [...ids]);
}

// 检测并持久化: 合并已解锁+新满足的成就
export function checkAndPersist(records, profile, achievements) {
  const unlocked = loadUnlockedIds();
  const newlyUnlocked = [];
  for (const ach of achievements) {
    if (unlocked.has(ach.id)) continue;
    if (checkAchievement(ach, records, profile)) {
      unlocked.add(ach.id);
      newlyUnlocked.push(ach);
    }
  }
  if (newlyUnlocked.length > 0) saveUnlockedIds(unlocked);
  return { unlocked, newlyUnlocked };
}
