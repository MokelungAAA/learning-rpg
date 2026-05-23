// review-calc.js — 复习中心核心算法
// 功能: 温度衰减模型、动态半衰期、阴影队列、背包推荐、
//       提分潜力诊断、假性熟练检测、遗忘曲线数据
// 算法: T(t) = T_peak × 2^(-t/halfLife)
// 易错点: subjectModifiers 用拉丁语 key（logos/physis）

import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys, SUBJECTS } from '../config.js';
import { getAllSkills } from '../data/skill-tree.js';

const getRecords = () => Store.get(StorageKeys.STUDY_RECORDS) || [];
const getProfile = () => Store.get(StorageKeys.USER_PROFILE) || {};

// 温度衰减公式: T(t) = T_peak × 2^(-t/halfLife)
// @param {number} T_peak — 峰值温度（0-100）
// @param {number} daysSince — 距上次学习天数
// @param {number} halfLife — 半衰期（天）
// @returns {number} 当前温度值
export function calcTemp(T_peak, daysSince, halfLife) {
  return T_peak * Math.pow(2, -daysSince / halfLife);
}

// 温度→等级映射（6级：冻结/微凉/正常/温暖/温热/炙热）
// @param {number} temp — 温度值（0-100）
// @returns {{name, color, icon, level}} 等级信息
export function getTempLevel(temp) {
  if (temp >= 80) return { name: '炙热', color: '#FF4500', icon: '🔥', level: 5 };
  if (temp >= 60) return { name: '温热', color: '#FF8C00', icon: '🟠', level: 4 };
  if (temp >= 40) return { name: '温暖', color: '#FFD700', icon: '🟡', level: 3 };
  if (temp >= 20) return { name: '正常', color: '#62A0EA', icon: '🟢', level: 2 };
  if (temp > 0)  return { name: '微凉', color: '#1A5FB4', icon: '🔵', level: 1 };
  return { name: '冻结', color: '#6B7280', icon: '⚫', level: 0 };
}

// 动态半衰期: base × f_subject × f_accuracy × f_streak
// @param {Object} profile — 用户画像（需含 globalBaseHalfLife, subjectModifiers）
// @param {string} subject — 学科拉丁语 key（logos/physis 等）
// @param {number} accuracy — 正确率（0-100）
// @param {number} streak — 连续学习次数
// @returns {number} 半衰期，clamp [0.5, 30] 天
export function calcHalfLife(profile, subject, accuracy, streak) {
  const base = profile.globalBaseHalfLife || 3;
  const fSubject = (profile.subjectModifiers || {})[subject] || 1.0;
  const fAccuracy = 1 + ((accuracy || 70) - 70) / 100;
  const fStreak = 1 + Math.min(streak || 0, 10) * 0.02;
  return Math.max(0.5, Math.min(30, base * fSubject * fAccuracy * fStreak));
}

// 构建所有知识点的温度状态（核心数据结构）
// @param {Array} records — 学习记录数组
// @param {Object} profile — 用户画像
// @returns {Object} {skillId::kp → {temp, halfLife, lastDays, count, ...}}
// 易错点: kp 匹配用双向 includes，可能误匹配子串
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
        states[key] = { kp, skillId: skill.id, subjectKey: skill.subjectKey, subjectName: skill.subjectName, temp: 0, halfLife: 3, lastDays: 999, count: 0, avgScore: 0, examWeight: skill.weight };
        continue;
      }
      const lastRec = matched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      const lastDays = (now - new Date(lastRec.timestamp).getTime()) / 86400000;
      const avgScore = matched.reduce((s, r) => s + (r.score || 0), 0) / matched.length;
      const halfLife = calcHalfLife(profile, skill.subjectKey, avgScore, matched.length);
      const T_peak = Math.min(100, 60 + avgScore * 0.4);
      const temp = Math.max(0, calcTemp(T_peak, lastDays, halfLife));
      states[key] = { kp, skillId: skill.id, subjectKey: skill.subjectKey, subjectName: skill.subjectName, temp: Math.round(temp * 10) / 10, halfLife: Math.round(halfLife * 10) / 10, lastDays: Math.round(lastDays * 10) / 10, count: matched.length, avgScore: Math.round(avgScore), examWeight: skill.weight };
    }
  }
  return states;
}

// 阴影队列: 按优先级排序待复习知识点
// v0.68 对齐参考文档 §5.5:
//   urgency = (80-temp) × examWeight / max(1, lastDays)
//   priority = urgency × subjectLevel × ln(1+lastDays)
//   subjectLevel = 学科综合评分 / 100（来自 aggregateSubjectAbility）
// @param {Object} tempStates — buildTempStates 的输出
// @param {Object} [subjectAbility] — 学科能力（可选，缺省时降级为 count）
// @returns {Array} 按 priority 降序排列的队列
export function calcShadowQueue(tempStates, subjectAbility) {
  const queue = Object.values(tempStates)
    .filter(s => s.count > 0 && s.temp < 80)
    .map(s => {
      const urgency = (80 - s.temp) * (s.examWeight || 0.1) / Math.max(1, s.lastDays);
      // v0.68: 用学科评分替代 count，学科越强优先级越低（把时间留给弱科）
      const subjLevel = subjectAbility
        ? ((subjectAbility[s.subjectKey]?.mastery || 0) / 100)
        : Math.max(1, s.count);
      const priority = urgency * subjLevel * Math.log(1 + s.lastDays);
      return { ...s, urgency: Math.round(urgency * 100) / 100, priority: Math.round(priority * 100) / 100 };
    })
    .sort((a, b) => b.priority - a.priority);
  return queue;
}

// 0/1背包推荐: 在时间预算内选择最优复习组合
// cost = max(5, 15 - temp/10)，温度越低耗时越长
// @param {Array} queue — 阴影队列
// @param {number} timeBudget — 可用复习时间（分钟）
// @returns {Array} 被选中的知识点列表
// 易错点: 时间预算为整数分钟，DP数组大小 = items × budget
export function knapsackRecommend(queue, timeBudget) {
  const items = queue.map(q => ({
    ...q,
    cost: Math.max(5, Math.round(15 - q.temp / 10)), // 温度越低，复习时间越长
    benefit: q.priority,
  }));
  const n = items.length;
  const T = timeBudget;
  const dp = Array.from({ length: n + 1 }, () => Array(T + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let t = 0; t <= T; t++) {
      dp[i][t] = dp[i - 1][t];
      if (t >= items[i - 1].cost) {
        dp[i][t] = Math.max(dp[i][t], dp[i - 1][t - items[i - 1].cost] + items[i - 1].benefit);
      }
    }
  }
  // 回溯
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

// 提分潜力诊断: 找出最值得投入的技能
// v0.69 对齐参考文档 §5.7:
//   potential = (1 - mastery) × examWeight × (1 - recentInvestment)
//   recentInvestment = 近7天该技能学习时长 / 近7天总学习时长
//   已充分投入的技能潜力打折，把时间留给被忽视的弱科
// @param {Object} tempStates — buildTempStates 的输出
// @param {Array} records — 学习记录（用于计算近期投入）
// @returns {Array} Top 5 潜力技能（按 potential 降序）
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

  // v0.69: 计算近7天各技能的学习时长
  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const recentRecords = (records || []).filter(r => new Date(r.timestamp).getTime() >= weekAgo);
  const totalRecentMin = recentRecords.reduce((s, r) => s + (r.duration || 0), 0);
  // 按技能ID聚合近7天时长
  const recentBySkill = {};
  for (const r of recentRecords) {
    if (!r.knowledgePoints || !r.subject) continue;
    // 匹配到技能：通过 tempStates 反查 skillId
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
      // recentInvestment: 近7天该技能占比，已投入越多潜力越低
      const recentInvestment = totalRecentMin > 0 ? (recentBySkill[id] || 0) / totalRecentMin : 0;
      const potential = (1 - mastery) * (v.weight || 0.1) * (1 - recentInvestment);
      return { skillId: id, skillName: v.skillName, subjectName: v.subjectName, mastery: Math.round(mastery * 100), potential: Math.round(potential * 1000) / 1000 };
    })
    .sort((a, b) => b.potential - a.potential)
    .slice(0, 5);
}

// 假性熟练检测: 高正确率(>=70%)但温度低(<40)的知识点
// 特征: 练习次数>=3，可能是短期记忆而非真正掌握
// @param {Object} tempStates — 温度状态
// @param {Array} records — 学习记录
// @returns {Array} 可疑知识点（按温度升序）
export function detectFalseMastery(tempStates, records) {
  const results = [];
  for (const [key, st] of Object.entries(tempStates)) {
    if (st.count < 3) continue;
    const kpRecords = records.filter(r => r.knowledgePoints && r.knowledgePoints.some(k => k.includes(st.kp) || st.kp.includes(k)));
    const highScoreRate = kpRecords.filter(r => (r.score || 0) >= 80).length / kpRecords.length;
    if (highScoreRate >= 0.7 && st.temp < 40) {
      results.push({ ...st, highScoreRate: Math.round(highScoreRate * 100), reason: '高正确率但温度低 — 可能是短期记忆' });
    }
  }
  return results.sort((a, b) => a.temp - b.temp);
}

// 生成遗忘曲线数据点（用于 ECharts 渲染）
// @param {number} halfLife — 半衰期（天）
// @param {number} T_peak — 峰值温度
// @returns {Array} [{day, retention}, ...]，最多 halfLife×4 天
export function calcForgettingCurvePoints(halfLife, T_peak) {
  const points = [];
  const maxDays = Math.ceil(halfLife * 4);
  for (let d = 0; d <= maxDays; d++) {
    points.push({ day: d, retention: Math.round(calcTemp(T_peak || 80, d, halfLife || 3) * 10) / 10 });
  }
  return points;
}
