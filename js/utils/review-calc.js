// review-calc.js — 复习中心核心算法 (FSRS升级版)
// v0.113: 从简单指数衰减升级为FSRS幂律遗忘曲线
// 算法: R(t) = (1 + t/(9*S))^(-d) (Jarrett Ye 2022, Anki 23.10+)
// 易错点: subjectModifiers 用拉丁语 key（logos/physis）

import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys, SUBJECTS } from '../config.js';
import { getAllSkills } from '../data/skill-tree.js';

const getRecords = () => Store.get(StorageKeys.STUDY_RECORDS) || [];
const getProfile = () => Store.get(StorageKeys.USER_PROFILE) || {};

// ─── FSRS 核心参数 ────────────────────────────────────────────
// 默认参数，可通过用户画像校准
const FSRS_DEFAULTS = {
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  d0: 0,     // 初始难度偏移
  s0: 1.0,   // 初始稳定度(天)
  d: 0.5,    // 遗忘曲线衰减指数
  rating: { again: 1, hard: 2, good: 3, easy: 4 },
};

// ─── FSRS 遗忘曲线 ────────────────────────────────────────────
// R(t) = (1 + t/(9*S))^(-d)  (幂律模型，比指数衰减更准确)
// @param {number} daysSince — 距上次学习天数
// @param {number} stability — 稳定度 S (天)，默认1.0
// @param {number} decay — 衰减指数 d，默认0.5
// @returns {number} 可提取度 R (0-1)
export function calcRetrievability(daysSince, stability = 1.0, decay = 0.5) {
  if (stability <= 0) return 0;
  return Math.pow(1 + daysSince / (9 * stability), -decay);
}

// 稳定度更新：复习后根据评分更新S
// FSRS公式: S' = S * (1 + exp(w[8]) * (11 - D*10) * S^(-w[9]) * (exp(w[10]*(1-R)) - 1))
// 简化版: 评分越高，稳定度增长越大
// @param {number} oldS — 复习前稳定度
// @param {number} D — 难度 (0-1)
// @param {number} R — 复习时的可提取度
// @param {number} rating — 评分 (1=again, 2=hard, 3=good, 4=easy)
// @returns {number} 新稳定度 S'
export function calcStability(oldS, D, R, rating = 3) {
  const w = FSRS_DEFAULTS.w;
  // 基础增长因子
  const baseGrowth = rating === 1 ? 0.5 : rating === 2 ? 0.8 : rating === 3 ? 1.0 : 1.3;
  // 难度修正：难度越高，稳定度增长越慢
  const dFactor = 1 + w[8] * (11 - D * 10);
  // 可提取度修正：R越低(快忘)，复习效果越大
  const rFactor = Math.exp(w[10] * (1 - R)) - 1;
  // 稳定度修正：S越大，增长越慢(边际递减)
  const sFactor = Math.pow(Math.max(0.1, oldS), -w[9]);

  let newS = oldS * (1 + baseGrowth * dFactor * sFactor * (1 + rFactor));
  return Math.max(0.1, Math.min(365, newS));
}

// 难度更新：复习后根据评分更新D
// D' = D + w[6] * (rating - 3)  (rating=3(good)不改变难度)
// @param {number} oldD — 复习前难度 (0-1)
// @param {number} rating — 评分 (1-4)
// @returns {number} 新难度 D' (clamp 0-1)
export function calcDifficulty(oldD, rating = 3) {
  const w = FSRS_DEFAULTS.w;
  let newD = oldD + w[6] * (rating - 3);
  return Math.max(0, Math.min(1, newD));
}

// 保留旧接口：calcTemp 从 R 转换为温度值 (0-100)
// 温度 = R * 100，保持与旧系统兼容
// @param {number} T_peak — 峰值温度（保留参数，不直接使用）
// @param {number} daysSince — 距上次学习天数
// @param {number} halfLife — 半衰期（保留参数，映射到stability）
// @returns {number} 温度值 (0-100)
export function calcTemp(T_peak, daysSince, halfLife) {
  const stability = (halfLife || 3) * 0.5;
  const R = calcRetrievability(daysSince, stability);
  return T_peak * R;
}

// 温度→等级映射（6级：冻结/微凉/正常/温暖/温热/炙热）
export function getTempLevel(temp) {
  if (temp >= 80) return { name: '炙热', color: '#FF4500', icon: '🔥', level: 5 };
  if (temp >= 60) return { name: '温热', color: '#FF8C00', icon: '🟠', level: 4 };
  if (temp >= 40) return { name: '温暖', color: '#FFD700', icon: '🟡', level: 3 };
  if (temp >= 20) return { name: '正常', color: '#62A0EA', icon: '🟢', level: 2 };
  if (temp > 0)  return { name: '微凉', color: '#1A5FB4', icon: '🔵', level: 1 };
  return { name: '冻结', color: '#6B7280', icon: '⚫', level: 0 };
}

// 动态半衰期（旧接口，保持兼容）
export function calcHalfLife(profile, subject, accuracy, streak) {
  const base = profile.globalBaseHalfLife || 3;
  const fSubject = (profile.subjectModifiers || {})[subject] || 1.0;
  const fAccuracy = 1 + ((accuracy || 70) - 70) / 100;
  const fStreak = 1 + Math.min(streak || 0, 10) * 0.02;
  return Math.max(0.5, Math.min(30, base * fSubject * fAccuracy * fStreak));
}

// ─── 构建知识点温度状态（FSRS版）──────────────────────────────
// @param {Array} records — 学习记录数组
// @param {Object} profile — 用户画像
// @returns {Object} {skillId::kp → {temp, stability, difficulty, retrievability, halfLife, lastDays, count, avgScore, ...}}
export function buildTempStates(records, profile) {
  const now = Date.now();
  const states = {};
  const allSkills = getAllSkills();

  for (const skill of allSkills) {
    for (const kp of skill.kps) {
      const key = `${skill.id}::${kp}`;
      const matched = records.filter(r =>
        r.knowledgePoints && r.knowledgePoints.some(k => k.includes(kp) || kp.includes(k))
      );
      if (matched.length === 0) {
        states[key] = {
          kp, skillId: skill.id, subjectKey: skill.subjectKey, subjectName: skill.subjectName,
          temp: 0, stability: FSRS_DEFAULTS.s0, difficulty: 0.3,
          retrievability: 0, halfLife: 3, lastDays: 999, count: 0, avgScore: 0, examWeight: skill.weight,
        };
        continue;
      }
      const sorted = matched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const lastRec = sorted[0];
      const lastDays = (now - new Date(lastRec.timestamp).getTime()) / 86400000;
      const avgScore = matched.reduce((s, r) => s + (r.score || 0), 0) / matched.length;

      // FSRS: 从记录估算初始D和S
      const difficulty = Math.max(0, Math.min(1, 1 - avgScore / 100));
      const stability = calcStability(FSRS_DEFAULTS.s0, difficulty, 1, 3) * Math.min(matched.length, 5) * 0.5;
      const R = calcRetrievability(lastDays, stability);
      const T_peak = Math.min(100, 60 + avgScore * 0.4);
      const temp = Math.max(0, Math.round(T_peak * R * 10) / 10);

      // 半衰期从stability反推 (R=0.5时 t = S*(2^(1/d)-1)*9)
      const halfLife = Math.round(stability * (Math.pow(2, 1 / FSRS_DEFAULTS.d) - 1) * 9 / 10 * 10) / 10;

      states[key] = {
        kp, skillId: skill.id, subjectKey: skill.subjectKey, subjectName: skill.subjectName,
        temp, stability: Math.round(stability * 10) / 10, difficulty: Math.round(difficulty * 100) / 100,
        retrievability: Math.round(R * 100) / 100, halfLife: Math.max(0.5, Math.min(30, halfLife)),
        lastDays: Math.round(lastDays * 10) / 10, count: matched.length,
        avgScore: Math.round(avgScore), examWeight: skill.weight,
      };
    }
  }
  return states;
}

// 阴影队列: 按优先级排序待复习知识点
// v0.113: 使用FSRS的R值替代温度，urgency基于遗忘风险
export function calcShadowQueue(tempStates, subjectAbility) {
  const queue = Object.values(tempStates)
    .filter(s => s.count > 0 && s.retrievability < 0.9)
    .map(s => {
      // urgency: 遗忘风险 × 学科权重 / (1 + 天数)
      const forgetRisk = 1 - (s.retrievability || 0);
      const urgency = forgetRisk * (s.examWeight || 0.1) / Math.max(1, s.lastDays);
      const subjLevel = subjectAbility
        ? ((subjectAbility[s.subjectKey]?.mastery || 0) / 100)
        : Math.max(1, s.count);
      const priority = urgency * subjLevel * Math.log(1 + s.lastDays);
      return { ...s, urgency: Math.round(urgency * 100) / 100, priority: Math.round(priority * 100) / 100 };
    })
    .sort((a, b) => b.priority - a.priority);
  return queue;
}

// 0/1背包推荐（v0.113: 加入交错效应因子）
// 交错效应(Rohrer & Taylor 2007): 混合学科优于集中学科
// 实现: 最近3次推荐的学科被惩罚
// @param {Array} queue — 阴影队列
// @param {number} timeBudget — 可用复习时间（分钟）
// @param {Array} [recentSubjects] — 最近推荐的学科key数组(最多3个)
// @returns {Array} 被选中的知识点列表
export function knapsackRecommend(queue, timeBudget, recentSubjects = []) {
  const items = queue.map(q => ({
    ...q,
    cost: Math.max(5, Math.round(15 - q.temp / 10)),
    benefit: q.priority,
    // 交错惩罚: 最近推荐过的学科 benefit 打折
    interleavedBenefit: recentSubjects.includes(q.subjectKey)
      ? q.priority * 0.7
      : q.priority,
  }));
  const n = items.length;
  const T = timeBudget;
  const dp = Array.from({ length: n + 1 }, () => Array(T + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let t = 0; t <= T; t++) {
      dp[i][t] = dp[i - 1][t];
      if (t >= items[i - 1].cost) {
        dp[i][t] = Math.max(dp[i][t], dp[i - 1][t - items[i - 1].cost] + items[i - 1].interleavedBenefit);
      }
    }
  }
  const selected = [];
  let t = T;
  for (let i = n; i > 0; i--) {
    if (dp[i][t] !== dp[i - 1][t]) {
      selected.push(items[i - 1]);
      t -= items[i - 1].cost;
    }
  }
  return selected.reverse();
}

// 提分潜力诊断（v0.113: 使用FSRS的difficulty替代纯温度）
export function calcImprovementPotential(tempStates, records) {
  const skills = getAllSkills();
  const bySkill = {};
  for (const [key, st] of Object.entries(tempStates)) {
    if (!bySkill[st.skillId]) bySkill[st.skillId] = { temps: [], count: 0, weight: st.examWeight, subjectKey: st.subjectKey, subjectName: st.subjectName, skillName: '' };
    bySkill[st.skillId].temps.push(st.temp);
    bySkill[st.skillId].count += st.count;
  }
  for (const s of skills) {
    if (bySkill[s.id]) bySkill[s.id].skillName = s.name;
  }

  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const recentRecords = (records || []).filter(r => new Date(r.timestamp).getTime() >= weekAgo);
  const totalRecentMin = recentRecords.reduce((s, r) => s + (r.duration || 0), 0);
  const recentBySkill = {};
  for (const r of recentRecords) {
    if (!r.knowledgePoints || !r.subject) continue;
    for (const [key, st] of Object.entries(tempStates)) {
      if (st.subjectKey === r.subject && r.knowledgePoints.some(k => k.includes(st.kp) || st.kp.includes(k))) {
        recentBySkill[st.skillId] = (recentBySkill[st.skillId] || 0) + (r.duration || 0);
      }
    }
  }

  return Object.entries(bySkill)
    .filter(([, v]) => v.count > 0)
    .map(([id, v]) => {
      const mastery = v.temps.reduce((a, b) => a + b, 0) / v.temps.length / 100;
      const recentInvestment = totalRecentMin > 0 ? (recentBySkill[id] || 0) / totalRecentMin : 0;
      const potential = (1 - mastery) * (v.weight || 0.1) * (1 - recentInvestment);
      return { skillId: id, skillName: v.skillName, subjectName: v.subjectName, mastery: Math.round(mastery * 100), potential: Math.round(potential * 1000) / 1000 };
    })
    .sort((a, b) => b.potential - a.potential)
    .slice(0, 5);
}

// 假性熟练检测（v0.113: 结合FSRS的difficulty字段）
export function detectFalseMastery(tempStates, records) {
  const results = [];
  for (const [key, st] of Object.entries(tempStates)) {
    if (st.count < 3) continue;
    if (st.temp >= 60) continue;

    const kpRecords = records
      .filter(r => r.knowledgePoints && r.knowledgePoints.some(k => k.includes(st.kp) || st.kp.includes(k)))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (kpRecords.length < 3) continue;

    const last3 = kpRecords.slice(0, 3);
    const allHighScore = last3.every(r => (r.score || 0) > 85);
    if (!allHighScore) continue;

    // v0.113: 难度低+高分但温度低 → 更可能是假性熟练
    const lowDifficulty = (st.difficulty || 0) < 0.3;

    const hasReviewData = kpRecords.some(r => r.reviewDuration != null);
    if (hasReviewData) {
      const avgReviewRatio = kpRecords.reduce((s, r) => {
        const total = r.duration || 1;
        const review = r.reviewDuration || 0;
        return s + review / total;
      }, 0) / kpRecords.length;
      if (avgReviewRatio >= 0.10) continue;
    }

    results.push({
      ...st,
      last3Scores: last3.map(r => r.score),
      reason: lowDifficulty
        ? '低难度+连续高分 — 可能只是简单题'
        : hasReviewData
          ? '连续高分+低订正+温度下降 — 可能是短期记忆'
          : '连续高分但温度低 — 建议深度检测',
    });
  }
  return results.sort((a, b) => a.temp - b.temp);
}

// 遗忘曲线数据点（v0.113: 使用FSRS幂律曲线）
export function calcForgettingCurvePoints(halfLife, T_peak) {
  const stability = (halfLife || 3) * 0.5;
  const maxDays = Math.ceil((halfLife || 3) * 4);
  const points = [];
  for (let d = 0; d <= maxDays; d++) {
    const R = calcRetrievability(d, stability);
    points.push({ day: d, retention: Math.round(R * (T_peak || 80) * 10) / 10 });
  }
  return points;
}

// ─── 心流状态检测 ─────────────────────────────────────────────
// Csikszentmihalyi: 挑战≈技能时产生心流
// @param {number} challenge — 任务难度 (0-100)
// @param {number} skill — 用户能力 (0-100)
// @returns {{state, ratio, suggestion}} 心流状态
export function detectFlowState(challenge, skill) {
  if (skill === 0) return { state: '焦虑', ratio: 0, suggestion: '难度太高，建议降低任务难度' };
  const ratio = challenge / skill;
  if (ratio >= 0.9 && ratio <= 1.1) return { state: '心流', ratio, suggestion: '完美！挑战与能力匹配' };
  if (ratio < 0.7) return { state: '无聊', ratio, suggestion: '太简单了，建议提升难度' };
  if (ratio > 1.3) return { state: '焦虑', ratio, suggestion: '太难了，建议降低难度或拆分任务' };
  if (ratio < 0.9) return { state: '轻松', ratio, suggestion: '略有余力，可以尝试更难的内容' };
  return { state: '挑战', ratio, suggestion: '接近心流区间，继续保持' };
}

// ─── 元认知校准 ─────────────────────────────────────────────
// Dunlosky(2013): 学生常高估掌握程度
// 对比用户自评与实际表现的偏差
// @param {number} selfEstimate — 用户自评掌握度 (0-100)
// @param {number} actualMastery — 实际掌握度 (0-100)
// @returns {{bias, label, color}} 校准结果
export function calcMetacognitionBias(selfEstimate, actualMastery) {
  const bias = selfEstimate - actualMastery;
  if (bias > 20) return { bias, label: '高估', color: '#EF4444', suggestion: '你可能高估了自己的掌握程度，建议做一次综合测试' };
  if (bias > 10) return { bias, label: '略高', color: '#F59E0B', suggestion: '自评略高于实际，继续保持但注意检验' };
  if (bias >= -10) return { bias, label: '准确', color: '#10B981', suggestion: '元认知校准良好，自评与实际匹配' };
  return { bias, label: '低估', color: '#6366F1', suggestion: '你比自己想的更强，可以更有信心' };
}
