// profile-adapt.js — 用户画像 EMA 自适应（参考文档 §5.9）
// 每日首次打开时自动校准：学科能力、学科修正系数、全局半衰期、XP参数
// EMA (Exponential Moving Average) = 指数移动平均，新数据权重 α，旧数据权重 (1-α)
// 调用入口: adaptProfile()，由 app.js 每日首次打开时触发

import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';
import { buildTempStates } from './review-calc.js';

// 学科能力值更新: newValue = avgTemp×0.5 + avgAccuracy×0.5
// 注意: subjectAbility 存储用英文 key（math/physics）
// @param {Object} profile — 用户画像（会被直接修改）
// @param {string} subjectKey — 学科拉丁语 key（logos/physis）
// @param {number} avgTemp — 该学科平均温度
// @param {number} avgAccuracy — 该学科平均正确率
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

// 学科修正系数更新: 0.7×old + 0.3×(avgHalfLife/base)
// clamp [0.5, 2.0] 防止极端值
// 注意: subjectModifiers 用拉丁语 key（logos/physis）
// @param {Object} profile — 用户画像
// @param {string} subjectKey — 学科拉丁语 key
// @param {number} avgHalfLife — 该学科平均半衰期
function updateSubjectModifier(profile, subjectKey, avgHalfLife) {
  const base = profile.globalBaseHalfLife || 3.0;
  const ratio = avgHalfLife / base;
  const old = profile.subjectModifiers?.[subjectKey] || 1.0;
  if (!profile.subjectModifiers) profile.subjectModifiers = {};
  profile.subjectModifiers[subjectKey] = Math.max(0.5, Math.min(2.0,
    Math.round((0.7 * old + 0.3 * ratio) * 100) / 100
  ));
}

// 全局半衰期更新: 0.8×old + 0.2×median(allHalfLives)
// clamp [1.0, 15.0]
// @param {Object} profile — 用户画像
// @param {Array} allHalfLives — 所有知识点的半衰期数组
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

// XP 参数自动校准: 每7天检查，偏离目标20%则调整
// @param {Object} profile — 用户画像
// @param {Array} recentRecords — 近期学习记录
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

// 动态活动权重计算（综合型：努力因子 + 表现因子）
// 核心逻辑:
//   - 长期攻克难题（多次+低正确率）→ 努力因子高 → XP加成
//   - 短期正确率偏低（次数少）→ 努力因子低 → 正常权重
//   - 表现好（正确率高）→ 表现因子高 → XP加成
// @param {Object} profile — 用户画像
// @param {Object} bySubject — 按学科聚合的记录统计
function updateDynamicWeights(profile, bySubject) {
  const baseWeights = profile.activityWeights || {};
  const dynamicWeights = { ...baseWeights };

  // 计算全局统计（用于 effortFactor）
  let totalAttempts = 0;
  let totalCorrect = 0;
  for (const data of Object.values(bySubject)) {
    totalAttempts += data.count;
    totalCorrect += data.correctCount;
  }
  const globalAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0.7;

  // 对每个学科计算动态权重
  for (const [subjectKey, data] of Object.entries(bySubject)) {
    if (data.count < 3) continue; // 数据不足，用基础权重

    const avgAcc = data.avgAccuracy;
    const count = data.count;

    // 努力因子 = 尝试量加成 × 难度补偿
    // 尝试量加成: log2(count/10+1)，10次=0.69, 50次=2.26, 100次=3.12
    const volumeBonus = Math.log2(count / 10 + 1);
    // 难度补偿: 正确率越低+坚持越多 → 补偿越大
    // 60%正确率→1.17, 40%→1.67, 20%→2.5
    const difficultyBonus = avgAcc > 0 ? Math.min(3, 0.7 / avgAcc) : 2;

    // 努力因子 = min(2.0, volumeBonus × difficultyBonus × 0.5)
    const effortFactor = Math.min(2.0, volumeBonus * difficultyBonus * 0.5);

    // 表现因子: 0.6 + accuracy × 0.8 (0.6~1.4)
    const performanceFactor = 0.6 + avgAcc * 0.8;

    // 综合权重 = 基础权重 × (1 + effortBonus + performanceBonus)
    // effortBonus 和 performanceBonus 各占一定比例
    const effortWeight = 0.4; // 努力占40%
    const perfWeight = 0.3;   // 表现占30%
    const baseWeight = 0.3;   // 基础占30%

    for (const [actType, baseW] of Object.entries(baseWeights)) {
      // 只对有该学科记录的活动类型计算动态权重
      const key = `${subjectKey}_${actType}`;
      const dynamicW = baseW * (baseWeight + effortWeight * effortFactor + perfWeight * performanceFactor);
      dynamicWeights[key] = Math.max(0.5, Math.min(3.0, Math.round(dynamicW * 100) / 100));
    }
  }

  profile.dynamicActivityWeights = dynamicWeights;
  profile._dynamicWeightsUpdatedAt = Date.now();
}

// 编排函数: 每日首次打开时调用，自动校准用户画像
// 流程: 构建温度→按学科聚合→更新能力/修正/半衰期→动态权重→XP校准→保存
// @returns {void} 直接修改 localStorage 中的 USER_PROFILE
export function adaptProfile() {
  const profile = Store.get(StorageKeys.USER_PROFILE);
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  if (!profile || records.length < 3) return; // 数据不足跳过

  // 构建温度状态（复用 review-calc 的逻辑）
  const tempStates = buildTempStates(records, profile);
  if (!tempStates || Object.keys(tempStates).length === 0) return;

  // 按学科聚合温度、正确率、记录数
  const bySubject = {};
  for (const st of Object.values(tempStates)) {
    if (st.count === 0) continue;
    if (!bySubject[st.subjectKey]) bySubject[st.subjectKey] = { temps: [], accuracies: [], halfLives: [], count: 0, correctCount: 0 };
    bySubject[st.subjectKey].temps.push(st.temp);
    bySubject[st.subjectKey].accuracies.push(st.avgScore);
    bySubject[st.subjectKey].halfLives.push(st.halfLife);
    bySubject[st.subjectKey].count += st.count;
    bySubject[st.subjectKey].correctCount += Math.round(st.avgScore * st.count / 100);
  }

  // 更新每个学科的参数
  for (const [subjectKey, data] of Object.entries(bySubject)) {
    const avgTemp = data.temps.reduce((a, b) => a + b, 0) / data.temps.length;
    const avgAccuracy = data.accuracies.reduce((a, b) => a + b, 0) / data.accuracies.length;
    const avgHalfLife = data.halfLives.reduce((a, b) => a + b, 0) / data.halfLives.length;
    data.avgAccuracy = avgAccuracy / 100; // 存储为 0-1 范围
    updateSubjectAbility(profile, subjectKey, avgTemp, avgAccuracy);
    updateSubjectModifier(profile, subjectKey, avgHalfLife);
  }

  // 动态活动权重（努力因子+表现因子）
  updateDynamicWeights(profile, bySubject);

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
