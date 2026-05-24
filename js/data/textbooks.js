// textbooks.js — 全学科教材数据（9科·精确到节·知识点）
// 层级: textbook > chapter > section > knowledgePoints[]
// 用户: 数学=湘教版, 其余8科=人教版
// 用途: subject-detail.js 教材进度, data-entry.js 教材选择

// ─── 数学 (湘教版) ────────────────────────────────────────────
export const MATH_TEXTBOOKS = [
  {
    id: 'math-xjb-bx1', name: '湘教版·必修第一册',
    chapters: [
      { id: 'ch1', name: '第一章 集合与逻辑', sections: [
        { id: 's1-1', name: '1.1 集合的概念与运算', knowledgePoints: ['集合的概念','集合的表示','集合间的基本关系','集合的运算'] },
        { id: 's1-2', name: '1.2 常用逻辑用语', knowledgePoints: ['充分条件与必要条件','全称量词与存在量词','逻辑联结词'] },
      ]},
      { id: 'ch2', name: '第二章 函数', sections: [
        { id: 's2-1', name: '2.1 函数的概念与性质', knowledgePoints: ['函数的概念','函数的单调性','函数的奇偶性'] },
        { id: 's2-2', name: '2.2 幂函数与指数函数', knowledgePoints: ['幂函数','指数函数','指数运算'] },
        { id: 's2-3', name: '2.3 对数函数', knowledgePoints: ['对数的概念','对数运算','对数函数'] },
        { id: 's2-4', name: '2.4 函数的零点', knowledgePoints: ['零点存在定理','二分法'] },
      ]},
      { id: 'ch3', name: '第三章 不等式', sections: [
        { id: 's3-1', name: '3.1 不等式的性质', knowledgePoints: ['不等式基本性质','比较大小'] },
        { id: 's3-2', name: '3.2 均值不等式', knowledgePoints: ['基本不等式','均值不等式应用'] },
        { id: 's3-3', name: '3.3 一元二次不等式', knowledgePoints: ['一元二次不等式解法','含参不等式'] },
      ]},
    ],
  },
  {
    id: 'math-xjb-bx2', name: '湘教版·必修第二册',
    chapters: [
      { id: 'ch4', name: '第四章 指数函数与对数函数（续）', sections: [
        { id: 's4-1', name: '4.1 指数函数与对数函数的应用', knowledgePoints: ['函数模型','指数增长与衰减'] },
      ]},
      { id: 'ch5', name: '第五章 三角函数', sections: [
        { id: 's5-1', name: '5.1 任意角与弧度制', knowledgePoints: ['任意角','弧度制','角的换算'] },
        { id: 's5-2', name: '5.2 三角函数的定义', knowledgePoints: ['三角函数定义','同角三角函数关系','诱导公式'] },
        { id: 's5-3', name: '5.3 三角函数的图象与性质', knowledgePoints: ['正弦函数图象','余弦函数图象','周期性','振幅与频率'] },
        { id: 's5-4', name: '5.4 三角恒等变换', knowledgePoints: ['两角和与差公式','二倍角公式','辅助角公式'] },
        { id: 's5-5', name: '5.5 正弦定理与余弦定理', knowledgePoints: ['正弦定理','余弦定理','解三角形'] },
      ]},
      { id: 'ch6', name: '第六章 平面向量', sections: [
        { id: 's6-1', name: '6.1 向量的概念与运算', knowledgePoints: ['向量的概念','向量加减法','数乘向量'] },
        { id: 's6-2', name: '6.2 向量的坐标运算', knowledgePoints: ['向量的坐标','向量数量积','向量夹角'] },
        { id: 's6-3', name: '6.3 向量的应用', knowledgePoints: ['向量与几何','向量与三角'] },
      ]},
    ],
  },
  {
    id: 'math-xjb-xbx1', name: '湘教版·选择性必修第一册',
    chapters: [
      { id: 'ch1', name: '第一章 数列', sections: [
        { id: 's1-1', name: '1.1 数列的概念', knowledgePoints: ['数列的定义','通项公式','递推公式'] },
        { id: 's1-2', name: '1.2 等差数列', knowledgePoints: ['等差数列通项','等差数列求和','等差中项'] },
        { id: 's1-3', name: '1.3 等比数列', knowledgePoints: ['等比数列通项','等比数列求和','等比中项'] },
        { id: 's1-4', name: '1.4 数列求和方法', knowledgePoints: ['裂项求和','错位相减','分组求和'] },
      ]},
      { id: 'ch2', name: '第二章 空间向量与立体几何', sections: [
        { id: 's2-1', name: '2.1 空间向量及其运算', knowledgePoints: ['空间向量','空间坐标系','空间向量运算'] },
        { id: 's2-2', name: '2.2 空间中的平行与垂直', knowledgePoints: ['线面平行判定','线面垂直判定','面面平行与垂直'] },
        { id: 's2-3', name: '2.3 空间角与距离', knowledgePoints: ['异面直线所成角','线面角','二面角','点到面距离'] },
      ]},
      { id: 'ch3', name: '第三章 圆锥曲线', sections: [
        { id: 's3-1', name: '3.1 曲线与方程', knowledgePoints: ['曲线与方程','求曲线方程'] },
        { id: 's3-2', name: '3.2 椭圆', knowledgePoints: ['椭圆标准方程','椭圆几何性质','椭圆应用'] },
        { id: 's3-3', name: '3.3 双曲线', knowledgePoints: ['双曲线标准方程','双曲线几何性质'] },
        { id: 's3-4', name: '3.4 抛物线', knowledgePoints: ['抛物线标准方程','抛物线几何性质'] },
      ]},
    ],
  },
  {
    id: 'math-xjb-xbx2', name: '湘教版·选择性必修第二册',
    chapters: [
      { id: 'ch4', name: '第四章 计数原理', sections: [
        { id: 's4-1', name: '4.1 分类加法与分步乘法', knowledgePoints: ['分类计数原理','分步计数原理'] },
        { id: 's4-2', name: '4.2 排列与组合', knowledgePoints: ['排列','组合','排列数组合数公式'] },
        { id: 's4-3', name: '4.3 二项式定理', knowledgePoints: ['二项式定理','二项式系数性质'] },
      ]},
      { id: 'ch5', name: '第五章 概率', sections: [
        { id: 's5-1', name: '5.1 概率的基本概念', knowledgePoints: ['古典概型','几何概型','概率加法公式'] },
        { id: 's5-2', name: '5.2 条件概率与独立性', knowledgePoints: ['条件概率','事件独立性','全概率公式'] },
        { id: 's5-3', name: '5.3 随机变量及其分布', knowledgePoints: ['离散型随机变量','分布列','期望与方差'] },
        { id: 's5-4', name: '5.4 二项分布与正态分布', knowledgePoints: ['二项分布','正态分布','正态曲线'] },
      ]},
    ],
  },
  {
    id: 'math-xjb-xbx3', name: '湘教版·选择性必修第三册',
    chapters: [
      { id: 'ch6', name: '第六章 统计', sections: [
        { id: 's6-1', name: '6.1 统计基本概念', knowledgePoints: ['总体与样本','频率分布','数字特征'] },
        { id: 's6-2', name: '6.2 回归分析', knowledgePoints: ['线性回归','相关系数','最小二乘法'] },
        { id: 's6-3', name: '6.3 独立性检验', knowledgePoints: ['列联表','卡方检验'] },
      ]},
      { id: 'ch7', name: '第七章 导数', sections: [
        { id: 's7-1', name: '7.1 导数的概念', knowledgePoints: ['导数的定义','导数的几何意义'] },
        { id: 's7-2', name: '7.2 导数的运算', knowledgePoints: ['基本求导公式','求导法则','复合函数求导'] },
        { id: 's7-3', name: '7.3 导数的应用', knowledgePoints: ['导数与单调性','导数与极值','导数与最值'] },
      ]},
    ],
  },
];

// ─── 语文 (人教版) ──────────────────────────────────────────────
export const CHINESE_TEXTBOOKS = [
  {
    id: 'chi-rjb-bxs', name: '人教版·必修上册',
    chapters: [
      { id: 'ch1', name: '第一单元 现代诗歌与散文', sections: [
        { id: 's1-1', name: '1.1 沁园春·长沙', knowledgePoints: ['词的意象','革命豪情'] },
        { id: 's1-2', name: '1.2 百合花 / 哦，香雪', knowledgePoints: ['小说人物','细节描写'] },
      ]},
      { id: 'ch2', name: '第二单元 实用类文本', sections: [
        { id: 's2-1', name: '2.1 喜看稻菽千重浪', knowledgePoints: ['人物通讯','新闻特写'] },
        { id: 's2-2', name: '2.2 以工匠精神雕琢时代品质', knowledgePoints: ['新闻评论','论证方法'] },
      ]},
      { id: 'ch3', name: '第三单元 古诗词', sections: [
        { id: 's3-1', name: '3.1 短歌行 / 归园田居', knowledgePoints: ['古诗意象','诗歌情感'] },
        { id: 's3-2', name: '3.2 梦游天姥吟留别 / 登高', knowledgePoints: ['浪漫主义','律诗格律'] },
      ]},
      { id: 'ch4', name: '第四单元 家乡文化', sections: [
        { id: 's4-1', name: '4.1 家乡文化调查', knowledgePoints: ['调查报告','访谈技巧'] },
      ]},
      { id: 'ch5', name: '第五单元 整本书阅读', sections: [
        { id: 's5-1', name: '5.1 《乡土中国》', knowledgePoints: ['学术著作阅读','核心概念提取'] },
      ]},
      { id: 'ch6', name: '第六单元 学习之道', sections: [
        { id: 's6-1', name: '6.1 劝学 / 师说', knowledgePoints: ['文言实词','文言虚词','论证结构'] },
      ]},
      { id: 'ch7', name: '第七单元 自然情怀', sections: [
        { id: 's7-1', name: '7.1 赤壁赋 / 登泰山记', knowledgePoints: ['文言句式','写景手法'] },
      ]},
      { id: 'ch8', name: '第八单元 语言文字运用', sections: [
        { id: 's8-1', name: '8.1 词语积累与运用', knowledgePoints: ['成语辨析','词语搭配'] },
      ]},
    ],
  },
  {
    id: 'chi-rjb-bxx', name: '人教版·必修下册',
    chapters: [
      { id: 'ch1', name: '第一单元 中华文明之光', sections: [
        { id: 's1-1', name: '1.1 子路曾皙冉有公西华侍坐', knowledgePoints: ['先秦散文','论语思想'] },
        { id: 's1-2', name: '1.2 齐桓晋文之事', knowledgePoints: ['孟子思想','论证方法'] },
      ]},
      { id: 'ch2', name: '第二单元 良知与悲悯', sections: [
        { id: 's2-1', name: '2.1 窦娥冤', knowledgePoints: ['元杂剧','戏剧冲突'] },
        { id: 's2-2', name: '2.2 雷雨', knowledgePoints: ['话剧艺术','人物语言'] },
      ]},
      { id: 'ch3', name: '第三单元 探索与发现', sections: [
        { id: 's3-1', name: '3.1 青蒿素：人类征服疾病的一小步', knowledgePoints: ['科普文阅读','信息筛选'] },
      ]},
      { id: 'ch4', name: '第四单元 信息时代的语文', sections: [
        { id: 's4-1', name: '4.1 信息类文本阅读', knowledgePoints: ['信息整合','观点概括'] },
      ]},
      { id: 'ch5', name: '第五单元 抱负与使命', sections: [
        { id: 's5-1', name: '5.1 谏太宗十思疏 / 答司马谏议书', knowledgePoints: ['奏疏文体','书信文言'] },
      ]},
      { id: 'ch6', name: '第六单元 戏剧与小说', sections: [
        { id: 's6-1', name: '6.1 林教头风雪山神庙', knowledgePoints: ['小说情节','环境描写'] },
        { id: 's6-2', name: '6.2 装在套子里的人', knowledgePoints: ['讽刺手法','人物塑造'] },
      ]},
      { id: 'ch7', name: '第七单元 实用性阅读', sections: [
        { id: 's7-1', name: '7.1 说明文阅读', knowledgePoints: ['说明方法','说明顺序'] },
      ]},
      { id: 'ch8', name: '第八单元 逻辑与论述', sections: [
        { id: 's8-1', name: '8.1 议论文写作', knowledgePoints: ['论点提炼','论据选择','论证方法'] },
      ]},
    ],
  },
  {
    id: 'chi-rjb-xbxs', name: '人教版·选择性必修上册',
    chapters: [
      { id: 'ch1', name: '第一单元 中国革命传统作品', sections: [
        { id: 's1-1', name: '1.1 中国人民站起来了', knowledgePoints: ['演讲词','论证力量'] },
        { id: 's1-2', name: '1.2 长征胜利万岁', knowledgePoints: ['回忆录','纪实文学'] },
      ]},
      { id: 'ch2', name: '第二单元 先秦诸子', sections: [
        { id: 's2-1', name: '2.1 论语十二章', knowledgePoints: ['儒学核心','文言精读'] },
        { id: 's2-2', name: '2.2 大学之道', knowledgePoints: ['经典阐释','文言翻译'] },
      ]},
      { id: 'ch3', name: '第三单元 外国文学', sections: [
        { id: 's3-1', name: '3.1 大卫·科波菲尔', knowledgePoints: ['外国小说','叙事视角'] },
      ]},
      { id: 'ch4', name: '第四单元 逻辑与论证', sections: [
        { id: 's4-1', name: '4.1 逻辑的力量', knowledgePoints: ['逻辑推理','论证有效性'] },
      ]},
      { id: 'ch5', name: '第五单元 中华传统文化', sections: [
        { id: 's5-1', name: '5.1 无衣 / 春江花月夜', knowledgePoints: ['古诗词鉴赏','诗歌意境'] },
      ]},
    ],
  },
  {
    id: 'chi-rjb-xbxz', name: '人教版·选择性必修中册',
    chapters: [
      { id: 'ch1', name: '第一单元 中国现当代文学', sections: [
        { id: 's1-1', name: '1.1 荷塘月色', knowledgePoints: ['散文语言','写景抒情'] },
      ]},
      { id: 'ch2', name: '第二单元 外国文学研读', sections: [
        { id: 's2-1', name: '2.1 复活', knowledgePoints: ['外国长篇','心理描写'] },
      ]},
      { id: 'ch3', name: '第三单元 历史现场', sections: [
        { id: 's3-1', name: '3.1 苏武传', knowledgePoints: ['传记文言','史传文学'] },
        { id: 's3-2', name: '3.2 过秦论', knowledgePoints: ['史论','铺陈手法'] },
      ]},
      { id: 'ch4', name: '第四单元 诗文鉴赏', sections: [
        { id: 's4-1', name: '4.1 诗词鉴赏方法', knowledgePoints: ['鉴赏术语','表达技巧'] },
      ]},
    ],
  },
  {
    id: 'chi-rjb-xbxx', name: '人教版·选择性必修下册',
    chapters: [
      { id: 'ch1', name: '第一单元 古诗词文赋', sections: [
        { id: 's1-1', name: '1.1 离骚', knowledgePoints: ['楚辞','骚体诗'] },
        { id: 's1-2', name: '1.2 蜀道难 / 蜀相', knowledgePoints: ['李白诗歌','杜甫诗歌'] },
      ]},
      { id: 'ch2', name: '第二单元 现代文学', sections: [
        { id: 's2-1', name: '2.1 阿Q正传', knowledgePoints: ['鲁迅小说','国民性批判'] },
      ]},
      { id: 'ch3', name: '第三单元 经典研读', sections: [
        { id: 's3-1', name: '3.1 兰亭集序 / 归去来兮辞', knowledgePoints: ['序文','辞赋'] },
      ]},
      { id: 'ch4', name: '第四单元 语言文字运用', sections: [
        { id: 's4-1', name: '4.1 语言综合运用', knowledgePoints: ['语段补写','图文转换','语言得体'] },
      ]},
    ],
  },
];

// ─── 英语 (人教版) ─────────────────────────────────────────────
export const ENGLISH_TEXTBOOKS = [
  {
    id: 'eng-rjb-bx1', name: '人教版·必修第一册',
    chapters: [
      { id: 'ch1', name: 'Unit 1 Teenage Life', sections: [
        { id: 's1-1', name: 'Listening and Speaking', knowledgePoints: ['校园生活词汇','听力技巧'] },
        { id: 's1-2', name: 'Reading and Thinking', knowledgePoints: ['阅读理解','主旨大意'] },
        { id: 's1-3', name: 'Discovering Useful Structures', knowledgePoints: ['定语从句','名词性从句'] },
      ]},
      { id: 'ch2', name: 'Unit 2 Travelling Around', sections: [
        { id: 's2-1', name: 'Listening and Speaking', knowledgePoints: ['旅行词汇','计划表达'] },
        { id: 's2-2', name: 'Reading and Thinking', knowledgePoints: ['细节理解','推理判断'] },
        { id: 's2-3', name: 'Discovering Useful Structures', knowledgePoints: ['现在进行时','将来时态'] },
      ]},
      { id: 'ch3', name: 'Unit 3 Sports and Fitness', sections: [
        { id: 's3-1', name: 'Listening and Speaking', knowledgePoints: ['运动词汇','观点表达'] },
        { id: 's3-2', name: 'Reading and Thinking', knowledgePoints: ['词义猜测','文章结构'] },
        { id: 's3-3', name: 'Discovering Useful Structures', knowledgePoints: ['反意疑问句','附加疑问'] },
      ]},
      { id: 'ch4', name: 'Unit 4 Natural Disasters', sections: [
        { id: 's4-1', name: 'Listening and Speaking', knowledgePoints: ['灾害词汇','新闻听力'] },
        { id: 's4-2', name: 'Reading and Thinking', knowledgePoints: ['说明文阅读','信息提取'] },
        { id: 's4-3', name: 'Discovering Useful Structures', knowledgePoints: ['定语从句(关系副词)'] },
      ]},
      { id: 'ch5', name: 'Unit 5 Languages Around the World', sections: [
        { id: 's5-1', name: 'Listening and Speaking', knowledgePoints: ['语言文化词汇','议论听力'] },
        { id: 's5-2', name: 'Reading and Thinking', knowledgePoints: ['议论文阅读','作者观点'] },
        { id: 's5-3', name: 'Discovering Useful Structures', knowledgePoints: ['名词性从句(主语从句)'] },
      ]},
    ],
  },
  {
    id: 'eng-rjb-bx2', name: '人教版·必修第二册',
    chapters: [
      { id: 'ch1', name: 'Unit 1 Cultural Heritage', sections: [
        { id: 's1-1', name: 'Reading and Thinking', knowledgePoints: ['文化遗产词汇','阅读策略'] },
        { id: 's1-2', name: 'Discovering Useful Structures', knowledgePoints: ['非限制性定语从句'] },
      ]},
      { id: 'ch2', name: 'Unit 2 Wildlife Protection', sections: [
        { id: 's2-1', name: 'Reading and Thinking', knowledgePoints: ['环保词汇','议论文结构'] },
        { id: 's2-2', name: 'Discovering Useful Structures', knowledgePoints: ['现在完成时','被动语态'] },
      ]},
      { id: 'ch3', name: 'Unit 3 The Internet', sections: [
        { id: 's3-1', name: 'Reading and Thinking', knowledgePoints: ['网络词汇','说明文阅读'] },
        { id: 's3-2', name: 'Discovering Useful Structures', knowledgePoints: ['现在完成进行时'] },
      ]},
      { id: 'ch4', name: 'Unit 4 History and Traditions', sections: [
        { id: 's4-1', name: 'Reading and Thinking', knowledgePoints: ['历史文化词汇','记叙文阅读'] },
        { id: 's4-2', name: 'Discovering Useful Structures', knowledgePoints: ['过去分词作定语/表语'] },
      ]},
      { id: 'ch5', name: 'Unit 5 Music', sections: [
        { id: 's5-1', name: 'Reading and Thinking', knowledgePoints: ['音乐词汇','人物传记阅读'] },
        { id: 's5-2', name: 'Discovering Useful Structures', knowledgePoints: ['过去分词作状语/补语'] },
      ]},
    ],
  },
  {
    id: 'eng-rjb-bx3', name: '人教版·必修第三册',
    chapters: [
      { id: 'ch1', name: 'Unit 1 Festivals and Celebrations', sections: [
        { id: 's1-1', name: 'Reading and Thinking', knowledgePoints: ['节日词汇','文化理解'] },
        { id: 's1-2', name: 'Discovering Useful Structures', knowledgePoints: ['动名词','不定式'] },
      ]},
      { id: 'ch2', name: 'Unit 2 Morals and Virtues', sections: [
        { id: 's2-1', name: 'Reading and Thinking', knowledgePoints: ['道德词汇','议论文阅读'] },
        { id: 's2-2', name: 'Discovering Useful Structures', knowledgePoints: ['情态动词'] },
      ]},
      { id: 'ch3', name: 'Unit 3 Diverse Cultures', sections: [
        { id: 's3-1', name: 'Reading and Thinking', knowledgePoints: ['多元文化','描述性写作'] },
        { id: 's3-2', name: 'Discovering Useful Structures', knowledgePoints: ['倒装句'] },
      ]},
      { id: 'ch4', name: 'Unit 4 Space Exploration', sections: [
        { id: 's4-1', name: 'Reading and Thinking', knowledgePoints: ['科技词汇','科普阅读'] },
        { id: 's4-2', name: 'Discovering Useful Structures', knowledgePoints: ['主谓一致'] },
      ]},
      { id: 'ch5', name: 'Unit 5 The Value of Money', sections: [
        { id: 's5-1', name: 'Reading and Thinking', knowledgePoints: ['文学阅读','戏剧语言'] },
        { id: 's5-2', name: 'Discovering Useful Structures', knowledgePoints: ['虚拟语气'] },
      ]},
    ],
  },
  {
    id: 'eng-rjb-xbx1', name: '人教版·选择性必修第一册',
    chapters: [
      { id: 'ch1', name: 'Unit 1 People of Achievement', sections: [
        { id: 's1-1', name: 'Reading and Thinking', knowledgePoints: ['人物传记','成就描述'] },
        { id: 's1-2', name: 'Discovering Useful Structures', knowledgePoints: ['定语从句(进阶)'] },
      ]},
      { id: 'ch2', name: 'Unit 2 Looking into the Future', sections: [
        { id: 's2-1', name: 'Reading and Thinking', knowledgePoints: ['科技预测','议论文写作'] },
        { id: 's2-2', name: 'Discovering Useful Structures', knowledgePoints: ['将来进行时','将来完成时'] },
      ]},
      { id: 'ch3', name: 'Unit 3 Fascinating Parks', sections: [
        { id: 's3-1', name: 'Reading and Thinking', knowledgePoints: ['地理描述','说明文写作'] },
        { id: 's3-2', name: 'Discovering Useful Structures', knowledgePoints: ['强调句','省略句'] },
      ]},
      { id: 'ch4', name: 'Unit 4 Body Language', sections: [
        { id: 's4-1', name: 'Reading and Thinking', knowledgePoints: ['肢体语言','跨文化交际'] },
        { id: 's4-2', name: 'Discovering Useful Structures', knowledgePoints: ['动词-ing形式(主语/宾语)'] },
      ]},
      { id: 'ch5', name: 'Unit 5 Working the Land', sections: [
        { id: 's5-1', name: 'Reading and Thinking', knowledgePoints: ['农业词汇','人物描写'] },
        { id: 's5-2', name: 'Discovering Useful Structures', knowledgePoints: ['动词-ing形式(定语/状语)'] },
      ]},
    ],
  },
  {
    id: 'eng-rjb-xbx2', name: '人教版·选择性必修第二册',
    chapters: [
      { id: 'ch1', name: 'Unit 1 Science and Scientists', sections: [
        { id: 's1-1', name: 'Reading and Thinking', knowledgePoints: ['科学素养','实验报告'] },
        { id: 's1-2', name: 'Discovering Useful Structures', knowledgePoints: ['名词性从句(进阶)'] },
      ]},
      { id: 'ch2', name: 'Unit 2 Bridging Cultures', sections: [
        { id: 's2-1', name: 'Reading and Thinking', knowledgePoints: ['文化交流','留学生活'] },
        { id: 's2-2', name: 'Discovering Useful Structures', knowledgePoints: ['过去分词(进阶)'] },
      ]},
      { id: 'ch3', name: 'Unit 3 Food and Culture', sections: [
        { id: 's3-1', name: 'Reading and Thinking', knowledgePoints: ['饮食文化','说明文阅读'] },
        { id: 's3-2', name: 'Discovering Useful Structures', knowledgePoints: ['同位语从句'] },
      ]},
      { id: 'ch4', name: 'Unit 4 Journey Across a Vast Land', sections: [
        { id: 's4-1', name: 'Reading and Thinking', knowledgePoints: ['旅行叙事','地理描写'] },
        { id: 's4-2', name: 'Discovering Useful Structures', knowledgePoints: ['独立主格结构'] },
      ]},
      { id: 'ch5', name: 'Unit 5 First Aid', sections: [
        { id: 's5-1', name: 'Reading and Thinking', knowledgePoints: ['急救知识','说明文写作'] },
        { id: 's5-2', name: 'Discovering Useful Structures', knowledgePoints: ['条件句(真实/虚拟)'] },
      ]},
    ],
  },
  {
    id: 'eng-rjb-xbx3', name: '人教版·选择性必修第三册',
    chapters: [
      { id: 'ch1', name: 'Unit 1 Art', sections: [
        { id: 's1-1', name: 'Reading and Thinking', knowledgePoints: ['艺术词汇','描述性阅读'] },
        { id: 's1-2', name: 'Discovering Useful Structures', knowledgePoints: ['非谓语动词综合'] },
      ]},
      { id: 'ch2', name: 'Unit 2 Healthy Lifestyle', sections: [
        { id: 's2-1', name: 'Reading and Thinking', knowledgePoints: ['健康词汇','议论文阅读'] },
        { id: 's2-2', name: 'Discovering Useful Structures', knowledgePoints: ['主语从句(进阶)'] },
      ]},
      { id: 'ch3', name: 'Unit 3 Environmental Protection', sections: [
        { id: 's3-1', name: 'Reading and Thinking', knowledgePoints: ['环保词汇','报告写作'] },
        { id: 's3-2', name: 'Discovering Useful Structures', knowledgePoints: ['让步状语从句'] },
      ]},
      { id: 'ch4', name: 'Unit 4 Adversity and Courage', sections: [
        { id: 's4-1', name: 'Reading and Thinking', knowledgePoints: ['冒险叙事','人物品质'] },
        { id: 's4-2', name: 'Discovering Useful Structures', knowledgePoints: ['方式/目的状语从句'] },
      ]},
      { id: 'ch5', name: 'Unit 5 Poems', sections: [
        { id: 's5-1', name: 'Reading and Thinking', knowledgePoints: ['诗歌鉴赏','英诗格律'] },
        { id: 's5-2', name: 'Discovering Useful Structures', knowledgePoints: ['倒装(进阶)'] },
      ]},
    ],
  },
  {
    id: 'eng-rjb-xbx4', name: '人教版·选择性必修第四册',
    chapters: [
      { id: 'ch1', name: 'Unit 1 Science Fiction', sections: [
        { id: 's1-1', name: 'Reading and Thinking', knowledgePoints: ['科幻文学','想象力写作'] },
        { id: 's1-2', name: 'Discovering Useful Structures', knowledgePoints: ['名词性从句综合'] },
      ]},
      { id: 'ch2', name: 'Unit 2 Iconic Attractions', sections: [
        { id: 's2-1', name: 'Reading and Thinking', knowledgePoints: ['地标描述','旅游写作'] },
        { id: 's2-2', name: 'Discovering Useful Structures', knowledgePoints: ['非谓语综合运用'] },
      ]},
      { id: 'ch3', name: 'Unit 3 Sea Exploration', sections: [
        { id: 's3-1', name: 'Reading and Thinking', knowledgePoints: ['海洋探索','科普写作'] },
        { id: 's3-2', name: 'Discovering Useful Structures', knowledgePoints: ['特殊句式综合'] },
      ]},
      { id: 'ch4', name: 'Unit 4 Sharing', sections: [
        { id: 's4-1', name: 'Reading and Thinking', knowledgePoints: ['志愿者活动','应用文写作'] },
        { id: 's4-2', name: 'Discovering Useful Structures', knowledgePoints: ['长难句分析'] },
      ]},
      { id: 'ch5', name: 'Unit 5 Launching Your Career', sections: [
        { id: 's5-1', name: 'Reading and Thinking', knowledgePoints: ['职业规划','议论文写作'] },
        { id: 's5-2', name: 'Discovering Useful Structures', knowledgePoints: ['语法综合运用'] },
      ]},
    ],
  },
];

// ─── 物理 (人教版) ─────────────────────────────────────────────
export const PHYSICS_TEXTBOOKS = [
  {
    id: 'phy-rjb-bx1', name: '人教版·必修第一册',
    chapters: [
      { id: 'ch1', name: '第一章 运动的描述', sections: [
        { id: 's1-1', name: '1.1 质点 参考系和坐标系', knowledgePoints: ['质点模型','参考系选择','坐标系建立'] },
        { id: 's1-2', name: '1.2 时间 位移', knowledgePoints: ['时间与时刻','位移与路程'] },
        { id: 's1-3', name: '1.3 位置变化快慢——速度', knowledgePoints: ['平均速度','瞬时速度','速率'] },
        { id: 's1-4', name: '1.4 速度变化快慢——加速度', knowledgePoints: ['加速度概念','加速度计算'] },
      ]},
      { id: 'ch2', name: '第二章 匀变速直线运动', sections: [
        { id: 's2-1', name: '2.1 实验：探究小车速度随时间变化', knowledgePoints: ['打点计时器','数据处理'] },
        { id: 's2-2', name: '2.2 匀变速直线运动的速度与时间', knowledgePoints: ['速度公式','v-t图象'] },
        { id: 's2-3', name: '2.3 匀变速直线运动的位移与时间', knowledgePoints: ['位移公式','x-t图象'] },
        { id: 's2-4', name: '2.4 自由落体运动', knowledgePoints: ['自由落体','重力加速度'] },
      ]},
      { id: 'ch3', name: '第三章 相互作用——力', sections: [
        { id: 's3-1', name: '3.1 重力与弹力', knowledgePoints: ['重力','弹力','胡克定律'] },
        { id: 's3-2', name: '3.2 摩擦力', knowledgePoints: ['静摩擦力','滑动摩擦力','摩擦系数'] },
        { id: 's3-3', name: '3.3 牛顿第三定律', knowledgePoints: ['作用力与反作用力','牛顿第三定律'] },
        { id: 's3-4', name: '3.4 力的合成与分解', knowledgePoints: ['合力','分力','平行四边形法则'] },
      ]},
      { id: 'ch4', name: '第四章 牛顿运动定律', sections: [
        { id: 's4-1', name: '4.1 牛顿第一定律', knowledgePoints: ['惯性','伽利略理想实验'] },
        { id: 's4-2', name: '4.2 牛顿第二定律', knowledgePoints: ['F=ma','力的独立性'] },
        { id: 's4-3', name: '4.3 牛顿运动定律的应用', knowledgePoints: ['受力分析','动力学问题','超重与失重'] },
      ]},
    ],
  },
  {
    id: 'phy-rjb-bx2', name: '人教版·必修第二册',
    chapters: [
      { id: 'ch5', name: '第五章 曲线运动', sections: [
        { id: 's5-1', name: '5.1 曲线运动', knowledgePoints: ['曲线运动条件','速度方向'] },
        { id: 's5-2', name: '5.2 运动的合成与分解', knowledgePoints: ['运动合成','运动分解'] },
        { id: 's5-3', name: '5.3 实验：探究平抛运动', knowledgePoints: ['平抛运动','轨迹描绘'] },
        { id: 's5-4', name: '5.4 抛体运动', knowledgePoints: ['平抛公式','斜抛运动'] },
      ]},
      { id: 'ch6', name: '第六章 圆周运动', sections: [
        { id: 's6-1', name: '6.1 圆周运动', knowledgePoints: ['线速度','角速度','周期'] },
        { id: 's6-2', name: '6.2 向心力', knowledgePoints: ['向心力','向心加速度'] },
        { id: 's6-3', name: '6.3 实际中的圆周运动', knowledgePoints: ['竖直面圆周','离心运动'] },
      ]},
      { id: 'ch7', name: '第七章 万有引力与宇宙航行', sections: [
        { id: 's7-1', name: '7.1 行星的运动', knowledgePoints: ['开普勒三定律'] },
        { id: 's7-2', name: '7.2 万有引力定律', knowledgePoints: ['万有引力','引力常量'] },
        { id: 's7-3', name: '7.3 万有引力理论的成就', knowledgePoints: ['天体质量计算','发现未知天体'] },
        { id: 's7-4', name: '7.4 宇宙航行', knowledgePoints: ['宇宙速度','卫星运动','同步卫星'] },
      ]},
      { id: 'ch8', name: '第八章 机械能守恒', sections: [
        { id: 's8-1', name: '8.1 功与功率', knowledgePoints: ['功的计算','功率'] },
        { id: 's8-2', name: '8.2 重力势能', knowledgePoints: ['重力势能','弹性势能'] },
        { id: 's8-3', name: '8.3 动能与动能定理', knowledgePoints: ['动能','动能定理'] },
        { id: 's8-4', name: '8.4 机械能守恒定律', knowledgePoints: ['机械能','守恒条件','能量转化'] },
      ]},
    ],
  },
  {
    id: 'phy-rjb-bx3', name: '人教版·必修第三册',
    chapters: [
      { id: 'ch9', name: '第九章 静电场', sections: [
        { id: 's9-1', name: '9.1 电荷及其守恒定律', knowledgePoints: ['电荷','库仑定律'] },
        { id: 's9-2', name: '9.2 电场强度', knowledgePoints: ['电场强度','电场线','点电荷电场'] },
        { id: 's9-3', name: '9.3 电势与电势差', knowledgePoints: ['电势','电势差','等势面'] },
        { id: 's9-4', name: '9.4 电容器', knowledgePoints: ['电容','平行板电容器'] },
      ]},
      { id: 'ch10', name: '第十章 恒定电流', sections: [
        { id: 's10-1', name: '10.1 电源与电流', knowledgePoints: ['电流','电动势'] },
        { id: 's10-2', name: '10.2 欧姆定律', knowledgePoints: ['欧姆定律','电阻','伏安特性'] },
        { id: 's10-3', name: '10.3 串联与并联', knowledgePoints: ['串联电路','并联电路'] },
        { id: 's10-4', name: '10.4 电功与电功率', knowledgePoints: ['电功','电功率','焦耳定律'] },
      ]},
      { id: 'ch11', name: '第十一章 电磁感应', sections: [
        { id: 's11-1', name: '11.1 磁场与磁感线', knowledgePoints: ['磁场','磁感线','安培定则'] },
        { id: 's11-2', name: '11.2 磁感应强度', knowledgePoints: ['磁感应强度','磁通量'] },
        { id: 's11-3', name: '11.3 电磁感应现象', knowledgePoints: ['法拉第电磁感应定律','楞次定律'] },
      ]},
    ],
  },
  {
    id: 'phy-rjb-xbx1', name: '人教版·选择性必修第一册',
    chapters: [
      { id: 'ch1', name: '第一章 动量', sections: [
        { id: 's1-1', name: '1.1 动量与动量定理', knowledgePoints: ['动量','动量定理','冲量'] },
        { id: 's1-2', name: '1.2 动量守恒定律', knowledgePoints: ['动量守恒','碰撞','反冲'] },
        { id: 's1-3', name: '1.3 实验：验证动量守恒', knowledgePoints: ['碰撞实验','数据验证'] },
      ]},
      { id: 'ch2', name: '第二章 机械振动', sections: [
        { id: 's2-1', name: '2.1 简谐运动', knowledgePoints: ['简谐运动','回复力','振幅周期频率'] },
        { id: 's2-2', name: '2.2 单摆', knowledgePoints: ['单摆周期','等时性'] },
        { id: 's2-3', name: '2.3 受迫振动与共振', knowledgePoints: ['受迫振动','共振'] },
      ]},
      { id: 'ch3', name: '第三章 机械波', sections: [
        { id: 's3-1', name: '3.1 波的形成与传播', knowledgePoints: ['横波纵波','波长波速频率'] },
        { id: 's3-2', name: '3.2 波的干涉与衍射', knowledgePoints: ['波的叠加','干涉','衍射'] },
        { id: 's3-3', name: '3.3 多普勒效应', knowledgePoints: ['多普勒效应'] },
      ]},
      { id: 'ch4', name: '第四章 光', sections: [
        { id: 's4-1', name: '4.1 光的折射', knowledgePoints: ['折射定律','全反射'] },
        { id: 's4-2', name: '4.2 光的干涉', knowledgePoints: ['双缝干涉','薄膜干涉'] },
        { id: 's4-3', name: '4.3 光的衍射与偏振', knowledgePoints: ['单缝衍射','偏振'] },
      ]},
    ],
  },
  {
    id: 'phy-rjb-xbx2', name: '人教版·选择性必修第二册',
    chapters: [
      { id: 'ch1', name: '第一章 安培力与洛伦兹力', sections: [
        { id: 's1-1', name: '1.1 安培力', knowledgePoints: ['安培力','左手定则'] },
        { id: 's1-2', name: '1.2 洛伦兹力', knowledgePoints: ['洛伦兹力','带电粒子偏转'] },
        { id: 's1-3', name: '1.3 带电粒子在磁场中的运动', knowledgePoints: ['圆周运动','质谱仪','回旋加速器'] },
      ]},
      { id: 'ch2', name: '第二章 电磁感应', sections: [
        { id: 's2-1', name: '2.1 感应电流的产生', knowledgePoints: ['磁通量变化','感应条件'] },
        { id: 's2-2', name: '2.2 法拉第电磁感应定律', knowledgePoints: ['感应电动势','法拉第定律'] },
        { id: 's2-3', name: '2.3 涡流与电磁阻尼', knowledgePoints: ['涡流','电磁驱动'] },
      ]},
      { id: 'ch3', name: '第三章 交变电流', sections: [
        { id: 's3-1', name: '3.1 交变电流的产生', knowledgePoints: ['交流发电机','交流表达式'] },
        { id: 's3-2', name: '3.2 电感与电容', knowledgePoints: ['感抗','容抗'] },
        { id: 's3-3', name: '3.3 变压器与远距离输电', knowledgePoints: ['变压器','输电损耗'] },
      ]},
    ],
  },
  {
    id: 'phy-rjb-xbx3', name: '人教版·选择性必修第三册',
    chapters: [
      { id: 'ch1', name: '第一章 分子运动与热力学', sections: [
        { id: 's1-1', name: '1.1 分子运动论', knowledgePoints: ['分子动理论','布朗运动'] },
        { id: 's1-2', name: '1.2 内能', knowledgePoints: ['内能','温度与内能'] },
        { id: 's1-3', name: '1.3 热力学定律', knowledgePoints: ['热力学第一定律','热力学第二定律','熵'] },
      ]},
      { id: 'ch2', name: '第二章 固体液体和气体', sections: [
        { id: 's2-1', name: '2.1 固体', knowledgePoints: ['晶体','非晶体'] },
        { id: 's2-2', name: '2.2 液体', knowledgePoints: ['表面张力','毛细现象'] },
        { id: 's2-3', name: '2.3 气体', knowledgePoints: ['气体实验定律','理想气体状态方程'] },
      ]},
      { id: 'ch3', name: '第三章 原子与原子核', sections: [
        { id: 's3-1', name: '3.1 原子结构', knowledgePoints: ['原子模型','能级跃迁'] },
        { id: 's3-2', name: '3.2 原子核', knowledgePoints: ['核反应','核能','半衰期'] },
        { id: 's3-3', name: '3.3 核能与核技术', knowledgePoints: ['裂变','聚变','核能应用'] },
      ]},
    ],
  },
];

// ─── 化学 (人教版) ─────────────────────────────────────────────
export const CHEMISTRY_TEXTBOOKS = [
  {
    id: 'chem-rjb-bx1', name: '人教版·必修第一册',
    chapters: [
      { id: 'ch1', name: '第一章 物质及其变化', sections: [
        { id: 's1-1', name: '1.1 物质的分类及转化', knowledgePoints: ['物质分类','分散系','胶体'] },
        { id: 's1-2', name: '1.2 离子反应', knowledgePoints: ['电解质','离子方程式','离子共存'] },
        { id: 's1-3', name: '1.3 氧化还原反应', knowledgePoints: ['氧化剂与还原剂','氧化还原配平','电子转移'] },
      ]},
      { id: 'ch2', name: '第二章 海水中的重要元素——钠和氯', sections: [
        { id: 's2-1', name: '2.1 钠及其化合物', knowledgePoints: ['钠的性质','氧化钠与过氧化钠','碳酸钠与碳酸氢钠'] },
        { id: 's2-2', name: '2.2 氯及其化合物', knowledgePoints: ['氯气性质','次氯酸','漂白粉'] },
        { id: 's2-3', name: '2.3 物质的量', knowledgePoints: ['摩尔','摩尔质量','气体摩尔体积'] },
      ]},
      { id: 'ch3', name: '第三章 铁 金属材料', sections: [
        { id: 's3-1', name: '3.1 铁及其化合物', knowledgePoints: ['铁的化学性质','铁的氧化物','Fe²⁺与Fe³⁺转化'] },
        { id: 's3-2', name: '3.2 金属材料', knowledgePoints: ['合金','金属腐蚀与防护'] },
      ]},
      { id: 'ch4', name: '第四章 物质结构 元素周期律', sections: [
        { id: 's4-1', name: '4.1 原子结构与元素周期表', knowledgePoints: ['原子结构','元素周期表','核素'] },
        { id: 's4-2', name: '4.2 元素周期律', knowledgePoints: ['原子半径','化合价','金属性非金属性'] },
        { id: 's4-3', name: '4.3 化学键', knowledgePoints: ['离子键','共价键','化学键与物质性质'] },
      ]},
    ],
  },
  {
    id: 'chem-rjb-bx2', name: '人教版·必修第二册',
    chapters: [
      { id: 'ch5', name: '第五章 化学反应与能量', sections: [
        { id: 's5-1', name: '5.1 化学反应与能量变化', knowledgePoints: ['放热反应','吸热反应','热化学方程式'] },
        { id: 's5-2', name: '5.2 化学反应的速率与限度', knowledgePoints: ['反应速率','影响因素','化学平衡'] },
      ]},
      { id: 'ch6', name: '第六章 化学反应与能量（续）', sections: [
        { id: 's6-1', name: '6.1 化学能与电能', knowledgePoints: ['原电池','化学电源'] },
        { id: 's6-2', name: '6.2 化学能与热能', knowledgePoints: ['燃烧热','中和热'] },
      ]},
      { id: 'ch7', name: '第七章 有机化合物', sections: [
        { id: 's7-1', name: '7.1 认识有机化合物', knowledgePoints: ['有机物概念','碳原子成键','同分异构体'] },
        { id: 's7-2', name: '7.2 乙烯与有机高分子', knowledgePoints: ['乙烯','加聚反应'] },
        { id: 's7-3', name: '7.3 乙醇与乙酸', knowledgePoints: ['乙醇','乙酸','酯化反应'] },
      ]},
      { id: 'ch8', name: '第八章 化学与可持续发展', sections: [
        { id: 's8-1', name: '8.1 自然资源的开发利用', knowledgePoints: ['金属冶炼','海水资源'] },
        { id: 's8-2', name: '8.2 化学与环境保护', knowledgePoints: ['酸雨','水污染','绿色化学'] },
      ]},
    ],
  },
  {
    id: 'chem-rjb-xbx1', name: '人教版·选择性必修第一册',
    chapters: [
      { id: 'ch1', name: '第一章 化学反应的热效应', sections: [
        { id: 's1-1', name: '1.1 反应热', knowledgePoints: ['反应热','焓变','热化学方程式'] },
        { id: 's1-2', name: '1.2 反应热的计算', knowledgePoints: ['盖斯定律','键能与反应热'] },
      ]},
      { id: 'ch2', name: '第二章 化学反应速率与化学平衡', sections: [
        { id: 's2-1', name: '2.1 化学反应速率', knowledgePoints: ['速率概念','速率方程','活化能'] },
        { id: 's2-2', name: '2.2 化学平衡', knowledgePoints: ['平衡常数','平衡移动','勒夏特列原理'] },
        { id: 's2-3', name: '2.3 化学平衡的移动', knowledgePoints: ['浓度影响','温度影响','压强影响'] },
      ]},
      { id: 'ch3', name: '第三章 水溶液中的离子反应与平衡', sections: [
        { id: 's3-1', name: '3.1 电离平衡', knowledgePoints: ['弱电解质电离','电离常数'] },
        { id: 's3-2', name: '3.2 水的电离与溶液的pH', knowledgePoints: ['水的电离','pH计算','酸碱指示剂'] },
        { id: 's3-3', name: '3.3 盐类的水解', knowledgePoints: ['水解原理','水解应用'] },
        { id: 's3-4', name: '3.4 沉淀溶解平衡', knowledgePoints: ['溶度积','沉淀转化'] },
      ]},
      { id: 'ch4', name: '第四章 化学反应与电能', sections: [
        { id: 's4-1', name: '4.1 原电池', knowledgePoints: ['原电池原理','电极反应'] },
        { id: 's4-2', name: '4.2 电解池', knowledgePoints: ['电解原理','电解应用'] },
        { id: 's4-3', name: '4.3 金属的腐蚀与防护', knowledgePoints: ['电化学腐蚀','阴极保护'] },
      ]},
    ],
  },
  {
    id: 'chem-rjb-xbx2', name: '人教版·选择性必修第二册',
    chapters: [
      { id: 'ch1', name: '第一章 原子结构与性质', sections: [
        { id: 's1-1', name: '1.1 原子结构', knowledgePoints: ['电子排布','构造原理','能级交错'] },
        { id: 's1-2', name: '1.2 原子结构与元素性质', knowledgePoints: ['电离能','电负性'] },
      ]},
      { id: 'ch2', name: '第二章 分子结构与性质', sections: [
        { id: 's2-1', name: '2.1 共价键', knowledgePoints: ['σ键与π键','键参数','杂化轨道'] },
        { id: 's2-2', name: '2.2 分子的立体构型', knowledgePoints: ['VSEPR模型','分子极性'] },
        { id: 's2-3', name: '2.3 分子间作用力', knowledgePoints: ['范德华力','氢键'] },
      ]},
      { id: 'ch3', name: '第三章 晶体结构与性质', sections: [
        { id: 's3-1', name: '3.1 晶体与非晶体', knowledgePoints: ['晶体特征','晶胞'] },
        { id: 's3-2', name: '3.2 分子晶体与原子晶体', knowledgePoints: ['分子晶体','原子晶体'] },
        { id: 's3-3', name: '3.3 金属晶体与离子晶体', knowledgePoints: ['金属键','离子晶体'] },
      ]},
    ],
  },
  {
    id: 'chem-rjb-xbx3', name: '人教版·选择性必修第三册',
    chapters: [
      { id: 'ch1', name: '第一章 有机化合物的结构与分类', sections: [
        { id: 's1-1', name: '1.1 有机化合物的分类', knowledgePoints: ['官能团','有机物命名'] },
        { id: 's1-2', name: '1.2 有机化合物的结构', knowledgePoints: ['碳链','碳环','同分异构'] },
      ]},
      { id: 'ch2', name: '第二章 烃', sections: [
        { id: 's2-1', name: '2.1 烷烃与烯烃', knowledgePoints: ['烷烃性质','烯烃性质','加成反应'] },
        { id: 's2-2', name: '2.2 炔烃与芳香烃', knowledgePoints: ['炔烃','苯','取代反应'] },
      ]},
      { id: 'ch3', name: '第三章 烃的衍生物', sections: [
        { id: 's3-1', name: '3.1 卤代烃', knowledgePoints: ['卤代烃性质','取代与消除'] },
        { id: 's3-2', name: '3.2 醇与酚', knowledgePoints: ['醇的性质','酚的性质'] },
        { id: 's3-3', name: '3.3 醛与酮', knowledgePoints: ['醛的性质','银镜反应'] },
        { id: 's3-4', name: '3.4 羧酸与酯', knowledgePoints: ['羧酸性质','酯化反应','水解'] },
      ]},
      { id: 'ch4', name: '第四章 生物大分子', sections: [
        { id: 's4-1', name: '4.1 糖类', knowledgePoints: ['单糖','二糖','多糖'] },
        { id: 's4-2', name: '4.2 蛋白质', knowledgePoints: ['氨基酸','肽键','蛋白质性质'] },
        { id: 's4-3', name: '4.3 核酸', knowledgePoints: ['DNA','RNA'] },
      ]},
    ],
  },
];

// ─── 生物 (人教版) ─────────────────────────────────────────────
export const BIOLOGY_TEXTBOOKS = [
  {
    id: 'bio-rjb-bx1', name: '人教版·必修第一册',
    chapters: [
      { id: 'ch1', name: '第一章 细胞的分子组成', sections: [
        { id: 's1-1', name: '1.1 细胞中的元素和化合物', knowledgePoints: ['组成细胞的元素','无机物'] },
        { id: 's1-2', name: '1.2 细胞中的蛋白质', knowledgePoints: ['氨基酸','蛋白质结构','蛋白质功能'] },
        { id: 's1-3', name: '1.3 细胞中的核酸', knowledgePoints: ['DNA','RNA','核酸功能'] },
        { id: 's1-4', name: '1.4 细胞中的糖类和脂质', knowledgePoints: ['糖类分类','脂质分类'] },
      ]},
      { id: 'ch2', name: '第二章 细胞的结构', sections: [
        { id: 's2-1', name: '2.1 细胞膜', knowledgePoints: ['流动镶嵌模型','细胞膜功能'] },
        { id: 's2-2', name: '2.2 细胞器', knowledgePoints: ['线粒体','叶绿体','内质网','核糖体','高尔基体'] },
        { id: 's2-3', name: '2.3 细胞核', knowledgePoints: ['核膜','染色质','核仁'] },
        { id: 's2-4', name: '2.4 细胞骨架', knowledgePoints: ['微管','微丝'] },
      ]},
      { id: 'ch3', name: '第三章 细胞的物质运输', sections: [
        { id: 's3-1', name: '3.1 被动运输', knowledgePoints: ['自由扩散','协助扩散','渗透作用'] },
        { id: 's3-2', name: '3.2 主动运输与胞吞胞吐', knowledgePoints: ['主动运输','胞吞','胞吐'] },
      ]},
      { id: 'ch4', name: '第四章 细胞的能量供应', sections: [
        { id: 's4-1', name: '4.1 酶', knowledgePoints: ['酶的本质','酶的特性','影响酶活性因素'] },
        { id: 's4-2', name: '4.2 ATP', knowledgePoints: ['ATP结构','ATP与ADP转化'] },
        { id: 's4-3', name: '4.3 细胞呼吸', knowledgePoints: ['有氧呼吸','无氧呼吸','呼吸作用应用'] },
        { id: 's4-4', name: '4.4 光合作用', knowledgePoints: ['光反应','暗反应','影响光合因素'] },
      ]},
      { id: 'ch5', name: '第五章 细胞的生命历程', sections: [
        { id: 's5-1', name: '5.1 细胞增殖', knowledgePoints: ['有丝分裂','细胞周期','减数分裂'] },
        { id: 's5-2', name: '5.2 细胞分化', knowledgePoints: ['分化实质','全能性','干细胞'] },
        { id: 's5-3', name: '5.3 细胞的衰老与凋亡', knowledgePoints: ['衰老特征','凋亡意义'] },
      ]},
    ],
  },
  {
    id: 'bio-rjb-bx2', name: '人教版·必修第二册',
    chapters: [
      { id: 'ch1', name: '第一章 遗传因子的发现', sections: [
        { id: 's1-1', name: '1.1 孟德尔的豌豆杂交实验（一）', knowledgePoints: ['分离定律','显隐性','基因型与表现型'] },
        { id: 's1-2', name: '1.2 孟德尔的豌豆杂交实验（二）', knowledgePoints: ['自由组合定律','9:3:3:1'] },
      ]},
      { id: 'ch2', name: '第二章 基因与染色体的关系', sections: [
        { id: 's2-1', name: '2.1 减数分裂与受精作用', knowledgePoints: ['减数分裂过程','配子形成'] },
        { id: 's2-2', name: '2.2 基因在染色体上', knowledgePoints: ['基因与染色体关系','摩尔根实验'] },
        { id: 's2-3', name: '2.3 伴性遗传', knowledgePoints: ['X染色体遗传','色盲遗传'] },
      ]},
      { id: 'ch3', name: '第三章 基因的本质', sections: [
        { id: 's3-1', name: '3.1 DNA是主要的遗传物质', knowledgePoints: ['肺炎双球菌实验','噬菌体实验'] },
        { id: 's3-2', name: '3.2 DNA的结构', knowledgePoints: ['双螺旋结构','碱基互补配对'] },
        { id: 's3-3', name: '3.3 DNA的复制', knowledgePoints: ['半保留复制','DNA聚合酶'] },
      ]},
      { id: 'ch4', name: '第四章 基因的表达', sections: [
        { id: 's4-1', name: '4.1 转录', knowledgePoints: ['mRNA','转录过程'] },
        { id: 's4-2', name: '4.2 翻译', knowledgePoints: ['tRNA','核糖体','翻译过程'] },
        { id: 's4-3', name: '4.3 基因突变与基因重组', knowledgePoints: ['基因突变','基因重组'] },
      ]},
      { id: 'ch5', name: '第五章 生物的进化', sections: [
        { id: 's5-1', name: '5.1 自然选择与适应', knowledgePoints: ['达尔文进化论','自然选择'] },
        { id: 's5-2', name: '5.2 种群基因组成的变化', knowledgePoints: ['基因频率','基因库','遗传平衡'] },
        { id: 's5-3', name: '5.3 物种形成', knowledgePoints: ['隔离','物种形成'] },
      ]},
    ],
  },
  {
    id: 'bio-rjb-bx3', name: '人教版·必修第三册',
    chapters: [
      { id: 'ch1', name: '第一章 人体的内环境与稳态', sections: [
        { id: 's1-1', name: '1.1 细胞生活的环境', knowledgePoints: ['内环境','组织液','血浆'] },
        { id: 's1-2', name: '1.2 内环境的稳态', knowledgePoints: ['稳态概念','调节机制'] },
      ]},
      { id: 'ch2', name: '第二章 神经调节', sections: [
        { id: 's2-1', name: '2.1 神经调节的结构基础', knowledgePoints: ['反射弧','神经元'] },
        { id: 's2-2', name: '2.2 神经冲动的产生与传导', knowledgePoints: ['静息电位','动作电位','突触传递'] },
        { id: 's2-3', name: '2.3 神经系统的分级调节', knowledgePoints: ['大脑皮层','脊髓'] },
      ]},
      { id: 'ch3', name: '第三章 体液调节', sections: [
        { id: 's3-1', name: '3.1 激素调节', knowledgePoints: ['激素本质','激素调节特点'] },
        { id: 's3-2', name: '3.2 血糖调节', knowledgePoints: ['胰岛素','胰高血糖素','血糖平衡'] },
        { id: 's3-3', name: '3.3 甲状腺激素调节', knowledgePoints: ['反馈调节','甲状腺激素'] },
      ]},
      { id: 'ch4', name: '第四章 免疫调节', sections: [
        { id: 's4-1', name: '4.1 免疫系统的组成', knowledgePoints: ['免疫器官','免疫细胞','免疫活性物质'] },
        { id: 's4-2', name: '4.2 特异性免疫', knowledgePoints: ['体液免疫','细胞免疫'] },
        { id: 's4-3', name: '4.3 免疫失调', knowledgePoints: ['过敏反应','自身免疫病','免疫缺陷'] },
      ]},
      { id: 'ch5', name: '第五章 植物生命活动的调节', sections: [
        { id: 's5-1', name: '5.1 植物激素', knowledgePoints: ['生长素','赤霉素','脱落酸'] },
        { id: 's5-2', name: '5.2 植物生长调节剂', knowledgePoints: ['生长素应用','乙烯应用'] },
      ]},
    ],
  },
  {
    id: 'bio-rjb-xbx1', name: '人教版·选择性必修第一册',
    chapters: [
      { id: 'ch1', name: '第一章 内环境稳态', sections: [
        { id: 's1-1', name: '1.1 内环境的理化性质', knowledgePoints: ['渗透压','酸碱度','温度'] },
        { id: 's1-2', name: '1.2 稳态的调节机制', knowledgePoints: ['神经-体液-免疫调节'] },
      ]},
      { id: 'ch2', name: '第二章 神经调节（续）', sections: [
        { id: 's2-1', name: '2.1 兴奋的传导与传递', knowledgePoints: ['突触结构','神经递质'] },
        { id: 's2-2', name: '2.2 高级神经中枢', knowledgePoints: ['语言中枢','运动中枢'] },
      ]},
      { id: 'ch3', name: '第三章 体液调节（续）', sections: [
        { id: 's3-1', name: '3.1 激素调节的机制', knowledgePoints: ['受体','信号转导'] },
        { id: 's3-2', name: '3.2 神经调节与体液调节的关系', knowledgePoints: ['协调配合'] },
      ]},
      { id: 'ch4', name: '第四章 种群与群落', sections: [
        { id: 's4-1', name: '4.1 种群的特征', knowledgePoints: ['种群密度','出生率死亡率','年龄结构'] },
        { id: 's4-2', name: '4.2 种群数量变化', knowledgePoints: ['J型增长','S型增长','K值'] },
        { id: 's4-3', name: '4.3 群落的结构', knowledgePoints: ['群落组成','种间关系','群落演替'] },
      ]},
    ],
  },
  {
    id: 'bio-rjb-xbx2', name: '人教版·选择性必修第二册',
    chapters: [
      { id: 'ch1', name: '第一章 生态系统', sections: [
        { id: 's1-1', name: '1.1 生态系统的结构', knowledgePoints: ['成分','食物链','食物网'] },
        { id: 's1-2', name: '1.2 生态系统的能量流动', knowledgePoints: ['能量传递效率','能量金字塔'] },
        { id: 's1-3', name: '1.3 生态系统的物质循环', knowledgePoints: ['碳循环','物质循环特点'] },
      ]},
      { id: 'ch2', name: '第二章 生态系统的稳定性', sections: [
        { id: 's2-1', name: '2.1 生态系统的自我调节', knowledgePoints: ['负反馈','抵抗力稳定性','恢复力稳定性'] },
        { id: 's2-2', name: '2.2 生态系统的保护', knowledgePoints: ['生物多样性','保护措施'] },
      ]},
    ],
  },
  {
    id: 'bio-rjb-xbx3', name: '人教版·选择性必修第三册',
    chapters: [
      { id: 'ch1', name: '第一章 发酵工程', sections: [
        { id: 's1-1', name: '1.1 传统发酵技术', knowledgePoints: ['果酒果醋制作','腐乳制作'] },
        { id: 's1-2', name: '1.2 微生物的培养', knowledgePoints: ['培养基','灭菌','微生物计数'] },
      ]},
      { id: 'ch2', name: '第二章 细胞工程', sections: [
        { id: 's2-1', name: '2.1 植物细胞工程', knowledgePoints: ['植物组织培养','植物体细胞杂交'] },
        { id: 's2-2', name: '2.2 动物细胞工程', knowledgePoints: ['动物细胞培养','单克隆抗体'] },
      ]},
      { id: 'ch3', name: '第三章 基因工程', sections: [
        { id: 's3-1', name: '3.1 基因工程的基本工具', knowledgePoints: ['限制酶','DNA连接酶','载体'] },
        { id: 's3-2', name: '3.2 基因工程的基本操作', knowledgePoints: ['目的基因获取','基因表达载体','转化'] },
        { id: 's3-3', name: '3.3 基因工程的应用', knowledgePoints: ['基因工程药物','转基因生物'] },
      ]},
    ],
  },
];

// ─── 政治 (人教版) ─────────────────────────────────────────────
export const POLITICS_TEXTBOOKS = [
  {
    id: 'pol-rjb-bx1', name: '人教版·必修第一册',
    chapters: [
      { id: 'ch1', name: '第一单元 中国特色社会主义', sections: [
        { id: 's1-1', name: '1.1 社会主义从空想到科学', knowledgePoints: ['空想社会主义','科学社会主义'] },
        { id: 's1-2', name: '1.2 社会主义从理论到实践', knowledgePoints: ['十月革命','社会主义制度'] },
      ]},
      { id: 'ch2', name: '第二单元 中国共产党的领导', sections: [
        { id: 's2-1', name: '2.1 中华人民共和国成立前', knowledgePoints: ['各种政治力量','历史选择'] },
        { id: 's2-2', name: '2.2 中国共产党的诞生', knowledgePoints: ['建党意义','初心使命'] },
      ]},
      { id: 'ch3', name: '第三单元 中国特色社会主义进入新时代', sections: [
        { id: 's3-1', name: '3.1 新时代的社会主要矛盾', knowledgePoints: ['主要矛盾','新时代特征'] },
        { id: 's3-2', name: '3.2 习近平新时代中国特色社会主义思想', knowledgePoints: ['核心内容','历史地位'] },
      ]},
    ],
  },
  {
    id: 'pol-rjb-bx2', name: '人教版·必修第二册',
    chapters: [
      { id: 'ch1', name: '第一单元 生产资料所有制与经济体制', sections: [
        { id: 's1-1', name: '1.1 我国的生产资料所有制', knowledgePoints: ['公有制为主体','多种所有制并存'] },
        { id: 's1-2', name: '1.2 社会主义市场经济体制', knowledgePoints: ['市场调节','宏观调控'] },
      ]},
      { id: 'ch2', name: '第二单元 经济发展与社会进步', sections: [
        { id: 's2-1', name: '2.1 新发展理念', knowledgePoints: ['创新协调绿色开放共享'] },
        { id: 's2-2', name: '2.2 收入分配', knowledgePoints: ['按劳分配','社会保障'] },
      ]},
    ],
  },
  {
    id: 'pol-rjb-bx3', name: '人教版·必修第三册',
    chapters: [
      { id: 'ch1', name: '第一单元 中国共产党的领导', sections: [
        { id: 's1-1', name: '1.1 党的执政方式', knowledgePoints: ['科学执政','民主执政','依法执政'] },
        { id: 's1-2', name: '1.2 全面从严治党', knowledgePoints: ['党的建设','反腐败'] },
      ]},
      { id: 'ch2', name: '第二单元 人民当家作主', sections: [
        { id: 's2-1', name: '2.1 我国的根本政治制度', knowledgePoints: ['人民代表大会制度','人大代表'] },
        { id: 's2-2', name: '2.2 我国的基本政治制度', knowledgePoints: ['政党制度','民族区域自治','基层群众自治'] },
      ]},
      { id: 'ch3', name: '第三单元 全面依法治国', sections: [
        { id: 's3-1', name: '3.1 法治中国建设', knowledgePoints: ['宪法','法治体系'] },
        { id: 's3-2', name: '3.2 公民的权利与义务', knowledgePoints: ['基本权利','基本义务'] },
      ]},
    ],
  },
  {
    id: 'pol-rjb-bx4', name: '人教版·必修第四册',
    chapters: [
      { id: 'ch1', name: '第一单元 探索世界与把握规律', sections: [
        { id: 's1-1', name: '1.1 哲学概论', knowledgePoints: ['哲学基本问题','唯物主义与唯心主义'] },
        { id: 's1-2', name: '1.2 唯物辩证法', knowledgePoints: ['联系观','发展观','矛盾观'] },
      ]},
      { id: 'ch2', name: '第二单元 认识社会与价值选择', sections: [
        { id: 's2-1', name: '2.1 实践与认识', knowledgePoints: ['实践观','认识的辩证过程'] },
        { id: 's2-2', name: '2.2 社会历史观', knowledgePoints: ['社会存在与社会意识','人民群众'] },
        { id: 's2-3', name: '2.3 价值观', knowledgePoints: ['价值判断','社会主义核心价值观'] },
      ]},
    ],
  },
  {
    id: 'pol-rjb-xbx1', name: '人教版·选择性必修第一册',
    chapters: [
      { id: 'ch1', name: '第一单元 当代国际政治与经济', sections: [
        { id: 's1-1', name: '1.1 国家与国际组织', knowledgePoints: ['国家性质','国际组织'] },
        { id: 's1-2', name: '1.2 世界多极化', knowledgePoints: ['多极化趋势','国际关系'] },
        { id: 's1-3', name: '1.3 经济全球化', knowledgePoints: ['全球化表现','对外开放'] },
      ]},
    ],
  },
  {
    id: 'pol-rjb-xbx2', name: '人教版·选择性必修第二册',
    chapters: [
      { id: 'ch1', name: '第一单元 法律与生活', sections: [
        { id: 's1-1', name: '1.1 民事法律关系', knowledgePoints: ['民事主体','民事权利'] },
        { id: 's1-2', name: '1.2 合同与侵权', knowledgePoints: ['合同法','侵权责任'] },
        { id: 's1-3', name: '1.3 婚姻家庭法律', knowledgePoints: ['婚姻法','继承法'] },
      ]},
    ],
  },
  {
    id: 'pol-rjb-xbx3', name: '人教版·选择性必修第三册',
    chapters: [
      { id: 'ch1', name: '第一单元 逻辑与思维', sections: [
        { id: 's1-1', name: '1.1 逻辑思维', knowledgePoints: ['概念','判断','推理'] },
        { id: 's1-2', name: '1.2 辩证思维', knowledgePoints: ['分析与综合','抽象与具体'] },
        { id: 's1-3', name: '1.3 创新思维', knowledgePoints: ['联想','发散思维','聚合思维'] },
      ]},
    ],
  },
];

// ─── 历史 (人教版) ─────────────────────────────────────────────
export const HISTORY_TEXTBOOKS = [
  {
    id: 'his-rjb-bxs', name: '人教版·必修上册',
    chapters: [
      { id: 'ch1', name: '第一单元 从中华文明起源到秦汉', sections: [
        { id: 's1-1', name: '1.1 中华文明的起源', knowledgePoints: ['旧石器时代','新石器时代'] },
        { id: 's1-2', name: '1.2 早期国家', knowledgePoints: ['夏商周','分封制','宗法制'] },
      ]},
      { id: 'ch2', name: '第二单元 三国至隋唐', sections: [
        { id: 's2-1', name: '2.1 三国两晋南北朝', knowledgePoints: ['民族融合','江南开发'] },
        { id: 's2-2', name: '2.2 隋唐盛世', knowledgePoints: ['三省六部','科举制度','贞观之治'] },
      ]},
      { id: 'ch3', name: '第三单元 辽宋夏金元', sections: [
        { id: 's3-1', name: '3.1 两宋', knowledgePoints: ['宋代经济','理学','王安石变法'] },
        { id: 's3-2', name: '3.2 辽夏金元', knowledgePoints: ['民族政权并立','行省制度'] },
      ]},
      { id: 'ch4', name: '第四单元 明清', sections: [
        { id: 's4-1', name: '4.1 明朝', knowledgePoints: ['内阁制度','郑和下西洋','海禁'] },
        { id: 's4-2', name: '4.2 清朝', knowledgePoints: ['军机处','康乾盛世','闭关锁国'] },
      ]},
      { id: 'ch5', name: '第五单元 晚清至民国', sections: [
        { id: 's5-1', name: '5.1 鸦片战争', knowledgePoints: ['第一次鸦片战争','第二次鸦片战争','不平等条约'] },
        { id: 's5-2', name: '5.2 太平天国与洋务运动', knowledgePoints: ['太平天国','洋务运动'] },
        { id: 's5-3', name: '5.3 甲午战争与戊戌变法', knowledgePoints: ['甲午战争','百日维新'] },
      ]},
      { id: 'ch6', name: '第六单元 辛亥革命与中华民国', sections: [
        { id: 's6-1', name: '6.1 辛亥革命', knowledgePoints: ['同盟会','武昌起义','民国建立'] },
        { id: 's6-2', name: '6.2 北洋时期', knowledgePoints: ['军阀割据','新文化运动'] },
      ]},
      { id: 'ch7', name: '第七单元 新民主主义革命', sections: [
        { id: 's7-1', name: '7.1 五四运动与中共成立', knowledgePoints: ['五四运动','中共一大'] },
        { id: 's7-2', name: '7.2 国民革命与土地革命', knowledgePoints: ['北伐战争','长征'] },
        { id: 's7-3', name: '7.3 抗日战争', knowledgePoints: ['抗日民族统一战线','正面战场','敌后战场'] },
        { id: 's7-4', name: '7.4 解放战争', knowledgePoints: ['重庆谈判','三大战役'] },
      ]},
      { id: 'ch8', name: '第八单元 社会主义建设', sections: [
        { id: 's8-1', name: '8.1 新中国成立与巩固', knowledgePoints: ['开国大典','土地改革','抗美援朝'] },
        { id: 's8-2', name: '8.2 社会主义改造与建设', knowledgePoints: ['一五计划','三大改造'] },
        { id: 's8-3', name: '8.3 改革开放', knowledgePoints: ['十一届三中全会','经济特区','社会主义市场经济'] },
      ]},
    ],
  },
  {
    id: 'his-rjb-bxx', name: '人教版·必修下册',
    chapters: [
      { id: 'ch1', name: '第一单元 古代文明', sections: [
        { id: 's1-1', name: '1.1 古代两河流域与埃及', knowledgePoints: ['楔形文字','法老制度'] },
        { id: 's1-2', name: '1.2 古代印度与希腊', knowledgePoints: ['种姓制度','雅典民主','城邦政治'] },
      ]},
      { id: 'ch2', name: '第二单元 中古时期', sections: [
        { id: 's2-1', name: '2.1 西欧封建社会', knowledgePoints: ['封君封臣制','庄园经济'] },
        { id: 's2-2', name: '2.2 拜占庭与阿拉伯', knowledgePoints: ['拜占庭帝国','阿拉伯帝国'] },
      ]},
      { id: 'ch3', name: '第三单元 资产阶级革命', sections: [
        { id: 's3-1', name: '3.1 文艺复兴与宗教改革', knowledgePoints: ['人文主义','宗教改革'] },
        { id: 's3-2', name: '3.2 启蒙运动', knowledgePoints: ['理性主义','社会契约'] },
        { id: 's3-3', name: '3.3 英法美资产阶级革命', knowledgePoints: ['英国革命','法国大革命','美国独立'] },
      ]},
      { id: 'ch4', name: '第四单元 工业革命', sections: [
        { id: 's4-1', name: '4.1 第一次工业革命', knowledgePoints: ['蒸汽机','工厂制度'] },
        { id: 's4-2', name: '4.2 第二次工业革命', knowledgePoints: ['电气化','垄断组织'] },
      ]},
      { id: 'ch5', name: '第五单元 两次世界大战', sections: [
        { id: 's5-1', name: '5.1 第一次世界大战', knowledgePoints: ['同盟国与协约国','凡尔赛体系'] },
        { id: 's5-2', name: '5.2 十月革命与社会主义', knowledgePoints: ['十月革命','苏联建设'] },
        { id: 's5-3', name: '5.3 第二次世界大战', knowledgePoints: ['法西斯','反法西斯同盟','雅尔塔体系'] },
      ]},
      { id: 'ch6', name: '第六单元 冷战与当代', sections: [
        { id: 's6-1', name: '6.1 冷战', knowledgePoints: ['两极格局','冷战表现'] },
        { id: 's6-2', name: '6.2 当代世界', knowledgePoints: ['多极化','全球化','区域合作'] },
      ]},
    ],
  },
  {
    id: 'his-rjb-xbx1', name: '人教版·选择性必修第一册',
    chapters: [
      { id: 'ch1', name: '第一单元 政治制度', sections: [
        { id: 's1-1', name: '1.1 中国古代政治制度', knowledgePoints: ['中央集权','地方行政','选官制度'] },
        { id: 's1-2', name: '1.2 西方政治制度', knowledgePoints: ['代议制','三权分立'] },
      ]},
      { id: 'ch2', name: '第二单元 官员选拔与法律', sections: [
        { id: 's2-1', name: '2.1 官员选拔', knowledgePoints: ['科举','文官制度'] },
        { id: 's2-2', name: '2.2 法律教化', knowledgePoints: ['中华法系','西方法律'] },
      ]},
    ],
  },
  {
    id: 'his-rjb-xbx2', name: '人教版·选择性必修第二册',
    chapters: [
      { id: 'ch1', name: '第一单元 经济与社会生活', sections: [
        { id: 's1-1', name: '1.1 食物生产与社会', knowledgePoints: ['农业革命','食物物种交流'] },
        { id: 's1-2', name: '1.2 劳动工具与劳作方式', knowledgePoints: ['手工工场','机器大生产'] },
        { id: 's1-3', name: '1.3 商业贸易', knowledgePoints: ['丝绸之路','世界市场'] },
      ]},
      { id: 'ch2', name: '第二单元 村落城镇与居住', sections: [
        { id: 's2-1', name: '2.1 村落与城镇', knowledgePoints: ['城市化','城镇化'] },
      ]},
    ],
  },
  {
    id: 'his-rjb-xbx3', name: '人教版·选择性必修第三册',
    chapters: [
      { id: 'ch1', name: '第一单元 文化交流与传播', sections: [
        { id: 's1-1', name: '1.1 源远流长的中华文化', knowledgePoints: ['中华文化特点','文化传承'] },
        { id: 's1-2', name: '1.2 丰富多样的世界文化', knowledgePoints: ['多元文化','文化交融'] },
        { id: 's1-3', name: '1.3 人口迁徙与文化认同', knowledgePoints: ['移民文化','文化认同'] },
      ]},
    ],
  },
];

// ─── 地理 (人教版) ─────────────────────────────────────────────
export const GEOGRAPHY_TEXTBOOKS = [
  {
    id: 'geo-rjb-bx1', name: '人教版·必修第一册',
    chapters: [
      { id: 'ch1', name: '第一章 宇宙中的地球', sections: [
        { id: 's1-1', name: '1.1 地球的宇宙环境', knowledgePoints: ['天体系统','太阳系','地球的特殊性'] },
        { id: 's1-2', name: '1.2 太阳对地球的影响', knowledgePoints: ['太阳辐射','太阳活动'] },
        { id: 's1-3', name: '1.3 地球的历史', knowledgePoints: ['地质年代','化石'] },
        { id: 's1-4', name: '1.4 地球的圈层结构', knowledgePoints: ['内部圈层','外部圈层'] },
      ]},
      { id: 'ch2', name: '第二章 地球上的大气', sections: [
        { id: 's2-1', name: '2.1 大气的组成与垂直分层', knowledgePoints: ['大气成分','对流层','平流层'] },
        { id: 's2-2', name: '2.2 大气受热过程', knowledgePoints: ['削弱作用','保温作用'] },
        { id: 's2-3', name: '2.3 热力环流', knowledgePoints: ['热力环流原理','大气水平运动'] },
        { id: 's2-4', name: '2.4 气压带与风带', knowledgePoints: ['气压带风带','季风环流'] },
      ]},
      { id: 'ch3', name: '第三章 地球上的水', sections: [
        { id: 's3-1', name: '3.1 水循环', knowledgePoints: ['水循环环节','水循环意义'] },
        { id: 's3-2', name: '3.2 海水的性质', knowledgePoints: ['温度','盐度','密度'] },
        { id: 's3-3', name: '3.3 海水的运动', knowledgePoints: ['洋流','潮汐','波浪'] },
      ]},
      { id: 'ch4', name: '第四章 地貌', sections: [
        { id: 's4-1', name: '4.1 常见地貌类型', knowledgePoints: ['喀斯特','河流地貌','风成地貌'] },
        { id: 's4-2', name: '4.2 地貌的观察', knowledgePoints: ['等高线','地形剖面'] },
      ]},
      { id: 'ch5', name: '第五章 植被与土壤', sections: [
        { id: 's5-1', name: '5.1 主要植被', knowledgePoints: ['森林','草原','荒漠'] },
        { id: 's5-2', name: '5.2 土壤', knowledgePoints: ['土壤组成','土壤剖面'] },
      ]},
      { id: 'ch6', name: '第六章 自然灾害', sections: [
        { id: 's6-1', name: '6.1 气象灾害', knowledgePoints: ['台风','寒潮','干旱'] },
        { id: 's6-2', name: '6.2 地质灾害', knowledgePoints: ['地震','滑坡','泥石流'] },
      ]},
    ],
  },
  {
    id: 'geo-rjb-bx2', name: '人教版·必修第二册',
    chapters: [
      { id: 'ch1', name: '第一章 人口', sections: [
        { id: 's1-1', name: '1.1 人口分布', knowledgePoints: ['人口密度','人口分布影响因素'] },
        { id: 's1-2', name: '1.2 人口迁移', knowledgePoints: ['推拉理论','国内迁移','国际迁移'] },
        { id: 's1-3', name: '1.3 人口容量', knowledgePoints: ['环境承载力','人口合理容量'] },
      ]},
      { id: 'ch2', name: '第二章 乡村和城镇', sections: [
        { id: 's2-1', name: '2.1 城镇与乡村', knowledgePoints: ['聚落形态','城乡差异'] },
        { id: 's2-2', name: '2.2 城镇化', knowledgePoints: ['城镇化进程','城镇化问题'] },
      ]},
      { id: 'ch3', name: '第三章 产业区位因素', sections: [
        { id: 's3-1', name: '3.1 农业区位', knowledgePoints: ['农业区位因素','农业地域类型'] },
        { id: 's3-2', name: '3.2 工业区位', knowledgePoints: ['工业区位因素','工业集聚'] },
        { id: 's3-3', name: '3.3 服务业区位', knowledgePoints: ['商业区位','服务业布局'] },
      ]},
      { id: 'ch4', name: '第四章 交通运输布局与区域发展', sections: [
        { id: 's4-1', name: '4.1 交通运输方式', knowledgePoints: ['五种运输方式','交通选择'] },
        { id: 's4-2', name: '4.2 交通运输对区域发展的影响', knowledgePoints: ['交通与经济','一带一路'] },
      ]},
      { id: 'ch5', name: '第五章 环境与发展', sections: [
        { id: 's5-1', name: '5.1 人类面临的主要环境问题', knowledgePoints: ['环境污染','生态破坏'] },
        { id: 's5-2', name: '5.2 可持续发展', knowledgePoints: ['可持续发展原则','绿色发展'] },
      ]},
      { id: 'ch6', name: '第六章 地理信息技术', sections: [
        { id: 's6-1', name: '6.1 GIS', knowledgePoints: ['地理信息系统','空间分析'] },
        { id: 's6-2', name: '6.2 RS与GPS', knowledgePoints: ['遥感','全球定位系统'] },
      ]},
    ],
  },
  {
    id: 'geo-rjb-xbx1', name: '人教版·选择性必修第一册',
    chapters: [
      { id: 'ch1', name: '第一章 地球的运动', sections: [
        { id: 's1-1', name: '1.1 地球的自转', knowledgePoints: ['自转特征','地方时','地转偏向力'] },
        { id: 's1-2', name: '1.2 地球的公转', knowledgePoints: ['公转特征','黄赤交角','四季更替'] },
      ]},
      { id: 'ch2', name: '第二章 大气的运动', sections: [
        { id: 's2-1', name: '2.1 常见天气系统', knowledgePoints: ['气旋与反气旋','锋面系统'] },
        { id: 's2-2', name: '2.2 气候', knowledgePoints: ['气候类型','气候成因','气候变化'] },
      ]},
      { id: 'ch3', name: '第三章 水的运动', sections: [
        { id: 's3-1', name: '3.1 海水运动', knowledgePoints: ['洋流分布','洋流影响'] },
      ]},
      { id: 'ch4', name: '第四章 地表形态的变化', sections: [
        { id: 's4-1', name: '4.1 内力作用', knowledgePoints: ['地壳运动','岩浆活动','变质作用'] },
        { id: 's4-2', name: '4.2 外力作用', knowledgePoints: ['风化侵蚀','搬运沉积'] },
      ]},
    ],
  },
  {
    id: 'geo-rjb-xbx2', name: '人教版·选择性必修第二册',
    chapters: [
      { id: 'ch1', name: '第一章 区域发展', sections: [
        { id: 's1-1', name: '1.1 区域差异', knowledgePoints: ['区域比较','区域特征'] },
        { id: 's1-2', name: '1.2 区域产业结构', knowledgePoints: ['产业升级','产业转移'] },
      ]},
      { id: 'ch2', name: '第二章 资源开发与区域发展', sections: [
        { id: 's2-1', name: '2.1 资源型地区', knowledgePoints: ['资源开发','转型发展'] },
        { id: 's2-2', name: '2.2 流域开发', knowledgePoints: ['流域综合开发','水资源利用'] },
      ]},
      { id: 'ch3', name: '第三章 区域合作', sections: [
        { id: 's3-1', name: '3.1 区域联系', knowledgePoints: ['区域合作','经济一体化'] },
      ]},
    ],
  },
  {
    id: 'geo-rjb-xbx3', name: '人教版·选择性必修第三册',
    chapters: [
      { id: 'ch1', name: '第一章 资源安全', sections: [
        { id: 's1-1', name: '1.1 自然资源', knowledgePoints: ['资源分类','资源安全'] },
        { id: 's1-2', name: '1.2 能源安全', knowledgePoints: ['能源结构','能源安全策略'] },
      ]},
      { id: 'ch2', name: '第二章 环境安全', sections: [
        { id: 's2-1', name: '2.1 碳排放与碳减排', knowledgePoints: ['碳循环','碳中和'] },
        { id: 's2-2', name: '2.2 生态保护', knowledgePoints: ['自然保护区','生态修复'] },
      ]},
      { id: 'ch3', name: '第三章 海洋权益', sections: [
        { id: 's3-1', name: '3.1 海洋资源', knowledgePoints: ['海洋资源开发'] },
        { id: 's3-2', name: '3.2 海洋权益', knowledgePoints: ['领海','专属经济区'] },
      ]},
    ],
  },
];

// ─── 网课数据 ──────────────────────────────────────────────────
export const ONLINE_COURSES = [
  { id: 'course-yishu', name: '一数', teacher: '一数老师', subject: 'math',
    desc: '高中数学系统课，注重基础与解题技巧',
    modules: ['集合与逻辑','函数基础','三角函数','向量','数列','不等式','立体几何','解析几何','概率统计'] },
  { id: 'course-free-eng', name: 'Free高考英语', teacher: 'Free老师', subject: 'english',
    desc: '高考英语全题型突破，注重阅读与写作',
    modules: ['词汇精讲','语法填空','完形填空','阅读理解','七选五','写作','听力'] },
  { id: 'course-yihuaer', name: '一化儿', teacher: '一化儿老师', subject: 'chemistry',
    desc: '高中化学系统课，注重原理与实验',
    modules: ['化学反应原理','有机化学','无机化学','化学实验','元素化合物'] },
  { id: 'course-wangfuren', name: '王夫人', teacher: '王夫人老师', subject: 'chinese',
    desc: '高中语文系统课，注重阅读理解与写作',
    modules: ['现代文阅读','古诗文阅读','语言文字运用','作文','名句默写'] },
];

// ─── 教辅数据 ──────────────────────────────────────────────────
export const STUDY_AIDS = [
  { id: 'aid-jtxj-chi', name: '解题觉醒', subject: 'chinese', version: '高考版',
    desc: '高考语文全题型解题方法论',
    sections: ['现代文阅读','古诗文阅读','语言文字运用','作文','名句默写'] },
  { id: 'aid-jtxj-phy', name: '解题觉醒', subject: 'physics', version: '必修2',
    desc: '物理必修2解题方法论',
    sections: ['曲线运动','圆周运动','万有引力','机械能守恒'] },
];

// ─── 汇总导出（供 subjects.js 使用）────────────────────────────
export const ALL_TEXTBOOKS = {
  math: MATH_TEXTBOOKS,
  chinese: CHINESE_TEXTBOOKS,
  english: ENGLISH_TEXTBOOKS,
  physics: PHYSICS_TEXTBOOKS,
  chemistry: CHEMISTRY_TEXTBOOKS,
  biology: BIOLOGY_TEXTBOOKS,
  politics: POLITICS_TEXTBOOKS,
  history: HISTORY_TEXTBOOKS,
  geography: GEOGRAPHY_TEXTBOOKS,
};
