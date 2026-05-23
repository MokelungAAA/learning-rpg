// level.js — XP/等级计算工具 + XP Engine 2.0

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

// 数字滚动动画（countUp）
export function countUp(el, target, duration = 600) {
  if (!el || target === 0) { if (el) el.textContent = '0'; return; }
  const start = performance.now();
  const initial = 0;
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(initial + (target - initial) * eased);
    el.textContent = formatNumber(current);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// 最小二乘法线性回归斜率（用于进步动量计算）
// 输入: values 数组，返回斜率值
// 易错点: 数组长度 <2 时返回 0，避免除零
export function regressionSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
}

// XP Engine 2.0 — 完整 XP 计算公式
// 参考文档 §5.4: XP = round(rawXP × qual × decay × softCap)
// 参数:
//   record — 学习记录（需含 score, duration, practiceDuration, reviewDuration, subject, activityType）
//   profile — 用户画像（需含 xpBasePerMinute, subjectModifiers, activityWeights, decayRateForXP 等）
//   todayXP — 今日已获取 XP（用于软上限计算）
//   last10Scores — 最近 10 条记录的正确率数组（用于动量计算）
// 易错点: subjectModifiers 用拉丁语 key（logos/physis），不是英文 key（math/physics）
export function calcXP(record, profile, todayXP = 0, last10Scores = []) {
  const xppm = profile.xpBasePerMinute || 2.0;
  const score = record.score || 0;
  const practiceDur = record.practiceDuration || (record.duration || 0) * 0.8;
  const reviewDur = record.reviewDuration || (record.duration || 0) * 0.2;

  // rawXP = practiceBase × PE + reviewBase × CE × 1.3
  const PE = score / 100;
  const CE = Math.min(1, score / 100 * 1.2);
  const rawXP = practiceDur * xppm * PE + reviewDur * xppm * CE * 1.3;

  // E = PE × (1 - reviewRatio) + CE × reviewRatio × 1.3
  const reviewRatio = profile.baseReviewRatio || 0.20;
  const E = PE * (1 - reviewRatio) + CE * reviewRatio * 1.3;

  // 学科难度 = sqrt(1 / subjectModifiers[subject])
  const modifiers = profile.subjectModifiers || {};
  const subjectMod = modifiers[record.subject] || 1.0;
  const difficulty = Math.sqrt(1 / subjectMod);

  // 进步动量: tanh(slope) × 0.3，记录 <3 条时为 0
  const momentum = last10Scores.length >= 3
    ? Math.tanh(regressionSlope(last10Scores)) * 0.3
    : 0;

  // 活动类型权重
  const weights = profile.activityWeights || {};
  const activityWeight = weights[record.activityType] || 1.0;

  // qual = E × difficulty × (1 + momentum) × activityWeight
  const qual = E * difficulty * (1 + momentum) * activityWeight;

  // 边际递减: decay = 1 / (1 + totalXP × decayRate)
  const totalXP = profile._runtimeTotalXP || 0;
  const decayRate = profile.decayRateForXP || 0.00005;
  const decay = 1 / (1 + totalXP * decayRate);

  // 软上限: 超过每日限额后 XP 递减
  const limit = profile.dailyXPLimit || 500;
  const softness = profile.dailyXPLimitSoftness || 0.5;
  const softCap = todayXP >= limit
    ? 1 - (1 - softness) * (todayXP - limit) / limit
    : 1;

  return Math.max(1, Math.min(500, Math.round(rawXP * qual * decay * softCap)));
}
