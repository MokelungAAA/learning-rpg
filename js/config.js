// config.js — Constants and route table

export const ROUTES = {
  '#/':               'home',
  '#/data':           'data-tab',
  '#/data/charts':    'data-charts',
  '#/data/log':       'data-log',
  '#/data/review':    'data-review',
  '#/data/reading':   'data-reading',
  '#/data/skill-tree':'skill-tree',
  '#/pomodoro':       'pomodoro-fullscreen',
  '#/settings':       'settings',
  '#/about':          'about',
  '#/achievement':    'achievement',
  '#/subject/:id':    'subject-detail',
  '#/search':         'search',
};

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

export const NAV_TABS = [
  { id: 'home',     label: '首页', icon: '🏠', hash: '#/' },
  { id: 'data',     label: '数据', icon: '📊', hash: '#/data' },
  { id: 'settings', label: '设置', icon: '⚙️', hash: '#/settings' },
];
