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
