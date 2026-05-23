// defaults.js — 默认数据模板
export const DEFAULT_USER_PROFILE = {
  version: 3,
  updatedAt: Date.now(),
  nickname: '墨澜',
  grade: '高一',
  subjects: ['physics', 'chemistry', 'biology', 'math', 'english', 'chinese'],
  level: 1,
  totalXP: 0,
  title: '初学者',
  streakDays: 0,
  streakStartDate: null,
  subjectAbility: {
    physics: 0,
    chemistry: 0,
    biology: 0,
    math: 0,
    english: 0,
    chinese: 0,
    politics: 0,
    history: 0,
    geography: 0,
  },
  modifiers: {
    timeOfDay: { morning: 1.1, afternoon: 0.95, evening: 1.0, night: 0.8 },
    subjectType: { '理科': 1.05, '文科': 0.95 },
    sessionLength: { short: 0.9, medium: 1.0, long: 1.05 },
  },
  globalBaseHalfLife: 3.0,
  subjectModifiers: {
    logos: 1.0, mythos: 1.0, lingua: 1.0,
    physis: 1.0, khemeia: 1.0, zoe: 1.0,
    politeia: 1.0, historia: 1.0, geographia: 1.0,
  },
  xpBasePerMinute: 2.0,
  activityWeights: { practice: 1.2, exam: 1.5, lecture: 0.8, review: 1.0, reading: 0.6, video: 0.7, other: 0.5 },
  decayRateForXP: 0.00005,
  dailyXPLimit: 500,
  dailyXPLimitSoftness: 0.5,
  baseReviewRatio: 0.20,
  totalStudyMinutes: 0,
  totalPomodoros: 0,
  pomodoroSettings: {
    defaultPreset: 'classic',
    customPresets: [],
    soundEnabled: true,
    vibrationEnabled: true,
  },
  settings: {
    theme: 'light',
    fontSize: 'standard',
    syncFrequency: 'realtime',
    chartPreferences: {},
  },
};

export const EMPTY_STUDY_RECORDS = [];
export const EMPTY_POMODORO_SESSIONS = [];
export const EMPTY_READING_RECORDS = [];
export const EMPTY_KNOWLEDGE_STATE = {};
export const EMPTY_ACHIEVEMENTS = [];

export function getDefaultProfile() {
  return JSON.parse(JSON.stringify(DEFAULT_USER_PROFILE));
}
