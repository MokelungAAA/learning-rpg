// level.js — XP/等级计算工具 + XP Engine 2.0
// 功能: 等级公式、XP进度、连续天数、今日XP、数字动画、回归斜率、XP引擎
// 易错点: 等级公式为 log₁.₅，subject key 用英文（math/physics）

// 每 10 级一个段位，共 10 段（Level 1-100）
const LEVEL_TITLES = [
  { min: 1,  max: 10,  cn: '初学者',   name: 'Beginner' },
  { min: 11, max: 20,  cn: '见习生',   name: 'Novice' },
  { min: 21, max: 30,  cn: '学徒',     name: 'Apprentice' },
  { min: 31, max: 40,  cn: '熟练者',   name: 'Adept' },
  { min: 41, max: 50,  cn: '专家',     name: 'Expert' },
  { min: 51, max: 60,  cn: '大师',     name: 'Master' },
  { min: 61, max: 70,  cn: '宗师',     name: 'Grandmaster' },
  { min: 71, max: 80,  cn: '传说',     name: 'Legend' },
  { min: 81, max: 90,  cn: '神话',     name: 'Mythic' },
  { min: 91, max: 100, cn: '超越',     name: 'Transcend' },
];

// §5.3 学科等级称号体系（日语）：按正确率分数范围映射
const SUBJECT_LEVEL_TITLES = [
  { min: 0,  max: 9,   ja: '見習い',   reading: 'Minarai',    cn: '见习',   color: '#9CA3AF' },
  { min: 10, max: 19,  ja: '初心者',   reading: 'Shoshinsha', cn: '初心者', color: '#6B7280' },
  { min: 20, max: 39,  ja: '学徒',     reading: 'Gakuto',     cn: '学徒',   color: '#3B82F6' },
  { min: 40, max: 59,  ja: '熟練者',   reading: 'Jukurensha', cn: '熟练者', color: '#10B981' },
  { min: 60, max: 79,  ja: '達人',     reading: 'Tatsujin',   cn: '达人',   color: '#F59E0B' },
  { min: 80, max: 94,  ja: '名人',     reading: 'Meijin',     cn: '名人',   color: '#EF4444' },
  { min: 95, max: 100, ja: '伝説',     reading: 'Densetsu',   cn: '传说',   color: '#8B5CF6' },
];

const SUBJECT_ICONS = {
  math: '📐', chinese: '📖', english: '🔤',
  physics: '⚡', chemistry: '🧪', biology: '🧬',
  politics: '⚖️', history: '📜', geography: '🌍',
};

// 根据总XP计算等级，公式: floor(log₁.₅(xp/100+1)) + 1
// @param {number} totalXP — 累计总XP
// @returns {number} 等级（最低1级）
export function calcLevel(totalXP) {
  if (totalXP < 100) return 1;
  return Math.floor(Math.log(totalXP / 100 + 1) / Math.log(1.5)) + 1;
}

// 学科等级: 基于该学科累计学习时长(分钟)计算
// @param {number} totalMinutes — 该学科累计学习分钟数
// @param {number} avgScore — 该学科平均正确率(可选, 用于加成)
// @returns {number} 等级（最低1级）
export function calcSubjectLevel(totalMinutes, avgScore) {
  if (totalMinutes < 10) return 1;
  const base = Math.floor(Math.log(totalMinutes / 60 + 1) / Math.log(1.5)) + 1;
  const bonus = (avgScore || 0) >= 85 ? 1 : 0;
  return Math.min(10, base + bonus);
}

// 计算当前等级内的XP进度（用于进度条显示）
// @param {number} totalXP — 累计总XP
// @returns {{level, xpInLevel, xpNeeded, percent}} 等级+进度信息
export function calcLevelProgress(totalXP) {
  const level = calcLevel(totalXP);
  const currentLevelXP = Math.floor(100 * (Math.pow(1.5, level - 1) - 1));
  const nextLevelXP = Math.floor(100 * (Math.pow(1.5, level) - 1));
  const xpInLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) || 0;
  return { level, xpInLevel, xpNeeded, percent };
}

// 获取等级对应的中文称号（每10级一段，10段封顶）
// @param {number} level — 当前等级
// @returns {{cn, name, min, max}} 段位信息
export function getLevelTitle(level) {
  for (const t of LEVEL_TITLES) {
    if (level >= t.min && level <= t.max) return t;
  }
  return LEVEL_TITLES[LEVEL_TITLES.length - 1];
}

// §5.3 获取学科等级称号（日语体系，按正确率分数范围）
// @param {number} avgScore — 学科平均正确率 (0-100)
// @returns {{ja, reading, cn, color}} 日文+读音+中文+颜色
export function getSubjectLevelTitle(avgScore) {
  for (const t of SUBJECT_LEVEL_TITLES) {
    if (avgScore >= t.min && avgScore <= t.max) return t;
  }
  return SUBJECT_LEVEL_TITLES[0];
}

// 获取学科图标（英文 key: math/physics/chemistry 等）
// @param {string} subjectId — 学科英文ID
// @returns {string} emoji图标，未知学科返回📚
export function getSubjectIcon(subjectId) {
  return SUBJECT_ICONS[subjectId] || '📚';
}

// 数字格式化：>=1万显示"万"，>=1千显示"k"
// @param {number} n — 数字
// @returns {string} 格式化后的字符串
export function formatNumber(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

// §4.3 每日状态：根据周几判断（非时段）
// 周一至周五 → 📖 平日，周六 → 🎯 周末，周日 → 📝 复盘日
// @returns {{icon, text, color}} 状态图标+文字+主题色变量
export function getDayStatus() {
  const day = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (day === 0) return { icon: '📝', text: '复盘日', color: 'var(--color-accent)' };
  if (day === 6) return { icon: '🎯', text: '周末', color: 'var(--color-success)' };
  return { icon: '📖', text: '平日', color: 'var(--color-accent)' };
}

// 计算连续学习天数（从今天往前数，中断即停）
// @param {Array} records — 学习记录数组（需含 timestamp）
// @returns {number} 连续天数，无记录返回0
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

// 计算今日已获取XP总和（用于XP软上限判断）
// @param {Array} records — 学习记录数组（需含 timestamp, xp）
// @returns {number} 今日XP总和
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
//   talentSubjects — 特长学科 Set（可选，有特长时 qual ×1.1）
// 易错点: subjectModifiers 用拉丁语 key（logos/physis），不是英文 key（math/physics）
export function calcXP(record, profile, todayXP = 0, last10Scores = [], talentSubjects = null) {
  const xppm = profile.xpBasePerMinute || 2.0;
  const score = record.score || 0;
  const duration = record.duration || 0;
  const practiceDur = record.practiceDuration || duration * 0.8;
  const reviewDur = record.reviewDuration || duration * 0.2;

  // 活动类型权重（优先使用动态权重，回退到基础权重）
  const baseWeights = profile.activityWeights || {};
  const dynamicWeights = profile.dynamicActivityWeights || {};
  const dynKey = `${record.subject}_${record.activityType}`;
  const activityWeight = dynamicWeights[dynKey] || baseWeights[record.activityType] || 1.0;
  const hasScore = (record.activityType === 'practice' || record.activityType === 'exam') && score > 0;

  let rawXP;
  if (hasScore) {
    // 有分数路径: rawXP = practiceBase × PE + reviewBase × CE × 1.3
    const PE = score / 100;
    const CE = Math.min(1, score / 100 * 1.2);
    rawXP = practiceDur * xppm * PE + reviewDur * xppm * CE * 1.3;
  } else {
    // 无分数路径: 基于时长的基础 XP（复习/上课/阅读等）
    // 效率系数 0.6: 比有分数活动低，但不是零
    rawXP = duration * xppm * 0.6;
  }

  // E 系数: 有分数时用 PE/CE 加权，无分数时固定 0.6
  const reviewRatio = profile.baseReviewRatio || 0.20;
  let E;
  if (hasScore) {
    const PE = score / 100;
    const CE = Math.min(1, score / 100 * 1.2);
    E = PE * (1 - reviewRatio) + CE * reviewRatio * 1.3;
  } else {
    E = 0.6;
  }

  // 学科难度 = sqrt(1 / subjectModifiers[subject])，subjectMod 下限 0.5 防止极端值
  const modifiers = profile.subjectModifiers || {};
  const subjectMod = Math.max(0.5, modifiers[record.subject] || 1.0);
  const difficulty = Math.sqrt(1 / subjectMod);

  // 进步动量: tanh(slope / 10) × 0.3，记录 <3 条时为 0
  // §5.6: slope 除以 10 压缩尺度，防止 tanh 过早饱和
  const momentum = last10Scores.length >= 3
    ? Math.tanh(regressionSlope(last10Scores) / 10) * 0.3
    : 0;

  // qual = E × difficulty × (1 + momentum) × activityWeight × talentMultiplier
  // §5.4: 特长学科 XP 额外 ×1.1
  const talentMultiplier = (talentSubjects && talentSubjects.has(record.subject)) ? 1.1 : 1.0;
  let qual = E * difficulty * (1 + momentum) * activityWeight * talentMultiplier;

  // === 4项心理学增强 ===

  // 1. 进步趋势修正 (Dweck 成长型思维): accuracy 上升时额外加成
  //    momentum 已经捕获了趋势，这里用额外的 progressBonus 放大效果
  //    slope > 0 → 进步中 → ×1.0~1.2; slope < 0 → 退步 → ×0.9~1.0
  const progressBonus = last10Scores.length >= 5
    ? 1 + Math.max(-0.1, Math.min(0.2, regressionSlope(last10Scores) / 50))
    : 1;
  qual *= progressBonus;

  // 2. 挫败下限保护 (Deci & Ryan 自我决定理论):
  //    正确率 <25% 且已尝试很多次 → 可能是挫败不是努力 → 降低 qual
  //    用 last10Scores 的平均值判断持续低正确率
  if (last10Scores.length >= 10) {
    const recentAvg = last10Scores.reduce((a, b) => a + b, 0) / last10Scores.length;
    if (recentAvg < 25) {
      // 持续极低正确率 → qual 降低 30%（但不归零，仍有基础奖励）
      qual *= 0.7;
    }
  }

  // 3. 最佳间隔加成 (Cepeda 间隔效应):
  //    review 活动 + 学科修正系数较高 → 间隔合理 → ×1.1~1.3
  //    subjectMod > 1.0 说明该学科半衰期较长，复习间隔合理
  if (record.activityType === 'review' && subjectMod > 1.0) {
    const spacingMult = Math.min(1.3, 1 + (subjectMod - 1) * 0.3);
    qual *= spacingMult;
  }

  // 边际递减: decay = 1 / (1 + totalXP × decayRate)
  const totalXP = profile._runtimeTotalXP || 0;
  const decayRate = profile.decayRateForXP || 0.00005;
  const decay = 1 / (1 + totalXP * decayRate);

  // 软上限: 超过每日限额后 XP 递减，最低 0.1（不会完全归零）
  const limit = profile.dailyXPLimit || 500;
  const softness = profile.dailyXPLimitSoftness || 0.5;
  const softCap = todayXP >= limit
    ? Math.max(0.1, 1 - (1 - softness) * (todayXP - limit) / limit)
    : 1;

  let finalXP = rawXP * qual * decay * softCap;

  // 4. XP暴击 (Skinner 变比率强化): 5%概率 ×2
  //    用 record.id 的 hash 做确定性判断（同一条记录重算时结果一致）
  const hash = record.id ? record.id.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0) : 0;
  if (Math.abs(hash % 100) < 5) finalXP *= 2;

  return Math.max(1, Math.min(500, Math.round(finalXP)));
}
