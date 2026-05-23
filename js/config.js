// config.js — 全局常量：路由表、存储键、学科配置
// 注意：学科有三套标识符
//   id: 英文 (math) — 用于 subjectAbility 等旧字段
//   name: 中文 (数学) — 用于 UI 显示
//   latin: 拉丁 (logos) — 用于 subjectModifiers 等新字段

export const ROUTES = {
  '#/':               'home',
  '#/data':           'data-tab',
  '#/data/log':       'data-log',
  '#/data/review':    'data-review',
  '#/data/reading':   'data-reading',
  '#/data/skill-tree':'skill-tree',
  '#/pomodoro':       'pomodoro-fullscreen',
  '#/settings':       'settings',
  '#/about':          'about',
  '#/subject/:id':    'subject-detail',
  '#/data/export':    'data-io',
  '#/search':         'search',
  '#/achievement':    'achievement',
};

// localStorage 键名，所有模块必须引用此处常量
export const STORAGE_KEYS = {
  USER_PROFILE:       'lts_user_profile',
  STUDY_RECORDS:      'lts_study_records',
  POMODORO_SESSIONS:  'lts_pomodoro_sessions',
  READING_RECORDS:    'lts_reading_records',
  KNOWLEDGE_STATE:    'lts_knowledge_state',
  ACHIEVEMENTS:       'lts_achievements',
  SETTINGS:           'lts_settings',
  SYNC_META:          'lts_sync_meta',
  SEARCH_HISTORY:     'lts_search_history',
  CHART_PREFS:        'lts_chart_preferences',
};

// 9 科配置：id 用于旧字段，latin 用于新字段，name 用于显示
export const SUBJECTS = [
  { id: 'math',      name: '数学',   latin: 'logos' },
  { id: 'chinese',   name: '语文',   latin: 'mythos' },
  { id: 'english',   name: '英语',   latin: 'lingua' },
  { id: 'physics',   name: '物理',   latin: 'physis' },
  { id: 'chemistry', name: '化学',   latin: 'khemeia' },
  { id: 'biology',   name: '生物',   latin: 'zoe' },
  { id: 'politics',  name: '政治',   latin: 'politeia' },
  { id: 'history',   name: '历史',   latin: 'historia' },
  { id: 'geography', name: '地理',   latin: 'geographia' },
];

// 番茄钟预设：work/shortBreak/longBreak 单位为分钟
export const POMODORO_PRESETS = [
  { id: 'classic', name: '经典', work: 25, shortBreak: 5, longBreak: 15, rounds: 4 },
  { id: 'short', name: '短时', work: 15, shortBreak: 3, longBreak: 10, rounds: 4 },
  { id: 'long', name: '长时', work: 45, shortBreak: 8, longBreak: 20, rounds: 4 },
  { id: 'intense', name: '高强度', work: 50, shortBreak: 10, longBreak: 30, rounds: 3 },
];

// 成就条件类型枚举，与 achievements.js 配合使用
export const ACHIEVEMENT_CONDITION_TYPES = [
  'pomodoro_count', 'record_count', 'streak_days', 'total_minutes',
  'unique_subjects', 'reading_count', 'review_count',
  'max_score_rate', 'level',
  'study_at_night', 'study_at_dawn', 'fast_pomodoro',
];

// 底部导航栏配置，icon 为 emoji
export const NAV_TABS = [
  { id: 'home',     label: '首页', icon: '🏠', hash: '#/' },
  { id: 'data',     label: '数据', icon: '📊', hash: '#/data' },
  { id: 'settings', label: '设置', icon: '⚙️', hash: '#/settings' },
];
