// profile-adapt.js — 用户画像 EMA 自适应（参考文档 §5.9）
// 每日首次打开时自动校准：学科能力、学科修正系数、全局半衰期、XP参数
// EMA (Exponential Moving Average) = 指数移动平均，新数据权重 α，旧数据权重 (1-α)

import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';
import { buildTempStates } from './review-calc.js';

// 学科能力值更新: subjectAbility = avgTemp × 0.5 + avgAccuracy × 0.5
// 注意: subjectAbility 用英文 key（math/physics），不是拉丁语 key
const SUBJECT_ID_MAP = {
  logos: 'math', mythos: 'chinese', lingua: 'english',
  physis: 'physics', khemeia: 'chemistry', zoe: 'biology',
  politeia: 'politics', historia: 'history', geographia: 'geography',
};

function updateSubjectAbility(profile, subjectKey, avgTemp, avgAccuracy) {
  const subjectId = SUBJECT_ID_MAP[subjectKey] || subjectKey;
  const newValue = avgTemp * 0.5 + avgAccuracy * 0.5;
  const old = profile.subjectAbility?.[subjectId] || 0;
  if (!profile.subjectAbility) profile.subjectAbility = {};
  // EMA α=0.3: 缓慢适应，避免单次异常数据过度影响
  profile.subjectAbility[subjectId] = Math.round((0.7 * old + 0.3 * newValue) * 10) / 10;
}

// 学科修正系数更新: subjectModifiers = 0.7 × old + 0.3 × (avgHalfLife / globalBaseHalfLife)
// clamp [0.5, 2.0] 防止极端值
// 注意: subjectModifiers 用拉丁语 key（logos/physis）
function updateSubjectModifier(profile, subjectKey, avgHalfLife) {
  const base = profile.globalBaseHalfLife || 3.0;
  const ratio = avgHalfLife / base;
  const old = profile.subjectModifiers?.[subjectKey] || 1.0;
  if (!profile.subjectModifiers) profile.subjectModifiers = {};
  profile.subjectModifiers[subjectKey] = Math.max(0.5, Math.min(2.0,
    Math.round((0.7 * old + 0.3 * ratio) * 100) / 100
  ));
}

// 全局半衰期更新: globalBaseHalfLife = 0.8 × old + 0.2 × median(allHalfLives)
// clamp [1.0, 15.0]
function updateGlobalHalfLife(profile, allHalfLives) {
  if (allHalfLives.length === 0) return;
  const sorted = [...allHalfLives].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const old = profile.globalBaseHalfLife || 3.0;
  profile.globalBaseHalfLife = Math.max(1.0, Math.min(15.0,
    Math.round((0.8 * old + 0.2 * median) * 10) / 10
  ));
}

// XP 参数自动校准: 每 7 天检查一次，如果 avgXpPerMinute 偏离 2.0 超过 20% 则调整
function autoCalibrateXP(profile, recentRecords) {
  const lastCalibration = profile._lastXPCalibration || 0;
  const daysSince = (Date.now() - lastCalibration) / 86400000;
  if (daysSince < 7) return; // 不到 7 天不校准

  const totalXP = recentRecords.reduce((s, r) => s + (r.xp || 0), 0);
  const totalMinutes = recentRecords.reduce((s, r) => s + (r.duration || 0), 0);
  if (totalMinutes < 30) return; // 数据不足不校准

  const avgXpPerMinute = totalXP / totalMinutes;
  const target = 2.0;
  const deviation = Math.abs(avgXpPerMinute - target) / target;
  if (deviation > 0.2) {
    // 偏差超过 20%，调整 xpBasePerMinute
    const old = profile.xpBasePerMinute || 2.0;
    profile.xpBasePerMinute = Math.round((0.8 * old + 0.2 * (target / avgXpPerMinute * old)) * 100) / 100;
  }
  profile._lastXPCalibration = Date.now();
}

// 编排函数: 在每日首次打开时调用
export function adaptProfile() {
  const profile = Store.get(StorageKeys.USER_PROFILE);
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  if (!profile || records.length < 3) return; // 数据不足跳过

  // 构建温度状态（复用 review-calc 的逻辑）
  const tempStates = buildTempStates(records, profile);
  if (!tempStates || Object.keys(tempStates).length === 0) return;

  // 按学科聚合温度和正确率
  const bySubject = {};
  for (const st of Object.values(tempStates)) {
    if (st.count === 0) continue;
    if (!bySubject[st.subjectKey]) bySubject[st.subjectKey] = { temps: [], accuracies: [], halfLives: [] };
    bySubject[st.subjectKey].temps.push(st.temp);
    bySubject[st.subjectKey].accuracies.push(st.avgScore);
    bySubject[st.subjectKey].halfLives.push(st.halfLife);
  }

  // 更新每个学科的参数
  for (const [subjectKey, data] of Object.entries(bySubject)) {
    const avgTemp = data.temps.reduce((a, b) => a + b, 0) / data.temps.length;
    const avgAccuracy = data.accuracies.reduce((a, b) => a + b, 0) / data.accuracies.length;
    const avgHalfLife = data.halfLives.reduce((a, b) => a + b, 0) / data.halfLives.length;
    updateSubjectAbility(profile, subjectKey, avgTemp, avgAccuracy);
    updateSubjectModifier(profile, subjectKey, avgHalfLife);
  }

  // 更新全局半衰期
  const allHalfLives = Object.values(tempStates).filter(s => s.count > 0).map(s => s.halfLife);
  updateGlobalHalfLife(profile, allHalfLives);

  // XP 参数校准
  autoCalibrateXP(profile, records);

  // 清理运行时字段
  delete profile._runtimeTotalXP;
  profile.updatedAt = Date.now();

  Store.set(StorageKeys.USER_PROFILE, profile);
}
