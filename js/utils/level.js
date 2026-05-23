// level.js — XP/等级计算工具

const LEVEL_TITLES = [
  { cn: '初学者',   name: 'Beginner' },
  { cn: '见习生',   name: 'Novice' },
  { cn: '学徒',     name: 'Apprentice' },
  { cn: '熟练者',   name: 'Adept' },
  { cn: '专家',     name: 'Expert' },
  { cn: '大师',     name: 'Master' },
  { cn: '宗师',     name: 'Grandmaster' },
  { cn: '传说',     name: 'Legend' },
];

const SUBJECT_ICONS = {
  math: '📐', chinese: '📖', english: '🔤',
  physics: '⚡', chemistry: '🧪', biology: '🧬',
  politics: '⚖️', history: '📜', geography: '🌍',
};

export function calcLevel(totalXP) {
  if (totalXP < 100) return 1;
  return Math.floor(Math.log(totalXP / 100 + 1) / Math.log(1.5)) + 1;
}

export function calcLevelProgress(totalXP) {
  const level = calcLevel(totalXP);
  const currentLevelXP = Math.floor(100 * (Math.pow(1.5, level - 1) - 1));
  const nextLevelXP = Math.floor(100 * (Math.pow(1.5, level) - 1));
  const xpInLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) || 0;
  return { level, xpInLevel, xpNeeded, percent };
}

export function getLevelTitle(level) {
  const idx = Math.min(level - 1, LEVEL_TITLES.length - 1);
  return LEVEL_TITLES[Math.max(0, idx)];
}

export function getSubjectIcon(subjectId) {
  return SUBJECT_ICONS[subjectId] || '📚';
}

export function formatNumber(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export function getDayStatus() {
  const h = new Date().getHours();
  if (h >= 5 && h < 8) return { icon: '🌅', text: '早起', color: 'var(--color-warning)' };
  if (h >= 8 && h < 12) return { icon: '☀️', text: '上午', color: 'var(--color-success)' };
  if (h >= 12 && h < 14) return { icon: '🌤️', text: '午间', color: 'var(--color-warning)' };
  if (h >= 14 && h < 18) return { icon: '📖', text: '下午', color: 'var(--color-accent)' };
  if (h >= 18 && h < 22) return { icon: '🌙', text: '晚间', color: 'var(--color-accent)' };
  return { icon: '🦉', text: '深夜', color: 'var(--color-text-3)' };
}

export function calcStreakDays(records) {
  if (!records || !records.length) return 0;
  const days = new Set();
  for (const r of records) {
    if (r.timestamp) days.add(new Date(r.timestamp).toISOString().slice(0, 10));
  }
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

export function calcTodayXP(records) {
  if (!records || !records.length) return 0;
  const today = new Date().toISOString().slice(0, 10);
  let xp = 0;
  for (const r of records) {
    if (r.timestamp && new Date(r.timestamp).toISOString().slice(0, 10) === today) xp += r.xp || 0;
  }
  return xp;
}
