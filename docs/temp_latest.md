这是之前我们确定的版本迭代路线图，从 v0.8.0 一直到 v1.0.0，每一步都规划了优先级和可验证的完成标准。后续讨论的番茄钟、阅读系统、机器学习集成等新功能，可以在 v1.0 发布后作为后续版本（例如 v1.1.0+）继续加入。

\-\--

学习RPG v0.8.0 → v1.0.0 版本迭代路线图

总目标：将 v0.7.2 升级为拥有自适应算法、三层技能体系、智能推荐、成就系统、美观 UI 的完整单用户学习操作系统。所有功能按优先级逐步实现，每个版本可独立验证。

\-\--

v0.8.0 --- 自适应经验值引擎

优先级：🔴 最高

预计时间：周五晚 + 周六

核心目标：让经验值从"随机分配"变为"由个人数据驱动"。

包含功能：

· 建立用户画像文件 user_profile.json，存储全局基础半衰期、学科能力值、学科遗忘系数、温度升降系数等可调参数

· 重写温度模型，实现复习升温（peakTemp + lastStudy + 动态 halfLifeDays）

· 实现动态半衰期算法：从复习事件对反推瞬时半衰期，取中位数更新全局值

· 实现学习效率评估器（正确率因子 + 难度匹配因子 + 时间有效性因子）

· 实现新 XP 合成公式：baseXP × 效率 × 学科难度 × (1+进步动量) × 边际递减 × 软上限

· 全量重算所有历史记录的 computedXP，替换旧公式

可验证结果：

· 同一学习行为，不同学科能力值下产出不同 XP

· 高正确率长期用户 XP 获取率逐渐递减

· 复习后温度明显回升

\-\--

v0.9.0 --- 三层技能体系

优先级：🔴 最高

预计时间：周六

核心目标：建立"学科→技能→知识点"层次结构，实现按能力的精细诊断。

包含功能：

· 创建 skill-tree.json，定义9门学科的50+技能及知识点

· 为所有已有知识点增加 skillId 字段

· 实现三层聚合算法：知识点温度 → 技能掌握度 → 学科能力值

· 技能掌握度 = 平均温度×0.5 + 平均正确率×0.3 + 掌握占比×0.2

· 学科能力值 = 各技能掌握度按考试权重加权

· 技能级别特长判定（某技能掌握度超平均15分且半衰期更长→特长）

可验证结果：

· 每个知识点可追溯到所属技能

· 每项技能能实时显示掌握度百分比

· 能看到"现代文阅读80% vs 古诗文阅读55%"的差异

\-\--

v0.10.0 --- 智能复习推荐

优先级：🟡 高

预计时间：周日

核心目标：从"展示数据"升级为"告诉用户最优行动方案"。

包含功能：

· 实现复习收益计算：benefit = (80 - 当前温度) × 考试权重

· 实现成本估算：以该知识点历史平均复习时间为基础

· 实现0/1背包算法，在给定预算时间内选出总收益最大的知识点组合

· 推荐结果按技能分组展示，显示预计耗时和预期温度恢复值

· 实现提分潜力诊断：找出掌握度低、考试权重高、近期投入少的技能

· 实现假性熟练检测：连续高正确率但极低订正时间→标记"深度检测"

可验证结果：

· 同样30分钟，推荐组合总收益高于随机或单纯按温度排序

· 被标记为"潜在假性掌握"的知识点优先推荐

\-\--

v0.11.0 --- 低输入负担与教辅联动

优先级：🟡 高

预计时间：周末继续

核心目标：记录成本降到最低------只需搜章节、点提交。

包含功能：

· 创建 textbooks-library.json，内置3-5本常用教辅的完整目录

· 实现倒排索引和模糊搜索（支持中文简称、别名、莱文斯坦纠错）

· 实现快速记录面板：输入关键词→下拉选择章节→自动填充学科、技能、知识点

· 用户只需补填正确率、时长（可选），点击提交即生成完整记录

· 实现做题/订正时间分离：若用户明确提供则直接使用，否则由个人习惯推断

· 实现个人订正习惯的指数移动平均学习算法

可验证结果：

· 搜索"数学选修二 5.2"能匹配到正确章节

· 选中章节后90%字段自动填完，用户10秒内可完成录入

\-\--

v0.12.0 --- 成就系统

优先级：🟢 中

预计时间：下次周末

核心目标：让用户对成长有持续的正反馈和激励。

包含功能：

· 设计5类55个成就（坚持之力12个、博学之路15个、精进之魂18个、探索之心8个、传奇之巅7个，含5个隐藏）

· 实现5级稀有度体系（青铜/白银/黄金/传说/隐藏），各有不同配色和光效

· 成就自动检测与触发，解锁时弹出动画

· 成就墙页面，按类别和稀有度展示，可查看解锁时间和进度

· 未解锁成就可查看进度条和达成条件

可验证结果：

· 连续3天学习自动解锁"三日之约"

· 某技能掌握度首次突破80%自动解锁"融会贯通"

· 隐藏成就不透露达成条件

\-\--

v0.13.0 --- 考试推荐

优先级：🟢 中

预计时间：下次周末

核心目标：自动在合适时机提醒用户进行综合检测。

包含功能：

· 考试推荐触发条件：距上次考试超14天、累积学时超15小时、多项技能快速进步、假性熟练警告累积

· 考试日期偏好学习：根据历史考试记录推荐用户最常用时段

· 考试内容建议：综合各技能的薄弱知识点，推荐应包含的检测内容

· 考试与上次对比的进步奖励算法纳入XP

可验证结果：

· 系统在合适时机主动建议考试（非强制性）

· 推荐时段符合用户历史偏好

\-\--

v0.14.0 --- 统计系统

优先级：🟢 中

预计时间：下次周末

核心目标：提供全面的宏观层面分析，包括时长、题数、正确率趋势。

包含功能：

· 时间维度：累计学习天数、总时长、总题数、总经验，日/周/月趋势图

· 学科维度：各科时长占比饼图、刷题与正确率对比、技能成长曲线

· 效率维度：学习效率趋势散点图、做题vs订正时间比例、XP获取效率

· 时段分析：按小时和星期展示学习时长热力图，发现最佳学习时段

· 所有图表支持点击下钻（如点击学科进入该科技能页）

可验证结果：

· 能看到各科时间分配和变化趋势

· 能发现个人最佳学习时段

\-\--

v0.15.0 --- UI 全面重构

优先级：🔵 可稍后

预计时间：后续周末

核心目标：信息架构清晰，视觉体验美观统一。

包含功能：

· 重构底部导航：4项主导航（仪表盘、技能、记录、更多）

· 新增仪表盘首页：今日核心指标、本周摘要图表、学习动态时间线

· 新增技能页：雷达图、技能卡片列表、复习建议面板

· 记录页增加教辅搜索和快速录入面板

· "更多"页收纳统计中心、成就墙、知识库管理、设置

· 全局统一设计（配色体系化、动效增强、深色模式）

可验证结果：

· 所有功能在4个主导航内可达，无需来回跳转

· 界面美观，信息层级清晰

\-\--

v1.0.0 --- 发布稳定版

优先级：🟣 最终

预计时间：所有核心功能稳定后

核心目标：作为第一个完整正式版发布。

内容：

· 全功能测试与bug修复

· 历史数据兼容性校验

· 用户画像冷启动流程优化

· 性能优化（大量数据下的聚合计算效率）

· 完整的使用文档和技术参考文档

· 版本号确定为1.0.0

\-\--

后续的番茄钟、阅读系统、机器学习集成、启动语自定义等功能，可在 v1.0 发布后作为后续版本（v1.1.0+）继续规划。需要我现在也把这些后续功能整理成版本大纲吗？

编写一份面向其他AI的参考文档大纲，核心是让拿到这份大纲的AI能够快速理解项目的全局设计，并准确找到实现任何功能所需的全部信息。以下是具体的编写思路：

\-\--

1\. 明确文档定位与读者

先向AI说明这份参考文档是给谁看的、在什么场景下使用：

· 读者：其他AI编程助手（或未来的你自己）。

· 使用场景：接手项目开发、实现新功能、调试现有算法、理解数据流向。

· 核心要求：自包含、无歧义、可直接执行。所有算法必须给出伪代码或数学公式，所有数据结构必须给出字段级定义，所有功能必须给出明确的触发条件和输出格式。

\-\--

2\. 采用"金字塔"结构组织内容

从宏观到微观，层层递进：

第一层：项目总览

· 一句话定位（单用户纯前端自适应学习系统）。

· 技术栈清单（纯HTML/CSS/JS + ECharts + GitHub Pages + ClawBot）。

· 数据闭环图（ClawBot → GitHub → 网页加载 → 算法引擎 → 渲染 → 反向写入GitHub）。

第二层：数据模型

· 每个数据文件的路径、用途、字段定义表（字段名、类型、是否必填、默认值、说明）。

· 所有枚举值的完整列表（学科键、活动类型、成就类别等）。

第三层：核心算法

· 按功能模块拆分（温度模型、半衰期、XP计算、效率评估、三层聚合、推荐算法、校准等）。

· 每个算法给出：输入参数、输出结果、伪代码、关键公式、边界条件处理。

第四层：功能规范

· 按用户可见功能拆分（每日推荐、考试建议、成就触发、教辅搜索、快速录入、番茄钟、阅读记录等）。

· 每个功能给出：触发时机、交互流程、生成数据的格式、与算法的调用关系。

第五层：UI架构

· 页面路由设计（主导航、子页面、模态面板）。

· 每个页面的组件树和数据绑定关系。

· 响应式断点与布局差异。

第六层：开发约定

· 文件目录结构。

· 模块命名与导出规范。

· Git提交信息格式。

· 版本号语义。

\-\--

3\. 关键内容的编写技巧

数据模型部分

· 字段级定义表是最重要的，不要写成自然语言描述。例如：

字段 类型 必填 默认值 说明

peakTemp number 是 80 最近复习后的峰值温度

halfLifeDays number 是 3.0 当前动态半衰期（天）

算法部分

· 每个算法必须给出精确的伪代码，不允许用"根据情况调整"这类模糊描述。

· 边界条件要显式列出：输入为空怎么办？除数为零怎么办？数据不足怎么办？

· 公式使用标准数学符号，并在注释中说明每个变量的来源（来自哪个字段或哪个函数）。

功能规范部分

· 每个功能用触发条件 → 处理流程 → 输出数据 → UI表现四段式描述。

· 处理流程中的每一步要注明调用哪个算法模块。

\-\--

4\. 用索引和交叉引用增强可读性

· 为每个算法、每个数据字段、每个功能分配一个唯一ID（如 ALG-TEMP-01、FIELD-PROFILE-03、FEAT-RECOMMEND-01）。

· 在文档中遇到引用时，直接使用ID，方便AI快速定位。

· 在文档末尾提供功能-算法依赖矩阵，一目了然地展示每个功能依赖哪些算法模块。

\-\--

5\. 给出具体的编写指令示例

向AI下达任务时，可以这样描述：

请为学习RPG项目编写一份技术参考文档大纲（SPEC.md），要求：

1\. 包含项目总览、数据模型、核心算法、功能规范、UI架构、开发约定六大章节。

2\. 数据模型部分用字段定义表呈现，每个字段标明类型、必填性、默认值和说明。

3\. 算法部分使用伪代码或数学公式，明确输入输出和边界条件，并标注数据来源。

4\. 功能规范部分采用"触发条件→处理流程→输出数据→UI表现"的四段格式。

5\. 为所有算法、字段、功能分配唯一ID，并在文末提供依赖矩阵。

6\. 全文采用Markdown格式，章节层级清晰，表格对齐。

7\. 可参考以下现有设计要点：\[这里贴入你之前对话中确定的关键设计决策摘要\]。

\-\--

6\. 提供"已知设计摘要"作为种子

为了让AI不偏离你的设计，可以附上一个简短的摘要，例如：

· 数据闭环：ClawBot写GitHub → 网页读Raw → 算法引擎在前端运行 → 反向写入GitHub。

· 用户画像12维参数，完全从学习记录中推导，初始值仅作冷启动。

· 温度模型使用指数衰减，半衰期动态更新，复习时升温。

· XP公式：base × 效率 × 学科难度 × 动量 × 边际递减 × 软上限。

· 技能系统三层结构：学科→技能→知识点，聚合时使用加权几何平均。

· 推荐算法使用0/1背包，目标函数为紧急度×考试权重。

· 成就系统5类60+成就，5级稀有度，自动检测触发。

· 界面4主导航：仪表盘、技能、记录、更多。

把这个摘要给AI，它就能快速对齐你的设计语言。

\-\--

7\. 迭代与更新机制

· 在文档开头声明版本号和最后更新日期。

· 每次功能更新后，在文档中对应的章节追加变更说明。

· 在版本迭代记录章节中，列出每个版本新增/修改的算法、字段和功能ID。

\-\--

用这个思路去指导AI，生成的参考大纲将是一份严谨、可执行的技术蓝图，无论是未来的AI助手还是你自己，都能快速上手。

** **

学习RPG v0.8.0 开发提示词

 

自适应经验值引擎实现指南（完整版）

 

面向对象：AI编程助手（实现者）

目标版本：v0.8.0

依赖：现有 v0.7.2 代码库

预计代码量：约1500行新增/重构

核心目标：让经验值从"固定公式计算"变为"由个人学习数据驱动"

 

\-\--

 

1\. 项目背景与版本目标

 

1.1 现状分析

 

当前 v0.7.2 使用固定公式 xp = round(accuracy \* duration / 20) 计算经验值，存在以下致命缺陷：

 

1\. 零个性化：不同用户、不同学科的相同 score/duration 产出完全一样的 XP。

2\. 无视活动类型：刷题、背诵、网课、考试全部使用同一公式。

3\. 无边际递减：能力增长后 XP 获取速率不变，无法模拟真实的学习高原效应。

4\. 人工硬编码：部分记录（如历史填充图册）只能手动给 XP 值。

 

1.2 v0.8.0 目标

 

彻底替换旧 XP 公式，建立一套完全数据驱动、自适应个人画像的经验值引擎。实现后：

 

· 同一学习行为，不同学科能力值下产出不同 XP。

· 高正确率长期用户的 XP 获取率逐渐递减。

· 复习后知识点温度明显回升。

· 做题时间和订正时间区分对待，订正获得更高认知价值。

· 考试根据难度和历史表现自动加权。

 

\-\--

 

2\. 数据模型设计

 

2.1 用户画像 (UserProfile)

 

存储在 data/user_profile.json，初始值如下：

 

\`\`\`json

{

\"firstTimestamp\": null,

\"totalXP\": 0,

\"totalStudyMinutes\": 0,

\"globalBaseHalfLife\": 3.0,

\"subjectModifiers\": {

\"logos\": 1.2, \"physis\": 1.2, \"khēmeia\": 1.1,

\"mythos\": 0.9, \"lingua\": 0.9, \"zōē\": 0.9,

\"politeia\": 0.7, \"historia\": 0.8, \"geographia\": 0.8

},

\"subjectAbility\": {

\"logos\": 50, \"mythos\": 50, \"lingua\": 50, \"physis\": 50,

\"khēmeia\": 50, \"zōē\": 50, \"politeia\": 50, \"historia\": 50, \"geographia\": 50

},

\"tempBoostGain\": 0.5,

\"tempBoostBase\": 10,

\"halfLifeIncreaseRatio\": 1.2,

\"halfLifeDecreaseRatio\": 0.75,

\"avgReviewsPerWeek\": 7,

\"xpBasePerMinute\": 2.0,

\"activityWeights\": {

\"practice\": 1.2, \"exam\": 1.5, \"lecture\": 0.8,

\"review\": 1.0, \"recitation\": 1.1, \"reflection\": 0.7, \"other\": 0.5

},

\"efficiencySensitivity\": 0.6,

\"decayRateForXP\": 0.00005,

\"dailyXPLimit\": 500,

\"dailyXPLimitSoftness\": 0.5,

\"examWeightBase\": 1.5,

\"progressBonusMultiplier\": 2.0,

\"optimalDurationMin\": 30,

\"maxEffectiveDuration\": 90,

\"baseReviewRatio\": 0.20

}

\`\`\`

 

所有字段说明：

 

字段 类型 说明

firstTimestamp number/null 首条记录时间戳

totalXP number 累计经验值

totalStudyMinutes number 累计学习分钟数

globalBaseHalfLife number 全局基础半衰期（天）

subjectModifiers object 学科遗忘修正系数

subjectAbility object 学科能力值 0-100

tempBoostGain number 复习升温正确率系数

tempBoostBase number 复习升温基础增量

halfLifeIncreaseRatio number 表现好时半衰期延长系数

halfLifeDecreaseRatio number 表现差时半衰期缩短系数

avgReviewsPerWeek number 近7天平均每日复习次数

xpBasePerMinute number 每分钟基础 XP

activityWeights object 各活动类型权重

efficiencySensitivity number 效率对 XP 的影响系数

decayRateForXP number 全局边际递减率

dailyXPLimit number 每日软上限基数

dailyXPLimitSoftness number 超过软上限后的折扣率

examWeightBase number 考试基础权重

progressBonusMultiplier number 考试进步奖励倍数

optimalDurationMin number 最优学习时长（分钟）

maxEffectiveDuration number 最大有效时长

baseReviewRatio number 默认订正占比

 

2.2 知识点节点 (KnowledgeNode)

 

在原 data.json 中 subjects\[subject\].nodes\[\] 中扩展字段。每个节点在预处理时生成，包含：

 

\`\`\`javascript

{

id: string, // 知识点唯一ID

name: string, // 知识点名称

subject: string, // 所属学科key

peakTemp: number, // 最近复习后峰值温度 0-100

lastStudy: number\|null, // 最近学习时间戳

halfLifeDays: number, // 动态半衰期

accuracyHistory: number\[\], // 历次正确率

totalXP: number, // 累计XP

studyCount: number, // 学习次数

implicitStudyCount: number // 无正确率学习次数

}

\`\`\`

 

2.3 学习记录 (Record)

 

沿用现有结构，在 data.json 中 log\[\] 存储。本次需新增字段：

 

\`\`\`javascript

{

// \...原有字段

practiceMinutes: number\|null, // 做题时间（分钟）

reviewMinutes: number\|null, // 订正时间（分钟）

computedXP: number // 计算出的XP（新字段）

}

\`\`\`

 

\-\--

 

3\. 核心算法实现

 

3.1 数据预处理 (js/core/preprocess.js)

 

从 records 数组构建知识点节点和全局统计。

 

\`\`\`javascript

function preprocessRecords(records, profile) {

// 按时间排序

const sortedRecords = \[\...records\].sort((a, b) =\>

new Date(a.timestamp) - new Date(b.timestamp)

);

const nodeMap = new Map(); // key: \"subject:knowledgePoint\"

let totalMinutes = 0;

const subjectStats = {};

sortedRecords.forEach(record =\> {

const ts = new Date(record.timestamp).getTime();

totalMinutes += record.durationMinutes \|\| 0;

// 统计

if (!subjectStats\[record.subject\]) {

subjectStats\[record.subject\] = { minutes: 0, accuracySum: 0, accuracyCount: 0 };

}

subjectStats\[record.subject\].minutes += record.durationMinutes \|\| 0;

if (record.accuracy != null) {

subjectStats\[record.subject\].accuracySum += record.accuracy;

subjectStats\[record.subject\].accuracyCount++;

}

// 处理每个知识点

(record.knowledgePoints \|\| \[\]).forEach(kpName =\> {

const key = \`\${record.subject}:\${kpName}\`;

if (!nodeMap.has(key)) {

nodeMap.set(key, createKnowledgeNode(record.subject, kpName, profile));

}

const node = nodeMap.get(key);

node.studyCount++;

if (record.accuracy != null) {

node.accuracyHistory.push(record.accuracy);

updateNodeTemperature(node, record, ts, profile);

} else {

implicitUpdate(node, ts, profile, record.durationMinutes);

}

if (ts \> node.lastStudy \|\| node.lastStudy === null) {

node.lastStudy = ts;

}

});

});

return {

nodes: Array.from(nodeMap.values()),

stats: {

totalRecords: sortedRecords.length,

totalMinutes,

firstTimestamp: sortedRecords.length ? new Date(sortedRecords\[0\].timestamp).getTime() : Date.now(),

lastTimestamp: sortedRecords.length ? new Date(sortedRecords\[sortedRecords.length-1\].timestamp).getTime() : Date.now(),

subjectStats

}

};

}

 

function createKnowledgeNode(subject, name, profile) {

return {

id: generateUUID(),

name,

subject,

peakTemp: 80,

lastStudy: null,

halfLifeDays: profile.globalBaseHalfLife \* (profile.subjectModifiers\[subject\] \|\| 1),

accuracyHistory: \[\],

totalXP: 0,

studyCount: 0,

implicitStudyCount: 0

};

}

\`\`\`

 

3.2 温度模型 (js/core/temperature.js)

 

3.2.1 实时温度计算

 

\`\`\`javascript

function getCurrentTemp(node, now = Date.now()) {

if (!node.lastStudy \|\| node.peakTemp \<= 0) return 0;

const elapsedDays = (now - node.lastStudy) / (24 \* 3600 \* 1000);

return Math.max(0, +(node.peakTemp \* Math.pow(2, -elapsedDays / node.halfLifeDays)).toFixed(1));

}

\`\`\`

 

3.2.2 复习后温度更新

 

本版需支持做题/订正时间分离。若用户提供了明确时间，则分别计算升幅；否则根据个人习惯推断。

 

\`\`\`javascript

function updateNodeTemperature(node, record, nowTs, profile) {

// 1. 推断做题/订正时间

const { practice, review } = inferPracticeReviewTime(record, profile, node);

// 2. 计算复习前温度

const currentTemp = getCurrentTemp(node, nowTs);

// 3. 做题和订正分别升溫

const practiceBoost = record.accuracy \* profile.tempBoostGain \* (practice / (record.durationMinutes \|\| 1));

const reviewBoost = record.accuracy \* (profile.tempBoostGain + 0.1) \* (review / (record.durationMinutes \|\| 1));

const totalBoost = practiceBoost + reviewBoost;

const newPeak = Math.min(100, currentTemp + totalBoost);

// 4. 动态半衰期

const elapsedDays = node.lastStudy ? (nowTs - node.lastStudy) / (24 \* 3600 \* 1000) : 0;

const predictedRetention = elapsedDays \> 0 ? Math.pow(2, -elapsedDays / node.halfLifeDays) : 1;

const observedRetention = record.accuracy / 100;

const ratio = observedRetention / (predictedRetention + 0.01);

let newHalfLife;

if (ratio \> 1.1) {

newHalfLife = node.halfLifeDays \* profile.halfLifeIncreaseRatio;

} else if (ratio \< 0.9) {

newHalfLife = node.halfLifeDays \* profile.halfLifeDecreaseRatio;

} else {

newHalfLife = node.halfLifeDays \* (0.9 + ratio \* 0.2);

}

node.peakTemp = newPeak;

node.lastStudy = nowTs;

node.halfLifeDays = Math.max(0.5, Math.min(60, newHalfLife));

node.studyCount++;

}

\`\`\`

 

3.2.3 隐式更新

 

无正确率时的暴露效应更新：

 

\`\`\`javascript

function implicitUpdate(node, now, profile, durationMinutes) {

const decayedTemp = getCurrentTemp(node, now);

const exposureBoost = 5 + Math.min(durationMinutes / 10, 5);

node.peakTemp = Math.min(100, decayedTemp + exposureBoost);

node.lastStudy = now;

node.studyCount++;

node.implicitStudyCount++;

}

\`\`\`

 

3.3 做题/订正时间推断 (js/core/time-inferrer.js)

 

若记录中 practiceMinutes 和 reviewMinutes 均已提供则直接使用；否则根据个人习惯和正确率偏差推断。

 

\`\`\`javascript

function inferPracticeReviewTime(record, profile, node) {

if (record.practiceMinutes != null && record.reviewMinutes != null) {

return { practice: record.practiceMinutes, review: record.reviewMinutes };

}

let reviewRatio = profile.baseReviewRatio \|\| 0.20;

// 正确率偏差微调

if (record.accuracy != null && node.accuracyHistory.length \> 0) {

const avgAcc = node.accuracyHistory.reduce((a,b)=\>a+b,0) / node.accuracyHistory.length;

const deviation = record.accuracy - avgAcc;

if (deviation \< -15) {

reviewRatio = Math.min(0.50, reviewRatio + 0.08);

} else if (deviation \> 10) {

reviewRatio = Math.max(0.05, reviewRatio - 0.05);

}

}

// 学科微调

const subjectBias = { logos: 0.03, physis: 0.03, khēmeia: 0.02 };

reviewRatio += (subjectBias\[record.subject\] \|\| 0);

reviewRatio = Math.max(0.05, Math.min(0.60, reviewRatio));

const total = record.durationMinutes \|\| 30;

const review = Math.round(total \* reviewRatio);

const practice = total - review;

return { practice, review };

}

\`\`\`

 

当用户明确提供时间时，用指数移动平均更新 baseReviewRatio：

 

\`\`\`javascript

function updateBaseReviewRatio(profile, record) {

if (record.practiceMinutes == null \|\| record.reviewMinutes == null) return;

const total = record.practiceMinutes + record.reviewMinutes;

if (total === 0) return;

const observedRatio = record.reviewMinutes / total;

profile.baseReviewRatio = 0.7 \* profile.baseReviewRatio + 0.3 \* observedRatio;

profile.baseReviewRatio = Math.max(0.05, Math.min(0.60, profile.baseReviewRatio));

}

\`\`\`

 

3.4 学习效率评估 (js/core/efficiency-split.js)

 

效率拆分为做题效率 (PE) 和订正效率 (CE)，再加权得到综合效率 (E)。

 

3.4.1 做题效率

 

\`\`\`javascript

function calcPracticeEfficiency(record, relatedNodes, profile, inferredTimes) {

const practiceTime = inferredTimes.practice;

if (practiceTime \<= 0) return 0.5;

// 速度因子

let speedFactor = 1.0;

const avgPracTime = getHistoricalAvgPracticeTime(record.subject, relatedNodes);

if (avgPracTime \> 0) {

const ratio = avgPracTime / practiceTime;

speedFactor = Math.min(1.5, Math.max(0.6, ratio));

}

// 正确率因子

const accFactor = (record.accuracy != null) ? record.accuracy / 100 : 0.5;

// 难度匹配因子

const challengeFactor = calcChallengeFactor(record, relatedNodes, profile);

// 疲劳因子

const fatigue = Math.max(0.6, 1.0 - (practiceTime - 30) \* 0.008);

return Math.min(1.0, Math.max(0.1,

accFactor \* 0.35 + speedFactor \* 0.20 + challengeFactor \* 0.30 + fatigue \* 0.15

));

}

 

function calcChallengeFactor(record, relatedNodes, profile) {

if (relatedNodes.length === 0) return 0.5;

const nodeAvgAccuracy = relatedNodes.reduce((s, n) =\> {

return s + (n.accuracyHistory.length ? n.accuracyHistory.reduce((a,b)=\>a+b,0)/n.accuracyHistory.length : 50);

}, 0) / relatedNodes.length;

const difficulty = 100 - nodeAvgAccuracy;

const userAbility = profile.subjectAbility\[record.subject\] \|\| 50;

const optimal = 100 - userAbility + 5;

return Math.max(0.2, 1 - Math.abs(difficulty - optimal) / 50);

}

\`\`\`

 

3.4.2 订正效率

 

\`\`\`javascript

function calcCorrectionEfficiency(record, relatedNodes, profile, inferredTimes, allRecords) {

const reviewTime = inferredTimes.review;

if (reviewTime \<= 0) return 0.5;

// 深度因子

let depthFactor = 1.0;

if (record.details) {

const wrongCount = (record.details.totalQuestions \|\| 0) - (record.details.correctCount \|\| 0);

if (wrongCount \> 0) {

const minPerWrong = reviewTime / wrongCount;

if (minPerWrong \< 1) depthFactor = 0.6;

else if (minPerWrong \< 3) depthFactor = 1.0;

else depthFactor = 1.2;

}

}

// 提升因子（查找同一知识点后续正确率变化）

let improvementFactor = 1.0;

const nextRecord = findNextPracticeRecord(record, allRecords);

if (nextRecord && nextRecord.accuracy != null && record.accuracy != null) {

const change = nextRecord.accuracy - record.accuracy;

if (change \> 10) improvementFactor = 1.3;

else if (change \> 3) improvementFactor = 1.1;

else if (change \< -10) improvementFactor = 0.7;

}

// 习惯因子

const habitBonus = Math.min(1.2, 1.0 + profile.correctionEffectiveness \* 0.5);

return Math.min(1.5, Math.max(0.2,

depthFactor \* 0.40 + improvementFactor \* 0.35 + habitBonus \* 0.25

));

}

\`\`\`

 

3.4.3 综合效率

 

\`\`\`javascript

function calcOverallEfficiency(pe, ce, inferredTimes) {

const total = inferredTimes.practice + inferredTimes.review;

if (total \<= 0) return 0.5;

return (inferredTimes.practice / total) \* pe + (inferredTimes.review / total) \* Math.min(1.2, ce);

}

\`\`\`

 

3.5 经验值合成 (js/core/xp-calculator.js)

 

\`\`\`javascript

function calculateRecordXP(record, allNodes, profile, allRecords) {

// 1. 推断时间

const relatedNodes = findRelatedNodes(record, allNodes);

const inferred = inferPracticeReviewTime(record, profile, relatedNodes\[0\] \|\| {});

// 2. 效率

const pe = calcPracticeEfficiency(record, relatedNodes, profile, inferred);

const ce = calcCorrectionEfficiency(record, relatedNodes, profile, inferred, allRecords);

const overallE = calcOverallEfficiency(pe, ce, inferred);

// 3. 基础产出

const practiceBase = inferred.practice \* profile.xpBasePerMinute;

const reviewBase = inferred.review \* profile.xpBasePerMinute;

const reviewBonus = 1.3; // 订正每分钟价值是做题的1.3倍

const rawXP = practiceBase \* pe + reviewBase \* ce \* reviewBonus;

// 4. 质量乘数

const subjectDifficulty = Math.sqrt(1 / (profile.subjectModifiers\[record.subject\] \|\| 1));

const momentum = getMomentum(record.subject, allRecords);

const activityWeight = profile.activityWeights\[record.activityType\] \|\| 0.5;

const qual = overallE \* subjectDifficulty \* (1 + momentum) \* activityWeight;

// 5. 考试特殊处理

if (record.activityType === \'exam\') {

const examQual = calculateExamWeight(record, profile, allRecords);

qual \*= examQual;

}

// 6. 全局调节

const decay = 1 / (1 + profile.totalXP \* profile.decayRateForXP);

const softCap = applyDailySoftCap(record, allRecords, profile);

const finalXP = Math.round(rawXP \* qual \* decay \* softCap);

return Math.max(1, finalXP);

}

\`\`\`

 

3.5.1 考试加权

 

\`\`\`javascript

function calculateExamWeight(record, profile, allRecords) {

const difficulty = estimateExamDifficulty(record, profile, allRecords);

const progressBonus = calculateProgressBonus(record, allRecords);

return profile.examWeightBase \* (1 + difficulty) \* (1 + progressBonus);

}

 

function estimateExamDifficulty(record, profile, allRecords) {

let currentRate;

if (record.accuracy != null) currentRate = record.accuracy / 100;

else if (record.details?.totalScore) currentRate = record.details.obtainedScore / record.details.totalScore;

else currentRate = 0.7;

const ability = profile.subjectAbility\[record.subject\] \|\| 50;

const predictedRate = ability / 100;

const deviation = currentRate - predictedRate;

const pastExams = allRecords.filter(r =\> r.activityType === \'exam\' && r.subject === record.subject);

let historicalDeviation = 0;

if (pastExams.length \> 0) {

historicalDeviation = pastExams.reduce((s, e) =\> {

const rate = e.accuracy != null ? e.accuracy / 100 :

(e.details?.totalScore ? e.details.obtainedScore / e.details.totalScore : 0.7);

return s + (rate - ability / 100);

}, 0) / pastExams.length;

}

let difficulty = 0.5 - (deviation \* 0.3 + historicalDeviation \* 0.7) \* 0.5;

return Math.max(0.1, Math.min(1.0, difficulty));

}

 

function calculateProgressBonus(record, allRecords) {

const pastExams = allRecords

.filter(r =\> r.activityType === \'exam\' && r.subject === record.subject && r.recordID !== record.recordID)

.sort((a, b) =\> new Date(b.timestamp) - new Date(a.timestamp));

if (pastExams.length === 0) return 0;

const getRate = (r) =\> {

if (r.accuracy != null) return r.accuracy / 100;

if (r.details?.totalScore) return r.details.obtainedScore / r.details.totalScore;

return 0.7;

};

const lastRate = getRate(pastExams\[0\]);

const currentRate = getRate(record);

const improvement = currentRate - lastRate;

return Math.min(0.5, Math.max(0, improvement \* 2));

}

\`\`\`

 

3.5.2 每日软上限

 

\`\`\`javascript

function applyDailySoftCap(record, xp, allRecords, profile) {

const recordDate = new Date(record.timestamp).toDateString();

const todayRecords = allRecords.filter(r =\>

new Date(r.timestamp).toDateString() === recordDate && r.recordID !== record.recordID

);

const todayXP = todayRecords.reduce((sum, r) =\> sum + (r.computedXP \|\| 0), 0);

if (todayXP \>= profile.dailyXPLimit) {

return xp \* profile.dailyXPLimitSoftness;

}

return xp;

}

\`\`\`

 

3.5.3 进步动量

 

\`\`\`javascript

function getMomentum(subject, allRecords) {

const subjectRecords = allRecords

.filter(r =\> r.subject === subject && r.accuracy != null)

.slice(-10);

if (subjectRecords.length \< 3) return 0;

const n = subjectRecords.length;

const xMean = (n - 1) / 2;

const yMean = subjectRecords.reduce((s, r) =\> s + r.accuracy, 0) / n;

let num = 0, den = 0;

subjectRecords.forEach((r, i) =\> {

num += (i - xMean) \* (r.accuracy - yMean);

den += Math.pow(i - xMean, 2);

});

const slope = den !== 0 ? num / den : 0;

return 0.3 \* Math.tanh(5 \* slope / 100);

}

\`\`\`

 

3.6 全量重算与XP分配 (js/core/xp-allocation.js)

 

遍历所有记录，重新计算每条记录的 computedXP，并分配到知识点和画像。

 

\`\`\`javascript

function computeAllXP(records, nodes, profile) {

nodes.forEach(n =\> n.totalXP = 0);

let totalXP = 0;

const sorted = \[\...records\].sort((a, b) =\> new Date(a.timestamp) - new Date(b.timestamp));

sorted.forEach(record =\> {

const currentProfile = { \...profile, totalXP };

const xp = calculateRecordXP(record, nodes, currentProfile, sorted);

record.computedXP = xp;

totalXP += xp;

// 分配XP到知识点

const relatedNodes = nodes.filter(n =\>

n.subject === record.subject && record.knowledgePoints.includes(n.name)

);

const xpPerNode = relatedNodes.length \> 0 ? Math.round(xp / relatedNodes.length) : 0;

relatedNodes.forEach(n =\> n.totalXP += xpPerNode);

});

profile.totalXP = totalXP;

profile.totalStudyMinutes = records.reduce((s, r) =\> s + (r.durationMinutes \|\| 0), 0);

return { profile, records };

}

\`\`\`

 

3.7 用户画像更新 (js/core/profile-updater.js)

 

在学习记录处理完后更新画像参数。

 

\`\`\`javascript

function updateUserProfile(profile, nodes, records, now = Date.now()) {

// 更新学科能力

updateSubjectAbility(nodes, profile, now);

// 更新学科修正系数

updateSubjectModifiers(nodes, profile);

// 更新全局半衰期

updateGlobalHalfLife(nodes, profile);

// 更新复习频率

updateReviewFrequency(profile, records);

// 校准XP参数

calibrateXPParameters(profile, records);

// 更新时间戳

profile.firstTimestamp = records.length ? Math.min(

profile.firstTimestamp \|\| Infinity,

new Date(records\[0\].timestamp).getTime()

) : profile.firstTimestamp;

}

 

function updateSubjectAbility(nodes, profile, now) {

for (let sub of Object.keys(profile.subjectAbility)) {

const subNodes = nodes.filter(n =\> n.subject === sub);

if (subNodes.length === 0) continue;

const avgTemp = subNodes.reduce((s, n) =\> s + getCurrentTemp(n, now), 0) / subNodes.length;

const allAcc = subNodes.flatMap(n =\> n.accuracyHistory);

const avgAcc = allAcc.length ? allAcc.reduce((a,b)=\>a+b,0) / allAcc.length : 50;

profile.subjectAbility\[sub\] = Math.round(avgTemp \* 0.5 + avgAcc \* 0.5);

}

}

 

function updateSubjectModifiers(nodes, profile) {

for (let sub of Object.keys(profile.subjectModifiers)) {

const subNodes = nodes.filter(n =\> n.subject === sub && n.halfLifeDays \> 0);

if (subNodes.length === 0) continue;

const avgHL = subNodes.reduce((s, n) =\> s + n.halfLifeDays, 0) / subNodes.length;

profile.subjectModifiers\[sub\] = +(profile.subjectModifiers\[sub\] \* 0.7 + (avgHL / profile.globalBaseHalfLife) \* 0.3).toFixed(2);

}

}

 

function updateGlobalHalfLife(nodes, profile) {

const allHL = nodes.filter(n =\> n.halfLifeDays \> 0).map(n =\> n.halfLifeDays);

if (allHL.length === 0) return;

const median = allHL.sort((a,b)=\>a-b)\[Math.floor(allHL.length/2)\];

profile.globalBaseHalfLife = +(profile.globalBaseHalfLife \* 0.8 + median \* 0.2).toFixed(1);

profile.globalBaseHalfLife = Math.max(1, Math.min(15, profile.globalBaseHalfLife));

}

 

function calibrateXPParameters(profile, records) {

const weekAgo = Date.now() - 7\*86400000;

const weekRecords = records.filter(r =\> new Date(r.timestamp).getTime() \> weekAgo);

if (weekRecords.length \< 5) return;

const totalXP = weekRecords.reduce((s, r) =\> s + (r.computedXP \|\| 0), 0);

const totalMin = weekRecords.reduce((s, r) =\> s + (r.durationMinutes \|\| 0), 0);

if (totalMin === 0) return;

const rate = totalXP / totalMin;

const target = 2.0;

profile.xpBasePerMinute = +(profile.xpBasePerMinute \* (1 + 0.1 \* (target - rate) / target)).toFixed(2);

profile.xpBasePerMinute = Math.max(0.5, Math.min(5, profile.xpBasePerMinute));

}

 

function updateReviewFrequency(profile, records) {

const weekAgo = Date.now() - 7\*86400000;

const weekRecords = records.filter(r =\> new Date(r.timestamp).getTime() \> weekAgo);

const uniqueDays = new Set(weekRecords.map(r =\> new Date(r.timestamp).toDateString()));

profile.avgReviewsPerWeek = uniqueDays.size;

}

\`\`\`

 

\-\--

 

4\. 与现有系统的集成

 

4.1 主引擎入口

 

在 js/core/engine.js 中提供 runXPEngine(records, existingProfile) 函数，调用上述所有模块完成计算并返回更新后的 records、nodes 和 profile。

 

4.2 数据加载

 

在 app.js 中，从 GitHub 加载 data.json 和 user_profile.json，然后调用 runXPEngine，最后刷新所有UI。

 

4.3 向后兼容

 

旧记录可能没有 computedXP，首次运行全量重算时自动填充。旧记录缺少 practiceMinutes 由推断机制处理。

 

\-\--

 

5\. 测试要点

 

· 同一学习行为在不同学科能力值下产出不同XP。

· 高正确率长期用户的XP获取率逐渐递减。

· 复习后知识点温度回升。

· 订正时间占比高的记录获得更高XP。

· 考试记录正确率超过历史最佳时获得进步奖励。

· 每日软上限生效。

· 所有计算不产生 NaN 或 Infinity。

 

\-\--

 

6\. 文件变更清单

 

文件 操作

js/core/preprocess.js 新增

js/core/temperature.js 新增

js/core/time-inferrer.js 新增

js/core/efficiency-split.js 新增

js/core/xp-calculator.js 新增

js/core/xp-allocation.js 新增

js/core/profile-updater.js 新增

js/core/engine.js 新增

data/user_profile.json 新增（初始值）

js/app.js 修改：加载新模块，替换旧XP计算

 

\-\--

 

按照以上规范实现，v0.8.0 将拥有完全数据驱动的自适应经验值引擎，为后续版本打下坚实基础。

学习RPG v0.9.0 开发提示词三层技能体系实现指南（完整版）面向对象：AI编程助手（实现者）目标版本：v0.9.0依赖：v0.8.0 自适应经验值引擎（用户画像、温度模型、动态半衰期）预计代码量：约1800行新增/重构核心目标：建立"学科→技能→知识点"三层认知架构，实现按能力的精细诊断和聚合\-\--1. 版本背景与目标1.1 从v0.8.0继承的成果v0.8.0已经实现了：· 用户画像 (user_profile.json) 包含12维自适应参数· 完全数据驱动的经验值引擎：XP由效率、难度、动量等因子合成· 动态温度模型：知识点温度随时间衰减，复习后升温，半衰期动态调整· 做题/订正时间分离与推断· 学科能力值 (subjectAbility) 通过EWMA更新然而，v0.8.0的知识点是扁平化存储的------所有知识点挂在学科下，没有中间层次。这导致：· 无法回答"我现代文阅读强，但古诗文弱"这样的问题· 学科能力值是一个笼统的均值，无法反映学科内部的强弱差异· 无法在技能级别进行特长判定和精细化推荐1.2 v0.9.0的目标在现有数据结构之上，建立技能层，形成完整的三层结构：\`\`\`学科 (Subject) ├── 技能 (Skill) ─── 考试权重、掌握度、等级 │ ├── 知识点 (Knowledge Point) ─── 温度、正确率、XP │ └── \... └── \...\`\`\`实现后：· 每个知识点可追溯到所属技能· 每项技能能实时显示掌握度百分比和等级· 能看到"现代文阅读80% vs 古诗文阅读55%"的对比· 特长判定细化为技能级· 学科能力值由技能掌握度加权聚合（不再仅由知识点直接聚合）\-\--2. 技能树定义2.1 设计原则· 全面覆盖：涵盖9门学科（语数英物化生政史地），每科3-7个技能· 考试导向：每个技能标注高考/期末考参考权重，用于加权聚合· 知识点归属明确：每个技能列出其包含的知识点，作为匹配基准· 可扩展：未来可新增技能或调整知识点归属，不影响已有数据2.2 技能树文件 data/skill-tree.json完整定义包含所有学科和技能。下面给出数学和语文的示例，其他学科按相同格式补全。\`\`\`json{ \"version\": \"1.0.0\", \"lastUpdated\": \"2026-05-15\", \"subjects\": { \"logos\": { \"name\": \"数学\", \"skills\": { \"logos-func\": { \"name\": \"函数与导数\", \"description\": \"函数性质分析、导数应用、不等式\", \"examWeight\": 0.30, \"knowledgePoints\": \[ \"函数性质\", \"基本初等函数\", \"函数的图像变换\", \"导数的运算\", \"导数与切线\", \"导数与单调性\", \"导数与极值\", \"恒成立问题\", \"函数零点问题\", \"不等式证明\" \] }, \"logos-geo\": { \"name\": \"几何与代数\", \"description\": \"坐标系、向量、立体几何\", \"examWeight\": 0.28, \"knowledgePoints\": \[ \"空间几何体\", \"向量法与建立坐标系\", \"锥柱球体计算\", \"点线面位置关系\", \"立体几何证明\", \"解析几何·直线与圆\", \"解析几何·椭圆\", \"解析几何·双曲线\", \"解析几何·抛物线\" \] }, \"logos-prob\": { \"name\": \"概率与统计\", \"description\": \"数据处理、概率模型\", \"examWeight\": 0.17, \"knowledgePoints\": \[ \"古典概型\", \"几何概型\", \"条件概率\", \"分布列与期望\", \"二项分布\", \"正态分布\", \"回归分析\", \"独立性检验\" \] }, \"logos-seq\": { \"name\": \"数列与数学归纳法\", \"description\": \"等差等比、递推、数学归纳法\", \"examWeight\": 0.12, \"knowledgePoints\": \[ \"等差数列\", \"等比数列\", \"数列通项与求和\", \"放缩法\", \"奇偶讨论\", \"数学归纳法\" \] }, \"logos-model\": { \"name\": \"数学建模与创新\", \"description\": \"新情境应用、跨学科综合\", \"examWeight\": 0.13, \"knowledgePoints\": \[ \"新定义题型\", \"实际情境建模\", \"创新综合题\" \] } } }, \"mythos\": { \"name\": \"语文\", \"skills\": { \"mythos-modern\": { \"name\": \"现代文阅读\", \"description\": \"论述类、文学类、实用类文本理解与分析\", \"examWeight\": 0.23, \"knowledgePoints\": \[ \"论证分析\", \"词句含义\", \"文脉梳理\", \"主题概括\", \"手法赏析\", \"结构分析\" \] }, \"mythos-classical\": { \"name\": \"古诗文阅读\", \"description\": \"文言文断句翻译+古代诗歌鉴赏\", \"examWeight\": 0.23, \"knowledgePoints\": \[ \"断句技巧\", \"文化常识\", \"实词虚词\", \"内容理解\", \"翻译方法\", \"意象分析\", \"手法鉴赏\" \] }, \"mythos-language\": { \"name\": \"语言文字运用\", \"description\": \"病句修改、语段连贯、语言表达\", \"examWeight\": 0.14, \"knowledgePoints\": \[ \"病句辨析\", \"句子补写\", \"修辞效果分析\", \"语体转换\", \"缩写与扩写\", \"衔接连贯\" \] }, \"mythos-writing\": { \"name\": \"写作\", \"description\": \"议论文与记叙文写作能力\", \"examWeight\": 0.40, \"knowledgePoints\": \[ \"审题立意\", \"论据选择\", \"结构布局\", \"语言表达\", \"思辨力\", \"素材积累\" \] }, \"mythos-dictation\": { \"name\": \"名篇名句默写\", \"description\": \"课标篇目的情境默写\", \"examWeight\": 0.04, \"knowledgePoints\": \[\"理解性默写\", \"易错字辨析\", \"情境填空\"\] } } } // \...其他7学科按相同结构定义 }}\`\`\`每个技能的 examWeight 总和为该学科的1（或接近1），用于加权聚合。学科定义中还需包含完整的技能权重和知识点列表。其他学科的技能定义参考此前对话中已给出的完整技能树，须全部写入此文件。2.3 技能ID命名规范采用 学科前缀-技能关键词 的形式，如：· logos-func (数学-函数与导数)· mythos-modern (语文-现代文阅读)· lingua-read (英语-阅读理解)所有技能ID在此文件中定义，后续在知识点节点中通过 skillId 引用。\-\--3. 数据结构更新3.1 知识点节点 (KnowledgeNode) 扩展在 v0.8.0 的基础上，节点新增 skillId 字段：\`\`\`javascript{ id: \"kp-xxx\", name: \"导数的运算\", subject: \"logos\", skillId: \"logos-func\", // 新增：关联的技能ID // \... 原有字段 (peakTemp, lastStudy, halfLifeDays, accuracyHistory, totalXP, studyCount)}\`\`\`3.2 学习记录 (Record) 可选扩展学习记录中可增加 skillId 字段（可选），若用户通过教辅联动录入，则自动填入。否则由知识点匹配时动态关联。3.3 数据升级脚本需要编写迁移脚本，为现有 data.json 中所有知识点自动匹配技能。匹配逻辑：1. 遍历 skill-tree.json，建立知识点名称到技能ID的映射表2. 遍历 data.json 中的知识点节点，查找映射表，填入 skillId3. 若某知识点在技能树中找不到，自动归入该学科的 general 默认技能（每个学科预留一个 general 技能，权重为0，作为兜底）4. 迁移后，补全 skill-tree.json 中各技能的 knowledgePoints 列表，确保与实际数据一致\-\--4. 三层聚合算法4.1 知识点→技能聚合对于每个技能，计算其掌握度、等级和平均温度。输入：· subject: 学科key· skillId: 技能ID· nodes: 所有知识点节点数组· profile: 用户画像输出：· mastery: 掌握度 0-100· level: 等级（基于掌握度）· avgTemperature: 下属知识点的平均温度· nodeCount: 知识点总数· masteredNodeCount: 温度≥60的知识点数· totalXP: 技能累计XP计算公式：\`\`\`javascriptfunction calcSkillMetrics(subject, skillId, nodes, profile) { const now = Date.now(); const skillNodes = nodes.filter(n =\> n.subject === subject && n.skillId === skillId); if (skillNodes.length === 0) { return { mastery: 0, level: 1, avgTemperature: 0, nodeCount: 0, masteredNodeCount: 0, totalXP: 0 }; } // 平均温度 const avgTemp = skillNodes.reduce((sum, node) =\> sum + getCurrentTemp(node, now), 0) / skillNodes.length; // 掌握知识点数（温度≥60视为掌握） const masteredCount = skillNodes.filter(n =\> getCurrentTemp(n, now) \>= 60).length; // 平均正确率 const allAccuracies = skillNodes.flatMap(n =\> n.accuracyHistory); const avgAccuracy = allAccuracies.length \> 0 ? allAccuracies.reduce((a, b) =\> a + b, 0) / allAccuracies.length : 50; // 技能掌握度 = 温度分×0.5 + 正确率分×0.3 + 掌握占比分×0.2 const mastery = avgTemp \* 0.5 + avgAccuracy \* 0.3 + (masteredCount / skillNodes.length) \* 100 \* 0.2; // 技能等级（基于掌握度，1-100） const level = Math.max(1, Math.round(mastery)); // 技能累计XP const totalXP = skillNodes.reduce((sum, n) =\> sum + n.totalXP, 0); return { mastery: Math.round(mastery), level, avgTemperature: Math.round(avgTemp), nodeCount: skillNodes.length, masteredNodeCount: masteredCount, totalXP };}\`\`\`4.2 技能→学科聚合学科能力值由下属各技能的掌握度按考试权重加权平均得到。此值将替代 v0.8.0 中从知识点直接EWMA计算的 subjectAbility。\`\`\`javascriptfunction calcSubjectAbility(subject, skillTree, nodes, profile) { const skills = skillTree.subjects\[subject\].skills; let weightedSum = 0; let totalWeight = 0; for (const \[skillId, skillDef\] of Object.entries(skills)) { const metrics = calcSkillMetrics(subject, skillId, nodes, profile); const weight = skillDef.examWeight \|\| 0; weightedSum += metrics.mastery \* weight; totalWeight += weight; } // 若总权重为0（无技能定义），回退到直接计算知识点平均温度+正确率 if (totalWeight === 0) { return fallbackSubjectAbility(subject, nodes); } return totalWeight \> 0 ? Math.round(weightedSum / totalWeight) : 50;}\`\`\`注意：v0.8.0 的 profile.subjectAbility 更新方式需改为调用此函数的结果，而不再是原先的EWMA直接计算。需要保持向后兼容：在 updateSubjectAbility 中使用 calcSubjectAbility 赋值。4.3 技能级特长判定在用户画像中新增 skillTalent 字段，记录每个技能是否为特长。\`\`\`javascriptfunction detectSkillTalents(subject, skillTree, nodes, profile) { const skills = skillTree.subjects\[subject\].skills; const allMasteries = \[\]; const talentMap = {}; // 先计算所有技能的掌握度 for (const \[skillId, skillDef\] of Object.entries(skills)) { const metrics = calcSkillMetrics(subject, skillId, nodes, profile); allMasteries.push({ skillId, mastery: metrics.mastery }); } if (allMasteries.length === 0) return talentMap; // 计算平均掌握度 const avgMastery = allMasteries.reduce((s, item) =\> s + item.mastery, 0) / allMasteries.length; // 特长条件：掌握度超过平均15分以上，且该技能知识点平均半衰期 \> 学科平均半衰期 × 1.2 const subjectNodes = nodes.filter(n =\> n.subject === subject); const subjectAvgHL = subjectNodes.length \> 0 ? subjectNodes.reduce((s, n) =\> s + n.halfLifeDays, 0) / subjectNodes.length : profile.globalBaseHalfLife; for (const { skillId, mastery } of allMasteries) { const skillNodes = nodes.filter(n =\> n.subject === subject && n.skillId === skillId); const skillAvgHL = skillNodes.length \> 0 ? skillNodes.reduce((s, n) =\> s + n.halfLifeDays, 0) / skillNodes.length : subjectAvgHL; if (mastery \> avgMastery + 15 && skillAvgHL \> subjectAvgHL \* 1.2) { talentMap\[skillId\] = true; } else { talentMap\[skillId\] = false; } } return talentMap;}\`\`\`特长标记每周更新一次（或每次全量重算时更新），并存储在 user_profile.json 的 skillTalents 字段中。\-\--5. 经验值计算的调整5.1 特长加成当一条学习记录涉及特长技能时，XP质量乘数额外乘以1.1。在 calculateRecordXP 中增加：\`\`\`javascriptconst skillTalentMultiplier = record.skillId && profile.skillTalents?.\[record.skillId\] ? 1.1 : 1.0;qual \*= skillTalentMultiplier;\`\`\`5.2 学科难度系数的来源v0.8.0中 subjectModifiers 来自半衰期比值，v0.9.0保持此机制，但 subjectModifiers 现在可以由技能级半衰期聚合来细化。我们可在 updateSubjectModifiers 中按技能平均半衰期计算学科系数。\-\--6. 与现有系统的集成6.1 数据预处理更新preprocessRecords 函数在创建知识点节点时，需要从 skill-tree.json 查找 skillId 并赋值。若某知识点在技能树中找不到，则使用 skillId = \"general\"。\`\`\`javascriptfunction getSkillIdForKnowledgePoint(subject, kpName, skillTree) { const skills = skillTree.subjects\[subject\]?.skills; if (!skills) return \'general\'; for (const \[skillId, skillDef\] of Object.entries(skills)) { if (skillDef.knowledgePoints.includes(kpName)) { return skillId; } } return \'general\';}\`\`\`6.2 用户画像加载user_profile.json 现在需要新增 skillTalents 字段（初始空对象），并在更新时赋值。6.3 前端展示数据结构为了供给UI渲染，引擎需导出一个 skillDashboardData 对象，包含每个学科的技能列表及其掌握度、等级、温度等，以便前端绘制雷达图和技能卡片。\`\`\`javascriptfunction getSkillDashboardData(subject, skillTree, nodes, profile) { const skills = skillTree.subjects\[subject\]?.skills \|\| {}; const result = \[\]; for (const \[skillId, skillDef\] of Object.entries(skills)) { const metrics = calcSkillMetrics(subject, skillId, nodes, profile); result.push({ skillId, name: skillDef.name, mastery: metrics.mastery, level: metrics.level, avgTemperature: metrics.avgTemperature, nodeCount: metrics.nodeCount, masteredNodeCount: metrics.masteredNodeCount, totalXP: metrics.totalXP, isTalent: profile.skillTalents?.\[skillId\] \|\| false }); } return result;}\`\`\`6.4 主页仪表盘在概览页的"学科等级"区域，改为展示技能掌握度摘要。可显示一个迷你雷达图或柱状图，以及特长技能标记。\-\--7. UI扩展建议v0.9.0需要新增或修改以下UI模块：7.1 技能雷达图组件利用 ECharts 雷达图，展示用户所选学科的技能掌握度。数据绑定 getSkillDashboardData 的输出。7.2 技能卡片列表在技能页，每个技能卡片显示：· 技能名称· 掌握度进度条· 下属知识点数量（已掌握/总数）· 特长标签（若是特长，显示星标）7.3 知识点详情页点击技能卡片展开下属知识点列表，显示每个知识点的温度、最近学习时间、正确率曲线。7.4 学科能力值展示学科能力值现在由技能聚合得到，在概览页的学科卡片中显示，点击可跳转到该科的技能雷达图。\-\--8. 实现步骤与验证8.1 实施步骤1. 创建 skill-tree.json：写入全部9学科的技能定义和知识点列表。2. 编写数据迁移脚本：为现有 data.json 中所有知识点添加 skillId 字段。3. 修改 preprocess.js：使用 skill-tree.json 为节点分配技能。4. 实现聚合算法：calcSkillMetrics 和 calcSubjectAbility。5. 更新画像更新逻辑：替换 subjectAbility 的计算方式，新增 skillTalents。6. 调整XP计算：增加特长加成。7. 扩展UI：雷达图、技能卡片等。8. 测试：验证三层聚合准确性。8.2 验证标准· 所有知识点都有 skillId，无一遗漏。· 学科能力值等于该学科各技能掌握度按考试权重加权平均（误差不超过1）。· 特长技能正确标记：掌握度超平均15分以上且半衰期更长。· 前端能正确展示技能雷达图和技能卡片。· 已有记录在新算法下运行不报错。\-\--9. 文件变更清单文件 操作data/skill-tree.json 新增js/skills/skill-aggregator.js 新增（聚合算法）js/skills/skill-tree-loader.js 新增（加载技能树）js/skills/talent-detector.js 新增（特长判定）js/core/preprocess.js 修改：增加skillId分配js/core/profile-updater.js 修改：更改subjectAbility计算js/core/xp-calculator.js 修改：增加特长加成js/ui/skill-radar.js 新增（雷达图组件）js/ui/skill-panel.js 新增（技能卡片组件）data/user_profile.json 修改：新增skillTalents字段js/app.js 修改：加载新模块，更新UI\-\--10. 注意事项与边界处理· 如果某学科在 skill-tree.json 中没有定义，则退化到 v0.8.0 的直接计算方式。· 某技能的知识点列表可能为空，此时该技能的掌握度为0。· 当所有知识点的 accuracyHistory 为空时，平均正确率取50。· general 技能权重为0，不参与学科能力加权，仅作为兜底。· 数据迁移时，如果 data.json 中已有 skillId 字段则保留，不做覆盖。· 保持与 ClawBot 写入数据的兼容：ClawBot 写入的记录若包含 skillId 则直接使用，否则由算法补充。\-\--按照本规范实施后，学习RPG将具备完整的三层技能体系，能够提供细粒度的能力诊断，为后续的智能复习推荐（v0.10.0）和教辅联动（v0.11.0）打下坚实基础。
