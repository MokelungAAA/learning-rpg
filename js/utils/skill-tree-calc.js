// skill-tree-calc.js — 技能树数据计算（SKILL-01~04）
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys, SUBJECTS } from '../config.js';
import { SKILL_TREE, getAllSkills } from '../data/skill-tree.js';

const getRecords = () => Store.get(StorageKeys.STUDY_RECORDS) || [];

// SKILL-01: 知识点数据构建
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

// SKILL-02: 技能聚合
export function aggregateSkillMastery(knowledgeStates) {
  const allSkills = getAllSkills();
  const result = {};
  for (const skill of allSkills) {
    const kps = skill.kps.map(kp => knowledgeStates[`${skill.id}::${kp}`]).filter(Boolean);
    const count = kps.reduce((s, k) => s + k.count, 0);
    const totalMin = kps.reduce((s, k) => s + k.totalMin, 0);
    const avgMastery = kps.length > 0 ? Math.round(kps.reduce((s, k) => s + k.mastery, 0) / kps.length) : 0;
    const avgScore = kps.length > 0 ? Math.round(kps.reduce((s, k) => s + k.avgScore, 0) / kps.length) : 0;
    const lastTs = kps.reduce((max, k) => Math.max(max, k.lastTs), 0);
    result[skill.id] = {
      ...skill, count, totalMin, avgMastery, avgScore, lastTs,
      kpCount: kps.length, totalKps: skill.kps.length,
    };
  }
  return result;
}

// SKILL-03: 学科聚合
export function aggregateSubjectAbility(skillMastery) {
  const result = {};
  for (const [subjKey, subj] of Object.entries(SKILL_TREE.subjects)) {
    const skills = Object.entries(subj.skills).map(([id]) => skillMastery[id]).filter(Boolean);
    const totalWeight = skills.reduce((s, sk) => s + sk.weight, 0) || 1;
    const weightedMastery = skills.reduce((s, sk) => s + sk.avgMastery * sk.weight, 0) / totalWeight;
    const totalMin = skills.reduce((s, sk) => s + sk.totalMin, 0);
    const count = skills.reduce((s, sk) => s + sk.count, 0);
    result[subjKey] = {
      name: subj.name, subjectId: subj.subjectId,
      mastery: Math.round(weightedMastery), totalMin, count,
      skillCount: skills.length,
    };
  }
  return result;
}

// SKILL-04: 特长检测
export function detectTalents(subjectAbility) {
  const entries = Object.entries(subjectAbility).filter(([, v]) => v.count > 0);
  if (entries.length === 0) return [];
  const avgMastery = entries.reduce((s, [, v]) => s + v.mastery, 0) / entries.length;
  const talents = [];
  for (const [key, val] of entries) {
    if (val.mastery >= avgMastery + 15 && val.mastery >= 50) {
      talents.push({ subjectKey: key, name: val.name, mastery: val.mastery, type: 'strength' });
    } else if (val.mastery <= avgMastery - 15 && val.count > 0) {
      talents.push({ subjectKey: key, name: val.name, mastery: val.mastery, type: 'weakness' });
    }
  }
  return talents.sort((a, b) => b.mastery - a.mastery);
}

// 一键计算全部
export function computeAll() {
  const records = getRecords();
  const knowledgeStates = buildKnowledgeStates(records);
  const skillMastery = aggregateSkillMastery(knowledgeStates);
  const subjectAbility = aggregateSubjectAbility(skillMastery);
  const talents = detectTalents(subjectAbility);
  return { knowledgeStates, skillMastery, subjectAbility, talents };
}
