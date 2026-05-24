// subjects.js — 学科数据（教材/章节/知识点层级）
// 层级: subject > textbook > chapter > section > knowledgePoints
// 教材数据从 textbooks.js 导入，本文件保留接口和工具函数
import { ALL_TEXTBOOKS, ONLINE_COURSES, STUDY_AIDS } from './textbooks.js';

export const SUBJECTS_DATA = {};
for (const [id, textbooks] of Object.entries(ALL_TEXTBOOKS)) {
  SUBJECTS_DATA[id] = { id, name: getTextbookSubjectName(id), textbooks };
}

function getTextbookSubjectName(id) {
  const names = { math:'数学', chinese:'语文', english:'英语', physics:'物理',
    chemistry:'化学', biology:'生物', politics:'政治', history:'历史', geography:'地理' };
  return names[id] || id;
}

// 按英文 id 查学科, 不存在返回 null
export function getSubjectById(id) {
  return SUBJECTS_DATA[id] || null;
}

// 递归收集某学科下所有知识点名称数组
export function getAllKnowledgePoints(subjectId) {
  const subject = SUBJECTS_DATA[subjectId];
  if (!subject) return [];
  const points = [];
  for (const textbook of subject.textbooks) {
    for (const chapter of textbook.chapters) {
      for (const section of chapter.sections) {
        points.push(...section.knowledgePoints);
      }
    }
  }
  return points;
}

// 获取某学科所有教材名称列表
export function getTextbookNames(subjectId) {
  const subject = SUBJECTS_DATA[subjectId];
  if (!subject) return [];
  return subject.textbooks.map(tb => tb.name);
}

// 获取某学科的网课列表
export function getOnlineCourses(subjectId) {
  return ONLINE_COURSES.filter(c => c.subject === subjectId);
}

// 获取某学科的教辅列表
export function getStudyAids(subjectId) {
  return STUDY_AIDS.filter(a => a.subject === subjectId);
}
