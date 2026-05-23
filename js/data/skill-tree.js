// skill-tree.js — 三层技能体系（9科42技能）
export const SKILL_TREE = {
  version: '1.0.0',
  subjects: {
    logos: {
      id: 'logos', name: '数学', subjectId: 'math',
      skills: {
        'logos-func':  { name: '函数与导数', desc: '函数性质分析、导数应用、不等式', weight: 0.30, kps: ['函数性质','基本初等函数','导数的运算','导数与切线','导数与单调性'] },
        'logos-geo':   { name: '几何与代数', desc: '坐标系、向量、立体几何', weight: 0.28, kps: ['空间几何体','向量法','立体几何证明','解析几何'] },
        'logos-prob':  { name: '概率与统计', desc: '数据处理、概率模型', weight: 0.17, kps: ['古典概型','条件概率','分布列与期望','回归分析'] },
        'logos-seq':   { name: '数列与数学归纳法', desc: '等差等比、递推、数学归纳法', weight: 0.12, kps: ['等差数列','等比数列','数列通项与求和','数学归纳法'] },
        'logos-model': { name: '数学建模与创新', desc: '新情境应用、跨学科综合', weight: 0.13, kps: ['新定义题型','实际情境建模','创新综合题'] },
      },
    },
    mythos: {
      id: 'mythos', name: '语文', subjectId: 'chinese',
      skills: {
        'mythos-modern':  { name: '现代文阅读', desc: '论述类、文学类、实用类文本', weight: 0.25, kps: ['论述类文本','文学类文本','实用类文本'] },
        'mythos-classic': { name: '古诗文阅读', desc: '文言文、古诗词鉴赏', weight: 0.25, kps: ['文言文阅读','古诗词鉴赏','名句默写'] },
        'mythos-lang':    { name: '语言文字运用', desc: '成语、病句、修辞、语段', weight: 0.15, kps: ['成语运用','病句辨析','修辞手法','语段补写'] },
        'mythos-write':   { name: '写作', desc: '议论文、记叙文、应用文', weight: 0.25, kps: ['议论文写作','记叙文写作','作文审题'] },
        'mythos-mem':     { name: '名篇名句默写', desc: '必背古诗文', weight: 0.10, kps: ['高中必背篇目'] },
      },
    },
    lingua: {
      id: 'lingua', name: '英语', subjectId: 'english',
      skills: {
        'lingua-vocab':  { name: '词汇与语法', desc: '核心词汇、语法结构', weight: 0.20, kps: ['核心词汇','语法填空','短文改错'] },
        'lingua-read':   { name: '阅读理解', desc: '细节理解、推理判断、主旨大意', weight: 0.25, kps: ['细节理解','推理判断','主旨大意','词义猜测'] },
        'lingua-cloze':  { name: '完形填空', desc: '语境理解、词汇辨析', weight: 0.15, kps: ['完形填空技巧'] },
        'lingua-75':     { name: '七选五', desc: '语篇结构、逻辑关系', weight: 0.10, kps: ['七选五技巧'] },
        'lingua-write':  { name: '写作', desc: '应用文、读后续写', weight: 0.20, kps: ['应用文写作','读后续写'] },
        'lingua-listen': { name: '听力', desc: '听力理解、信息获取', weight: 0.10, kps: ['听力技巧'] },
      },
    },
    physis: {
      id: 'physis', name: '物理', subjectId: 'physics',
      skills: {
        'physis-mech':   { name: '力学', desc: '牛顿定律、动量、能量', weight: 0.35, kps: ['牛顿运动定律','动量守恒','能量守恒','圆周运动'] },
        'physis-elec':   { name: '电磁学', desc: '电场、磁场、电磁感应', weight: 0.30, kps: ['电场强度','磁场','电磁感应','交流电'] },
        'physis-thermo': { name: '热学', desc: '分子运动、热力学', weight: 0.10, kps: ['分子运动论','热力学定律'] },
        'physis-optics': { name: '光学', desc: '光的折射、干涉、衍射', weight: 0.10, kps: ['光的折射','光的干涉'] },
        'physis-atom':   { name: '原子物理', desc: '原子结构、核反应', weight: 0.15, kps: ['原子结构','核反应'] },
      },
    },
    khemeia: {
      id: 'khemeia', name: '化学', subjectId: 'chemistry',
      skills: {
        'khemeia-basic':   { name: '化学基本概念', desc: '物质分类、化学计量', weight: 0.15, kps: ['物质分类','化学计量','氧化还原反应'] },
        'khemeia-element': { name: '元素化合物', desc: '金属、非金属及其化合物', weight: 0.25, kps: ['金属及其化合物','非金属及其化合物'] },
        'khemeia-organic': { name: '有机化学', desc: '烃、烃的衍生物', weight: 0.20, kps: ['烃','烃的衍生物','有机合成'] },
        'khemeia-react':   { name: '化学反应原理', desc: '热化学、速率、平衡、电化学', weight: 0.25, kps: ['化学反应速率','化学平衡','电化学'] },
        'khemeia-lab':     { name: '化学实验', desc: '实验设计、操作、安全', weight: 0.15, kps: ['实验基本操作','实验设计'] },
      },
    },
    zoe: {
      id: 'zoe', name: '生物', subjectId: 'biology',
      skills: {
        'zoe-cell':     { name: '分子与细胞', desc: '细胞结构、代谢、分裂', weight: 0.25, kps: ['细胞结构','细胞代谢','细胞分裂'] },
        'zoe-genetics': { name: '遗传与进化', desc: '遗传规律、变异、进化', weight: 0.30, kps: ['遗传规律','基因突变','进化理论'] },
        'zoe-env':      { name: '稳态与环境', desc: '内环境、神经调节、免疫', weight: 0.20, kps: ['内环境稳态','神经调节','免疫调节'] },
        'zoe-bio':      { name: '生物技术', desc: '基因工程、细胞工程', weight: 0.10, kps: ['基因工程','细胞工程'] },
        'zoe-lab':      { name: '生物实验', desc: '实验设计与分析', weight: 0.15, kps: ['实验设计','数据分析'] },
      },
    },
    politeia: {
      id: 'politeia', name: '政治', subjectId: 'politics',
      skills: {
        'politeia-econ':   { name: '经济生活', desc: '生产、消费、分配、市场', weight: 0.35, kps: ['生产与消费','收入分配','市场经济'] },
        'politeia-pol':    { name: '政治生活', desc: '公民、政府、政党、国际', weight: 0.35, kps: ['公民权利','政府职能','政党制度'] },
        'politeia-culture': { name: '文化生活', desc: '文化传承、创新、中华文化', weight: 0.30, kps: ['文化传承','文化创新','中华文化'] },
      },
    },
    historia: {
      id: 'historia', name: '历史', subjectId: 'history',
      skills: {
        'historia-cn-ancient': { name: '中国古代史', desc: '先秦至明清', weight: 0.25, kps: ['先秦','秦汉','隋唐','宋元','明清'] },
        'historia-cn-modern':  { name: '中国近现代史', desc: '鸦片战争至现代', weight: 0.30, kps: ['近代探索','新民主主义革命','社会主义建设'] },
        'historia-world-ancient': { name: '世界古代史', desc: '古代文明', weight: 0.15, kps: ['古希腊','古罗马'] },
        'historia-world-modern': { name: '世界近现代史', desc: '工业革命至当代', weight: 0.30, kps: ['工业革命','两次世界大战','冷战与当代'] },
      },
    },
    geographia: {
      id: 'geographia', name: '地理', subjectId: 'geography',
      skills: {
        'geographia-phys':   { name: '自然地理', desc: '地球、大气、水、地貌', weight: 0.35, kps: ['地球运动','大气环流','水循环','地貌'] },
        'geographia-human':  { name: '人文地理', desc: '人口、城市、农业、工业', weight: 0.25, kps: ['人口','城市化','农业','工业'] },
        'geographia-region': { name: '区域地理', desc: '中国地理、世界地理', weight: 0.25, kps: ['中国地理','世界地理'] },
        'geographia-gis':    { name: '地理信息技术', desc: 'GIS、RS、GPS', weight: 0.15, kps: ['GIS','遥感','GPS'] },
      },
    },
  },
};

// 获取所有技能的扁平列表
export function getAllSkills() {
  const list = [];
  for (const [subjKey, subj] of Object.entries(SKILL_TREE.subjects)) {
    for (const [skillId, skill] of Object.entries(subj.skills)) {
      list.push({ ...skill, id: skillId, subjectKey: subjKey, subjectName: subj.name, subjectId: subj.subjectId });
    }
  }
  return list;
}

// 获取学科下的所有技能
export function getSkillsBySubject(subjectKey) {
  const subj = SKILL_TREE.subjects[subjectKey];
  if (!subj) return [];
  return Object.entries(subj.skills).map(([id, s]) => ({ ...s, id, subjectKey, subjectName: subj.name, subjectId: subj.subjectId }));
}
