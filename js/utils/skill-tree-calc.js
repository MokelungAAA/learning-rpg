// skill-tree-calc.js — 技能树数据计算
// 功能: 知识点状态构建、技能掌握度聚合、学科能力聚合、特长检测
// 数据流: records → knowledgeStates → skillMastery → subjectAbility → talents
// v0.66: 技能聚合公式对齐参考文档 §5.10
//   旧: mastery = avgScore×0.7 + count×0.3
//   新: mastery = avgTemp×0.5 + avgScore×0.3 + 掌握占比×0.2
// 易错点: kp 匹配用双向 includes，可能误匹配子串

import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys, SUBJECTS } from '../config.js';
import { SKILL_TREE, getAllSkills } from '../data/skill-tree.js';
import { buildTempStates } from './review-calc.js';

const getRecords = () => Store.get(StorageKeys.STUDY_RECORDS) || [];

// 构建所有知识点的学习状态
// mastery = avgScore×0.7 + min(100, count×10)×0.3
// @param {Array} records — 学习记录（需含 knowledgePoints, duration, score）
// @returns {Object} {skillId::kp → {count, totalMin, avgScore, mastery, ...}}
export function buildKnowledgeStates(records) {
  const states = {};
  const allSkills = getAllSkills();
  for (const skill of allSkills) {
    for (const kp of skill.kps) {
      const key = `${skill.id}::${kp}`;
      const matched = records.filter(r => {
        if (!r.knowledgePoints || r.knowledgePoints.length === 0) return false;
        return r.knowledgePoints.some(k => k.includes(kp) || kp.includes(k));
      });
      const totalMin = matched.reduce((s, r) => s + (r.duration || 0), 0);
      const avgScore = matched.length > 0 ? matched.reduce((s, r) => s + (r.score || 0), 0) / matched.length : 0;
      const lastTs = matched.filter(r => r.timestamp).map(r => new Date(r.timestamp).getTime()).sort((a, b) => b - a)[0] || 0;
      states[key] = {
        kp, skillId: skill.id, subjectKey: skill.subjectKey,
        count: matched.length, totalMin, avgScore, lastTs,
        mastery: matched.length === 0 ? 0 : Math.min(100, Math.round(avgScore * 0.7 + Math.min(100, matched.length * 10) * 0.3)),
      };
    }
  }
  return states;
}

// 将知识点状态聚合到技能级别
// v0.66 对齐参考文档 §5.10:
//   技能掌握度 = 平均温度×0.5 + 平均正确率×0.3 + 掌握占比×0.2
//   掌握占比 = 温度≥60的知识点数 / 该技能知识点总数
// @param {Object} knowledgeStates — buildKnowledgeStates 的输出
// @param {Object} tempStates — buildTempStates 的输出（含温度数据）
// @returns {Object} {skillId → {avgMastery, count, totalMin, ...}}
export function aggregateSkillMastery(knowledgeStates, tempStates) {
  const allSkills = getAllSkills();
  const result = {};
  for (const skill of allSkills) {
    const kps = skill.kps.map(kp => knowledgeStates[`${skill.id}::${kp}`]).filter(Boolean);
    const count = kps.reduce((s, k) => s + k.count, 0);
    const totalMin = kps.reduce((s, k) => s + k.totalMin, 0);
    const avgScore = kps.length > 0 ? Math.round(kps.reduce((s, k) => s + k.avgScore, 0) / kps.length) : 0;
    const lastTs = kps.reduce((max, k) => Math.max(max, k.lastTs), 0);

    // v0.66: 新公式 — 温度×0.5 + 正确率×0.3 + 掌握占比×0.2
    let avgMastery = 0;
    if (kps.length > 0 && tempStates) {
      // 收集该技能下所有 KP 的温度
      const temps = skill.kps
        .map(kp => tempStates[`${skill.id}::${kp}`])
        .filter(Boolean)
        .map(st => st.temp);
      const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
      // 掌握占比: 温度≥60 的 KP 数 / 总 KP 数
      const masteredCount = temps.filter(t => t >= 60).length;
      const masteryRatio = temps.length > 0 ? masteredCount / temps.length : 0;
      avgMastery = Math.round(avgTemp * 0.5 + avgScore * 0.3 + masteryRatio * 100 * 0.2);
    } else {
      // 兜底: 无温度数据时用旧公式
      avgMastery = kps.length > 0 ? Math.round(kps.reduce((s, k) => s + k.mastery, 0) / kps.length) : 0;
    }

    result[skill.id] = {
      ...skill, count, totalMin, avgMastery, avgScore, lastTs,
      kpCount: kps.length, totalKps: skill.kps.length,
    };
  }
  return result;
}

// 将技能掌握度聚合到学科级别
// v0.67 对齐参考文档 §5.3: S = B^0.3 × D^0.4 × E^0.3
//   B (广度) = 已学KP数 / 该学科总KP数
//   D (深度) = 该学科所有KP的平均温度 / 100
//   E (效率) = 该学科所有记录的平均正确率 / 100
// @param {Object} skillMastery — aggregateSkillMastery 的输出
// @param {Object} knowledgeStates — buildKnowledgeStates 的输出（含正确率）
// @param {Object} tempStates — buildTempStates 的输出（含温度）
// @returns {Object} {subjectKey → {mastery, totalMin, count, ...}}
export function aggregateSubjectAbility(skillMastery, knowledgeStates, tempStates) {
  const result = {};
  for (const [subjKey, subj] of Object.entries(SKILL_TREE.subjects)) {
    const skills = Object.entries(subj.skills).map(([id]) => skillMastery[id]).filter(Boolean);
    const totalMin = skills.reduce((s, sk) => s + sk.totalMin, 0);
    const count = skills.reduce((s, sk) => s + sk.count, 0);

    // v0.67: 三因子公式 S = B^0.3 × D^0.4 × E^0.3
    let mastery = 0;
    if (knowledgeStates && tempStates) {
      // 收集该学科下所有 KP
      const subjKps = Object.values(knowledgeStates).filter(k => k.subjectKey === subjKey);
      const totalKps = subjKps.length;
      const learnedKps = subjKps.filter(k => k.count > 0).length;
      // B: 广度 — 已学KP占比
      const B = totalKps > 0 ? learnedKps / totalKps : 0;
      // D: 深度 — 平均温度/100
      const temps = subjKps
        .map(k => tempStates[`${k.skillId}::${k.kp}`])
        .filter(Boolean)
        .map(st => st.temp);
      const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
      const D = avgTemp / 100;
      // E: 效率 — 平均正确率/100
      const scores = subjKps.filter(k => k.count > 0).map(k => k.avgScore);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const E = avgScore / 100;
      // S = B^0.3 × D^0.4 × E^0.3，映射到 0-100
      mastery = Math.round(Math.pow(B, 0.3) * Math.pow(Math.max(0.01, D), 0.4) * Math.pow(Math.max(0.01, E), 0.3) * 100);
    } else {
      // 兜底: 无温度数据时用加权平均
      const totalWeight = skills.reduce((s, sk) => s + sk.weight, 0) || 1;
      mastery = Math.round(skills.reduce((s, sk) => s + sk.avgMastery * sk.weight, 0) / totalWeight);
    }

    result[subjKey] = {
      name: subj.name, subjectId: subj.subjectId,
      mastery: Math.min(100, mastery), totalMin, count,
      skillCount: skills.length,
    };
  }
  return result;
}

// 特长/短板检测: mastery >= 均值+15 且 >=50 为特长，
// mastery <= 均值-15 为短板
// §5.10: 特长还需 halfLife > 学科平均半衰期×1.2
// @param {Object} subjectAbility — aggregateSubjectAbility 的输出
// @param {Object} tempStates — buildTempStates 的输出（含半衰期数据）
// @returns {Array} [{subjectKey, name, mastery, type:'strength'|'weakness'}]
export function detectTalents(subjectAbility, tempStates) {
  const entries = Object.entries(subjectAbility).filter(([, v]) => v.count > 0);
  if (entries.length === 0) return [];
  const avgMastery = entries.reduce((s, [, v]) => s + v.mastery, 0) / entries.length;

  // 计算各学科平均半衰期
  const subjectAvgHL = {};
  if (tempStates) {
    for (const [key, val] of entries) {
      const hlValues = Object.values(tempStates)
        .filter(st => st.subjectKey === key && st.halfLife > 0)
        .map(st => st.halfLife);
      subjectAvgHL[key] = hlValues.length > 0
        ? hlValues.reduce((a, b) => a + b, 0) / hlValues.length
        : 0;
    }
  }
  const globalAvgHL = Object.values(subjectAvgHL).filter(v => v > 0);
  const avgHalfLife = globalAvgHL.length > 0
    ? globalAvgHL.reduce((a, b) => a + b, 0) / globalAvgHL.length
    : 0;

  const talents = [];
  for (const [key, val] of entries) {
    if (val.mastery >= avgMastery + 15 && val.mastery >= 50) {
      // §5.10: 特长还需半衰期 > 平均×1.2（仅在有半衰期数据时验证）
      if (avgHalfLife > 0) {
        const hl = subjectAvgHL[key] || 0;
        if (hl <= avgHalfLife * 1.2) continue;
      }
      talents.push({ subjectKey: key, name: val.name, mastery: val.mastery, type: 'strength' });
    } else if (val.mastery <= avgMastery - 15 && val.count > 0) {
      talents.push({ subjectKey: key, name: val.name, mastery: val.mastery, type: 'weakness' });
    }
  }
  return talents.sort((a, b) => b.mastery - a.mastery);
}

// 一键计算: records → knowledgeStates → skillMastery → subjectAbility → talents
// v0.66: 构建 tempStates 传入 aggregateSkillMastery 用于温度加权
// v0.67: 传递 knowledgeStates + tempStates 到 aggregateSubjectAbility
// @returns {{knowledgeStates, skillMastery, subjectAbility, talents}}
export function computeAll() {
  const records = getRecords();
  const profile = Store.get(StorageKeys.USER_PROFILE) || {};
  const knowledgeStates = buildKnowledgeStates(records);
  const tempStates = buildTempStates(records, profile);
  const skillMastery = aggregateSkillMastery(knowledgeStates, tempStates);
  const subjectAbility = aggregateSubjectAbility(skillMastery, knowledgeStates, tempStates);
  const talents = detectTalents(subjectAbility, tempStates);
  // 持久化特长学科到 profile，供 calcXP 的 talentMultiplier 使用
  const strengthSubjects = talents.filter(t => t.type === 'strength').map(t => t.subjectKey);
  profile._talentSubjects = strengthSubjects;
  Store.set(StorageKeys.USER_PROFILE, profile);
  return { knowledgeStates, skillMastery, subjectAbility, talents };
}
