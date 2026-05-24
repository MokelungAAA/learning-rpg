// data-migration.js — 数据版本迁移系统
// 按版本号顺序执行迁移函数，跳过已完成的版本
// 迁移对象直接修改 data（mutable），注意引用问题
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
    if (!data.activityWeights) data.activityWeights = { practice: 1.2, exam: 1.5, lecture: 0.8, review: 1.0, note: 0.9, reading: 0.6, video: 0.7, other: 0.5 };
    if (data.decayRateForXP === undefined) data.decayRateForXP = 0.00005;
    if (data.dailyXPLimit === undefined) data.dailyXPLimit = 500;
    if (data.dailyXPLimitSoftness === undefined) data.dailyXPLimitSoftness = 0.5;
    if (data.baseReviewRatio === undefined) data.baseReviewRatio = 0.20;
    return data;
  },
};

const LATEST_VERSION = Object.keys(migrations).map(Number).sort((a, b) => b - a)[0] || 1;

// 执行所有待运行的迁移，返回迁移后的数据
// data: 用户画像对象，必须有 version 字段
export function migrate(data) {
  if (!data || typeof data !== 'object') return data;
  let current = data.version || 0;
  while (migrations[current + 1]) {
    data = migrations[current + 1](data);
    current++;
  }
  return data;
}

// 返回当前最新数据版本号
export function getDataVersion() {
  return LATEST_VERSION;
}

// 重算所有记录的 XP（XP Engine 2.0 迁移）
// 必须在 profile migrate 之后调用
// 用 _xpMigrated 标记防止重复执行
// 注意: 已有 XP 的记录保留原值不重算（避免新引擎边际递减导致 XP 降低）
export function migrateRecordsXP(Store, StorageKeys, calcXP) {
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  if (!records.length) return;
  // 检查是否需要迁移：跳过条件为标记已设 AND 所有记录都有 XP
  const profile = Store.get(StorageKeys.USER_PROFILE) || {};
  const allHaveXP = records.every(r => r.xp && r.xp > 0);
  if (profile._xpMigrated && allHaveXP) return;

  const today = new Date().toISOString().slice(0, 10);
  const talentSet = profile._talentSubjects ? new Set(profile._talentSubjects) : null;
  let runningTotal = 0;
  let changed = false;
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    // 已有 XP 的记录保留原值，只计算没有 XP 的新记录
    if (r.xp && r.xp > 0) {
      runningTotal += r.xp;
      continue;
    }
    const last10 = records.slice(Math.max(0, i - 9), i + 1).map(rec => rec.score || 0);
    profile._runtimeTotalXP = runningTotal;
    const todayXP = records.filter(rec => rec.timestamp && rec.timestamp.slice(0, 10) === today && records.indexOf(rec) < i).reduce((s, rec) => s + (rec.xp || 0), 0);
    r.xp = calcXP(r, profile, todayXP, last10, talentSet);
    runningTotal += r.xp;
    changed = true;
  }
  if (changed) Store.set(StorageKeys.STUDY_RECORDS, records);
  // 只有所有记录都有 XP 才标记迁移完成
  const done = records.every(r => r.xp && r.xp > 0);
  profile._xpMigrated = done;
  delete profile._runtimeTotalXP;
  Store.set(StorageKeys.USER_PROFILE, profile);
}

export default { migrate, getDataVersion, migrateRecordsXP };
