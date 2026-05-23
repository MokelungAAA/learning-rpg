// data-migration.js — 数据迁移系统
const migrations = {
  1: (data) => {
    data.version = 1;
    if (!data.updatedAt) data.updatedAt = Date.now();
    return data;
  },
  2: (data) => {
    data.version = 2;
    if (data.subjectAbility && typeof data.subjectAbility === 'object') {
      const defaults = { politics: 0, history: 0, geography: 0 };
      Object.keys(defaults).forEach(k => {
        if (!(k in data.subjectAbility)) data.subjectAbility[k] = defaults[k];
      });
    }
    return data;
  },
  // v3: 修复 halfLife 字段名 + 添加 subjectModifiers + XP 引擎参数
  3: (data) => {
    data.version = 3;
    // 重命名 globalHalfLife → globalBaseHalfLife
    if (data.globalHalfLife !== undefined && data.globalBaseHalfLife === undefined) {
      data.globalBaseHalfLife = data.globalHalfLife;
      delete data.globalHalfLife;
    }
    if (data.globalBaseHalfLife === undefined) data.globalBaseHalfLife = 3.0;
    // 添加 subjectModifiers（拉丁语 key）
    if (!data.subjectModifiers) {
      data.subjectModifiers = {
        logos: 1.0, mythos: 1.0, lingua: 1.0,
        physis: 1.0, khemeia: 1.0, zoe: 1.0,
        politeia: 1.0, historia: 1.0, geographia: 1.0,
      };
    }
    // 添加 XP 引擎参数
    if (data.xpBasePerMinute === undefined) data.xpBasePerMinute = 2.0;
    if (!data.activityWeights) data.activityWeights = { practice: 1.2, exam: 1.5, lecture: 0.8, review: 1.0, reading: 0.6, video: 0.7, other: 0.5 };
    if (data.decayRateForXP === undefined) data.decayRateForXP = 0.00005;
    if (data.dailyXPLimit === undefined) data.dailyXPLimit = 500;
    if (data.dailyXPLimitSoftness === undefined) data.dailyXPLimitSoftness = 0.5;
    if (data.baseReviewRatio === undefined) data.baseReviewRatio = 0.20;
    return data;
  },
};

const LATEST_VERSION = Object.keys(migrations).map(Number).sort((a, b) => b - a)[0] || 1;

export function migrate(data) {
  if (!data || typeof data !== 'object') return data;
  let current = data.version || 0;
  while (migrations[current + 1]) {
    data = migrations[current + 1](data);
    current++;
  }
  return data;
}

export function getDataVersion() {
  return LATEST_VERSION;
}

export default { migrate, getDataVersion };
