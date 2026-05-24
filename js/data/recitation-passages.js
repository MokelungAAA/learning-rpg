// recitation-passages.js — 语文古诗文背诵篇目数据库
// 精选高考必背篇目，按教材册次组织
// status: not_started / memorized / mastered
// 记忆曲线: 基于FSRS，用自评数据修正

export const PASSAGE_CATEGORIES = [
  { id: 'required', name: '高考必背', icon: '📝' },
  { id: 'elective', name: '选修拓展', icon: '📚' },
];

// 每篇结构: { id, title, author, dynasty, category, source, preview, length }
// length: 字数（用于估算背诵/默写时长）
export const PASSAGES = [
  // ═══ 高中必修上册 ═══
  { id: 'p_001', title: '沁园春·长沙', author: '毛泽东', dynasty: '现代', category: 'required', source: '必修上册', preview: '独立寒秋，湘江北去，橘子洲头...', length: 116 },
  { id: 'p_002', title: '短歌行', author: '曹操', dynasty: '东汉', category: 'required', source: '必修上册', preview: '对酒当歌，人生几何...', length: 160 },
  { id: 'p_003', title: '归园田居（其一）', author: '陶渊明', dynasty: '东晋', category: 'required', source: '必修上册', preview: '少无适俗韵，性本爱丘山...', length: 100 },
  { id: 'p_004', title: '梦游天姥吟留别', author: '李白', dynasty: '唐', category: 'required', source: '必修上册', preview: '海客谈瀛洲，烟涛微茫信难求...', length: 450 },
  { id: 'p_005', title: '登高', author: '杜甫', dynasty: '唐', category: 'required', source: '必修上册', preview: '风急天高猿啸哀，渚清沙白鸟飞回...', length: 56 },
  { id: 'p_006', title: '琵琶行', author: '白居易', dynasty: '唐', category: 'required', source: '必修上册', preview: '浔阳江头夜送客，枫叶荻花秋瑟瑟...', length: 616 },
  { id: 'p_007', title: '念奴娇·赤壁怀古', author: '苏轼', dynasty: '宋', category: 'required', source: '必修上册', preview: '大江东去，浪淘尽...', length: 100 },
  { id: 'p_008', title: '永遇乐·京口北固亭怀古', author: '辛弃疾', dynasty: '宋', category: 'required', source: '必修上册', preview: '千古江山，英雄无觅...', length: 104 },
  { id: 'p_009', title: '声声慢', author: '李清照', dynasty: '宋', category: 'required', source: '必修上册', preview: '寻寻觅觅，冷冷清清...', length: 97 },
  { id: 'p_010', title: '劝学', author: '荀子', dynasty: '战国', category: 'required', source: '必修上册', preview: '君子曰：学不可以已...', length: 320 },
  { id: 'p_011', title: '师说', author: '韩愈', dynasty: '唐', category: 'required', source: '必修上册', preview: '古之学者必有师...', length: 460 },
  { id: 'p_012', title: '赤壁赋', author: '苏轼', dynasty: '宋', category: 'required', source: '必修上册', preview: '壬戌之秋，七月既望...', length: 540 },
  { id: 'p_013', title: '登泰山记', author: '姚鼐', dynasty: '清', category: 'required', source: '必修上册', preview: '泰山之阳，汶水西流...', length: 480 },

  // ═══ 高中必修下册 ═══
  { id: 'p_014', title: '子路、曾皙、冉有、公西华侍坐', author: '论语', dynasty: '先秦', category: 'required', source: '必修下册', preview: '子路、曾皙、冉有、公西华侍坐...', length: 420 },
  { id: 'p_015', title: '谏太宗十思疏', author: '魏征', dynasty: '唐', category: 'required', source: '必修下册', preview: '臣闻求木之长者...', length: 380 },
  { id: 'p_016', title: '答司马谏议书', author: '王安石', dynasty: '宋', category: 'required', source: '必修下册', preview: '某启：昨日蒙教...', length: 340 },
  { id: 'p_017', title: '阿房宫赋', author: '杜牧', dynasty: '唐', category: 'required', source: '必修下册', preview: '六王毕，四海一...', length: 520 },
  { id: 'p_018', title: '六国论', author: '苏洵', dynasty: '宋', category: 'required', source: '必修下册', preview: '六国破灭，非兵不利...', length: 480 },
  { id: 'p_019', title: '游褒禅山记', author: '王安石', dynasty: '宋', category: 'required', source: '必修下册', preview: '褒禅山亦谓之华山...', length: 460 },

  // ═══ 选择性必修上册 ═══
  { id: 'p_020', title: '论语十二章', author: '论语', dynasty: '先秦', category: 'required', source: '选必上册', preview: '子曰：学而时习之...', length: 380 },
  { id: 'p_021', title: '大学之道', author: '礼记', dynasty: '先秦', category: 'required', source: '选必上册', preview: '大学之道，在明明德...', length: 280 },
  { id: 'p_022', title: '老子四章', author: '老子', dynasty: '先秦', category: 'required', source: '选必上册', preview: '三十辐共一毂...', length: 240 },
  { id: 'p_023', title: '将进酒', author: '李白', dynasty: '唐', category: 'required', source: '选必上册', preview: '君不见黄河之水天上来...', length: 180 },
  { id: 'p_024', title: '江城子·乙卯正月二十日夜记梦', author: '苏轼', dynasty: '宋', category: 'required', source: '选必上册', preview: '十年生死两茫茫...', length: 70 },

  // ═══ 选择性必修中册 ═══
  { id: 'p_025', title: '屈原列传（节选）', author: '司马迁', dynasty: '西汉', category: 'required', source: '选必中册', preview: '屈平疾王听之不聪也...', length: 380 },
  { id: 'p_026', title: '过秦论', author: '贾谊', dynasty: '西汉', category: 'required', source: '选必中册', preview: '秦孝公据崤函之固...', length: 720 },
  { id: 'p_027', title: '五代史伶官传序', author: '欧阳修', dynasty: '宋', category: 'required', source: '选必中册', preview: '呜呼！盛衰之理...', length: 360 },
  { id: 'p_028', title: '燕歌行', author: '高适', dynasty: '唐', category: 'required', source: '选必中册', preview: '汉家烟尘在东北...', length: 200 },
  { id: 'p_029', title: '李凭箜篌引', author: '李贺', dynasty: '唐', category: 'required', source: '选必中册', preview: '吴丝蜀桐张高秋...', length: 120 },
  { id: 'p_030', title: '锦瑟', author: '李商隐', dynasty: '唐', category: 'required', source: '选必中册', preview: '锦瑟无端五十弦...', length: 56 },
  { id: 'p_031', title: '书愤', author: '陆游', dynasty: '宋', category: 'required', source: '选必中册', preview: '早岁那知世事艰...', length: 56 },

  // ═══ 选择性必修下册 ═══
  { id: 'p_032', title: '离骚（节选）', author: '屈原', dynasty: '战国', category: 'required', source: '选必下册', preview: '帝高阳之苗裔兮...', length: 480 },
  { id: 'p_033', title: '蜀道难', author: '李白', dynasty: '唐', category: 'required', source: '选必下册', preview: '噫吁嚱，危乎高哉...', length: 320 },
  { id: 'p_034', title: '蜀相', author: '杜甫', dynasty: '唐', category: 'required', source: '选必下册', preview: '丞相祠堂何处寻...', length: 56 },
  { id: 'p_035', title: '望海潮', author: '柳永', dynasty: '宋', category: 'required', source: '选必下册', preview: '东南形胜，三吴都会...', length: 110 },
  { id: 'p_036', title: '扬州慢', author: '姜夔', dynasty: '宋', category: 'required', source: '选必下册', preview: '淮左名都，竹西佳处...', length: 98 },
  { id: 'p_037', title: '陈情表', author: '李密', dynasty: '西晋', category: 'required', source: '选必下册', preview: '臣密言：臣以险衅...', length: 480 },
  { id: 'p_038', title: '项脊轩志', author: '归有光', dynasty: '明', category: 'required', source: '选必下册', preview: '项脊轩，旧南阁子也...', length: 520 },
  { id: 'p_039', title: '兰亭集序', author: '王羲之', dynasty: '东晋', category: 'required', source: '选必下册', preview: '永和九年，岁在癸丑...', length: 320 },
  { id: 'p_040', title: '归去来兮辞', author: '陶渊明', dynasty: '东晋', category: 'required', source: '选必下册', preview: '归去来兮，田园将芜胡不归...', length: 340 },
];

// 题型定义（用于成绩趋势系统）
export const QUESTION_TYPES = {
  chinese: [
    { id: 'modern_reading', name: '现代文阅读', maxScore: 36 },
    { id: 'classical_reading', name: '古诗文阅读', maxScore: 34 },
    { id: 'language_use', name: '语言文字运用', maxScore: 20 },
    { id: 'writing', name: '作文', maxScore: 60 },
  ],
  english: [
    { id: 'listening', name: '听力', maxScore: 30 },
    { id: 'reading', name: '阅读理解', maxScore: 40 },
    { id: 'cloze', name: '完形填空', maxScore: 15 },
    { id: 'grammar', name: '语法填空', maxScore: 15 },
    { id: 'writing', name: '作文', maxScore: 25 },
  ],
  math: [
    { id: 'choice', name: '选择题', maxScore: 60 },
    { id: 'fill', name: '填空题', maxScore: 20 },
    { id: 'answer', name: '解答题', maxScore: 70 },
  ],
  physics: [
    { id: 'choice', name: '选择题', maxScore: 48 },
    { id: 'experiment', name: '实验题', maxScore: 18 },
    { id: 'calculation', name: '计算题', maxScore: 34 },
  ],
  chemistry: [
    { id: 'choice', name: '选择题', maxScore: 42 },
    { id: 'experiment', name: '实验题', maxScore: 14 },
    { id: 'calculation', name: '综合题', maxScore: 44 },
  ],
  biology: [
    { id: 'choice', name: '选择题', maxScore: 36 },
    { id: 'fill', name: '填空题', maxScore: 54 },
    { id: 'experiment', name: '实验题', maxScore: 10 },
  ],
  politics: [
    { id: 'choice', name: '选择题', maxScore: 48 },
    { id: 'analysis', name: '材料分析', maxScore: 52 },
  ],
  history: [
    { id: 'choice', name: '选择题', maxScore: 48 },
    { id: 'analysis', name: '材料分析', maxScore: 52 },
  ],
  geography: [
    { id: 'choice', name: '选择题', maxScore: 44 },
    { id: 'analysis', name: '综合题', maxScore: 56 },
  ],
};

// 估算背诵时长（分钟）: 每100字约5分钟
export function estimateReciteTime(passage) {
  return Math.max(5, Math.round(passage.length / 100 * 5));
}

// 估算默写时长（分钟）: 每100字约8分钟（比背诵慢）
export function estimateDictateTime(passage) {
  return Math.max(8, Math.round(passage.length / 100 * 8));
}
