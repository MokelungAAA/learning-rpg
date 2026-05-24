// exam-scores.js — 考试成绩数据模型：题型定义 + 默认结构
// 每科有固定的题型列表，用于录入和图表展示

// 题型定义：subject id → [{ type, maxScore }]
export const QUESTION_TYPES = {
  english: [
    { type: '听力', maxScore: 30 },
    { type: '阅读理解', maxScore: 40 },
    { type: '完形填空', maxScore: 30 },
    { type: '语法填空', maxScore: 15 },
    { type: '作文', maxScore: 25 },
  ],
  chinese: [
    { type: '现代文阅读', maxScore: 35 },
    { type: '古诗文阅读', maxScore: 35 },
    { type: '语言文字运用', maxScore: 20 },
    { type: '作文', maxScore: 60 },
  ],
  math: [
    { type: '选择题', maxScore: 60 },
    { type: '填空题', maxScore: 20 },
    { type: '解答题', maxScore: 70 },
  ],
  physics: [
    { type: '选择题', maxScore: 48 },
    { type: '实验题', maxScore: 18 },
    { type: '计算题', maxScore: 34 },
  ],
  chemistry: [
    { type: '选择题', maxScore: 42 },
    { type: '实验题', maxScore: 28 },
    { type: '计算题', maxScore: 30 },
  ],
  biology: [
    { type: '选择题', maxScore: 36 },
    { type: '实验题', maxScore: 32 },
    { type: '计算题', maxScore: 32 },
  ],
  politics: [
    { type: '选择题', maxScore: 48 },
    { type: '材料分析', maxScore: 52 },
  ],
  history: [
    { type: '选择题', maxScore: 48 },
    { type: '材料分析', maxScore: 52 },
  ],
  geography: [
    { type: '选择题', maxScore: 44 },
    { type: '材料分析', maxScore: 56 },
  ],
};

// 每科默认满分
export const DEFAULT_MAX_SCORES = {
  english: 150, chinese: 150, math: 150,
  physics: 100, chemistry: 100, biology: 100,
  politics: 100, history: 100, geography: 100,
};

// 创建空考试记录模板
export function createExamEntry(subject, examName, totalScore, maxScore, questionTypeScores) {
  return {
    id: 'exam-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    subject: subject,
    examName: examName,
    totalScore: totalScore,
    maxScore: maxScore,
    questionTypeScores: questionTypeScores || [],
  };
}
