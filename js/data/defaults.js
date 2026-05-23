// defaults.js — 默认数据模板
export const DEFAULT_USER_PROFILE = {
  version: 1,
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
  globalHalfLife: 7.0,
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
