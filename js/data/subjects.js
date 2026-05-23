// subjects.js — 学科数据（教材/章节/知识点层级）
// 层级: subject > textbook > chapter > section > knowledgePoints
// 注意: 学科 id 用英文(physics/math等),
//       与 skill-tree.js 的拉丁代号不同
export const SUBJECTS_DATA = {
  physics: {
    id: 'physics',
    name: '物理',
    textbooks: [
      {
        id: 'physics-rjb-bx1',
        name: '人教版·必修第一册',
        chapters: [
          {
            id: 'ch1',
            name: '第一章 运动的描述',
            sections: [
              { id: 's1-1', name: '1.1 质点 参考系和坐标系', knowledgePoints: ['k1-1-1', 'k1-1-2', 'k1-1-3'] },
              { id: 's1-2', name: '1.2 时间 位移', knowledgePoints: ['k1-2-1', 'k1-2-2'] },
              { id: 's1-3', name: '1.3 位置变化快慢的描述——速度', knowledgePoints: ['k1-3-1', 'k1-3-2'] },
            ],
          },
          {
            id: 'ch2',
            name: '第二章 匀变速直线运动的研究',
            sections: [
              { id: 's2-1', name: '2.1 实验：探究小车速度随时间变化的规律', knowledgePoints: ['k2-1-1'] },
              { id: 's2-2', name: '2.2 匀变速直线运动的速度与时间的关系', knowledgePoints: ['k2-2-1', 'k2-2-2'] },
            ],
          },
        ],
      },
    ],
  },
  chemistry: {
    id: 'chemistry',
    name: '化学',
    textbooks: [
      {
        id: 'chem-rjb-bx1',
        name: '人教版·必修第一册',
        chapters: [
          {
            id: 'ch1',
            name: '第一章 化学反应的热效应',
            sections: [
              { id: 's1-1', name: '1.1 反应热', knowledgePoints: ['ck1-1-1', 'ck1-1-2'] },
              { id: 's1-2', name: '1.2 反应热的计算', knowledgePoints: ['ck1-2-1'] },
            ],
          },
        ],
      },
    ],
  },
  biology: {
    id: 'biology',
    name: '生物',
    textbooks: [
      {
        id: 'bio-rjb-bx1',
        name: '人教版·必修第一册',
        chapters: [
          {
            id: 'ch1',
            name: '第一章 细胞的分子组成',
            sections: [
              { id: 's1-1', name: '1.1 细胞中的元素和化合物', knowledgePoints: ['bk1-1-1'] },
            ],
          },
        ],
      },
    ],
  },
  math: {
    id: 'math',
    name: '数学',
    textbooks: [
      {
        id: 'math-rjb-a1',
        name: '人教版·A版必修第一册',
        chapters: [
          {
            id: 'ch1',
            name: '第一章 集合与常用逻辑用语',
            sections: [
              { id: 's1-1', name: '1.1 集合的概念', knowledgePoints: ['mk1-1-1', 'mk1-1-2'] },
            ],
          },
        ],
      },
    ],
  },
  english: {
    id: 'english',
    name: '英语',
    textbooks: [
      {
        id: 'eng-rjb-bx1',
        name: '人教版·必修第一册',
        chapters: [
          {
            id: 'ch1',
            name: 'Unit 1 Teenage Life',
            sections: [
              { id: 's1-1', name: 'Reading and Thinking', knowledgePoints: ['ek1-1-1'] },
            ],
          },
        ],
      },
    ],
  },
  chinese: {
    id: 'chinese',
    name: '语文',
    textbooks: [
      {
        id: 'chi-rjb-bx1',
        name: '人教版·必修上册',
        chapters: [
          {
            id: 'ch1',
            name: '第一单元',
            sections: [
              { id: 's1-1', name: '1.1 沁园春·长沙', knowledgePoints: ['kk1-1-1'] },
            ],
          },
        ],
      },
    ],
  },
  politics: {
    id: 'politics',
    name: '政治',
    textbooks: [
      {
        id: 'pol-rjb-bx1',
        name: '人教版·必修第一册',
        chapters: [
          {
            id: 'ch1',
            name: '第一单元 中国共产党的领导',
            sections: [
              { id: 's1-1', name: '1.1 中华人民共和国成立前各种政治力量', knowledgePoints: ['pk1-1-1'] },
            ],
          },
        ],
      },
    ],
  },
  history: {
    id: 'history',
    name: '历史',
    textbooks: [
      {
        id: 'his-rjb-bx1',
        name: '人教版·必修上册',
        chapters: [
          {
            id: 'ch1',
            name: '第一单元 从中华文明起源到秦汉统一多民族封建国家的建立',
            sections: [
              { id: 's1-1', name: '1.1 中华文明的起源', knowledgePoints: ['hk1-1-1'] },
            ],
          },
        ],
      },
    ],
  },
  geography: {
    id: 'geography',
    name: '地理',
    textbooks: [
      {
        id: 'geo-rjb-bx1',
        name: '人教版·必修第一册',
        chapters: [
          {
            id: 'ch1',
            name: '第一章 宇宙中的地球',
            sections: [
              { id: 's1-1', name: '1.1 地球的宇宙环境', knowledgePoints: ['gk1-1-1'] },
            ],
          },
        ],
      },
    ],
  },
};

// 按英文 id 查学科, 不存在返回 null
export function getSubjectById(id) {
  return SUBJECTS_DATA[id] || null;
}

// 递归收集某学科下所有知识点 id 数组
// subjectId 为英文 id (如 'math')
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
