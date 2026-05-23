// review-calc.js — 复习中心算法（REV-01~08 核心计算）
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys, SUBJECTS } from '../config.js';
import { getAllSkills } from '../data/skill-tree.js';

const getRecords = () => Store.get(StorageKeys.STUDY_RECORDS) || [];
const getProfile = () => Store.get(StorageKeys.USER_PROFILE) || {};

// 温度模型：T(t) = T_peak × 2^(-t / t_half)
export function calcTemp(T_peak, daysSince, halfLife) {
  return T_peak * Math.pow(2, -daysSince / halfLife);
}

// 温度等级映射
export function getTempLevel(temp) {
  if (temp >= 80) return { name: '炙热', color: '#FF4500', icon: '🔥', level: 5 };
  if (temp >= 60) return { name: '温热', color: '#FF8C00', icon: '🟠', level: 4 };
  if (temp >= 40) return { name: '温暖', color: '#FFD700', icon: '🟡', level: 3 };
  if (temp >= 20) return { name: '正常', color: '#62A0EA', icon: '🟢', level: 2 };
  if (temp > 0)  return { name: '微凉', color: '#1A5FB4', icon: '🔵', level: 1 };
  return { name: '冻结', color: '#6B7280', icon: '⚫', level: 0 };
}

// 动态半衰期：t_half = t_base × f_subject × f_accuracy × f_streak
export function calcHalfLife(profile, subject, accuracy, streak) {
  const base = profile.globalBaseHalfLife || 3;
  const fSubject = (profile.subjectModifiers || {})[subject] || 1.0;
  const fAccuracy = 1 + ((accuracy || 70) - 70) / 100;
  const fStreak = 1 + Math.min(streak || 0, 10) * 0.02;
  return Math.max(0.5, Math.min(30, base * fSubject * fAccuracy * fStreak));
}

// 构建知识点温度状态
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

// 阴影队列：urgency = (80 - temp) × examWeight / max(1, lastDays)
export function calcShadowQueue(tempStates) {
  const queue = Object.values(tempStates)
    .filter(s => s.count > 0 && s.temp < 80)
    .map(s => {
      const urgency = (80 - s.temp) * (s.examWeight || 0.1) / Math.max(1, s.lastDays);
      const priority = urgency * Math.max(1, s.count) * Math.log(1 + s.lastDays);
      return { ...s, urgency: Math.round(urgency * 100) / 100, priority: Math.round(priority * 100) / 100 };
    })
    .sort((a, b) => b.priority - a.priority);
  return queue;
}

// 背包推荐：0/1 Knapsack
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

// 提分潜力诊断
export function calcImprovementPotential(tempStates) {
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
  return Object.entries(bySkill)
    .filter(([, v]) => v.count > 0)
    .map(([id, v]) => {
      const mastery = v.temps.reduce((a, b) => a + b, 0) / v.temps.length / 100;
      const potential = (1 - mastery) * (v.weight || 0.1);
      return { skillId: id, skillName: v.skillName, subjectName: v.subjectName, mastery: Math.round(mastery * 100), potential: Math.round(potential * 1000) / 1000 };
    })
    .sort((a, b) => b.potential - a.potential)
    .slice(0, 5);
}

// 假性熟练检测
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

// 遗忘曲线数据点（用于图表）
export function calcForgettingCurvePoints(halfLife, T_peak) {
  const points = [];
  const maxDays = Math.ceil(halfLife * 4);
  for (let d = 0; d <= maxDays; d++) {
    points.push({ day: d, retention: Math.round(calcTemp(T_peak || 80, d, halfLife || 3) * 10) / 10 });
  }
  return points;
}
