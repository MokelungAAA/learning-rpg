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

学习RPG v0.10.0 开发提示词

 

智能复习推荐系统实现指南（完整版）

 

面向对象：AI编程助手（实现者）

目标版本：v0.10.0

依赖：v0.9.0 三层技能体系（技能树、技能聚合、特长判定）及 v0.8.0 自适应经验值引擎（温度模型、动态半衰期、用户画像）

预计代码量：约2000行新增/重构

核心目标：从"展示数据"升级为"告诉用户最优行动方案"，实现基于背包算法的时间预算优化复习推荐，并整合提分潜力诊断与假性熟练检测

 

\-\--

 

1\. 版本背景与目标

 

1.1 已有基础

 

v0.9.0 已经实现了：

 

· 完整的学科→技能→知识点三层结构

· 技能掌握度、等级和特长的聚合计算

· 知识点的温度、半衰期和正确率历史

· 用户画像中的学科能力值、遗忘系数等参数

 

然而，目前系统在复习方面仅展示阴影队列（温度低于阈值的知识点），缺乏优先级排序和时间预算优化。用户面对一堆需要复习的知识点，不知道先复习哪个、分配多少时间。

 

1.2 v0.10.0 目标

 

建立一套智能复习推荐引擎，输出可执行的最优复习计划：

 

· 基于背包算法：在用户给定的时间预算内，选出总收益最大的知识点组合

· 收益模型：综合温度恢复潜力、考试权重、技能重要性、个人遗忘速率

· 成本估算：基于用户历史复习该知识点的平均耗时，或教材建议时长

· 假性熟练检测：识别"高正确率但极低订正时间"的疑似表面掌握，提升其推荐优先级

· 提分潜力诊断：找出掌握度低、考试权重高、近期投入少的技能，提供战略进攻建议

· 连续推荐疲软控制：避免反复推荐用户持续忽略的知识点

 

实现后，用户将看到形如"今日建议复习（可用30分钟）：1. 恒成立问题（温度28%，预计12分钟，恢复至68%）2. \..."的个性化清单。

 

\-\--

 

2\. 数据结构扩展

 

2.1 推荐快照

 

每次生成推荐时，可在内存中产生一个推荐快照对象，不持久化（也可选择性存入缓存供UI使用）。结构如下：

 

\`\`\`javascript

{

generatedAt: number, // 生成时间戳

timeBudget: number, // 用户可用时间（分钟）

candidates: Candidate\[\], // 候选知识点列表（含收益、成本）

selectedPlan: PlanItem\[\], // 背包算法选出的最优组合

growthOpportunities: GrowthItem\[\], // 提分潜力技能

pseudoMasteryAlerts: Alert\[\] // 假性熟练警告

}

 

interface Candidate {

nodeId: string;

name: string;

subject: string;

skillId: string;

currentTemp: number;

urgency: number; // 紧急度得分

benefit: number; // 预期收益

estimatedCost: number; // 预估复习成本（分钟）

examWeight: number; // 关联技能的考试权重

decayRate: number; // 遗忘速率（1/半衰期）

reason: string; // 推荐理由简短描述

}

 

interface PlanItem extends Candidate {

expectedRecovery: number; // 预期恢复温度

}

 

interface GrowthItem {

skillId: string;

skillName: string;

currentMastery: number;

examWeight: number;

recentFocusRatio: number; // 近7天内该技能学习时间占比

potentialScore: number; // 提分潜力指数

suggestedNodes: string\[\]; // 建议练习的知识点

}

 

interface Alert {

nodeId: string;

name: string;

reason: string; // "连续3次正确率≥85%但订正时间\<10%"

}

\`\`\`

 

2.2 用户画像新增推荐相关参数

 

在 user_profile.json 中增加：

 

\`\`\`json

{

\"recommendationParams\": {

\"urgencyTemperatureThreshold\": 60, // 低于此温度进入候选池

\"urgencyMaxBenefit\": 100,

\"costDefaultMinutes\": 10, // 无历史时的默认复习成本

\"knapsackTimeBudgetFraction\": 0.6, // 日常容量的60%用于复习

\"pseudoMasteryMinAccuracy\": 85, // 假性熟练的正确率阈值

\"pseudoMasteryMaxReviewRatio\": 0.1, // 假性熟练的订正占比上限

\"pseudoMasteryMinCount\": 3, // 连续次数

\"skipDecayFactor\": 0.7 // 连续忽略后权重衰减系数

},

\"recommendationFeedback\": \[\] // 存储用户跳过/完成的反馈

}

\`\`\`

 

\-\--

 

3\. 核心算法实现

 

3.1 候选池生成 (js/decision/candidate-generator.js)

 

遍历所有知识节点，筛选需要复习的。

 

筛选条件：

 

1\. 当前温度 \< urgencyTemperatureThreshold (默认60)

2\. 或距上次学习超过该知识点的80%保留时间（即 getCurrentTemp(node) \< node.peakTemp \* 0.8）

3\. 排除最近1小时内已复习的节点（防止重复推荐刚复习的内容）

 

紧急度计算：

 

\`\`\`javascript

function calcUrgency(node, skillWeight, profile) {

const temp = getCurrentTemp(node);

const tempDeficit = Math.max(0, 80 - temp); // 温度缺口

const decayRate = 1 / (node.halfLifeDays + 0.01); // 遗忘速率

const daysSinceStudy = node.lastStudy ? (Date.now() - node.lastStudy) / 86400000 : 999;

// 紧急度 = 温度缺口 × 遗忘速率 × 时间惩罚 × 考试权重

const timePenalty = Math.log2(daysSinceStudy + 1); // 时间越久越紧急

const urgency = tempDeficit \* decayRate \* timePenalty \* (skillWeight \|\| 0.5) \* 10;

return Math.min(100, urgency);

}

\`\`\`

 

收益计算：

 

\`\`\`javascript

function calcBenefit(node, skillWeight) {

const temp = getCurrentTemp(node);

const recoveryPotential = Math.max(0, 80 - temp); // 可恢复的最大温度值

const examWeight = skillWeight \|\| 0.5;

const halfLifeFactor = Math.min(1, node.halfLifeDays / 10); // 半衰期越短，收益越大（易忘的越值钱）

return recoveryPotential \* examWeight \* (1 + 1 - halfLifeFactor);

}

\`\`\`

 

预估成本：

 

\`\`\`javascript

function estimateCost(node, profile, allRecords) {

// 基于该知识点历史复习的平均时长

const historyRecords = allRecords.filter(r =\>

r.knowledgePoints.includes(node.name) &&

r.activityType === \'review\'

);

if (historyRecords.length \>= 2) {

const avgDuration = historyRecords.reduce((s, r) =\> s + (r.durationMinutes \|\| 0), 0) / historyRecords.length;

return Math.max(5, Math.round(avgDuration));

}

// 无历史，使用教辅建议时长或默认值

return profile.recommendationParams?.costDefaultMinutes \|\| 10;

}

\`\`\`

 

候选池排序：按 urgency 降序，截取前50个（防止背包计算过慢），再传给背包算法。

 

3.2 背包优化器 (js/decision/knapsack-optimizer.js)

 

输入：

 

· candidates: 候选知识点数组，每项含 benefit (收益) 和 estimatedCost (成本)

· timeBudget: 总可用时间（分钟）

 

输出：

 

· selected: 被选中的知识点数组

· totalBenefit: 总收益

· totalCost: 实际总耗时

 

算法：经典0/1背包动态规划。

 

\`\`\`javascript

function optimizeReviewPlan(candidates, timeBudget) {

const n = candidates.length;

if (n === 0) return { selected: \[\], totalBenefit: 0, totalCost: 0 };

// 将成本向上取整为分钟，背包容量以分钟为单位

const dp = Array.from({ length: n + 1 }, () =\> Array(timeBudget + 1).fill(0));

const keep = Array.from({ length: n + 1 }, () =\> Array(timeBudget + 1).fill(false));

for (let i = 1; i \<= n; i++) {

const cost = candidates\[i - 1\].estimatedCost;

const benefit = candidates\[i - 1\].benefit;

for (let t = 0; t \<= timeBudget; t++) {

if (cost \<= t && dp\[i - 1\]\[t - cost\] + benefit \> dp\[i - 1\]\[t\]) {

dp\[i\]\[t\] = dp\[i - 1\]\[t - cost\] + benefit;

keep\[i\]\[t\] = true;

} else {

dp\[i\]\[t\] = dp\[i - 1\]\[t\];

}

}

}

// 回溯

const selected = \[\];

let t = timeBudget;

for (let i = n; i \> 0; i\--) {

if (keep\[i\]\[t\]) {

selected.push(candidates\[i - 1\]);

t -= candidates\[i - 1\].estimatedCost;

}

}

const totalCost = selected.reduce((s, c) =\> s + c.estimatedCost, 0);

return {

selected: selected.reverse(),

totalBenefit: dp\[n\]\[timeBudget\],

totalCost

};

}

\`\`\`

 

优化：若候选数超过30，可对成本进行缩放（如除以2）以减少DP状态数。或者使用分支定界法，但DP在200分钟容量内性能足够。

 

3.3 预期温度恢复估计

 

对于被选中的知识点，预估复习后的温度：

 

\`\`\`javascript

function estimateRecovery(node, profile) {

const currentTemp = getCurrentTemp(node);

// 假设一次标准复习（正确率80%）带来的升温

const typicalAccuracy = 80;

const boost = typicalAccuracy \* profile.tempBoostGain + profile.tempBoostBase;

return Math.min(100, currentTemp + boost);

}

\`\`\`

 

3.4 假性熟练检测 (js/decision/pseudo-mastery-detector.js)

 

检测连续高正确率但订正时间极低的知识点，标记为"疑似假性掌握"。

 

\`\`\`javascript

function detectPseudoMastery(node, allRecords, profile) {

const params = profile.recommendationParams \|\| {};

const minAcc = params.pseudoMasteryMinAccuracy \|\| 85;

const maxReviewRatio = params.pseudoMasteryMaxReviewRatio \|\| 0.1;

const minCount = params.pseudoMasteryMinCount \|\| 3;

// 该知识点的最近N条有正确率的记录

const recentRecords = allRecords

.filter(r =\> r.knowledgePoints.includes(node.name) && r.accuracy != null)

.sort((a, b) =\> new Date(b.timestamp) - new Date(a.timestamp))

.slice(0, minCount);

if (recentRecords.length \< minCount) return false;

const allHighAcc = recentRecords.every(r =\> r.accuracy \>= minAcc);

if (!allHighAcc) return false;

// 检查订正时间占比

const lowReviewRatio = recentRecords.every(r =\> {

const practice = r.practiceMinutes \|\| 0;

const review = r.reviewMinutes \|\| 0;

const total = practice + review;

return total === 0 \|\| (review / total) \< maxReviewRatio;

});

return lowReviewRatio;

}

\`\`\`

 

若检测到假性熟练，该知识点的 urgency 乘以1.3，并在推荐理由中标注"需深度检测"。

 

3.5 提分潜力诊断 (js/decision/growth-analyzer.js)

 

对每个技能计算提分潜力指数，输出前3-5个最具潜力的技能。

 

\`\`\`javascript

function analyzeGrowthOpportunities(subject, skillTree, nodes, profile, records) {

const skills = skillTree.subjects\[subject\].skills;

const now = Date.now();

const weekAgo = now - 7 \* 86400000;

const recentRecords = records.filter(r =\>

r.subject === subject && new Date(r.timestamp).getTime() \> weekAgo

);

const totalRecentMinutes = recentRecords.reduce((s, r) =\> s + (r.durationMinutes \|\| 0), 0);

const opportunities = \[\];

for (const \[skillId, skillDef\] of Object.entries(skills)) {

const metrics = calcSkillMetrics(subject, skillId, nodes, profile);

// 该技能近期投入时间占比

const skillRecentMinutes = recentRecords

.filter(r =\> r.skillId === skillId)

.reduce((s, r) =\> s + (r.durationMinutes \|\| 0), 0);

const focusRatio = totalRecentMinutes \> 0 ? skillRecentMinutes / totalRecentMinutes : 0;

// 提分潜力 = (100 - 掌握度) × 考试权重 × (1 - 近期投入占比)

const potentialScore = (100 - metrics.mastery) \* (skillDef.examWeight \|\| 0.5) \* (1 - focusRatio);

opportunities.push({

skillId,

skillName: skillDef.name,

currentMastery: metrics.mastery,

examWeight: skillDef.examWeight,

recentFocusRatio: focusRatio,

potentialScore: Math.round(potentialScore \* 100) / 100,

suggestedNodes: getLowestTempNodes(skillId, nodes, 3) // 取温度最低的3个知识点

});

}

// 按potentialScore降序

opportunities.sort((a, b) =\> b.potentialScore - a.potentialScore);

return opportunities.slice(0, 3);

}

\`\`\`

 

3.6 连续推荐疲软控制

 

在候选池生成后，检查用户过去7天内的推荐记录（存储在 recommendationFeedback 中），如果某知识点连续3次被推荐但用户从未复习（无对应review记录），则其 urgency 乘以 skipDecayFactor（0.7）。连续跳过越久，权重越低，避免"狼来了"。

 

\`\`\`javascript

function applySkipDecay(candidates, profile) {

const feedback = profile.recommendationFeedback \|\| \[\];

candidates.forEach(c =\> {

const skipCount = feedback.filter(f =\> f.nodeId === c.nodeId && f.action === \'skipped\').length;

if (skipCount \>= 3) {

c.urgency \*= Math.pow(profile.recommendationParams?.skipDecayFactor \|\| 0.7, skipCount - 2);

}

});

}

\`\`\`

 

\-\--

 

4\. 复习建议生成引擎

 

主函数 generateReviewRecommendations，整合以上所有子模块。

 

\`\`\`javascript

function generateReviewRecommendations(subject, skillTree, nodes, profile, allRecords, timeBudget) {

const params = profile.recommendationParams \|\| {};

const threshold = params.urgencyTemperatureThreshold \|\| 60;

// 1. 生成候选池

let candidates = \[\];

for (const node of nodes) {

if (node.subject !== subject) continue;

const temp = getCurrentTemp(node);

const skillWeight = skillTree.subjects\[subject\]?.skills\[node.skillId\]?.examWeight \|\| 0.5;

if (temp \< threshold \|\| (node.lastStudy && (Date.now() - node.lastStudy) \> node.halfLifeDays \* 0.8 \* 86400000)) {

candidates.push({

nodeId: node.id,

name: node.name,

subject: node.subject,

skillId: node.skillId,

currentTemp: temp,

urgency: calcUrgency(node, skillWeight, profile),

benefit: calcBenefit(node, skillWeight),

estimatedCost: estimateCost(node, profile, allRecords),

examWeight: skillWeight,

decayRate: 1 / (node.halfLifeDays + 0.01),

reason: temp \< 40 ? \'温度过低\' : \'接近遗忘临界点\'

});

}

}

// 2. 假性熟练检测并调整紧急度

candidates.forEach(c =\> {

const node = nodes.find(n =\> n.id === c.nodeId);

if (node && detectPseudoMastery(node, allRecords, profile)) {

c.urgency \*= 1.3;

c.reason = \'可能假性掌握，需深度检测\';

}

});

// 3. 疲软控制

applySkipDecay(candidates, profile);

// 4. 按紧急度排序

candidates.sort((a, b) =\> b.urgency - a.urgency);

// 5. 背包优化

const budget = timeBudget \|\| Math.round((profile.dailyXPLimit \|\| 500) \* 0.6);

const plan = optimizeReviewPlan(candidates.slice(0, 50), budget);

// 6. 补充预期恢复温度

plan.selected.forEach(item =\> {

const node = nodes.find(n =\> n.id === item.nodeId);

item.expectedRecovery = node ? estimateRecovery(node, profile) : item.currentTemp + 10;

});

// 7. 提分潜力

const growthOps = analyzeGrowthOpportunities(subject, skillTree, nodes, profile, allRecords);

// 8. 假性熟练警报

const alerts = candidates

.filter(c =\> c.reason.includes(\'假性掌握\'))

.map(c =\> ({ nodeId: c.nodeId, name: c.name, reason: c.reason }));

return {

generatedAt: Date.now(),

timeBudget: budget,

candidates,

selectedPlan: plan.selected,

totalBenefit: plan.totalBenefit,

totalCost: plan.totalCost,

growthOpportunities: growthOps,

pseudoMasteryAlerts: alerts

};

}

\`\`\`

 

\-\--

 

5\. 与用户画像的联动

 

5.1 推荐反馈收集

 

当用户在UI上执行"已完成复习"或"跳过"操作时，调用 recordRecommendationFeedback 更新画像。

 

\`\`\`javascript

function recordRecommendationFeedback(profile, nodeId, action) {

if (!profile.recommendationFeedback) profile.recommendationFeedback = \[\];

profile.recommendationFeedback.push({

nodeId,

action, // \'completed\' 或 \'skipped\'

timestamp: Date.now()

});

// 只保留最近100条反馈

if (profile.recommendationFeedback.length \> 100) {

profile.recommendationFeedback = profile.recommendationFeedback.slice(-100);

}

}

\`\`\`

 

5.2 复习成本学习

 

如果用户多次进行"已完成"操作，这些复习记录（通常用户会快速生成一条复习记录）可以更新画像中的 costDefaultMinutes 和知识点的历史平均耗时。

 

\-\--

 

6\. 考试推荐联动（v0.13.0预览）

 

v0.10.0 可预留接口：当检测到距上次考试超过14天，或累积学习时长超15小时，在推荐面板最上方插入一条考试建议卡片，点击可跳转到考试内容推荐（具体实现延后）。

 

\-\--

 

7\. UI设计规范

 

7.1 推荐面板布局

 

在仪表盘首页（或技能页内）放置"今日复习建议"卡片组。包含三个子区域：

 

A. 最优复习清单

 

· 显示为有序列表，每项：优先级序号、知识点名、技能名、当前温度（彩色温度计图标）、预计耗时、预期恢复温度

· 总用时显示在底部，如"预计共需28分钟，剩余7分钟缓冲"

· 每个知识点旁有复选框，勾选后点击"标记完成"可批量生成复习记录

 

B. 提分潜力卡片

 

· 列出1-3个技能，含掌握度、潜力指数、建议知识点

· 每个技能有"去学习"按钮，可联动教辅搜索（v0.11.0）

 

C. 假性熟练警告

 

· 若有，显示为黄色警告条，列出可疑知识点

 

7.2 交互细节

 

· 用户可修改"可用时间"输入框，实时重算背包结果（防抖500ms）

· 点击知识点可展开其遗忘曲线迷你图

· "标记完成"后弹出简短确认，自动生成复习记录（activityType: \'review\', knowledgePoints: \[知识点\], durationMinutes: 预计成本）

· 推荐卡片支持折叠/展开

 

7.3 空状态

 

当没有需要复习的知识点时，显示：

 

🎉 当前知识状态良好，建议按计划学习新内容。可查看\[提分建议\]或去\[教辅库\]学习新章节。

 

\-\--

 

8\. 与现有系统的集成

 

8.1 依赖注入

 

· generateReviewRecommendations 需要访问 skillTree, nodes, profile, allRecords，这些均由引擎主控提供。

· 推荐面板注册为UI组件，数据由引擎输出后调用渲染函数。

 

8.2 数据加载时机

 

· 应用启动时，引擎跑完 runXPEngine 后，自动调用 generateReviewRecommendations，将结果传入UI。

· 用户修改任何记录后（如快速录入面板提交），重新生成推荐（可限频）。

 

8.3 兼容性

 

· 若用户未定义 recommendationParams，所有值采用代码默认值，无影响。

· 若技能树尚未完整（只有部分技能），analyzeGrowthOpportunities 只处理已有技能。

· 旧版记录无 practiceMinutes，假性熟练检测中订正占比将使用推断值（v0.8.0 已实现推断）。

 

\-\--

 

9\. 性能与边界条件

 

9.1 性能

 

· 候选池遍历所有知识点（通常\<200个），生成候选 \< 100，背包DP复杂度 O(nT) ≈ 50200 = 1万状态，毫秒级。

· 若知识点数量过多（如1000+），可预筛选温度最低的100个，避免全量遍历。

· 推荐生成可放入 Web Worker 异步执行（若UI卡顿才需）。

 

9.2 边界处理

 

· timeBudget 为0时，返回空计划。

· 所有成本必须\>=5分钟，防止DP爆炸。

· 如果背包无法填满预算，剩余时间显示为缓冲。

· 技能考试权重缺失时，默认0.5。

· 技能树未加载时，analyzeGrowthOpportunities 返回空数组。

 

\-\--

 

10\. 测试要点

 

· 给定固定数据集和预算，验证背包算法选出总收益最大组合（可手动计算验证）。

· 假性熟练检测正确率阈值生效：连续3次≥85%且订正\<10%才标记。

· 连续跳过同一知识点3次后，下次推荐的紧急度降低。

· 提分潜力排序：掌握度低+权重大+近期投入少排前。

· 用户修改时间预算后，推荐列表自动刷新且总耗时不超过预算。

· 标记完成后，系统自动生成正确格式的复习记录。

 

\-\--

 

11\. 文件变更清单

 

文件 操作

js/decision/candidate-generator.js 新增

js/decision/knapsack-optimizer.js 新增

js/decision/pseudo-mastery-detector.js 新增

js/decision/growth-analyzer.js 新增

js/decision/review-engine.js 新增（主推荐引擎）

js/ui/review-panel.js 新增（推荐面板UI）

js/core/profile-updater.js 修改：增加 recommendationFeedback 处理

data/user_profile.json 修改：新增 recommendationParams 和 feedback 字段

js/app.js 修改：引入推荐引擎，挂载UI

 

\-\--

 

按照本规范实现后，v0.10.0 将为用户提供科学、个性化的复习决策支持，极大提升学习效率和系统智能感。

学习RPG v0.11.0 开发提示词低输入负担与教辅联动实现指南（完整版）面向对象：AI编程助手（实现者）目标版本：v0.11.0依赖：v0.10.0 智能复习推荐系统、v0.9.0 三层技能体系、v0.8.0 自适应经验值引擎预计代码量：约2200行新增/重构核心目标：将学习记录的成本压缩到10秒以内------用户只需搜索教辅章节并点击提交，系统自动补全所有字段，并持续学习用户个人订正习惯，实现真正的"无感录入"\-\--1. 版本背景与目标1.1 现状痛点当前用户通过ClawBot输入学习记录时，即便使用简化指令，仍需要记住教材名称、章节编号，或手动输入知识点。对于"每天只愿花30秒记录"的用户，这个门槛仍然太高。理想的情况是：用户输入几个关键词，系统立刻联想出对应的教辅章节，自动填充学科、技能、知识点、预估时长，用户只需补填正确率和时长（甚至这些也可选），点击提交即完成记录。1.2 v0.11.0 目标1. 内置常用教辅数据库：覆盖用户常刷的3-5本教材（数学、物理、化学等理科为主，兼顾语文英语），提供章节→知识点的完整映射。2. 毫秒级模糊搜索：支持中文简称、别名、章节号、知识点名称的混合搜索，内置纠错能力（莱文斯坦距离）。3. 快速记录面板：在网页端提供一个突出的命令面板，通过搜索一键定位章节，自动填入90%的字段。4. 个人订正习惯学习：通过用户偶尔明确标注的做题/订正时间，持续更新个人化的 baseReviewRatio，推断越来越准。5. 历史记录补充入口：在快速面板中也可搜索已有知识点或技能，快速补录遗忘的记录。实现后，用户录入一条学习记录的平均耗时将从30-60秒降至10秒以内。\-\--2. 教辅数据库设计2.1 数据结构：data/textbooks/textbooks-library.json这是一个独立的JSON文件，存储用户常用教辅的完整目录结构。每个学科下可有多本教材，每本教材按章→节组织，每节包含关联的知识点、技能ID、默认活动类型、预估难度和时长。完整示例（数学部分）：\`\`\`json{ \"version\": \"1.0\", \"lastUpdated\": \"2026-05-15\", \"subjects\": { \"logos\": { \"name\": \"数学\", \"textbooks\": \[ { \"id\": \"tb-logos-rj-bx1\", \"name\": \"人教版 数学 必修第一册\", \"shortName\": \"数学必修一·人教版\", \"aliases\": \[\"必修一\", \"数学必修一\", \"必修1\", \"数学B1\"\], \"coverColor\": \"#1A5FB4\", \"chapters\": \[ { \"order\": 1, \"title\": \"第一章 集合与常用逻辑用语\", \"aliases\": \[\"集合\", \"逻辑用语\"\], \"sections\": \[ { \"order\": 1, \"title\": \"1.1 集合的概念\", \"aliases\": \[\"集合概念\", \"元素与集合\"\], \"knowledgePoints\": \[ \"集合的定义\", \"集合的表示法\", \"元素与集合的关系\" \], \"skillIds\": \[\"logos-func\"\], \"defaultActivityType\": \"practice\", \"estimatedDifficulty\": 30, \"estimatedMinutes\": 25, \"tags\": \[\"基础概念\", \"入门\"\] }, { \"order\": 2, \"title\": \"1.2 集合间的基本关系\", \"aliases\": \[\"子集\", \"集合关系\"\], \"knowledgePoints\": \[\"子集\", \"真子集\", \"空集\"\], \"skillIds\": \[\"logos-func\"\], \"defaultActivityType\": \"practice\", \"estimatedDifficulty\": 35, \"estimatedMinutes\": 30, \"tags\": \[\"基础概念\"\] } \] }, { \"order\": 3, \"title\": \"第三章 函数的概念与性质\", \"aliases\": \[\"函数\", \"函数性质\"\], \"sections\": \[ { \"order\": 1, \"title\": \"3.1 函数的概念及其表示\", \"aliases\": \[\"函数概念\", \"表示法\"\], \"knowledgePoints\": \[ \"函数的概念\", \"函数的表示法\", \"定义域与值域\" \], \"skillIds\": \[\"logos-func\"\], \"defaultActivityType\": \"practice\", \"estimatedDifficulty\": 45, \"estimatedMinutes\": 40, \"tags\": \[\"核心概念\", \"抽象思维\"\] }, { \"order\": 2, \"title\": \"3.2 函数的基本性质\", \"aliases\": \[\"单调性\", \"奇偶性\", \"函数性质\"\], \"knowledgePoints\": \[ \"函数的单调性\", \"函数的奇偶性\", \"函数的周期性\" \], \"skillIds\": \[\"logos-func\"\], \"defaultActivityType\": \"practice\", \"estimatedDifficulty\": 55, \"estimatedMinutes\": 50, \"tags\": \[\"核心\", \"难点\"\] } \] } \] }, { \"id\": \"tb-logos-rj-xx2\", \"name\": \"人教版 数学 选择性必修 第二册\", \"shortName\": \"数学选修二·人教版\", \"aliases\": \[\"选修二\", \"数学选修二\", \"选修2\"\], \"coverColor\": \"#1C71D8\", \"chapters\": \[ { \"order\": 5, \"title\": \"第五章 一元函数的导数及其应用\", \"aliases\": \[\"导数\", \"导数应用\"\], \"sections\": \[ { \"order\": 1, \"title\": \"5.1 导数的概念及其意义\", \"aliases\": \[\"导数概念\", \"导数定义\"\], \"knowledgePoints\": \[\"导数的定义\", \"导数的几何意义\", \"导数的物理意义\"\], \"skillIds\": \[\"logos-func\"\], \"defaultActivityType\": \"practice\", \"estimatedDifficulty\": 60, \"estimatedMinutes\": 45, \"tags\": \[\"核心\", \"抽象\"\] }, { \"order\": 2, \"title\": \"5.2 导数的运算\", \"aliases\": \[\"导数运算\", \"求导法则\"\], \"knowledgePoints\": \[\"导数的运算\", \"复合函数求导\", \"隐函数求导\"\], \"skillIds\": \[\"logos-func\"\], \"defaultActivityType\": \"practice\", \"estimatedDifficulty\": 65, \"estimatedMinutes\": 50, \"tags\": \[\"核心\", \"计算\"\] } \] } \] } \] } // 其他学科类似\... }}\`\`\`关键字段说明：字段 说明aliases 别名数组，支持用户用俗称、简称搜索，是搜索匹配的核心。例如"数学选修二"即可命中。defaultActivityType 该节默认的学习活动类型，用户可在快速面板修改。estimatedDifficulty 预估难度（0-100），用于初始温度设定和效率预估。estimatedMinutes 建议学习时长，当用户未提供时长时的默认值。knowledgePoints 该节涉及的知识点，自动写入学习记录的 knowledgePoints 字段。skillIds 该节关联的技能ID数组，自动归入技能。tags 内容标签，用于分类筛选和搜索加权（匹配到标签也会提升该结果的得分）。扩展性：未来新增教材，只需追加对象到 textbooks 数组，无需修改代码。2.2 教材别名文件 data/textbooks/aliases.json为方便用户输入简称，建立全局别名映射：\`\`\`json{ \"数学必修一\": \"tb-logos-rj-bx1\", \"数学必修1\": \"tb-logos-rj-bx1\", \"数学B1\": \"tb-logos-rj-bx1\", \"数学选修二\": \"tb-logos-rj-xx2\", \"数学选修2\": \"tb-logos-rj-xx2\"}\`\`\`搜索时先查此表，命中则直接定位教材，加速匹配。\-\--3. 模糊搜索引擎3.1 倒排索引构建系统加载教辅库后，为每个可搜索单元（教材、章、节）建立倒排索引。\`\`\`javascriptclass TextbookIndex { constructor(library) { this.index = new Map(); // normalizedKeyword -\> \[itemId, \...\] this.items = new Map(); // itemId -\> itemObject this.buildIndex(library); } buildIndex(library) { for (const \[subjectKey, subjectData\] of Object.entries(library.subjects)) { for (const textbook of subjectData.textbooks) { // 索引教材级别 const tbId = textbook.id; const tbItem = { type: \'textbook\', subject: subjectKey, textbookId: tbId, textbookName: textbook.name, keywords: \[textbook.name, textbook.shortName, \...textbook.aliases\], data: textbook }; this.items.set(tbId, tbItem); for (const kw of tbItem.keywords) { this.addToIndex(kw, tbId); } // 索引章 for (const chapter of textbook.chapters) { const chId = \`\${tbId}-ch-\${chapter.order}\`; const chItem = { type: \'chapter\', subject: subjectKey, textbookId: tbId, textbookName: textbook.name, chapter: chapter, keywords: \[chapter.title, \...chapter.aliases\], data: chapter }; this.items.set(chId, chItem); for (const kw of chItem.keywords) { this.addToIndex(kw, chId); } // 索引节 for (const section of chapter.sections) { const secId = \`\${chId}-sec-\${section.order}\`; const secItem = { type: \'section\', subject: subjectKey, textbookId: tbId, textbookName: textbook.name, chapter: chapter, section: section, keywords: \[ section.title, \...section.aliases, \...section.knowledgePoints, \...section.tags \], data: section }; this.items.set(secId, secItem); for (const kw of secItem.keywords) { this.addToIndex(kw, secId); } } } } } } addToIndex(keyword, itemId) { const normalized = this.normalize(keyword); if (!this.index.has(normalized)) { this.index.set(normalized, \[\]); } this.index.get(normalized).push(itemId); } normalize(text) { return text.toLowerCase() .replace(/\\./g, \'\') .replace(/\\s+/g, \'\') .replace(/\[（）()\]/g, \'\'); }}\`\`\`3.2 模糊搜索与打分用户输入查询后，对每个条目计算匹配得分。\`\`\`javascriptfunction search(query, index, maxResults = 15) { const queryNorm = index.normalize(query); const scores = new Map(); // itemId -\> score // 1. 精确匹配（完全相等，最高分） for (const \[kw, ids\] of index.index.entries()) { if (kw === queryNorm) { for (const id of ids) scores.set(id, (scores.get(id) \|\| 0) + 100); } } // 2. 前缀匹配 for (const \[kw, ids\] of index.index.entries()) { if (kw.startsWith(queryNorm)) { for (const id of ids) scores.set(id, (scores.get(id) \|\| 0) + 50); } } // 3. 子串匹配（包含关键词） for (const \[kw, ids\] of index.index.entries()) { if (kw.includes(queryNorm)) { const bonus = 20 \* (kw.length / queryNorm.length); for (const id of ids) scores.set(id, (scores.get(id) \|\| 0) + bonus); } } // 4. 编辑距离（莱文斯坦距离≤3） for (const \[kw, ids\] of index.index.entries()) { const dist = levenshteinDistance(queryNorm, kw); if (dist \<= 3 && dist \> 0) { const bonus = (4 - dist) \* 8; for (const id of ids) scores.set(id, (scores.get(id) \|\| 0) + bonus); } } // 按得分排序，截取top N const ranked = Array.from(scores.entries()) .filter((\[, s\]) =\> s \> 0) .sort((a, b) =\> b\[1\] - a\[1\]) .slice(0, maxResults); return ranked.map((\[id, score\]) =\> ({ \...index.items.get(id), score }));}function levenshteinDistance(a, b) { const matrix = Array.from({ length: a.length + 1 }, (\_, i) =\> Array.from({ length: b.length + 1 }, (\_, j) =\> (i === 0 ? j : j === 0 ? i : 0)) ); for (let i = 1; i \<= a.length; i++) { for (let j = 1; j \<= b.length; j++) { const cost = a\[i - 1\] === b\[j - 1\] ? 0 : 1; matrix\[i\]\[j\] = Math.min( matrix\[i - 1\]\[j\] + 1, // 删除 matrix\[i\]\[j - 1\] + 1, // 插入 matrix\[i - 1\]\[j - 1\] + cost // 替换 ); } } return matrix\[a.length\]\[b.length\];}\`\`\`搜索结果优先展示节（section），其次是章和教材。节匹配会附带所属章和教材信息，方便用户辨认。\-\--4. 快速记录面板4.1 UI设计快速记录面板是一个全局命令面板，类似VS Code的Ctrl+P。通过以下方式唤起：· 右下角悬浮按钮（FAB）"+"· 快捷键 Ctrl+K / Cmd+K（桌面端）· 仪表盘顶部搜索图标面板弹出后，显示一个突出的搜索框，placeholder: "搜索教辅章节，例如：数学选修二 5.2"交互流程：1. 用户输入关键词，面板实时显示匹配结果（防抖200ms）。2. 结果按得分降序排列，每项显示： · 节标题（高亮匹配部分） · 所属教材名 + 章名（灰色小字） · 涉及的知识点标签（3-5个，彩色小标签） · 预估时长3. 用户点击某一节，进入"确认记录"卡片。4. 确认卡片展示自动填充的字段：学科、技能、知识点列表、默认活动类型、预估时长。用户只需补充： · 正确率（可选输入数字或拖动条） · 实际时长（可覆盖默认值） · 做题/订正时间（可选，若不填则由系统推断） · 简短备注（可选）5. 点击"提交"按钮，记录立即写入 data.json 并同步GitHub。面板关闭，仪表盘刷新。细节：· 若用户未修改时长，使用 estimatedMinutes。· 若知识点在技能树中不存在，自动归入对应学科的 general 技能。· 提交后，用户画像中的 baseReviewRatio 若本次提供了明确时间，则随之更新。4.2 知识点自动补全在确认卡片中，知识点以标签展示，用户可以删除或添加。新增知识点输入框支持自动补全：输入时查询技能树中已有知识点，下拉联想。若输入的是全新知识点，回车后自动创建并归类。4.3 个人订正习惯更新每次用户明确提供了 practiceMinutes 和 reviewMinutes，调用 v0.8.0 中已实现的 updateBaseReviewRatio(profile, record)。该函数在 v0.11.0 无需修改，直接复用。如果用户在快速记录面板中未提供做题/订正时间，系统使用 v0.8.0 的推断函数 inferPracticeReviewTime，它内部会基于 baseReviewRatio 和正确率偏差自动计算。因此，随着用户偶尔明确标注，推断会越来越符合用户个人习惯。\-\--5. 与现有系统的集成5.1 教辅库加载在应用初始化时，使用 fetch 从 data/textbooks-library.json 加载教辅数据，并构建 TextbookIndex 实例，存储在全局状态中。5.2 搜索接口暴露一个全局函数 window.searchTextbooks(query)，供快速面板和命令行（ClawBot模拟）调用，返回标准化结果。5.3 记录生成快速面板提交后，调用主引擎的 addRecord(record) 函数（需在 v0.11.0 新增），该函数负责：· 为记录分配UUID· 追加到 data.json 的 log\[\]· 调用 preprocessRecords 中的节点更新逻辑（或直接调用增量更新函数）· 触发 computeAllXP 全量重算或增量XP更新· 更新用户画像· 保存并同步到GitHub5.4 与 ClawBot 的联动ClawBot 可调用同样的搜索逻辑。当用户通过微信发送 /教辅 数学 选修二 5.2 时，ClawBot 在本地（或通过API）执行搜索，获取最佳匹配的节，再自动生成记录写入 data.json。ClawBot 端的实现不在此版本范围，但需确保搜索接口是纯数据驱动、可被外部调用的。\-\--6. 用户画像的持续学习除了订正习惯外，v0.11.0 还可利用用户经常搜索和选择的章节，优化搜索排序：记录每个章节的"被选中次数"，在搜索时对高频章节给予轻微加分（+5），使用户常用教材的章节排名更靠前。该偏好数据存储在 user_profile.json 的 textbookSearchPreferences 字段中。\`\`\`javascriptfunction recordTextbookSelection(profile, sectionId) { if (!profile.textbookSearchPreferences) profile.textbookSearchPreferences = {}; profile.textbookSearchPreferences\[sectionId\] = (profile.textbookSearchPreferences\[sectionId\] \|\| 0) + 1;}\`\`\`搜索时若结果集较大，可以此提升常用项的分数。\-\--7. UI/UX设计细节7.1 命令面板样式· 面板覆盖在页面内容上方，带有半透明背景遮罩。· 搜索框高48px，圆角12px，内阴影，输入时匹配关键词高亮。· 结果列表最大高度60vh，支持键盘上下键选择，回车确认。· 确认卡片在面板下方滑出，保留搜索框可见，允许用户调整搜索。7.2 响应式· 移动端面板全屏显示，搜索框靠顶，结果列表占剩余高度。· 确认卡片固定在底部，有明确的"提交"和"取消"按钮。7.3 空状态与提示· 若无匹配结果，显示："未找到匹配的章节，试试输入教材全称或知识点？"· 提供"手动录入"链接，跳转到完整记录表单（保留原有的详细录入方式）。\-\--8. 实现步骤与验证8.1 实施步骤1. 创建 textbooks-library.json 和 aliases.json，填充至少3本教材的完整数据。2. 实现 TextbookIndex 类和 search 函数。3. 创建快速记录面板 UI 组件。4. 实现 addRecord 函数，串联记录写入、XP重算、画像更新。5. 集成搜索到面板，实现选择→确认→提交的完整流程。6. 复用 v0.8.0 的时间推断和订正习惯更新。7. 添加搜索偏好学习和排序优化。8. 测试搜索准确性和记录写入完整性。8.2 验证标准· 输入"数学选修二 5.2"，第一条结果即对应章节。· 输入"导数运算"，能匹配到包含此知识点的节。· 输入"shuxuexiu2"（拼音），通过编辑距离仍能找到。· 选中章节后，学科、技能、知识点自动填入无误。· 用户提供做题/订正时间后，baseReviewRatio 更新。· 提交的记录能正确触发XP重算和画像更新。· 面板在移动端和桌面端均可正常使用。\-\--9. 边界处理与鲁棒性· 教辅库文件加载失败时，快速面板回退到手动录入模式，不阻断应用。· 搜索查询为空时，不触发搜索，显示最近选择的章节历史。· 若某节的知识点与技能树不匹配，自动归入 general 技能。· 用户提交时若无网络，记录先存入本地队列，联网后批量同步。· 同一章节重复选择时，不创建重复知识点节点，而是追加学习记录。· 字符串规范化需处理全角/半角、中文数字（如"第五章"和"第5章"），统一映射。\-\--10. 文件变更清单文件 操作data/textbooks/textbooks-library.json 新增data/textbooks/aliases.json 新增js/skills/textbook-index.js 新增（倒排索引与搜索）js/ui/quick-record-panel.js 新增（命令面板UI）js/data/record-crud.js 新增（记录增删改操作）js/core/engine.js 修改：暴露 addRecord、整合搜索js/app.js 修改：加载教辅库，挂载面板data/user_profile.json 修改：新增 textbookSearchPreferences\-\--按照本规范实现后，v0.11.0 将彻底消除学习记录输入的障碍，使用户能以近乎零成本的方式持续积累高质量的学习数据，为后续所有自适应算法和智能推荐提供充足的原料。

学习RPG v0.12.0 开发提示词成就与激励系统实现指南（完整版）面向对象：AI编程助手（实现者）目标版本：v0.12.0依赖：v0.11.0 低输入负担与教辅联动、v0.10.0 智能复习推荐、v0.9.0 三层技能体系、v0.8.0 自适应经验值引擎预计代码量：约1800行新增/重构核心目标：建立多层次的成就体系，为用户的每一点坚持、每一次突破、每一份积累提供即时的正向反馈，让成长变得可见、可感、可追\-\--1. 版本背景与目标1.1 已有基础前几个版本已经构建了扎实的数据和算法基础：· 丰富的学习记录（含正确率、时长、做题/订正时间）· 动态温度与半衰期模型· 三层技能掌握度体系· 智能复习推荐与提分潜力分析· 教辅联动快速录入然而，所有这些数据和分析，如果只以冷冰冰的数字和图表呈现，用户很难在日常的微观学习中感受到"我在变强"。心理学研究表明，即时、明确、有仪式感的正面反馈是维持长期学习动机的关键。成就系统正是为此而生。1.2 v0.12.0 目标设计并实现一套覆盖学习生活全维度的成就体系，包含：· 5大类别、60+成就，从日常坚持到稀有巅峰· 5级稀有度，渐进式的收集乐趣· 自动检测与触发，无需用户手动申报· 精美的解锁动画，提供即时的多巴胺奖励· 成就墙与进度追踪，一览全局成长足迹· 隐藏成就，增加探索的神秘感\-\--2. 成就体系架构2.1 五大类别类别 标识 定位 成就数量 核心主题🌱 坚持之力 stk 习惯养成 12 连续学习天数、早起学习等时间维度的坚持📚 博学之路 vol 量变积累 15 总时长、总题数、总经验值、全科覆盖🎯 精进之魂 mst 质变突破 18 技能掌握度突破、考试进步、半衰期延长🔍 探索之心 exp 功能使用 8 使用教辅搜索、快速记录、番茄钟等系统功能🏆 传奇之巅 lgd 终极稀有 7 365天坚持、万题斩、全部技能80%+等2.2 五级稀有度稀有度 名称 配色 光效 达成难度 占比✨ 青铜 Common 铜色 #CD7F32 无 新手日常 40%🔥 白银 Rare 银白 #C0C0C0 微光 需要持续努力 30%💎 黄金 Epic 金色 #FFD700 闪烁金光 显著积累或突破 18%👑 传说 Legendary 紫金 #8B00FF 流光溢彩 极端稀有 8%🌟 隐藏 Hidden 彩虹渐变 粒子特效 惊喜 4%\-\--3. 成就详情3.1 坚持之力 (Stickiness) --- 12个ID 名称 稀有度 条件 描述stk-001 初启之日 青铜 完成首次学习记录 "千里之行，始于足下。"stk-002 三日之约 青铜 连续3天有学习记录 "习惯正在悄然生长。"stk-003 七日之誓 白银 连续7天有学习记录 "你已经坚持了一整周。"stk-004 半月坚持 白银 连续14天有学习记录 "自律正在成为本能。"stk-005 月度勋章 黄金 连续30天有学习记录 "一个月的专注，绝非易事。"stk-006 百日筑基 黄金 连续100天有学习记录 "百日的坚持已化为习惯。"stk-007 四季轮回 传说 连续365天有学习记录 "横跨四季，是为恒心。"stk-008 黎明即起 白银 累计30次在早上8点前学习 "清晨的第一件事是学习。"stk-009 周末战士 青铜 连续4个周末均有学习记录 "你没有让休息日拖慢脚步。"stk-010 百折不挠 黄金 中断后重新连续学习14天 "跌倒后爬起，比一直站着更难。"stk-011 雷打不动 传说 连续90天每天学习超过1小时 "任何人都有借口，唯独你没有。"stk-012 一周一省 青铜 连续7周每周完成至少一次反思记录 "学而不思则罔。"3.2 博学之路 (Volume) --- 15个ID 名称 稀有度 条件 描述vol-001 小试牛刀 青铜 累计学习10小时 "每一分钟都算数。"vol-002 渐入佳境 青铜 累计学习50小时 "你在学习中找到了节奏。"vol-003 百时之约 白银 累计学习100小时 "百小时的学习成果，真实可见。"vol-004 砥砺前行 白银 累计学习500小时 "你已不是当初的自己了。"vol-005 千时磨砺 黄金 累计学习1000小时 "千锤百炼，始见真金。"vol-006 千题斩 青铜 累计刷题1000道（需记录含totalQuestions） "每题都是垫脚石。"vol-007 万题斩 黄金 累计刷题10000道 "题海无涯，你已远航。"vol-008 笔记百篇 白银 累计100条学习记录 "你的日志本身就是一本书。"vol-009 全能均衡 黄金 所有学科学习时长均超20小时 "你是一位真正的全科学习者。"vol-010 炼金术士 白银 累计获得经验值超过50000 "经验值不只是数字，是你的勋章。"vol-011 博学家 传说 累计学习2000小时 "你已经走过了漫长的求知之路。"vol-012 订正达人 白银 累计订正时间超过100小时 "在错误中挖掘的，比在正确中学到的更多。"vol-013 聚沙成塔 青铜 累计刷题5万道 "每一粒沙都是你攀登的阶梯。" （注：原计划有，可保留）vol-014 博览群书 白银 阅读分类达到5种（与阅读系统联动） "博学之，审问之，慎思之。"vol-015 书中自有 黄金 累计阅读时长超100小时（与阅读系统联动） "腹有诗书气自华。"3.3 精进之魂 (Mastery) --- 18个ID 名称 稀有度 条件 描述mst-001 入门之阶 青铜 任意技能掌握度突破40% "恭喜，你迈出了第一步。"mst-002 渐入佳境 青铜 任意技能掌握度突破60% "你已经掌握了核心要领。"mst-003 融会贯通 白银 任意技能掌握度突破80% "高手的标志是能够融会贯通。"mst-004 炉火纯青 黄金 任意技能掌握度突破90% "你已是这个领域的主人。"mst-005 登峰造极 传说 任意技能掌握度达到100% "极致，是对自己的最高敬意。"mst-006 全面突破 黄金 某学科所有技能掌握度均超60% "这门学科的任督二脉已被打通。"mst-007 学霸之名 传说 某学科所有技能掌握度均超80% "你在这门学科上，已无盲点。"mst-008 逆袭之路 白银 某学科能力值从30以下提升到70以上 "惊人的进步，证明了你的潜力。"mst-009 稳步前行 青铜 某技能连续30天掌握度不下降 "保持就是最好的胜利。"mst-010 突破自我 黄金 考试正确率超过历史最佳 "你创造了个人新纪录。"mst-011 连战连捷 白银 连续3次考试正确率持续上升 "每一次考试都见证着你的进步。"mst-012 单科状元 黄金 某学科技能能力值达到95以上 "在这门学科上，你就是标杆。"mst-013 铁杵磨针 白银 同一知识点坚持复习10次 "在重复中寻找更深的理解。"mst-014 记忆大师 黄金 某知识点半衰期延长到15天以上 "它已经成为你长期记忆的一部分。"mst-015 百发百中 隐藏 一次考试正确率100% "完美的一刻，值得铭记。"mst-016 反思之镜 白银 累计反思记录达到30条 "你善于从经验中提取智慧。"mst-017 书山有路 黄金 将一本教材的所有知识点全部掌握（温度≥80%） "这条路，你已经走完了。"mst-018 知识的守护者 黄金 任意知识点的温度连续30天保持在70%以上 "稳固的知识，无需重复。"3.4 探索之心 (Exploration) --- 8个ID 名称 稀有度 条件 描述exp-001 全科探索者 青铜 在所有学科都有学习记录 "不偏科，是第一步。"exp-002 功能大师 白银 使用过所有活动类型（7种）记录学习 "你知道如何利用每一种方式来成长。"exp-003 教辅先锋 青铜 使用教辅搜索功能快速录入10次 "科技让记录更简单。"exp-004 番茄钟爱好者 白银 累计完成50个番茄钟专注时段 "专注力是可以训练的肌肉。"exp-005 搜索专家 白银 使用命令面板搜索100次 "你已懂得如何高效地管理知识库。"exp-006 数据洁癖 黄金 编辑过50条过往学习记录 "你对自己的学习数据一丝不苟。"exp-007 深度探索 白银 查看过10种不同的统计图表 "数据的美，在于发现。"exp-008 第一成就 隐藏 解锁第一个隐藏成就 "秘密，开启了。"3.5 传奇之巅 (Legendary) --- 7个ID 名称 稀有度 条件 描述lgd-001 永恒之星 传说 连续365天每天学习 "横跨四季，是为恒心。" （若坚持类已用，可改为：365天无中断）lgd-002 万题之冠 传说 累计刷题50000道 "每一题都是你攀登的阶梯。"lgd-003 全科制霸 传说 所有学科能力值均超过80% "你不是在学某一科，你是在掌握学习本身。"lgd-004 记忆传说 传说 某知识点半衰期达到30天 "永久的记忆，不朽的认知。"lgd-005 自律之神 传说 连续180天每天学习超2小时 "自律的最高境界，是自由。"lgd-006 成就猎人 传说 解锁全部非隐藏成就 "遍历群山，方知世界之大。"lgd-007 学习之神 隐藏 解锁所有隐藏成就 "你已是传奇的一部分。"\-\--4. 成就检测与触发引擎4.1 检测时机成就检测在以下时机触发：· 应用初始化时（全量扫描，检查是否错过成就）· 每次学习记录新增或编辑后（增量检查）· 用户画像更新后（检查能力/坚持类）· 番茄钟完成后· 搜索/快速记录功能使用后为了性能，大部分检测只针对与该成就相关的数据切片，而非全量遍历。4.2 检测引擎设计每个成就都有一个独立的检测函数，返回 true/false。引擎维护一个成就定义表（见第5节），遍历执行，若返回 true 且用户尚未解锁，则触发解锁流程。\`\`\`javascriptclass AchievementEngine { constructor(definitions, profile) { this.definitions = definitions; // 成就定义数组 this.unlocked = profile.achievements \|\| \[\]; // 已解锁成就ID列表 this.newlyUnlocked = \[\]; // 本次新解锁的成就ID } // 全量扫描（初始化时） scanAll(context) { this.newlyUnlocked = \[\]; for (const def of this.definitions) { if (this.unlocked.includes(def.id)) continue; if (def.condition(context)) { this.unlock(def); } } return this.newlyUnlocked; } // 增量检查（特定事件后） scanOnEvent(eventType, context) { this.newlyUnlocked = \[\]; // 只检查与该事件相关的成就 const related = this.definitions.filter(d =\> d.events?.includes(eventType)); for (const def of related) { if (this.unlocked.includes(def.id)) continue; if (def.condition(context)) { this.unlock(def); } } return this.newlyUnlocked; } unlock(def) { this.unlocked.push(def.id); this.newlyUnlocked.push(def); // 记录解锁时间 const achievementData = { id: def.id, unlockedAt: Date.now(), category: def.category, rarity: def.rarity, title: def.title, description: def.description }; // 这里应调用画像更新函数，将解锁信息写入 user_profile.json // 但为解耦，引擎向外提供回调 if (this.onUnlock) { this.onUnlock(achievementData); } }}\`\`\`4.3 成就定义结构\`\`\`javascriptconst ACHIEVEMENT_DEFINITIONS = \[ { id: \'stk-001\', title: \'初启之日\', description: \'千里之行，始于足下。\', category: \'stk\', rarity: \'common\', events: \[\'record_added\'\], condition: (ctx) =\> ctx.totalRecords \>= 1 }, { id: \'stk-002\', title: \'三日之约\', description: \'习惯正在悄然生长。\', category: \'stk\', rarity: \'common\', events: \[\'record_added\'\], condition: (ctx) =\> ctx.streak \>= 3 }, { id: \'stk-003\', title: \'七日之誓\', description: \'你已经坚持了一整周。\', category: \'stk\', rarity: \'rare\', events: \[\'record_added\'\], condition: (ctx) =\> ctx.streak \>= 7 }, // \... 其余成就按相同结构定义\];\`\`\`context 对象由引擎在检测时动态构建，包含：· totalRecords：总记录数· streak：当前连续学习天数· totalDuration：累计总学习时长（分钟）· totalQuestions：累计总刷题数· totalXP：累计总XP· subjectAbility：各学科能力值· skillMastery：各技能掌握度· examHistory：考试历史数据· profile：完整用户画像· nodes：所有知识点节点数组· textbookSearchCount：教辅搜索次数· pomodoroCount：番茄钟完成数· 等等。\-\--5. 数据存储5.1 用户画像中的成就字段在 user_profile.json 中新增：\`\`\`json{ \"achievements\": \[ { \"id\": \"stk-001\", \"unlockedAt\": 1715200000000, \"category\": \"stk\", \"rarity\": \"common\", \"title\": \"初启之日\", \"description\": \"千里之行，始于足下。\" } \]}\`\`\`5.2 成就定义文件data/achievements.json 存储完整定义（可独立加载，也可硬编码在成就模块中，但为可维护性建议独立文件）。\-\--6. UI设计6.1 解锁动画当检测到新成就解锁时，在页面中央弹出成就解锁卡片：· 卡片宽度360px，圆角16px，玻璃态背景。· 顶部显示稀有度对应的光效（青铜无，白银微光，金色闪烁，传说流光，隐藏彩虹）。· 成就图标（按类别选emoji或SVG图标）+ 标题 + 描述 + 稀有度标签。· 动画：从下方滑入，停留3秒后淡出，同时有轻微的缩放和光效。· 若同时解锁多个，依次弹出。6.2 成就墙页面从"更多"页进入"🏆 成就"。布局：· 顶部：总成就进度条（如 15/60 已解锁）。· 分类筛选按钮：全部 / 🌱坚持 / 📚博学 / 🎯精进 / 🔍探索 / 🏆传奇。· 成就网格：每行4-5个（响应式），每个成就卡片显示： · 稀有度边框和光效 · 若已解锁：彩色图标、标题、描述、解锁日期 · 若未解锁：灰色剪影，悬浮显示成就条件（隐藏成就显示"???"），以及进度（如连续学习 5/7 天）· 隐藏成就：未解锁时显示为"???"和一句神秘提示语，不透露具体条件。已解锁后才揭示。6.3 成就通知徽章底部导航"更多"图标右上角增加小红点（Badge），当有未查看的新解锁成就时显示，点进去后消失。6.4 分享功能（可选）成就墙中的每个已解锁成就，旁边可放置一个分享按钮，生成一张包含成就图标、名称和日期的精美卡片图片（使用Canvas绘制），可保存或分享到微信等。注意，此功能不要求外部API，全前端实现。\-\--7. 与现有模块的联动7.1 学习记录模块每次添加记录后，自动调用 achievementEngine.scanOnEvent(\'record_added\', context)，检查坚持类、积累类成就。7.2 画像更新后在 updateUserProfile 末尾调用 achievementEngine.scanOnEvent(\'profile_updated\', context)，检查能力突破类、特长类成就。7.3 番茄钟、搜索等在相应功能结束时，触发特定事件，引擎执行增量检查。7.4 阅读系统（如果集成）阅读系统也应有对应的阅读成就（已在设计中预留）。\-\--8. 性能与边界情况· 扫描函数耗时极短（毫秒级），无需Worker。· 上下文对象构建一次，在需要时更新部分字段。· 成就定义中用简单的数值比较和布尔逻辑，避免复杂查询。· 隐藏成就的条件函数同样定义，但UI上不展示条件。· 若用户数据极少，大量未解锁为正常现象。\-\--9. 实施步骤1. 创建 data/achievements.json 或直接内联成就定义。2. 实现 AchievementEngine 类。3. 编写各成就的 condition 函数（内联在定义中或按类别分文件）。4. 在 user_profile.json 中增加 achievements 数组。5. 在应用初始化时运行 scanAll。6. 在各个事件点挂载 scanOnEvent。7. 开发解锁动画组件。8. 开发成就墙页面。9. 测试各触发条件。\-\--10. 验证标准· 首次学习记录出现后，"初启之日"立即解锁并弹出动画。· 连续学习3天后，"三日之约"解锁。· 某技能掌握度达到80%时，"融会贯通"解锁。· 隐藏成就条件不可见，直至解锁。· 成就墙正确显示进度和未解锁提示。· 刷新页面后成就数据不丢失。\-\--11. 文件变更清单文件 操作data/achievements.json 新增js/achievements/achievement-engine.js 新增js/achievements/achievement-definitions.js 新增js/ui/achievement-toast.js 新增（解锁动画）js/ui/achievement-wall.js 新增（成就墙）js/core/profile-updater.js 修改：增加成就数据存储和扫描调用js/app.js 修改：挂载成就引擎，绑定事件data/user_profile.json 修改：新增 achievements 字段\-\--成就系统是学习RPG的情感引擎，它让数据不再是冰冷的数字，而是一个个有温度的故事。每一枚徽章，都是用户与系统共同书写的成长篇章。

学习RPG v0.13.0 开发提示词

 

自动考试推荐系统实现指南（完整版）

 

面向对象：AI编程助手（实现者）

目标版本：v0.13.0

依赖：v0.12.0 成就系统、v0.11.0 低输入负担与教辅联动、v0.10.0 智能复习推荐、v0.9.0 三层技能体系、v0.8.0 自适应经验值引擎

预计代码量：约1600行新增/重构

核心目标：建立周期性的综合检测提醒机制，帮助用户在最佳时机通过模拟考试检验真实水平，避免日常刷题掩盖的"假性熟练"和"知识孤岛"问题

 

1\. 版本背景与目标

 

1.1 日常刷题 vs 综合考试

 

日常学习（尤其是按章节刷题）存在一个普遍问题：用户在做某个知识点的练习时，大脑处于"热启动"状态------刚刚复习过相关概念，正确率自然偏高。但真实考试是"冷启动"的------需要跨技能、跨章节地提取知识。这种冷提取能力，才是考场上的真实水平。

 

目前的系统能够：

 

· 追踪每个知识点的温度变化

· 检测假性熟练（连续高正确率但极低订正时间）

· 计算技能掌握度

· 生成复习建议

 

但缺少一个关键环节：主动提醒用户进行综合检测。用户可能在日常刷题中自我感觉良好，直到真正考试才发现问题。

 

1.2 v0.13.0 目标

 

建立自动考试推荐引擎，实现：

 

· 多条件复合触发：基于时间、累积学习量、技能成长速度、假性熟练警告等多信号判断是否需要考试

· 用户偏好学习：根据历史考试记录，自动推荐用户偏好的考试时段

· 考试内容智能建议：综合薄弱技能和核心知识点，推荐应覆盖的检测范围

· 考试结果联动：考试成绩自动纳入经验值计算，并与历史对比生成进步分析

 

实现后，系统会在合适的时机主动弹出一张卡片："你已经连续学习了3周，本周六上午（你通常的考试时间）要不要做一套综合试卷？"

 

2\. 数据结构扩展

 

2.1 用户画像新增字段

 

在 user_profile.json 中新增：

 

\`\`\`json

{

\"examRecommendation\": {

\"lastExamDate\": null,

\"lastExamSubject\": null,

\"preferredExamDay\": null,

\"preferredExamTime\": null,

\"examHistory\": \[\],

\"recommendationHistory\": \[\]

}

}

\`\`\`

 

examHistory 结构：

 

\`\`\`javascript

{

date: \"2026-05-15\",

subject: \"logos\",

accuracy: 78,

totalScore: 150,

obtainedScore: 117,

previousBest: 75,

triggeredBy: \"user\" \| \"system_recommendation\"

}

\`\`\`

 

recommendationHistory 结构：

 

\`\`\`javascript

{

generatedAt: 1715200000000,

subject: \"logos\",

reason: \"time_interval\", // 触发原因代码

userAction: \"accepted\" \| \"dismissed\" \| \"snoozed\",

snoozedUntil: null

}

\`\`\`

 

2.2 考试触发条件参数

 

在用户画像的 recommendationParams 中扩展：

 

\`\`\`json

{

\"examTrigger\": {

\"minDaysSinceLastExam\": 14,

\"minStudyHoursSinceLastExam\": 15,

\"rapidGrowthSkillsCount\": 3,

\"rapidGrowthMasteryIncrease\": 10,

\"pseudoMasteryWarningCount\": 3,

\"temperatureAnomalyThreshold\": 0.3

}

}

\`\`\`

 

3\. 触发条件引擎

 

3.1 五大触发条件

 

考试推荐的触发不是单一条件的，而是多信号融合的复合判断。系统维护一个"考试需求指数"（0-100），由以下因素加权计算：

 

条件一：时间周期性（权重30%）

 

距上次考试已过天数超过 minDaysSinceLastExam（默认14天）。

 

\`\`\`javascript

function calcTimeFactor(lastExamDate, params) {

if (!lastExamDate) return 1.0; // 从未考过，强烈建议

const daysSince = (Date.now() - new Date(lastExamDate).getTime()) / 86400000;

const threshold = params.minDaysSinceLastExam \|\| 14;

if (daysSince \>= threshold \* 2) return 1.0; // 超过两倍阈值，迫切

if (daysSince \>= threshold) return 0.7;

if (daysSince \>= threshold \* 0.7) return 0.3;

return 0.0;

}

\`\`\`

 

条件二：累积学习量（权重25%）

 

自上次考试以来，累计学习时长超过 minStudyHoursSinceLastExam（默认15小时）。

 

\`\`\`javascript

function calcVolumeFactor(lastExamDate, records, params) {

const since = lastExamDate ? new Date(lastExamDate).getTime() : 0;

const recentRecords = records.filter(r =\> new Date(r.timestamp).getTime() \> since);

const totalHours = recentRecords.reduce((s, r) =\> s + (r.durationMinutes \|\| 0), 0) / 60;

const threshold = params.minStudyHoursSinceLastExam \|\| 15;

if (totalHours \>= threshold \* 2) return 1.0;

if (totalHours \>= threshold) return 0.7;

return Math.min(0.3, totalHours / threshold \* 0.3);

}

\`\`\`

 

条件三：技能快速进步（权重20%）

 

过去7天内，有超过 rapidGrowthSkillsCount 个技能的掌握度提升了 rapidGrowthMasteryIncrease 个百分点以上。表明用户处于快速成长期，综合测试可以巩固成果。

 

\`\`\`javascript

function calcGrowthFactor(subject, skillTree, nodes, profile) {

const skills = skillTree.subjects\[subject\]?.skills \|\| {};

const rapidGrowthCount = Object.keys(skills).filter(skillId =\> {

const currentMastery = calcSkillMetrics(subject, skillId, nodes, profile).mastery;

const previousMastery = getHistoricalMastery(subject, skillId, 7); // 7天前

return (currentMastery - previousMastery) \>= 10;

}).length;

if (rapidGrowthCount \>= 3) return 1.0;

if (rapidGrowthCount \>= 2) return 0.6;

if (rapidGrowthCount \>= 1) return 0.3;

return 0.0;

}

\`\`\`

 

条件四：假性熟练警告累积（权重15%）

 

v0.10.0中实现的假性熟练检测结果被复用。如果被标记为"疑似假性掌握"的知识点超过阈值，强烈建议考试。

 

\`\`\`javascript

function calcPseudoMasteryFactor(nodes, allRecords, profile) {

const params = profile.recommendationParams \|\| {};

const threshold = params.pseudoMasteryWarningCount \|\| 3;

const pseudoCount = nodes.filter(n =\> detectPseudoMastery(n, allRecords, profile)).length;

if (pseudoCount \>= threshold \* 2) return 1.0;

if (pseudoCount \>= threshold) return 0.7;

return Math.min(0.3, pseudoCount / threshold \* 0.3);

}

\`\`\`

 

条件五：温度分布异常（权重10%）

 

大量知识点温度集中在50-65%区间（温热但不稳固），这是"即将大规模遗忘"的前兆。

 

\`\`\`javascript

function calcTemperatureAnomalyFactor(nodes) {

const now = Date.now();

const temps = nodes.map(n =\> getCurrentTemp(n, now));

const inRiskZone = temps.filter(t =\> t \>= 50 && t \<= 65).length;

const ratio = temps.length \> 0 ? inRiskZone / temps.length : 0;

if (ratio \>= 0.5) return 1.0; // 超过一半在风险区

if (ratio \>= 0.3) return 0.6;

return 0.0;

}

\`\`\`

 

综合考试需求指数：

 

\`\`\`javascript

function calcExamNeedIndex(subject, context) {

const params = context.profile.recommendationParams?.examTrigger \|\| {};

let total = 0;

total += calcTimeFactor(context.lastExamDate, params) \* 30;

total += calcVolumeFactor(context.lastExamDate, context.allRecords, params) \* 25;

total += calcGrowthFactor(subject, context.skillTree, context.nodes, context.profile) \* 20;

total += calcPseudoMasteryFactor(context.nodes, context.allRecords, context.profile) \* 15;

total += calcTemperatureAnomalyFactor(context.nodes) \* 10;

return Math.min(100, total);

}

\`\`\`

 

当综合指数超过60分时，触发考试推荐。指数越高，推荐的紧迫性越强（在UI上表现为不同的措辞和颜色）。

 

4\. 用户偏好学习

 

4.1 考试时段偏好

 

从历史考试记录中提取用户最常进行考试的时段。

 

\`\`\`javascript

function learnExamPreference(profile) {

const history = profile.examRecommendation?.examHistory \|\| \[\];

if (history.length \< 2) return null;

// 分析最常考试的星期几

const dayCount = {};

const hourCount = {};

history.forEach(exam =\> {

const date = new Date(exam.date);

const day = date.getDay(); // 0=周日, 6=周六

const hour = date.getHours();

dayCount\[day\] = (dayCount\[day\] \|\| 0) + 1;

hourCount\[Math.floor(hour / 4)\] = (hourCount\[Math.floor(hour / 4)\] \|\| 0) + 1;

});

const preferredDay = Object.entries(dayCount).sort((a, b) =\> b\[1\] - a\[1\])\[0\];

const preferredSlot = Object.entries(hourCount).sort((a, b) =\> b\[1\] - a\[1\])\[0\];

const dayNames = \[\'周日\', \'周一\', \'周二\', \'周三\', \'周四\', \'周五\', \'周六\'\];

const slotNames = \[\'上午\', \'下午\', \'晚上\', \'深夜\'\];

return {

day: parseInt(preferredDay\[0\]),

dayName: dayNames\[parseInt(preferredDay\[0\])\],

slot: parseInt(preferredSlot\[0\]),

slotName: slotNames\[parseInt(preferredSlot\[0\])\]

};

}

\`\`\`

 

如果没有足够历史数据，默认推荐周日（用户最可能空闲的时间）。

 

4.2 推荐时机计算

 

\`\`\`javascript

function calcNextExamDate(profile) {

const preference = learnExamPreference(profile);

const now = new Date();

if (!preference) {

// 默认：下个周日

const daysUntilSunday = (7 - now.getDay()) % 7 \|\| 7;

const nextSunday = new Date(now);

nextSunday.setDate(now.getDate() + daysUntilSunday);

nextSunday.setHours(9, 0, 0, 0);

return nextSunday;

}

// 找到最近的偏好日

const currentDay = now.getDay();

let daysUntil = preference.day - currentDay;

if (daysUntil \<= 0) daysUntil += 7;

const targetDate = new Date(now);

targetDate.setDate(now.getDate() + daysUntil);

// 设置偏好时段

const hourMap = { 0: 8, 1: 14, 2: 19, 3: 22 };

targetDate.setHours(hourMap\[preference.slot\] \|\| 9, 0, 0, 0);

return targetDate;

}

\`\`\`

 

5\. 考试内容推荐

 

当用户接受考试建议后，系统从教辅库和技能树中自动选出一套均衡的检测内容。

 

5.1 选题原则

 

· 覆盖均衡：各技能按考试权重分配题量

· 薄弱优先：掌握度低的技能，在均衡基础上多分配1-2道题

· 温度考虑：温度过低（\<40%）的知识点已被系统判定为"遗忘"，但仍可包含1道以检测真实冷启动能力

· 避免超纲：只从用户已学过的章节中选题（有学习记录的章节）

 

5.2 内容生成算法

 

\`\`\`javascript

function generateExamContent(subject, skillTree, nodes, profile, allRecords) {

const skills = skillTree.subjects\[subject\]?.skills \|\| {};

const totalQuestions = 20; // 默认20道题

// 1. 按考试权重分配基础题数

const allocation = {};

let totalWeight = 0;

for (const \[skillId, skillDef\] of Object.entries(skills)) {

totalWeight += skillDef.examWeight \|\| 0;

}

for (const \[skillId, skillDef\] of Object.entries(skills)) {

const weight = skillDef.examWeight \|\| 0;

allocation\[skillId\] = Math.round((weight / totalWeight) \* totalQuestions \* 0.8); // 80%按权重

}

// 2. 给薄弱技能额外加题

const remaining = totalQuestions - Object.values(allocation).reduce((a,b) =\> a+b, 0);

const sortedByWeakness = Object.entries(allocation)

.map((\[skillId\]) =\> {

const metrics = calcSkillMetrics(subject, skillId, nodes, profile);

return { skillId, mastery: metrics.mastery };

})

.sort((a, b) =\> a.mastery - b.mastery);

for (let i = 0; i \< Math.min(remaining, sortedByWeakness.length); i++) {

allocation\[sortedByWeakness\[i\].skillId\]++;

}

// 3. 为每个技能选择具体的知识点

const examSections = \[\];

for (const \[skillId, count\] of Object.entries(allocation)) {

if (count \<= 0) continue;

// 获取该技能下所有已学过的知识点

const skillNodes = nodes.filter(n =\> n.skillId === skillId && n.studyCount \> 0);

if (skillNodes.length === 0) continue;

// 按温度排序，优先选温度适中的（40-80%），这是最有检测价值的知识点

const now = Date.now();

const candidates = skillNodes

.map(n =\> ({ node: n, temp: getCurrentTemp(n, now) }))

.sort((a, b) =\> {

const aScore = Math.abs(a.temp - 60); // 离60%越近越优先

const bScore = Math.abs(b.temp - 60);

return aScore - bScore;

});

const selected = candidates.slice(0, count);

examSections.push({

skillId,

skillName: skills\[skillId\]?.name \|\| skillId,

questionCount: selected.length,

knowledgePoints: selected.map(s =\> ({

name: s.node.name,

currentTemp: s.temp,

lastStudyDate: s.node.lastStudy ? new Date(s.node.lastStudy).toISOString() : null

}))

});

}

// 4. 查找对应的教辅章节

examSections.forEach(section =\> {

section.textbookRefs = findTextbookChapters(subject, section.knowledgePoints.map(kp =\> kp.name));

});

return {

totalQuestions,

subject,

recommendedDate: calcNextExamDate(profile),

sections: examSections,

estimatedDuration: totalQuestions \* 3 // 每题预估3分钟

};

}

\`\`\`

 

6\. 推荐交互流程

 

6.1 推荐卡片

 

当考试需求指数超过阈值时，在仪表盘顶部或每日推荐区域展示考试建议卡片：

 

\`\`\`

┌────────────────────────────────────────────────┐

│ 📋 综合检测建议 │

│ │

│ 你已经连续学习 3 周，累计 22 小时。 │

│ 有 2 个技能近期进步显著，是时候综合检测了！ │

│ 检测到 4 个知识点可能存在假性熟练。 │

│ │

│ 推荐时间：本周六 上午 9:00（你的常用考试时间） │

│ 推荐科目：数学（函数与导数、几何与代数\...） │

│ 预估题量：20道 \| 预估用时：60分钟 │

│ │

│ \[查看试卷建议\] \[接受\] \[稍后再说\] │

└────────────────────────────────────────────────┘

\`\`\`

 

6.2 用户操作处理

 

"接受"：系统将推荐内容标记为 accepted，并将考试加入"待办"列表（可在仪表盘查看）。同时，系统可以生成一份PDF或可打印的练习清单（基于教辅库的章节号，用户可自行在纸质教辅中定位）。

 

"稍后再说"：记录 snoozed，3天后再次提醒。连续snooze 3次后，自动降低频率（延长至7天后提醒）。

 

"查看试卷建议"：展开详细的考试内容规划，显示各技能分配的题量和涉及的知识点，以及对应的教辅章节号，方便用户直接在教辅中找到题目。

 

6.3 考试完成后的处理

 

用户完成考试后，通过ClawBot或快速记录面板输入考试结果（/考试 数学 总分150 得分117）。系统自动：

 

1\. 将考试记录写入 data.json，activityType = \'exam\'

2\. 调用 v0.8.0 中的考试加权函数计算XP

3\. 将本次考试成绩与历史对比，生成进步分析

4\. 更新 examHistory 和 lastExamDate

5\. 触发成就检测（如"突破自我""连战连捷"）

6\. 重置考试推荐计时器

 

6.4 考试进步分析

 

在考试结果录入后，系统生成一份简短的进步报告：

 

\`\`\`

📊 本次考试 vs 上次考试

 

科目：数学

本次正确率：78% (117/150)

上次正确率：75% (112/150)

进步幅度：+3个百分点

 

各技能表现：

函数与导数：82% ↑（上次76%）

几何与代数：75% ↑（上次70%）

概率与统计：68% ↓（上次73%）

数列与归纳法：85% →（持平）

 

建议重点关注：概率与统计（连续两次下降，可能存在知识盲区）

\`\`\`

 

这份报告可展示在仪表盘或考试记录详情页。

 

7\. UI设计

 

7.1 推荐卡片设计

 

· 卡片带有紫色边框（考试主题色），左侧有一个日历图标。

· 根据考试需求指数，卡片背景颜色渐变：绿色（低紧迫）→黄色（中等）→红色（高紧迫）。

· 卡片右上角有"✕"关闭按钮，关闭等于 dismissed。

 

7.2 考试内容预览页

 

点击"查看试卷建议"进入一个模态页，展示：

 

· 各技能分配的题量条形图

· 每个技能下推荐检测的知识点列表（带温度指示）

· 对应的教辅章节号

· 预估总用时

· 底部按钮："确认接受此建议" / "修改题量分配"（允许用户自定义各技能题数）

 

7.3 考试历史页

 

从统计中心进入"📋 考试记录"，展示：

 

· 历次考试时间线

· 每次的正确率变化趋势图（折线图）

· 点击某次考试可查看详情（各技能表现、与上次对比）

 

7.4 与每日推荐的整合

 

当考试推荐被激活时，每日复习推荐会相应调整：在考试日期前的复习推荐，会优先推荐检测范围内的知识点，帮助用户"考前热身"。

 

8\. 与现有系统的集成

 

8.1 依赖模块

 

· v0.8.0：考试XP加权函数（calculateExamWeight）被复用

· v0.9.0：技能掌握度（calcSkillMetrics）被复用

· v0.10.0：假性熟练检测（detectPseudoMastery）被复用

· v0.11.0：教辅搜索（findTextbookChapters）被复用

 

8.2 调用时机

 

· 应用初始化时：检查是否需要触发考试推荐（静默计算需求指数）

· 每次添加学习记录后：更新需求指数，若超过阈值则显示卡片

· 用户画像更新后：检查技能进步和假性熟练累积

 

8.3 配置可调

 

所有触发参数存储在 user_profile.json 的 examTrigger 中，用户可在设置页调整（如"不要再推荐考试"可设为 minDaysSinceLastExam = 999）。

 

9\. 边界情况处理

 

· 如果用户从未考过试（examHistory 为空），首次推荐的触发时间缩短为7天。

· 如果用户连续dismiss考试推荐3次，系统自动将提醒频率降低一半。

· 如果所有知识点温度都很低（全科平均温度 \< 30%），系统建议优先全面复习而非考试。

· 如果某学科没有技能树定义，回退到通用的"全部知识点"建议。

· 生成考试内容时，若某技能的知识点数量不足，从相邻技能借用。

 

10\. 实施步骤与验证

 

10.1 实施步骤

 

1\. 在 user_profile.json 中新增 examRecommendation 字段。

2\. 实现五大触发条件的计算函数。

3\. 实现 calcExamNeedIndex 综合需求指数。

4\. 实现用户偏好学习函数。

5\. 实现考试内容生成算法。

6\. 开发推荐卡片UI组件。

7\. 开发考试内容预览模态页。

8\. 开发考试历史记录页。

9\. 实现考试完成后的分析生成。

10\. 集成到主引擎和应用初始化流程。

 

10.2 验证标准

 

· 距上次考试超过14天且有足够学习量时，推荐卡片出现。

· 技能快速进步或假性熟练累积时，推荐提前触发。

· 推荐时段与用户历史偏好一致。

· 生成的考试内容覆盖各技能，且题量分配合理。

· 考试结果录入后正确生成进步分析。

· 用户dismiss推荐后，不会反复骚扰。

 

11\. 文件变更清单

 

文件 操作

js/decision/exam-trigger.js 新增（触发条件引擎）

js/decision/exam-content-generator.js 新增（考试内容生成）

js/decision/exam-preference-learner.js 新增（用户偏好学习）

js/ui/exam-recommend-card.js 新增（推荐卡片UI）

js/ui/exam-content-preview.js 新增（考试内容预览）

js/ui/exam-history.js 新增（考试历史页）

js/core/profile-updater.js 修改：新增examHistory更新

data/user_profile.json 修改：新增examRecommendation字段

js/app.js 修改：挂载考试推荐模块

 

\-\--

 

考试推荐系统是学习RPG的"体检中心"，它让用户定期跳出日常刷题的舒适区，在模拟真实考试的环境中检验学习成果。与每日复习推荐形成互补------一个管"日常保健"，一个管"定期体检"。

学习RPG v0.14.0 开发提示词学习统计系统实现指南（完整版）面向对象：AI编程助手（实现者）目标版本：v0.14.0依赖：v0.13.0 自动考试推荐、v0.12.0 成就系统、v0.11.0 教辅联动、v0.10.0 智能复习推荐、v0.9.0 三层技能体系、v0.8.0 自适应经验值引擎预计代码量：约1500行新增/重构核心目标：为用户提供时间、学科、效率三大维度的宏观学习分析，通过丰富的图表和可下钻的数据层，让用户深度理解自己的学习行为模式1. 版本背景与目标1.1 当前状态前几个版本积累了丰富的学习数据（记录、温度、XP、技能掌握度等），但用户缺少一个集中的"全局看板"来回答以下问题：· 我这周/这个月学了多久？各科时间分配是怎样的？· 我的刷题数量和正确率是如何变化的？· 学习效率是上升还是下降？· 做题和订正的时间比例是否合理？· 我一天中哪个时段学习效率最高？1.2 v0.14.0 目标构建一个多维度、可交互的统计中心，包含：· 时间维度：累计总览、日/周/月趋势图、学习时段热力图· 学科维度：各科时长分布、刷题量与正确率对比、技能成长曲线· 效率维度：学习效率散点图、做题/订正比例分析、XP获取效率· 所有图表支持点击下钻，从宏观数据直达具体记录2. 数据结构准备统计系统不新增数据文件，完全基于现有的 data.json（学习记录）和 user_profile.json（画像参数）进行计算。所有统计指标均为派生数据，在加载时动态聚合。2.1 时间聚合工具函数为便于统计，需要一组通用的时间聚合函数。\`\`\`javascript// 将记录按日分组function groupRecordsByDay(records) { const groups = {}; records.forEach(r =\> { const day = new Date(r.timestamp).toISOString().slice(0, 10); if (!groups\[day\]) groups\[day\] = \[\]; groups\[day\].push(r); }); return groups;}// 按周分组（周一至周日）function groupRecordsByWeek(records) { const groups = {}; records.forEach(r =\> { const date = new Date(r.timestamp); const dayOfWeek = date.getDay(); const monday = new Date(date); monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); const weekKey = monday.toISOString().slice(0, 10); if (!groups\[weekKey\]) groups\[weekKey\] = \[\]; groups\[weekKey\].push(r); }); return groups;}// 按月分组function groupRecordsByMonth(records) { const groups = {}; records.forEach(r =\> { const month = new Date(r.timestamp).toISOString().slice(0, 7); if (!groups\[month\]) groups\[month\] = \[\]; groups\[month\].push(r); }); return groups;}// 按小时分组（用于热力图）function groupRecordsByHour(records) { const hours = Array.from({ length: 24 }, () =\> \[\]); records.forEach(r =\> { const hour = new Date(r.timestamp).getHours(); hours\[hour\].push(r); }); return hours;}// 按星期几分组function groupRecordsByDayOfWeek(records) { const days = Array.from({ length: 7 }, () =\> \[\]); records.forEach(r =\> { const day = new Date(r.timestamp).getDay(); days\[day\].push(r); }); return days;}\`\`\`3. 时间维度统计3.1 累计总览从所有记录中计算以下指标：\`\`\`javascriptfunction calcTimeOverview(records, profile) { const totalMinutes = records.reduce((s, r) =\> s + (r.durationMinutes \|\| 0), 0); const totalRecords = records.length; const totalQuestions = records.reduce((s, r) =\> s + (r.details?.totalQuestions \|\| 0), 0); const totalXP = profile.totalXP \|\| 0; const totalDays = new Set(records.map(r =\> new Date(r.timestamp).toISOString().slice(0, 10))).size; // 有正确率记录的平均正确率 const accuracyRecords = records.filter(r =\> r.accuracy != null); const avgAccuracy = accuracyRecords.length \> 0 ? Math.round(accuracyRecords.reduce((s, r) =\> s + r.accuracy, 0) / accuracyRecords.length) : null; return { totalMinutes, totalHours: Math.round(totalMinutes / 60 \* 10) / 10, totalRecords, totalQuestions, totalXP, totalDays, avgAccuracy };}\`\`\`3.2 日/周/月趋势图生成时间序列数据，供 ECharts 绑定。\`\`\`javascriptfunction calcDailyTrend(records, days = 30) { const dailyGroups = groupRecordsByDay(records); const now = new Date(); const result = \[\]; for (let i = days - 1; i \>= 0; i\--) { const date = new Date(now); date.setDate(date.getDate() - i); const key = date.toISOString().slice(0, 10); const dayRecords = dailyGroups\[key\] \|\| \[\]; result.push({ date: key, duration: dayRecords.reduce((s, r) =\> s + (r.durationMinutes \|\| 0), 0), questions: dayRecords.reduce((s, r) =\> s + (r.details?.totalQuestions \|\| 0), 0), records: dayRecords.length, avgAccuracy: dayRecords.filter(r =\> r.accuracy != null).length \> 0 ? Math.round(dayRecords.filter(r =\> r.accuracy != null).reduce((s, r) =\> s + r.accuracy, 0) / dayRecords.filter(r =\> r.accuracy != null).length) : null }); } return result;}// 周趋势和月趋势同理，基于对应的分组函数\`\`\`3.3 学习时段热力图以小时（行）和星期几（列）为轴，展示学习时长分布的二维矩阵。\`\`\`javascriptfunction calcHeatmapData(records) { const matrix = Array.from({ length: 7 }, () =\> Array(24).fill(0)); records.forEach(r =\> { const date = new Date(r.timestamp); const dayOfWeek = date.getDay(); // 0=周日, 6=周六 const hour = date.getHours(); matrix\[dayOfWeek\]\[hour\] += (r.durationMinutes \|\| 0); }); // 转换为 ECharts heatmap 格式 const data = \[\]; const dayNames = \[\'周日\', \'周一\', \'周二\', \'周三\', \'周四\', \'周五\', \'周六\'\]; for (let day = 0; day \< 7; day++) { for (let hour = 0; hour \< 24; hour++) { if (matrix\[day\]\[hour\] \> 0) { data.push(\[hour, day, matrix\[day\]\[hour\]\]); } } } return { data, xAxis: Array.from({ length: 24 }, (\_, i) =\> \`\${i}:00\`), yAxis: dayNames, maxValue: Math.max(\...data.map(d =\> d\[2\])) };}\`\`\`热力图的颜色映射：0 白色 → 低值浅蓝 → 中值黄 → 高值红，清晰展示最佳学习时段。4. 学科维度统计4.1 各科时长占比\`\`\`javascriptfunction calcSubjectDistribution(records) { const subjectMinutes = {}; records.forEach(r =\> { const sub = r.subject; if (!subjectMinutes\[sub\]) subjectMinutes\[sub\] = 0; subjectMinutes\[sub\] += (r.durationMinutes \|\| 0); }); const total = Object.values(subjectMinutes).reduce((a, b) =\> a + b, 0); const result = Object.entries(subjectMinutes).map((\[key, minutes\]) =\> ({ subject: key, name: SUBJECT_NAMES\[key\] \|\| key, minutes, percentage: total \> 0 ? Math.round(minutes / total \* 100) : 0 })); // 按时长降序 result.sort((a, b) =\> b.minutes - a.minutes); return { data: result, total };}\`\`\`此数据可直接用于饼图或环形图。4.2 各科刷题量与正确率对比\`\`\`javascriptfunction calcSubjectPracticeStats(records) { const stats = {}; records.forEach(r =\> { const sub = r.subject; if (!stats\[sub\]) stats\[sub\] = { totalQuestions: 0, totalCorrect: 0, accuracySum: 0, accuracyCount: 0 }; stats\[sub\].totalQuestions += (r.details?.totalQuestions \|\| 0); stats\[sub\].totalCorrect += (r.details?.correctCount \|\| 0); if (r.accuracy != null) { stats\[sub\].accuracySum += r.accuracy; stats\[sub\].accuracyCount++; } }); return Object.entries(stats).map((\[key, stat\]) =\> ({ subject: key, name: SUBJECT_NAMES\[key\] \|\| key, totalQuestions: stat.totalQuestions, totalCorrect: stat.totalCorrect, accuracy: stat.accuracyCount \> 0 ? Math.round(stat.accuracySum / stat.accuracyCount) : null }));}\`\`\`对比条形图：横轴为学科，两条柱分别表示刷题量和正确率（或双轴图）。4.3 技能成长曲线对于选定的学科和技能，展示过去N天的掌握度变化趋势。这需要访问用户画像的历史快照。如果用户画像没有历史版本，可以基于记录模拟重算（在引擎中已有该能力），在统计模块中提供一个轻量级回放：从指定日期起，以每日为单位，逐步应用该日记录，计算当时的技能掌握度。\`\`\`javascriptfunction calcSkillGrowthCurve(subject, skillId, records, nodes, profile, skillTree, days = 30) { const curve = \[\]; const now = Date.now(); for (let i = days - 1; i \>= 0; i\--) { const date = new Date(now); date.setDate(date.getDate() - i); const dayKey = date.toISOString().slice(0, 10); const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999); // 筛选当天及之前的记录 const recordsUpToDay = records.filter(r =\> new Date(r.timestamp).getTime() \<= dayEnd.getTime()); // 模拟计算当时的技能掌握度（使用快照） const snapshot = simulateProgression(recordsUpToDay, profile, skillTree); const metrics = calcSkillMetrics(subject, skillId, snapshot.nodes, snapshot.profile); curve.push({ date: dayKey, mastery: metrics.mastery, level: metrics.level, nodeCount: metrics.nodeCount }); } return curve;}\`\`\`注意，simulateProgression 是一个重放函数，它取当前画像参数为初始值，按时间顺序逐条处理记录，更新节点状态。这一功能在 v0.8.0 的 computeAllXP 中已有原型，可复用其逻辑。4.4 学科贡献度分析计算每个学科的XP贡献占比，以及每个技能对该学科XP的贡献，形成树图或旭日图数据。5. 效率维度统计5.1 学习效率趋势每次学习的效率值已在 v0.8.0 中计算（overallE）。统计系统将这些效率值按时间绘制散点图。\`\`\`javascriptfunction calcEfficiencyTrend(records) { return records .filter(r =\> r.computedXP != null \|\| r.accuracy != null) .map(r =\> ({ date: new Date(r.timestamp).toISOString(), duration: r.durationMinutes, accuracy: r.accuracy, xp: r.computedXP, // 从记录中提取或重算效率（如果效率值存储了则直接取，否则在统计模块中重算） efficiency: r.calculatedEfficiency \|\| null }));}\`\`\`在图表中，X轴为时间，Y轴为效率值，每个散点为一个学习记录。可叠加7日移动平均线，展示效率趋势。5.2 做题 vs 订正时间比例\`\`\`javascriptfunction calcPracticeReviewRatio(records) { const totalPractice = records.reduce((s, r) =\> s + (r.practiceMinutes \|\| 0), 0); const totalReview = records.reduce((s, r) =\> s + (r.reviewMinutes \|\| 0), 0); const total = totalPractice + totalReview; return { practice: totalPractice, review: totalReview, practiceRatio: total \> 0 ? Math.round(totalPractice / total \* 100) : 0, reviewRatio: total \> 0 ? Math.round(totalReview / total \* 100) : 0, // 按月趋势 monthlyTrend: calcMonthlyRatioTrend(records) };}\`\`\`饼图展示总体比例，折线图展示按月变化。5.3 XP获取效率XP获取效率 = XP / 时长（分钟），可按学科、按活动类型、按时间展示。\`\`\`javascriptfunction calcXPEfficiency(records) { const bySubject = {}; const byActivity = {}; records.filter(r =\> r.computedXP != null && r.durationMinutes \> 0).forEach(r =\> { const sub = r.subject; if (!bySubject\[sub\]) bySubject\[sub\] = { totalXP: 0, totalMin: 0 }; bySubject\[sub\].totalXP += r.computedXP; bySubject\[sub\].totalMin += r.durationMinutes; const act = r.activityType; if (!byActivity\[act\]) byActivity\[act\] = { totalXP: 0, totalMin: 0 }; byActivity\[act\].totalXP += r.computedXP; byActivity\[act\].totalMin += r.durationMinutes; }); return { bySubject: Object.entries(bySubject).map((\[k, v\]) =\> ({ key: k, xpPerMin: +(v.totalXP / v.totalMin).toFixed(2) })), byActivity: Object.entries(byActivity).map((\[k, v\]) =\> ({ key: k, xpPerMin: +(v.totalXP / v.totalMin).toFixed(2) })) };}\`\`\`柱状图展示各科/各活动类型的XP/分钟。6. 图表组件与下钻交互6.1 图表库继续使用 ECharts。统计系统为每个图表创建独立的初始化函数，数据由统计计算模块提供。6.2 下钻交互所有图表支持点击数据点下钻到具体记录列表：· 点击饼图的"数学"扇区 → 跳转到数学学科技能页，并过滤只显示该科记录· 点击热力图的某个单元格（周三 19:00） → 弹出该时段的学习记录列表· 点击趋势图的某个点 → 显示当日记录摘要下钻的实现方式：图表绑定 click 事件，调用全局的页面路由函数，传递筛选参数（如 { subject: \'logos\', date: \'2026-05-15\' }），对应页面接收参数后渲染过滤后的内容。6.3 图表配置统一为保持视觉一致，所有图表使用统一主题：· 背景色：透明· 文字色：#4a5568· 轴线色：#E5E7EB· 强调色：学科色或系统主色 #3b82f6· 图表标题、图例位置统一在顶部或底部7. UI布局设计7.1 统计中心入口从"更多"页点击"📈 学习统计"进入全屏统计面板。7.2 页面结构\`\`\`┌──────────────────────────────────────────────────┐│ ← 返回 学习统计 \[时间范围: 最近30天 ▼\] │├──────────────────────────────────────────────────┤│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ ││ │ 总时长 │ │ 总题数 │ │ 总经验 │ │ 平均正确│ ││ │ 328小时 │ │ 12,450 │ │ 58,200 │ │ 78% │ ││ └─────────┘ └─────────┘ └─────────┘ └────────┘ │├──────────────────────────────────────────────────┤│ 标签页：\[时间\] \[学科\] \[效率\] │├──────────────────────────────────────────────────┤│ （根据选中的标签页展示不同的图表） ││ ││ \[每日学习时长趋势图\] ││ \[学习时段热力图\] ││ \... │└──────────────────────────────────────────────────┘\`\`\`7.3 时间范围选择器顶部提供快捷按钮：最近7天 / 30天 / 3个月 / 全部，以及自定义日期范围选择器。切换后所有图表数据重新聚合并刷新。7.4 响应式· 桌面端：双列布局，左侧图表右侧图表或并排· 平板端：单列布局，图表宽度自适应· 移动端：图表高度缩小，卡片式排列8. 性能优化8.1 数据聚合缓存统计计算可能遍历全量记录。对于大数据量，可采用以下策略：· 聚合结果缓存：按时间范围缓存计算结果，时间范围不变则不重算· 增量更新：新增记录后只更新受影响的天/周/月聚合，而非全量重算8.2 Web Worker如果记录数量超过500条，将聚合计算放入Web Worker，避免阻塞UI线程。8.3 图表懒加载统计页面首次加载时只渲染可见区域的图表（如时间标签页），切换到学科标签页时才初始化学科图表。8.4 虚拟滚动如果需要展示记录列表（如下钻后的记录列表），使用虚拟滚动技术只渲染可视行。9. 与现有系统的集成9.1 数据获取统计模块通过全局数据存储获取 records 和 profile，不直接读取文件。9.2 路由集成在"更多"页增加"📈 学习统计"列表项，点击后通过页面路由系统导航到统计中心。统计中心作为独立的全屏模态页展示。9.3 图表组件复用ECharts 图表实例在页面离开时 dispose，进入时重新初始化，避免内存泄漏。10. 实施步骤与验证10.1 实施步骤1. 实现时间聚合工具函数2. 实现时间维度统计计算（总览、趋势、热力图）3. 实现学科维度统计计算（时长分布、刷题对比、技能成长）4. 实现效率维度统计计算（趋势、比例、XP效率）5. 开发统计中心UI布局和标签页切换6. 开发各图表组件（ECharts配置）7. 实现图表下钻交互8. 添加时间范围选择器9. 性能优化（缓存、懒加载）10. 集成到"更多"页路由10.2 验证标准· 总时长、总题数等总览指标与手动计算一致· 趋势图数据点日期连续，数值正确· 热力图颜色分布合理，能识别出最佳学习时段· 学科饼图比例与实际数据吻合· 效率散点图正确展示每次学习效率· 切换时间范围后图表自动刷新· 点击图表可下钻到具体记录11. 文件变更清单文件 操作js/stats/time-stats.js 新增（时间维度统计）js/stats/subject-stats.js 新增（学科维度统计）js/stats/efficiency-stats.js 新增（效率维度统计）js/stats/aggregator.js 新增（聚合工具函数）js/stats/chart-builder.js 新增（ECharts图表工厂）js/ui/stats-dashboard.js 新增（统计中心UI）js/ui/stats-heatmap.js 新增（热力图组件）js/app.js 修改：增加统计路由index.html 修改：增加统计中心DOM容器12. 预留接口· getStatsData(range)：外部可调用的统一接口，返回所有统计指标的JSON，供未来的API或ClawBot使用· 统计报告导出：未来可基于这些数据生成PDF或Markdown格式的学习报告\-\--统计系统是学习RPG的"数据眼镜"，它将离散的学习记录汇聚成有意义的模式和趋势，让用户不仅看到单次学习的细节，更能俯瞰自己学习的全局图景。通过时间、学科、效率三个维度，用户能够全面把握自己的学习状态，做出更明智的策略调整。

学习RPG v0.15.0 开发提示词UI全面重构实现指南（完整版）面向对象：AI编程助手（实现者）目标版本：v0.15.0依赖：v0.14.0 统计系统、v0.13.0 自动考试推荐、v0.12.0 成就系统、v0.11.0 教辅联动、v0.10.0 智能复习推荐、v0.9.0 三层技能体系、v0.8.0 自适应经验值引擎预计代码量：约2500行新增/重构（主要为CSS和UI组件JS）核心目标：彻底重构信息架构与视觉体验，建立清晰、美观、可扩展的界面体系，将所有功能收纳进4个主导航，实现抽屉式次级页面和统一的视觉语言1. 版本背景与目标1.1 现状问题经过前面7个版本的迭代，学习RPG已经积累了丰富的功能：经验值引擎、技能系统、智能推荐、成就、考试推荐、统计等。然而当前界面仍然是 v0.7.2 的框架------底部5个Tab平铺，概览页信息杂糅，缺少清晰的层级和收纳机制。随着功能增加，界面显得越来越拥挤。1.2 v0.15.0 目标彻底重构UI/UX，建立一套可支撑未来所有功能扩展的信息架构和视觉体系：· 底部4主导航：仪表盘、技能、记录、更多· 清晰的信息层级：核心功能直达，低频功能通过"更多"页收纳· 统一的视觉语言：玻璃态、学科色、温度色、稀有度色体系化· 流畅的交互体验：页面切换动画、卡片悬浮、数字滚动、成就解锁特效· 完整的响应式支持：桌面端、平板端、手机端三套布局· 深色模式：跟随系统或手动切换· 可访问性：ARIA标签、键盘导航、屏幕阅读器支持2. 信息架构重构2.1 底部主导航（4项）图标 标签 路由 功能定位📊 仪表盘 #dashboard 每日快照、今日推荐、本周摘要、最近动态🧠 技能 #skills 学科技能雷达图、技能卡片列表、复习建议📝 记录 #log 学习日志时间线、教辅搜索与快速录入⚙️ 更多 #more 统计中心、成就墙、知识库、考试记录、设置、关于2.2 全局可访问元素· 右下角悬浮按钮（FAB）：快速启动番茄钟或快速记录面板· 全局命令面板：Ctrl/Cmd + K 唤起，搜索教辅章节、知识点、历史记录· 顶部状态栏：显示当前页面标题、连续学习天数火焰图标、新成就红点2.3 页面路由系统\`\`\`javascript// 简易路由，基于 hashclass Router { constructor() { this.pages = new Map(); this.currentPage = null; window.addEventListener(\'hashchange\', () =\> this.navigate()); } register(name, pageComponent) { this.pages.set(name, pageComponent); } navigate() { const hash = location.hash.slice(1) \|\| \'dashboard\'; const page = this.pages.get(hash); if (page && page !== this.currentPage) { this.currentPage?.hide(); page.show(); this.currentPage = page; } // 更新底部导航激活状态 document.querySelectorAll(\'.nav-item\').forEach(item =\> { item.classList.toggle(\'active\', item.dataset.route === hash); }); }}\`\`\`每个页面组件实现 show() 和 hide() 方法，show() 中执行数据刷新和图表渲染。3. 页面详细设计3.1 仪表盘（Dashboard）定位：用户打开系统后的第一眼，展示今日核心指标和最重要的行动建议。布局（垂直滚动）：A. 顶部问候栏· 根据时段显示"☀️ 早上好 / 🌤️ 下午好 / 🌙 晚上好"，右侧显示连续学习天数火焰图标和数字。· 若有未查看的新成就，火焰图标旁显示红点。B. 今日核心指标卡片（3列网格）· 卡片1：今日学习总时长（大数字 + 环形进度条，目标值为日常容量）· 卡片2：今日获得经验值（大数字 + 迷你趋势线 vs 昨日）· 卡片3：今日刷题总数 / 平均正确率（两个数字并排）每张卡片使用玻璃态背景，悬浮时轻微上浮。卡片内部数据实时刷新（每60秒或手动下拉刷新）。C. 每日推荐区域· 来自 v0.10.0 的复习推荐和 v0.13.0 的考试推荐（若有）。· 显示为横向滚动的推荐卡片组：紧急复习卡片（红色边框微光）、提分潜力卡片（蓝色边框）、考试建议卡片（紫色边框）。· 每张卡片底部有操作按钮："去复习"、"查看详情"、"接受考试建议"等。D. 本周摘要图表· 过去7天的学习时长柱状图（ECharts），简洁小巧。· 点击可跳转到统计中心的时间维度。E. 最近学习动态· 最近5条记录的时间线，每条显示：时间、学科颜色圆点、知识点标签、时长、正确率。· 点击可跳转到记录页并定位到该记录。3.2 技能页（Skills）定位：展示三层技能结构，提供能力诊断和复习建议。布局：A. 顶部学科筛选器· 水平滚动的学科标签（全部、数学、语文、英语、物理、化学、生物、政治、历史、地理）。· 选中学科后，下方雷达图和技能卡片随之切换。· "全部"模式下，雷达图显示各学科技能能力值的综合视图（每个学科一个数据点）。B. 技能雷达图· 使用 ECharts 雷达图，展示所选学科各技能的掌握度。· 雷达图上每个节点显示技能名称和百分比。· 若某技能是特长（来自 v0.9.0 的特长判定），该节点用金色星标标注。C. 技能卡片列表· 按掌握度降序排列。· 每张卡片显示： · 技能名称 · 掌握度进度条（渐变色：低红→中黄→高绿） · 下属知识点数量（已掌握/总数） · 最近温度变化趋势迷你图标（箭头向上/向下/持平） · 若是特长，右上角显示星标图标· 点击卡片展开下属知识点列表（可切换"全部/需复习/已掌握"）。· 在知识点列表中，每个知识点显示：名称、当前温度、温度条、最近学习日期、快捷复习按钮。D. 复习建议面板· 从右侧滑入的抽屉面板（桌面端）或底部滑出的面板（移动端）。· 展示 v0.10.0 生成的最优复习组合，每项含预计耗时和预期恢复温度。· 底部有"一键标记完成"按钮，批量生成复习记录。3.3 记录页（Log）定位：学习日志展示 + 快速录入。布局：A. 顶部搜索栏· 突出的教辅章节搜索框（核心新功能），样式类似全局命令面板。· 输入关键词后，下拉联想教辅章节，选中后弹出"快速记录"确认卡片（详见 v0.11.0）。B. 筛选器· 学科多选、活动类型多选、日期范围选择器。· 快捷切换按钮："仅看有错"、"仅看无时长"、"仅看无正确率"，帮助用户发现遗漏的数据。· 筛选后列表实时过滤。C. 记录列表· 使用虚拟滚动技术渲染（若记录数 \> 200）。· 每条记录显示为一行或卡片： · 左侧：时间（小时:分钟） · 学科颜色圆点 · 知识点标签（多知识点横向排列，不同学科不同底色） · 活动类型图标 · 时长 + 正确率 + XP · 右侧：编辑按钮（点击进入内联编辑模式）、删除按钮· 内联编辑模式：点击编辑后，该行变为可编辑状态，单元格变为输入框或下拉菜单。修改后自动保存，该行短暂高亮绿色表示成功。D. 批量操作· 每行左侧有复选框，表头有全选复选框。· 底部浮现操作栏："批量删除"、"批量修改学科"、"导出选中"。· 删除操作有3秒撤销期。3.4 更多页（More）定位：收纳非高频但必要的功能。布局：一个清晰的列表/卡片菜单，每项带图标、标题和简短描述。图标 标题 描述 点击跳转📈 学习统计 时长、题数、效率全维度分析 统计中心（全屏模态页）🏆 成就墙 查看所有成就与进度 成就墙（全屏模态页）📚 知识库管理 管理知识点与技能归属 知识库编辑页📋 考试记录 历次考试与进步分析 考试历史页📖 阅读记录 阅读时长与书架管理 阅读仪表盘🍅 番茄钟专注分析 专注时段统计与趋势 番茄钟分析页⚙️ 设置 主题、提示语、数据同步、备份 设置页ℹ️ 关于 版本信息与更新日志 关于模态页每个菜单项为一张大卡片，玻璃态背景，悬浮时轻微右移并有阴影增强。3.5 次级页面（全屏模态页）所有从"更多"页进入的功能，均以全屏模态页展示：· 顶部有返回按钮（←）和页面标题· 独立的滚动区域· 关闭时保存状态（如滚动位置、筛选条件）4. 全局视觉设计规范4.1 配色体系背景系统：· 浅色模式：主背景 #f8f9fc，卡片背景 rgba(255,255,255,0.85)，玻璃态边框 rgba(200,200,220,0.4)· 深色模式：主背景 #0f172a，卡片背景 rgba(30,41,59,0.85)，玻璃态边框 rgba(71,85,105,0.4)学科色（保持不变）：· 数学 #1A5FB4，语文 #E5A50A，英语 #26A269，物理 #1C71D8，化学 #813D9C，生物 #2EC27E，政治 #E01B24，历史 #B45309，地理 #059669温度色阶：· 灼热(\>95%) #FF4500，温热(80-95%) #FF8C00，温暖(60-80%) #FFD700，常温(40-60%) #62A0EA，微凉(20-40%) #6B7280，冷却(\<20%) #9CA3AF稀有度色：· 青铜 #CD7F32，白银 #C0C0C0，黄金 #FFD700，传说 #8B00FF，隐藏（彩虹渐变）功能色：· 成功/增长 #10b981，警告/注意 #f59e0b，危险/错误 #ef4444，信息/链接 #3b82f64.2 排版体系字体：Inter + Noto Sans SC，通过 Google Fonts 加载。字号层级：· 页面标题：24px / Bold· 区块标题：18px / SemiBold· 卡片标题：16px / SemiBold· 正文：14px / Regular· 辅助文字：12px / Regular· 小标签：11px / Medium数字：所有数值使用 font-variant-numeric: tabular-nums 确保等宽。4.3 动效系统页面切换：· 主导航切换：内容区淡入淡出（opacity 0.3s）配合轻微上移（translateY 10px → 0）· 模态页进入：从右滑入（translateX 100% → 0，0.3s cubic-bezier(0.4, 0, 0.2, 1)）· 模态页退出：反向滑出卡片交互：· 悬浮：transform: translateY(-2px) + 阴影增强，过渡 0.2s· 点击：transform: scale(0.98) + 轻微亮度降低数字变化：· XP、时长等关键数字变化时，使用计数动画（countUp 效果，或自写 requestAnimationFrame 递增）· 温度变化时，进度条平滑过渡（transition: width 0.6s ease）成就解锁：· 从屏幕下方中央弹入，带金色光效和缩放动画，停留3秒后淡出加载状态：· 数据加载时显示骨架屏（shimmer效果），而非空白或loading图标4.4 响应式设计断点：· 桌面端：≥1024px，最大内容宽度1200px居中，双列布局（如技能雷达图+技能卡片并排）· 平板端：768px-1023px，单列布局，图表缩小，部分交互简化为点击展开· 手机端：\<768px，完全单列，底部导航图标缩小，FAB悬浮按钮缩小，模态页全屏关键适配：· 技能雷达图：桌面端尺寸400×400，平板端300×300，手机端250×250· 记录表格：手机端改为卡片式竖排显示，隐藏部分列· 统计图表：移动端图表高度缩小，图例位置自动调整· 底部导航：手机端图标24px，标签10px；平板端图标28px，标签11px4.5 深色模式在 \<html\> 上添加 data-theme=\"dark\" 属性，CSS变量随之切换。\`\`\`css:root { \--bg-primary: #f8f9fc; \--bg-card: rgba(255,255,255,0.85); \--text-primary: #1a1a2e; \--text-secondary: #4a5568; /\* \... \*/}\[data-theme=\"dark\"\] { \--bg-primary: #0f172a; \--bg-card: rgba(30,41,59,0.85); \--text-primary: #e2e8f0; \--text-secondary: #94a3b8; /\* \... \*/}\`\`\`切换开关放在"设置"页，支持"跟随系统 / 浅色 / 深色"三种模式。跟随系统通过 matchMedia(\'(prefers-color-scheme: dark)\') 实现。4.6 可访问性· 所有交互元素添加 aria-label 或可读文本· 按钮使用 \<button\> 而非 \<div\>· 图标配合文字标签，避免纯图标按钮· 焦点状态可见（:focus-visible 轮廓）· 颜色不作为唯一的信息传达方式（温度进度条旁有数字）5. 组件化设计为提高可维护性，将常用UI模式封装为可复用的函数或Web Components（或简单的类）。5.1 玻璃卡片\`\`\`javascriptfunction createGlassCard({ title, content, footer, className }) { const card = document.createElement(\'div\'); card.className = \`glass-card \${className \|\| \'\'}\`; if (title) { const header = document.createElement(\'div\'); header.className = \'card-header\'; header.textContent = title; card.appendChild(header); } const body = document.createElement(\'div\'); body.className = \'card-body\'; body.innerHTML = content; card.appendChild(body); if (footer) { const footerEl = document.createElement(\'div\'); footerEl.className = \'card-footer\'; footerEl.innerHTML = footer; card.appendChild(footerEl); } return card;}\`\`\`5.2 进度条\`\`\`javascriptfunction createProgressBar(value, max, color, showLabel = true) { const pct = Math.min(100, Math.round((value / max) \* 100)); const bar = document.createElement(\'div\'); bar.className = \'progress-bar\'; bar.innerHTML = \` \<div class=\"progress-fill\" style=\"width:\${pct}%; background:\${color};\"\>\</div\> \`; if (showLabel) { const label = document.createElement(\'span\'); label.className = \'progress-label\'; label.textContent = \`\${pct}%\`; bar.appendChild(label); } return bar;}\`\`\`5.3 知识点标签\`\`\`javascriptfunction createKPTag(name, subjectColor) { const tag = document.createElement(\'span\'); tag.className = \'kp-tag\'; tag.textContent = name; tag.style.backgroundColor = subjectColor + \'20\'; tag.style.color = subjectColor; tag.style.border = \`1px solid \${subjectColor}40\`; return tag;}\`\`\`5.4 温度指示器\`\`\`javascriptfunction createTempIndicator(temp) { const color = getTempColor(temp); const indicator = document.createElement(\'div\'); indicator.className = \'temp-indicator\'; indicator.innerHTML = \` \<span class=\"temp-dot\" style=\"background:\${color};\"\>\</span\> \<span class=\"temp-value\" style=\"color:\${color};\"\>\${temp}%\</span\> \`; return indicator;}\`\`\`5.5 列表虚拟滚动对于记录列表和知识点列表，使用 IntersectionObserver 实现简单的虚拟滚动：只渲染可视区域内的DOM节点，大幅减少节点数。或引入轻量库（如 clusterize.js），但更建议手写以控制体积。6. 全局状态与事件6.1 状态管理继续使用简单的发布/订阅模式存储全局状态（store.js）。新增 UI 状态字段：\`\`\`javascriptconst uiState = { currentPage: \'dashboard\', selectedSubject: null, // 技能页选中的学科 selectedSkill: null, // 技能页选中的技能 showFAB: true, isDarkMode: false, isCommandPaletteOpen: false, toastQueue: \[\] // 待显示的toast消息};\`\`\`6.2 事件总线用于跨组件通信，避免直接耦合：\`\`\`javascriptconst eventBus = { \_events: {}, on(event, callback) { if (!this.\_events\[event\]) this.\_events\[event\] = \[\]; this.\_events\[event\].push(callback); }, emit(event, data) { (this.\_events\[event\] \|\| \[\]).forEach(cb =\> cb(data)); }};// 示例事件// \'record:added\' - 新记录添加// \'achievement:unlocked\' - 成就解锁// \'profile:updated\' - 画像更新// \'theme:changed\' - 主题切换// \'page:changed\' - 页面切换\`\`\`7. 与现有功能的集成7.1 原有页面迁移· 原有的概览页内容 → 迁移到仪表盘 + 技能页· 原有的技能树图谱 → 迁移到技能页的知识点详情区· 原有的遗忘曲线页 → 整合到技能页的复习建议面板内· 原有的日志页 → 迁移到记录页· 原有的设置页 → 迁移到更多页的设置· 原有的关于模态框 → 保持不变7.2 图表重用v0.14.0 的统计图表组件直接嵌入统计中心（全屏模态页），数据接口不变。7.3 快速记录面板v0.11.0 的命令面板在 v0.15.0 中作为全局组件，可通过 FAB 或快捷键唤起，不绑定特定页面。7.4 番茄钟番茄钟的FAB和悬浮面板作为全局组件，可在任何页面启动。7.5 成就系统成就解锁动画在 v0.12.0 中已实现，v0.15.0 将其动画样式统一到新的视觉体系中。8. 实施步骤8.1 创建新样式文件1. 创建 css/variables.css：CSS自定义属性（浅色/深色两套）2. 创建 css/global.css：全局重置、排版、玻璃态、动效3. 创建 css/components.css：卡片、进度条、标签、按钮、表单4. 创建 css/layout.css：网格系统、底部导航、响应式5. 更新 index.html 引用新样式文件8.2 实现路由和页面容器1. 创建 js/ui/router.js：简易hash路由2. 创建 js/ui/page-container.js：页面切换逻辑3. 创建各页面的 HTML 容器（在 index.html 中）8.3 逐个实现页面1. js/ui/dashboard.js：仪表盘2. js/ui/skills-page.js：技能页（含雷达图）3. js/ui/log-page.js：记录页（含虚拟滚动）4. js/ui/more-page.js：更多页（菜单列表）8.4 实现全局组件1. js/ui/fab.js：悬浮按钮2. js/ui/command-palette.js：全局命令面板3. js/ui/toast.js：消息提示4. js/ui/drawer.js：抽屉面板8.5 深色模式与响应式1. 实现主题切换逻辑和持久化（localStorage）2. 添加媒体查询，适配平板和手机3. 测试所有页面在各断点的显示效果8.6 集成与测试1. 将所有页面挂载到路由2. 连接数据流（store更新 → 页面刷新）3. 测试页面切换流畅度4. 测试深色模式和响应式9. 验证标准· 底部4个导航点击后页面正确切换，当前页导航高亮· 仪表盘显示今日时长、经验值、推荐卡片· 技能页雷达图正确展示技能掌握度，点击学科标签可切换· 记录页搜索教辅章节功能正常，列表可筛选、编辑、删除· 更多页菜单项点击可进入对应模态页· 深色模式切换后所有页面颜色正确· 手机端布局自动切换为单列，底部导航图标缩小· 页面切换动画流畅无闪烁· 所有页面在最新版Chrome、Safari、Firefox上正常显示10. 文件变更清单文件 操作css/variables.css 新增css/global.css 新增css/components.css 新增css/layout.css 新增js/ui/router.js 新增js/ui/page-container.js 新增js/ui/dashboard.js 新增js/ui/skills-page.js 新增js/ui/log-page.js 新增js/ui/more-page.js 新增js/ui/fab.js 新增js/ui/command-palette.js 新增js/ui/toast.js 新增js/ui/drawer.js 新增js/ui/skill-radar.js 新增（雷达图组件，从技能页逻辑独立）js/app.js 修改：初始化路由、注册页面、启动应用index.html 修改：更新DOM结构，引用新样式和脚本css/main.css 可归档或删除（内容已分散到新文件）11. 向后兼容与迁移· 旧的页面内容（如 page-overview）的HTML容器可以保留作为初始骨架，但后续由JS动态渲染替换· data.json 和 user_profile.json 格式不变，所有数据接口不变· 原有的 ECharts 图表初始化代码可以复用，只需将DOM挂载点更新为新页面的容器· ClawBot 写入的数据格式不变，不受前端UI变化影响12. 结语v0.15.0 是学习RPG从"实验性原型"走向"精致个人工具"的关键一步。通过清晰的信息架构、统一的视觉语言和流畅的交互体验，这套UI将承载前面所有版本的强大功能，并为未来 v1.0.0 的正式发布做好最后准备。重构后的界面应当让用户感觉到：这不是一个测试版的仪表盘，而是一个成熟、可信赖的个人认知操作系统。

学习RPG v1.0.0 开发提示词正式版发布与系统完善实现指南（完整版）面向对象：AI编程助手（实现者）目标版本：v1.0.0依赖：v0.15.0 UI全面重构及所有前序版本预计代码量：约1500行（主要为测试、修复、文档、性能优化）核心目标：将所有功能整合为稳定、完整、可维护的正式版本，完成全功能测试、性能优化、数据迁移兼容、完整文档编写1. 版本背景与意义1.1 从0到1的旅程经过8个版本的迭代（v0.8.0 至 v0.15.0），学习RPG已经从简单的静态仪表盘成长为拥有自适应算法、三层技能体系、智能推荐、成就系统、考试建议、统计分析和精致UI的完整个人认知操作系统。现在，是时候将所有这些模块整合为一个稳定、可靠的正式版本。1.2 v1.0.0 的定义v1.0.0 不是新增功能，而是：1. 全功能稳定化：确保所有已有功能在真实使用场景中可靠运行2. 性能达标：大数据量下响应流畅，页面加载迅速3. 数据兼容：旧版数据无缝迁移，新版数据向后兼容4. 文档完备：技术参考文档和使用说明齐全5. 可维护性：代码结构清晰，测试覆盖充分，便于后续持续开发1.3 完成标准· 所有核心功能通过测试，无阻塞性bug· 500条学习记录下所有操作流畅（\<100ms响应）· v0.7.2 及之后所有版本的数据均可正常加载· SPEC.md 技术参考文档完整· 至少一次完整的数据迁移测试通过2. 全功能集成测试2.1 核心算法测试需要编写或完善以下单元测试（使用Jest或简单的手动测试用例），确保所有算法在边界条件下正确运行。温度模型测试：\`\`\`javascriptdescribe(\'Temperature Model\', () =\> { test(\'新知识点初始温度为峰值温度\', () =\> { const node = createKnowledgeNode(\'logos\', \'测试知识点\', defaultProfile); expect(node.peakTemp).toBe(80); }); test(\'无学习记录时温度保持不变\', () =\> { const node = createKnowledgeNode(\'logos\', \'测试知识点\', defaultProfile); node.lastStudy = Date.now() - 86400000; // 1天前 const temp = getCurrentTemp(node); expect(temp).toBeLessThan(80); expect(temp).toBeGreaterThan(0); }); test(\'半衰期过后温度约降至峰值的一半\', () =\> { const node = createKnowledgeNode(\'logos\', \'测试知识点\', defaultProfile); node.lastStudy = Date.now() - node.halfLifeDays \* 86400000; const temp = getCurrentTemp(node); expect(temp).toBeCloseTo(40, -1); // 约40，允许一定误差 }); test(\'复习后温度明显回升\', () =\> { const node = createKnowledgeNode(\'logos\', \'测试知识点\', defaultProfile); node.lastStudy = Date.now() - 86400000 \* 2; const beforeTemp = getCurrentTemp(node); updateNodeTemperature(node, { accuracy: 85, durationMinutes: 30 }, Date.now(), defaultProfile); expect(node.peakTemp).toBeGreaterThan(beforeTemp); }); test(\'极长时间未复习温度趋近于零\', () =\> { const node = createKnowledgeNode(\'logos\', \'测试知识点\', defaultProfile); node.lastStudy = Date.now() - 365 \* 86400000; // 一年前 const temp = getCurrentTemp(node); expect(temp).toBeLessThan(1); }); test(\'正确率100%时半衰期延长\', () =\> { const node = createKnowledgeNode(\'logos\', \'测试知识点\', defaultProfile); const oldHalfLife = node.halfLifeDays; updateNodeTemperature(node, { accuracy: 100, durationMinutes: 30 }, Date.now(), defaultProfile); expect(node.halfLifeDays).toBeGreaterThanOrEqual(oldHalfLife); }); test(\'正确率很低时半衰期缩短\', () =\> { const node = createKnowledgeNode(\'logos\', \'测试知识点\', defaultProfile); const oldHalfLife = node.halfLifeDays; updateNodeTemperature(node, { accuracy: 30, durationMinutes: 30 }, Date.now(), defaultProfile); expect(node.halfLifeDays).toBeLessThanOrEqual(oldHalfLife); });});\`\`\`经验值计算测试：\`\`\`javascriptdescribe(\'XP Calculation\', () =\> { test(\'相同学习行为在不同学科能力下产出不同XP\', () =\> { const profile1 = { \...defaultProfile, subjectAbility: { logos: 80 } }; const profile2 = { \...defaultProfile, subjectAbility: { logos: 30 } }; const record = createTestRecord({ subject: \'logos\', accuracy: 85, durationMinutes: 30 }); const xp1 = calculateRecordXP(record, \[\], profile1, \[\]); const xp2 = calculateRecordXP(record, \[\], profile2, \[\]); expect(xp1).not.toBe(xp2); }); test(\'边际递减生效：高总XP时获取率降低\', () =\> { const profileLow = { \...defaultProfile, totalXP: 1000 }; const profileHigh = { \...defaultProfile, totalXP: 100000 }; const record = createTestRecord({ durationMinutes: 30, accuracy: 85 }); const xpLow = calculateRecordXP(record, \[\], profileLow, \[\]); const xpHigh = calculateRecordXP(record, \[\], profileHigh, \[\]); expect(xpHigh).toBeLessThan(xpLow); }); test(\'每日软上限生效\', () =\> { const todayRecords = Array.from({ length: 20 }, () =\> createTestRecord({ computedXP: 50 })); const record = createTestRecord({ durationMinutes: 30, accuracy: 85, timestamp: new Date().toISOString() }); const xp = calculateRecordXP(record, \[\], defaultProfile, todayRecords); expect(xp).toBeLessThan(150); // 应该被衰减 }); test(\'考试正确率超过历史最佳时获得进步奖励\', () =\> { const historyRecords = \[ createTestRecord({ activityType: \'exam\', subject: \'logos\', accuracy: 70 }) \]; const record = createTestRecord({ activityType: \'exam\', subject: \'logos\', accuracy: 90 }); const xp = calculateRecordXP(record, \[\], defaultProfile, historyRecords); expect(xp).toBeGreaterThan(50); }); test(\'无正确率记录获得默认效率值\', () =\> { const record = createTestRecord({ activityType: \'lecture\', accuracy: null, durationMinutes: 45 }); const xp = calculateRecordXP(record, \[\], defaultProfile, \[\]); expect(xp).toBeGreaterThan(0); expect(xp).toBeLessThan(200); });});\`\`\`推荐算法测试：\`\`\`javascriptdescribe(\'Review Recommendation\', () =\> { test(\'背包算法在时间预算内选出最优组合\', () =\> { const candidates = \[ { benefit: 100, estimatedCost: 10 }, { benefit: 80, estimatedCost: 5 }, { benefit: 50, estimatedCost: 20 }, { benefit: 30, estimatedCost: 5 }, \]; const plan = optimizeReviewPlan(candidates, 15); const totalCost = plan.selected.reduce((s, c) =\> s + c.estimatedCost, 0); expect(totalCost).toBeLessThanOrEqual(15); // 应选择前两个（benefit=100+80=180）而非其他组合 expect(plan.selected.length).toBe(2); }); test(\'空候选池返回空计划\', () =\> { const plan = optimizeReviewPlan(\[\], 30); expect(plan.selected.length).toBe(0); }); test(\'零时间预算返回空计划\', () =\> { const candidates = \[{ benefit: 100, estimatedCost: 10 }\]; const plan = optimizeReviewPlan(candidates, 0); expect(plan.selected.length).toBe(0); }); test(\'假性熟练检测正确标记\', () =\> { const node = createKnowledgeNode(\'logos\', \'测试\', defaultProfile); const records = \[ createTestRecord({ knowledgePoints: \[\'测试\'\], accuracy: 90, practiceMinutes: 28, reviewMinutes: 2 }), createTestRecord({ knowledgePoints: \[\'测试\'\], accuracy: 92, practiceMinutes: 27, reviewMinutes: 3 }), createTestRecord({ knowledgePoints: \[\'测试\'\], accuracy: 88, practiceMinutes: 29, reviewMinutes: 1 }), \]; const isPseudo = detectPseudoMastery(node, records, defaultProfile); expect(isPseudo).toBe(true); });});\`\`\`2.2 数据流集成测试测试场景一：完整的学习记录生命周期1. 用户通过教辅搜索选择章节，输入正确率和时长，提交记录2. 验证记录被正确写入 data.json 的 log\[\] 数组3. 验证知识点节点被更新（温度、正确率历史、XP）4. 验证技能掌握度被重新计算5. 验证学科能力值被更新6. 验证用户画像参数被更新（总XP、总时长等）7. 验证成就检测引擎运行（新记录可能触发成就）8. 验证复习推荐随之更新测试场景二：冷启动到有数据1. 清空所有数据，仅保留默认画像2. 模拟首次学习记录3. 验证默认参数下的XP计算正常4. 模拟第5条记录5. 验证画像参数开始从默认值向个人值偏移测试场景三：数据迁移1. 准备一份 v0.7.2 格式的 data.json（仅含扁平记录和旧XP字段）2. 加载并运行 runXPEngine3. 验证所有记录被赋予新的 computedXP4. 验证知识点节点被创建且 skillId 被自动分配5. 验证用户画像完整生成2.3 UI交互测试手动测试清单：测试项 验证点底部导航切换 4个页面切换流畅，URL hash正确更新仪表盘数据展示 今日时长、XP、推荐卡片数据正确技能雷达图 数据与技能掌握度一致，切换学科刷新记录搜索 搜索教辅章节返回正确结果快速记录 选中章节后字段自动填充，提交成功记录编辑 内联编辑保存成功，数据同步到GitHub成就解锁 条件满足时弹出动画，成就墙更新统计图表 时间趋势、学科分布、效率分析图表数据正确深色模式 切换后所有页面颜色正确响应式 手机端单列布局，平板端适配2.4 性能测试基准指标：测试项 目标值 测试条件首次加载 \< 2秒 500条记录，正常网络页面切换 \< 100ms 本地数据已缓存XP全量重算 \< 500ms 500条记录推荐生成 \< 200ms 200个知识点节点搜索响应 \< 50ms 5本教材，200个章节统计聚合 \< 300ms 500条记录，30天范围若性能不达标，采取以下优化：· 将重计算移入 Web Worker· 统计聚合结果缓存· 知识点列表虚拟滚动· ECharts 图表懒加载2.5 浏览器兼容性测试在以下浏览器最新版本中测试所有功能：· Chrome (Windows / macOS / Android)· Safari (macOS / iOS)· Firefox (Windows / macOS)· Edge (Windows)3. Bug修复清单此部分需在测试过程中动态填写。以下为已知需重点关注的问题：1. 温度模型：确认 elapsedDays 为0时（刚学习完又立即记录）温度不会异常升高2. 半衰期：确认连续极低正确率不会导致半衰期降至0以下3. XP计算：确认 durationMinutes 为0或null时XP不为NaN4. 推荐引擎：确认所有知识点的复习成本至少为5分钟，防止DP状态爆炸5. 教辅搜索：确认别名完全匹配的优先级高于子串匹配6. 数据同步：确认GitHub写入冲突时重试机制正确7. 成就系统：确认同一成就不会重复解锁8. 统计图表：确认日期范围切换时图表正确销毁和重建9. 深色模式：确认ECharts图表在深色模式下文字可读10. 响应式：确认移动端FAB不遮挡底部导航\-\--4. 性能优化4.1 IndexedDB 本地缓存将 data.json 和 user_profile.json 缓存到 IndexedDB，启动时先加载本地缓存，再后台拉取GitHub最新版本对比更新，实现"秒开"体验。\`\`\`javascriptclass DataCache { constructor() { this.db = null; this.init(); } async init() { this.db = await new Promise((resolve, reject) =\> { const request = indexedDB.open(\'learning-rpg\', 1); request.onsuccess = () =\> resolve(request.result); request.onerror = () =\> reject(request.error); request.onupgradeneeded = (e) =\> { const db = e.target.result; if (!db.objectStoreNames.contains(\'data\')) { db.createObjectStore(\'data\', { keyPath: \'key\' }); } }; }); } async get(key) { const tx = this.db.transaction(\'data\', \'readonly\'); const store = tx.objectStore(\'data\'); const result = await new Promise(r =\> { store.get(key).onsuccess = e =\> r(e.target.result); }); return result?.value; } async set(key, value) { const tx = this.db.transaction(\'data\', \'readwrite\'); const store = tx.objectStore(\'data\'); store.put({ key, value, timestamp: Date.now() }); }}\`\`\`4.2 Service Worker 预缓存更新 sw.js，预缓存所有静态资源（CSS、JS、图标、字体），确保PWA二次加载几乎即时。\`\`\`javascriptconst CACHE_NAME = \'learning-rpg-v1.0.0\';const PRECACHE_URLS = \[ \'/\', \'/index.html\', \'/css/variables.css\', \'/css/global.css\', \'/css/components.css\', \'/css/layout.css\', \'/js/app.js\', \'/js/core/engine.js\', \'/js/core/temperature.js\', \'/js/core/xp-calculator.js\', // \... 所有核心JS文件\];self.addEventListener(\'install\', event =\> { event.waitUntil( caches.open(CACHE_NAME).then(cache =\> cache.addAll(PRECACHE_URLS)) );});\`\`\`4.3 Web Worker 重计算将 computeAllXP 和统计聚合函数移入 Web Worker。\`\`\`javascript// worker.jsself.onmessage = function(e) { const { type, data } = e.data; if (type === \'computeAllXP\') { const result = computeAllXP(data.records, data.nodes, data.profile); self.postMessage({ type: \'computeAllXP_result\', result }); }};\`\`\`4.4 虚拟滚动对于记录列表和知识点列表，实现基于 IntersectionObserver 的轻量虚拟滚动，避免渲染数千个DOM节点。4.5 防抖与节流· 搜索输入：200ms防抖· 推荐重新生成：500ms防抖· GitHub同步：批量提交，2秒防抖5. 数据兼容与迁移5.1 旧版数据自动升级在引擎初始化时检测 data.json 的版本字段：\`\`\`javascriptfunction migrateDataIfNeeded(data) { const version = data.version \|\| \'0.7.0\'; if (version.startsWith(\'0.7\')) { // v0.7.x → v1.0.0 data = migrate07To1(data); } // 未来版本迁移\... data.version = \'1.0.0\'; return data;}function migrate07To1(data) { // 1. 将旧记录中的 XP 字段保留为 legacyXP // 2. 为所有记录添加 practiceMinutes 和 reviewMinutes (默认null) // 3. 为所有知识点节点添加 skillId (通过技能树匹配) // 4. 重建用户画像 return data;}\`\`\`5.2 向后兼容保证· 新增字段都有默认值，旧记录加载时不报错· 技能树定义文件缺失时，退化到无技能模式· 用户画像参数缺失时，使用代码内默认值6. 文档编写6.1 技术参考文档 SPEC.md基于此前讨论的大纲，完整编写以下章节：1. 项目概述与设计哲学2. 完整数据模型（每个字段的类型、必填性、默认值）3. 核心算法规范（伪代码 + 数学公式 + 边界条件）4. 功能模块规范（触发条件 → 处理流程 → 输出格式）5. UI设计规范（信息架构、配色、排版、动效）6. 版本记录与迭代路线7. 开发约定（代码风格、模块命名、Git提交规范）6.2 用户使用指南（可选）如果未来有其他用户（或你自己回顾），可编写简要使用指南：· 如何通过 ClawBot 记录学习· 如何通过网页端搜索教辅章节· 如何理解仪表盘各项指标· 如何利用复习推荐· 成就系统说明6.3 代码注释规范确保所有公开函数有JSDoc注释，所有算法有参考文献引用。\`\`\`javascript/\*\* \* 计算知识点当前温度 \* 基于艾宾浩斯遗忘曲线 R(t) = 2\^(-t/h) \* \@param {KnowledgeNode} node - 知识节点 \* \@param {number} \[now=Date.now()\] - 当前时间戳 \* \@returns {number} 温度值 0-100，保留一位小数 \*/function getCurrentTemp(node, now = Date.now()) { \... }\`\`\`7. 代码质量提升7.1 模块依赖清理· 检查所有模块的导入导出，确保无循环依赖· 将重复代码提取为工具函数· 移除未使用的变量和导入7.2 错误处理完善· 所有 fetch 调用添加 catch· 所有 JSON.parse 使用 try-catch· 关键函数入口参数校验· 提供友好的错误提示而非控制台报错7.3 常量提取将散布在代码中的魔法数字提取到 js/core/constants.js：\`\`\`javascriptconst CONSTANTS = { DEFAULT_PEAK_TEMP: 80, DEFAULT_HALF_LIFE_DAYS: 3.0, TEMP_BOOST_GAIN_INITIAL: 0.5, TEMP_BOOST_BASE_INITIAL: 10, XP_BASE_PER_MINUTE: 2.0, DECAY_RATE_FOR_XP: 0.00005, REVIEW_BONUS_MULTIPLIER: 1.3, MIN_HALF_LIFE_DAYS: 0.5, MAX_HALF_LIFE_DAYS: 60, SOFT_CAP_DEFAULT: 500, SOFT_CAP_DISCOUNT: 0.5, // \...};\`\`\`8. 部署准备8.1 生产构建配置 Vite 生产构建，确保：· JS 代码压缩· CSS 压缩· 树摇（Tree Shaking）移除未用代码· 输出到 dist/ 目录8.2 GitHub Pages 部署更新部署脚本，确保 dist/ 部署到 Pages 分支。8.3 环境变量· .env.example 提供模板· GitHub Actions 中配置 Secrets· 确保 Token 不出现在构建产物中（使用 Vite 的 import.meta.env 在构建时替换）8.4 版本标签在GitHub仓库创建 v1.0.0 标签，发布 Release Notes。9. 后续版本规划v1.0.0 发布后，以下功能可在 v1.1.0+ 继续开发：版本 功能 优先级v1.1.0 番茄钟系统 高v1.2.0 阅读记录系统 中v1.3.0 内置机器学习输入解析 中v1.4.0 自定义启动语编辑器 低v1.5.0 学习-阅读-锻炼综合仪表盘 低这些功能的详细设计已在之前对话中完成，可在v1.0.0稳定后逐一实现。10. 发布检查清单发布前逐一确认：· 所有核心算法单元测试通过· 数据流集成测试通过· UI交互手动测试完成· 性能指标达标（\<2秒加载，\<100ms操作响应）· Chrome / Safari / Firefox 兼容性验证· 移动端 / 平板端响应式验证· 深色模式完整覆盖· v0.7.2 数据迁移测试通过· GitHub Pages 部署成功· PWA 可安装，Service Worker 正常· SPEC.md 技术参考文档完成· 代码注释覆盖率 \> 70%· 无控制台报错（生产模式）· README.md 更新为v1.0.0信息11. 文件变更总览文件 操作js/core/constants.js 新增（魔法数字提取）js/data/cache.js 新增（IndexedDB缓存）js/core/migrate.js 新增（数据迁移）sw.js 修改（预缓存列表更新）js/app.js 修改（集成迁移、缓存、Worker）SPEC.md 新增（技术参考文档）README.md 修改（更新为v1.0.0）.github/workflows/deploy.yml 修改（生产构建配置）所有JS文件 修改（JSDoc补充、错误处理完善）12. 结语v1.0.0 是一个里程碑，但绝不是终点。它标志着学习RPG从"实验性项目"走向"可长期使用的个人工具"。这个版本的核心价值不在于新增了什么耀眼的功能，而在于：所有功能都可靠运行，所有数据都安全兼容，所有代码都可维护，所有设计都有文档可查。从v0.7.2到v1.0.0，我们一起走过了8个版本迭代。从最初硬编码的XP公式，到现在12维用户画像、50+技能的掌握度追踪、背包算法驱动的智能推荐、60+成就的激励体系------这个系统已经成为你个人学习旅程的忠实记录者和智慧参谋。v1.0.0发布后，你可以放心地使用它，而不必担心数据丢失或功能异常。而当你有新的想法时，坚实的代码基础会让后续开发事半功倍。祝你，也祝这个系统，在各自的学习之路上，持续精进。

学习RPG v1.1.0 开发提示词番茄钟专注系统实现指南（完整版）面向对象：AI编程助手（实现者）目标版本：v1.1.0依赖：v1.0.0 正式版（完整的数据引擎、三层技能体系、推荐系统、UI框架）预计代码量：约1800行新增/重构核心目标：建立完整的番茄钟专注计时系统，实现一键开始、自动记录、中断处理、后台追踪、专注力分析，并与学习记录系统无缝集成1. 版本背景与目标1.1 用户的核心痛点目前的学习记录系统虽然已经通过教辅联动将录入成本降到10秒以内，但仍然需要用户在每次学习后手动输入时长、正确率等信息。对于"放下手机，专注学习"的场景，用户需要的是一个：· 一键开始的计时器，无需思考· 放下手机后自动计算时长，无需手动计时· 学习结束后自动生成记录，无需手动填写· 中断处理能区分"暂停休息"和"意外打断"· 专注力分析能看到自己的专注趋势和最佳时段番茄钟系统正是为这个场景而生。1.2 v1.1.0 目标1. 完整的番茄钟计时器：标准25分钟/自定义时长，倒计时显示，暂停/继续/放弃2. 双时间戳后台追踪：用户关闭手机学习，回来时自动计算有效时长3. 中断分类处理：主动暂停、意外中断、页面关闭等场景各自正确处理4. 自动生成学习记录：计时结束后自动生成带上下文（学科、知识点）的记录5. 上下文关联：启动番茄钟时可关联教辅章节或复习推荐中的知识点6. 专注力分析：累计专注时长、完成率、中断率、最佳专注时段7. 与成就系统联动：累计番茄钟数量触发专属成就2. 核心交互流程2.1 主流程\`\`\`用户点击 🍅 开始专注 ↓选择上下文（可选）├── 关联教辅章节 → 自动填入学科、技能、知识点├── 关联复习推荐 → 自动填入对应知识点└── 无上下文 → 仅记录时长，后续手动补充 ↓选择时长（默认25分钟） ↓计时开始├── 显示倒计时 + 当前上下文摘要├── 提供「暂停」「放弃」按钮└── 可记录中断原因（可选） ↓计时结束 / 用户提前完成 ↓自动生成学习记录├── 若有上下文：自动填充学科、技能、知识点、活动类型├── 若无上下文：activityType = \'other\'，留待补充└── 时长 = 实际专注时长（扣除暂停和中断时间） ↓记录写入 data.json + 同步GitHub ↓更新用户画像（专注统计） ↓触发成就检测\`\`\`2.2 用户关闭手机再打开的场景\`\`\`用户在番茄钟计时中 → 关闭手机屏幕（或切后台、关闭页面） ↓系统记录切出时间戳到 localStorage ↓用户学习一段时间后，重新打开手机 ↓页面加载时检测 localStorage 中有未完成的番茄钟 ↓弹出恢复提示卡片： ┌────────────────────────────────────┐ │ 🍅 检测到未完成的番茄钟 │ │ │ │ 开始时间：14:00 │ │ 计划时长：25分钟 │ │ 已过时间：约35分钟 │ │ 关联内容：数学·函数与导数 │ │ │ │ \[继续计时\] \[结束并记录\] \[放弃\] │ └────────────────────────────────────┘ ↓用户点击「结束并记录」 ↓生成记录：实际专注时长 = 总经过时间（不扣除，因为用户在学习） ↓写入记录，更新画像\`\`\`3. 数据结构设计3.1 番茄钟会话（运行时 + 持久化）\`\`\`typescriptinterface PomodoroSession { sessionId: string; // UUID startTime: number; // 开始时间戳（毫秒） plannedDuration: number; // 计划时长（分钟） endTime: number \| null; // 结束时间戳 completed: boolean; // 是否完成 // 上下文关联 context: { subject?: string; // 学科key skillId?: string; // 技能ID knowledgePoints?: string\[\]; // 知识点列表 activityType?: string; // 活动类型（默认 \'practice\'） textbookRef?: string; // 教辅章节引用 }; // 切出/返回记录 backgroundPeriods: Array\<{ start: number; // 切出时间戳 end: number; // 返回时间戳 duration: number; // 切出时长（秒） reason?: string; // 中断原因（可选） }\>; // 当前状态 isPaused: boolean; // 是否暂停中 isInBackground: boolean; // 是否在后台 currentBackgroundStart: number \| null; // 当前切出开始时间}\`\`\`3.2 用户画像新增字段在 user_profile.json 中新增：\`\`\`json{ \"focusStats\": { \"totalPomodoros\": 0, \"totalCompleted\": 0, \"totalFocusMinutes\": 0, \"totalBackgroundMinutes\": 0, \"interruptCount\": 0, \"averageFocusDuration\": 0, \"completionRate\": 0, \"dailyStreak\": 0, \"lastPomodoroDate\": null, \"peakFocusHour\": null, \"peakFocusDay\": null }}\`\`\`3.3 成就新增在 data/achievements.json 中新增：ID 名称 稀有度 条件fcs-001 专注初体验 青铜 完成首次番茄钟fcs-002 心流十次 青铜 累计完成10个番茄钟fcs-003 百番专注 白银 累计完成100个番茄钟fcs-004 千锤百炼 黄金 累计完成1000个番茄钟fcs-005 专注马拉松 白银 单次连续专注超过90分钟fcs-006 无中断之魂 黄金 连续10个番茄钟无中断fcs-007 清晨专注者 白银 上午8点前完成20个番茄钟fcs-008 深夜思考者 白银 晚上10点后完成30个番茄钟4. 核心算法实现4.1 计时引擎 (js/pomodoro/timer-engine.js)\`\`\`javascriptclass PomodoroTimer { constructor(onTick, onComplete) { this.session = null; this.tickInterval = null; this.onTick = onTick; // 每秒回调，用于更新UI this.onComplete = onComplete; // 计时完成回调 } // 启动番茄钟 start(plannedMinutes, context) { this.session = { sessionId: generateUUID(), startTime: Date.now(), plannedDuration: plannedMinutes, endTime: null, completed: false, context: context \|\| {}, backgroundPeriods: \[\], isPaused: false, isInBackground: false, currentBackgroundStart: null }; this.saveCheckpoint(); this.startTicking(); } // 计时脉冲 startTicking() { this.tickInterval = setInterval(() =\> { if (this.session && !this.session.isPaused && !this.session.isInBackground) { const elapsed = this.getElapsedSeconds(); const total = this.session.plannedDuration \* 60; const remaining = Math.max(0, total - elapsed); this.onTick({ elapsed, remaining, percentage: Math.min(100, Math.round(elapsed / total \* 100)), session: this.session }); // 时间到 if (remaining \<= 0) { this.complete(true); } } }, 1000); } // 获取有效专注秒数（扣除后台时间） getElapsedSeconds() { if (!this.session) return 0; const now = Date.now(); let totalElapsed = (now - this.session.startTime) / 1000; // 扣除已记录的后台时间 for (const period of this.session.backgroundPeriods) { totalElapsed -= (period.duration / 1000); } // 如果当前正在后台，扣除当前未结束的后台时间 if (this.session.isInBackground && this.session.currentBackgroundStart) { totalElapsed -= (now - this.session.currentBackgroundStart) / 1000; } return Math.max(0, totalElapsed); } // 暂停 pause() { if (this.session) { this.session.isPaused = true; this.saveCheckpoint(); } } // 恢复 resume() { if (this.session) { this.session.isPaused = false; this.saveCheckpoint(); } } // 完成后台切出处理 handleEnterBackground() { if (this.session && !this.session.isInBackground) { this.session.currentBackgroundStart = Date.now(); this.session.isInBackground = true; this.saveCheckpoint(); } } // 处理返回前台 handleEnterForeground() { if (this.session && this.session.isInBackground && this.session.currentBackgroundStart) { const backTime = Date.now(); this.session.backgroundPeriods.push({ start: this.session.currentBackgroundStart, end: backTime, duration: backTime - this.session.currentBackgroundStart }); this.session.isInBackground = false; this.session.currentBackgroundStart = null; this.saveCheckpoint(); } } // 完成番茄钟 complete(wasAutomatic = false) { if (this.session) { this.session.endTime = Date.now(); this.session.completed = true; clearInterval(this.tickInterval); this.clearCheckpoint(); const focusSeconds = this.getElapsedSeconds(); this.onComplete({ session: this.session, focusMinutes: Math.round(focusSeconds / 60), wasAutomatic }); } } // 放弃 abandon() { if (this.session) { const focusSeconds = this.getElapsedSeconds(); this.session.endTime = Date.now(); this.session.completed = false; clearInterval(this.tickInterval); this.clearCheckpoint(); return { session: this.session, focusMinutes: Math.round(focusSeconds / 60) }; } return null; } // 保存到 localStorage saveCheckpoint() { if (this.session) { localStorage.setItem(\'active_pomodoro\', JSON.stringify(this.session)); } } // 清除 checkpoint clearCheckpoint() { localStorage.removeItem(\'active_pomodoro\'); } // 检查是否有未完成的番茄钟（页面加载时调用） static getSavedSession() { const saved = localStorage.getItem(\'active_pomodoro\'); if (saved) { try { return JSON.parse(saved); } catch (e) { return null; } } return null; }}\`\`\`4.2 自动记录生成 (js/pomodoro/record-generator.js)番茄钟结束后，自动生成学习记录：\`\`\`javascriptfunction generateRecordFromPomodoro(session, focusMinutes) { const record = { recordID: generateUUID(), timestamp: new Date(session.startTime).toISOString(), activityType: session.context.activityType \|\| \'other\', subject: session.context.subject \|\| \'general\', skillId: session.context.skillId \|\| null, textbook: session.context.textbookRef \|\| null, knowledgePoints: session.context.knowledgePoints \|\| \[\], durationMinutes: Math.max(1, focusMinutes), accuracy: null, // 番茄钟默认无正确率 details: { pomodoroSessionId: session.sessionId, plannedDuration: session.plannedDuration, completed: session.completed, backgroundPeriods: session.backgroundPeriods.length, totalBackgroundSeconds: session.backgroundPeriods.reduce((s, p) =\> s + p.duration, 0) } }; return record;}\`\`\`4.3 专注力统计更新 (js/pomodoro/focus-stats.js)\`\`\`javascriptfunction updateFocusStats(profile, session, focusMinutes) { if (!profile.focusStats) { profile.focusStats = { totalPomodoros: 0, totalCompleted: 0, totalFocusMinutes: 0, totalBackgroundMinutes: 0, interruptCount: 0, averageFocusDuration: 0, completionRate: 0, dailyStreak: 0, lastPomodoroDate: null, peakFocusHour: null, peakFocusDay: null }; } const stats = profile.focusStats; stats.totalPomodoros++; if (session.completed) stats.totalCompleted++; stats.totalFocusMinutes += focusMinutes; // 后台时间累计 const bgSeconds = session.backgroundPeriods.reduce((s, p) =\> s + p.duration, 0); stats.totalBackgroundMinutes += Math.round(bgSeconds / 60); // 中断次数 stats.interruptCount += session.backgroundPeriods.length; // 平均专注时长 stats.averageFocusDuration = Math.round(stats.totalFocusMinutes / stats.totalPomodoros); // 完成率 stats.completionRate = Math.round(stats.totalCompleted / stats.totalPomodoros \* 100); // 每日连续 const today = new Date().toDateString(); const yesterday = new Date(Date.now() - 86400000).toDateString(); if (stats.lastPomodoroDate === yesterday \|\| stats.lastPomodoroDate === today) { if (stats.lastPomodoroDate !== today) stats.dailyStreak++; } else { stats.dailyStreak = 1; } stats.lastPomodoroDate = today; // 最佳专注时段（基于历史番茄钟开始时间） updatePeakFocusTime(stats, session);}function updatePeakFocusTime(stats, session) { // 从session.startTime提取小时和星期几，累积计数 // 在profile中维护一个时段计数对象，此处简化展示}\`\`\`5. UI设计5.1 悬浮按钮 (FAB)右下角常驻悬浮按钮，图标为 🍅，颜色为番茄红 #FF6347。点击展开番茄钟面板。5.2 番茄钟面板（抽屉式）从屏幕右侧滑入的抽屉面板（桌面端）或底部滑出（移动端）。面板布局：\`\`\`┌──────────────────────────────────────┐│ 🍅 番茄钟 \[✕\] │├──────────────────────────────────────┤│ ││ ○ 25:00 ││ 正在专注中\... ││ ││ 📐 数学 · 函数与导数 ││ 📝 导数的运算、切线方程 ││ ││ \[⏸️ 暂停\] \[🏁 提前完成\] ││ ││ ── 时间选项 ── ││ \[15分钟\] \[25分钟\] \[45分钟\] \[自定义\] ││ ││ ── 关联内容 ── ││ \[选择章节\] \[从推荐选择\] \[无关联\] ││ │├──────────────────────────────────────┤│ 今日完成：2个 ｜ 累计专注：85分钟 │└──────────────────────────────────────┘\`\`\`状态变化：· 运行中：显示圆形倒计时动画，中间大数字，外圈进度环· 暂停中：倒计时数字闪烁，背景变黄· 后台中：数字变灰，显示"手机已关闭，学习中\..."· 即将结束：最后1分钟数字变红，动画加速· 已完成：显示绿色对勾，弹出完成卡片5.3 恢复提示卡片（页面加载时）检测到未完成的番茄钟时，在页面中央弹出模态卡片：\`\`\`┌────────────────────────────────────────────┐│ ││ 🍅 检测到未完成的番茄钟 ││ ││ 开始时间：14:00 ││ 计划时长：25分钟 ││ 已过时间：约35分钟 ││ ││ 关联内容： ││ 📐 数学 · 函数与导数 ││ 📝 导数的运算、切线方程 ││ ││ ┌──────────┐ ┌──────────┐ ┌────────┐ ││ │ 继续计时 │ │结束并记录│ │ 放弃 │ ││ └──────────┘ └──────────┘ └────────┘ ││ │└────────────────────────────────────────────┘\`\`\`· 继续计时：恢复session，继续倒计时· 结束并记录：以实际经过时间生成完整学习记录· 放弃：清除session，不生成记录5.4 番茄钟历史面板（统计子页）在统计中心或更多页进入"🍅 番茄钟分析"。展示内容：· 累计统计卡片：总次数、完成率、总时长、平均时长· 每日番茄钟数量趋势图（柱状图，过去30天）· 最佳专注时段热力图（小时×星期几）· 最近完成的番茄钟列表6. 与现有系统的集成6.1 学习记录系统番茄钟生成的记录与手写记录格式完全一致，纳入 data.json 的 log\[\]，触发同样的XP计算、温度更新、画像更新流程。6.2 推荐系统用户可以在番茄钟面板中选择"从推荐选择"，展示当日复习推荐的知识点列表，勾选后作为本次番茄钟的关联内容。计时结束后，系统自动将该知识点标记为"已复习"，并从推荐列表中移除。6.3 成就系统番茄钟完成时触发成就检测事件 pomodoro_completed，检测专注类成就。6.4 每日推荐每日推荐中新增"今日番茄钟建议"：基于历史专注数据，建议今日何时进行番茄钟，以及建议时长。7. 边界情况处理情况 处理方式番茄钟运行中用户关闭页面 状态存入 localStorage，下次打开时提示恢复用户连续切后台多次 每次成对记录，不重复，不遗漏用户暂停后切后台 暂停期间不记录后台时间用户放弃番茄钟 保留已计时间生成部分记录（completed=false）用户放弃时专注时长\<1分钟 不生成记录，直接清除番茄钟关联的知识点不存在 自动创建知识点节点多个番茄钟同时运行 禁止同时运行，启动新番茄钟时提示"已有进行中的番茄钟"8. 实施步骤与验证8.1 实施步骤1. 实现 PomodoroTimer 类2. 实现 localStorage 持久化与恢复逻辑3. 实现 Page Visibility API 监听（切后台/前台）4. 开发番茄钟面板UI5. 开发恢复提示卡片6. 实现自动记录生成函数7. 实现专注力统计更新8. 新增专注类成就定义9. 集成到应用路由和FAB10. 开发番茄钟历史分析页8.2 验证标准· 点击FAB可启动番茄钟，倒计时正常· 暂停/恢复功能正常，暂停期间不计时· 关闭手机屏幕后，重新打开时弹出恢复提示· 点击"结束并记录"后，正确生成学习记录，时长准确· 生成的学习记录能正常触发XP计算和画像更新· 专注统计数值正确（总次数、完成率等）· 完成10个番茄钟后正确触发成就9. 文件变更清单文件 操作js/pomodoro/timer-engine.js 新增js/pomodoro/record-generator.js 新增js/pomodoro/focus-stats.js 新增js/ui/pomodoro-panel.js 新增（番茄钟面板UI）js/ui/pomodoro-restore.js 新增（恢复提示卡片）js/ui/focus-history.js 新增（番茄钟历史页）data/achievements.json 修改：新增专注类成就js/core/constants.js 修改：新增番茄钟默认值js/app.js 修改：集成番茄钟模块、FAB逻辑index.html 修改：新增番茄钟面板DOM容器10. 结语番茄钟系统是学习RPG从"被动记录"走向"主动陪伴"的关键一步。它不是简单的计时器，而是理解用户学习节奏的感知器------用户什么时候专注、专注多久、什么时候容易被打断。这些数据将与技能掌握度、复习推荐、考试建议形成更完整的个人学习画像。v1.1.0的番茄钟系统为后续的阅读记录（v1.2.0）、锻炼追踪等生活维度功能奠定了计时框架。未来任何需要"开始-结束"时间追踪的功能，都可复用 PomodoroTimer 的核心架构。

学习RPG v1.2.0 开发提示词阅读记录与知识广度扩展系统实现指南（完整版）面向对象：AI编程助手（实现者）目标版本：v1.2.0依赖：v1.1.0 番茄钟专注系统、v1.0.0 正式版完整架构预计代码量：约2000行新增/重构核心目标：建立独立的阅读记录系统，将阅读活动纳入个人认知管理体系，实现阅读统计、书架管理、阅读成就和与学习系统的联动分析1. 版本背景与目标1.1 阅读作为一种"元学习"活动阅读是广义认知输入的重要形式。与刷题、背诵不同，阅读的收获往往是隐性的、长期的、难以立即量化的。但阅读对个人成长的贡献不可忽视：· 知识广度：阅读跨领域书籍拓展认知边界· 思维深度：深度阅读培养逻辑推理和批判性思维· 语言能力：阅读量与写作能力呈正相关· 认知储备：广泛阅读为未来的学习提供"认知锚点"目前的系统只追踪了"学习活动"（刷题、考试、背诵等），缺乏对阅读的追踪。v1.2.0将填补这一空白。1.2 v1.2.0 目标1. 独立的阅读记录系统：不混入学习记录，拥有专属的数据结构和存储文件2. 轻量录入：通过ClawBot指令或网页端快速面板，录入成本不超过5秒3. 书架管理：自动聚合阅读进度，展示在读/已读完/暂停的书籍状态4. 阅读统计：阅读时长、页数、速度趋势、分类分布5. 阅读成就：12个专属阅读成就，与学习成就体系风格统一6. 与学习系统联动：阅读数据可影响用户画像的"知识广度"指标，但不做强行关联7. 番茄钟联动：番茄钟支持"阅读模式"，计时结束自动生成阅读记录2. 数据结构设计2.1 阅读记录 (data/reading_records.json)独立于学习记录，存储在单独的JSON文件中。\`\`\`typescriptinterface ReadingRecord { recordID: string; // UUID timestamp: string; // ISO 8601 bookTitle: string; // 书名 author?: string; // 作者 category: ReadingCategory; // 阅读分类 startPage?: number; // 本次起始页 endPage?: number; // 本次结束页 pagesRead?: number; // 本次阅读页数 durationMinutes: number; // 阅读时长（分钟） completionPercent?: number; // 本书累计完成百分比 notes?: string; // 简短笔记（可选，1-2句话） rating?: number; // 本次阅读体验评分 1-5 format: \'paper\' \| \'ebook\' \| \'audio\'; // 阅读介质 source?: \'clawbot\' \| \'web\' \| \'pomodoro\'; // 记录来源}\`\`\`阅读分类枚举：\`\`\`typescripttype ReadingCategory = \| \'literature\' // 文学小说 \| \'history\' // 历史 \| \'philosophy\' // 哲学 \| \'science\' // 科普/科学 \| \'technology\' // 技术/编程 \| \'psychology\' // 心理学 \| \'sociology\' // 社会学 \| \'economics\' // 经济学 \| \'biography\' // 传记 \| \'self_help\' // 个人成长 \| \'textbook\' // 教材/教辅 \| \'other\'; // 其他\`\`\`2.2 书架数据 (data/bookshelf.json)每本书的聚合状态，可从阅读记录动态生成，也可作为独立缓存文件加速加载。\`\`\`typescriptinterface BookStatus { bookId: string; // 唯一ID（基于书名+作者的哈希） title: string; author: string; category: ReadingCategory; totalPages: number; // 全书总页数（用户首次录入时指定，可修改） currentPage: number; // 当前读到页数 totalDuration: number; // 累计阅读时长（分钟） totalSessions: number; // 阅读次数 avgRating: number; // 平均体验评分 startDate: string; // 开始阅读日期 lastReadDate: string; // 最近阅读日期 status: \'reading\' \| \'finished\' \| \'paused\' \| \'abandoned\'; finishDate?: string; // 完成日期 notes?: string; // 全书总结（可选） format: \'paper\' \| \'ebook\' \| \'audio\'; // 主要阅读介质}\`\`\`2.3 用户画像新增字段在 user_profile.json 中新增：\`\`\`json{ \"readingStats\": { \"totalBooks\": 0, \"totalBooksFinished\": 0, \"totalPages\": 0, \"totalDuration\": 0, \"avgPagesPerSession\": 0, \"avgDurationPerSession\": 0, \"avgRating\": 0, \"favoriteCategory\": null, \"booksThisMonth\": 0, \"pagesThisMonth\": 0, \"readingStreak\": 0, \"lastReadingDate\": null, \"preferredFormat\": null, \"primeReadingTime\": null, \"categoryDistribution\": {} }}\`\`\`3. ClawBot 指令设计3.1 开始阅读一本书\`\`\`/开始阅读 书名 作者 分类 总页数/开始阅读 《原则》 瑞·达利欧 个人成长 500/开始阅读 《百年孤独》 马尔克斯 文学 360\`\`\`ClawBot解析后：在书架中创建新书，状态设为 reading，记录起始日期。3.2 记录一次阅读\`\`\`/阅读 书名 页数 时长 \[评分\] \[笔记\]/阅读 《原则》 30页 45分钟/阅读 《原则》 15-45页 30分钟 评分4/阅读 《原则》 30分钟 笔记:关于极度透明的原则很有启发/阅读 《原则》 第30页到第75页 60分钟 评分5\`\`\`解析逻辑：· 提取书名：模糊匹配书架已有书籍（莱文斯坦距离），若无则提示先 /开始阅读· 提取页数：30页 → 读了30页；15-45页 → 从15页读到45页，共30页；第30页到第75页 → 共45页· 提取时长：45分钟 → durationMinutes = 45· 提取评分：评分4 → rating = 4· 提取笔记：笔记:xxx → notes = \"xxx\"· 自动计算累计进度：currentPage = endPage，completionPercent = currentPage / totalPages \* 1003.3 标记读完\`\`\`/读完 《原则》 评分5 总结:这本书改变了我的思维方式\`\`\`ClawBot解析后：将书架状态改为 finished，记录完成日期，更新阅读统计。3.4 查看阅读进度\`\`\`/阅读进度/阅读进度 《原则》\`\`\`ClawBot回复当前在读书籍的进度摘要，或指定书籍的详细信息。4. 网页端快速录入4.1 阅读记录面板在记录页或通过全局命令面板（Ctrl+K）进入，选择"📖 阅读"标签。输入字段：· 书名（下拉选择书架已有书籍，或输入新书名）· 本次阅读页数/起止页（可选）· 阅读时长（必填，分钟）· 评分（可选，1-5星）· 简短笔记（可选）· 阅读介质（下拉：纸质书/电子书/有声书）自动填充：· 若书架中已有该书，自动填入作者、分类、总页数· 自动计算累计进度百分比提交后：· 生成阅读记录，写入 reading_records.json· 更新书架状态· 更新用户画像的阅读统计· 检查阅读成就4.2 书架管理页面从"更多"页进入"📚 书架"。布局：· 顶部：筛选标签（全部/在读/已读完/暂停/弃读）· 书籍卡片网格：每张卡片显示封面占位（按分类着色）、书名、作者、进度条、最近阅读日期· 点击卡片进入书籍详情页：完整的阅读记录时间线、进度变化图、笔记列表· 支持手动修改总页数、编辑状态、添加全书总结5. 阅读统计与可视化5.1 阅读仪表盘从统计中心进入，或独立的"📖 阅读统计"页面。核心指标卡片：· 累计阅读书籍数（已完成/在读/总数）· 累计阅读页数· 累计阅读时长（小时）· 本月阅读页数· 连续阅读天数· 平均每次阅读页数图表：· 月度阅读趋势图：柱状图，X轴为月份，Y轴为阅读页数和时长的双轴图· 分类分布饼图：各分类的阅读时长占比· 阅读速度趋势：折线图，展示每小时阅读页数的变化（反映阅读能力提升）· 阅读时段热力图：与学习热力图风格统一，展示最常阅读的时段· 阅读日历热力图：类似GitHub贡献图，展示每日阅读时长分布5.2 书籍详情分析点击书架中的某本书，进入详情页：· 基本信息：书名、作者、分类、总页数、阅读介质· 阅读进度环：环形进度条展示完成百分比· 阅读记录时间线：每次阅读的日期、页数、时长、评分、笔记· 阅读速度变化：该书各次阅读速度的折线图6. 阅读成就系统在 data/achievements.json 中新增阅读类别（rd）：ID 名称 稀有度 条件 描述rd-001 翻开第一页 青铜 完成首次阅读记录 "阅读是随身携带的避难所。"rd-002 书虫初长 青铜 累计阅读10小时 "你已经开始享受阅读的时光。"rd-003 小小图书馆 白银 累计读完5本书 "每一本书都是一段旅程。"rd-004 博览群书 白银 阅读跨越5个分类 "博学之，审问之，慎思之。"rd-005 一月一书 白银 连续3个月每月读完1本书 "阅读已成为生活习惯。"rd-006 书海泛舟 黄金 累计阅读100小时 "阅读的深度决定思考的高度。"rd-007 百本之约 传说 累计读完100本书 "读书破万卷，下笔如有神。"rd-008 专注阅读 黄金 单次阅读超过2小时无中断 "沉浸在书中的世界。"rd-009 读书笔记 白银 累计写了20条阅读笔记 "不记录就难以被思考和整合。"rd-010 七日连读 白银 连续7天每天阅读 "阅读，让心灵每天都有栖息之地。"rd-011 三栖读者 白银 使用过纸质书、电子书、有声书 "不拘一格，皆可读书。"rd-012 书评家 黄金 累计写了5条全书总结 "读过，更要思考过。"7. 与现有系统的联动7.1 番茄钟联动番茄钟面板新增"📖 阅读模式"选项：· 选择阅读模式后，计时器主题色变为阅读绿（#2EC27E）· 结束时弹出阅读记录面板（而非学习记录面板）· 自动填入最近在读的书名· 用户只需补充页数（可选），点击确认7.2 用户画像联动阅读数据可影响用户画像中的"知识广度"指标：· 分类多样性越高，知识广度分越高· 阅读时长可转化为少量的"认知健康度"提升· 连续阅读天数纳入总体自律指标（与学习连续天数综合评估）7.3 学习-阅读关联分析（可选，v1.3.0）未来可分析：· "学习日和阅读日的重叠度"· "阅读量增加后，学习效率是否有提升"· "考试前夕阅读习惯是否发生变化"这些分析基于现有数据自动生成，无需额外输入。7.4 不强行关联如果用户阅读的是小说，与学习内容完全无关，系统不做强行关联。阅读本身就有独立价值------拓展视野、放松心情、提升语感------不必一切服务于应试。8. UI设计要点8.1 阅读记录面板与学习快速记录面板风格统一，使用玻璃态卡片。关键区别：· 标题栏使用阅读绿（#2EC27E）作为强调色· 书名输入支持自动补全（从书架中匹配）· 页数输入有两种模式：简单模式（只输入本次页数）和精确模式（输入起止页）8.2 书架页面书籍卡片设计：· 左侧：按分类着色的色块（模拟书脊），宽度6px· 中间：书名（粗体）+ 作者（灰色小字）· 右侧：进度条 + 百分比· 底部：最近阅读日期（如"3天前"）· 悬浮时：显示更多信息（总页数、阅读次数、平均评分）8.3 阅读仪表盘风格与学习统计中心完全统一，使用相同的图表主题和布局骨架。用户切换"学习统计"和"阅读统计"时体验一致。9. 实施步骤与验证9.1 实施步骤1. 创建 data/reading_records.json 和 data/bookshelf.json 初始文件2. 实现ClawBot阅读指令解析（/开始阅读、/阅读、/读完、/阅读进度）3. 实现阅读记录CRUD模块4. 实现书架状态聚合算法5. 实现阅读统计计算函数6. 开发阅读快速记录面板UI7. 开发书架管理页面UI8. 开发阅读仪表盘（统计图表）9. 新增12个阅读成就定义10. 集成番茄钟阅读模式11. 更新用户画像的阅读统计字段12. 在"更多"页添加阅读入口9.2 验证标准· ClawBot指令正确解析并写入 reading_records.json· 书架状态从记录中正确聚合（在读/已读完/暂停）· 阅读统计数值与手动计算一致· 番茄钟阅读模式结束后，正确弹出阅读记录面板· 累计阅读10小时后，"书虫初长"成就解锁· 阅读仪表盘图表数据正确，切换时间范围后刷新· 书架页面正确展示书籍卡片和进度10. 文件变更清单文件 操作data/reading_records.json 新增data/bookshelf.json 新增js/reading/record-parser.js 新增（ClawBot指令解析）js/reading/bookshelf-manager.js 新增（书架状态聚合）js/reading/reading-stats.js 新增（阅读统计计算）js/reading/reading-achievements.js 新增（阅读成就检测）js/ui/reading-panel.js 新增（阅读快速记录面板）js/ui/bookshelf-page.js 新增（书架管理页面）js/ui/reading-dashboard.js 新增（阅读仪表盘）js/pomodoro/timer-engine.js 修改：增加阅读模式支持data/achievements.json 修改：新增阅读类别成就js/core/profile-updater.js 修改：新增阅读统计更新js/app.js 修改：集成阅读模块11. 结语阅读系统的加入，让学习RPG从"应试学习追踪器"扩展为更完整的"个人认知成长系统"。它不强制关联学习，尊重阅读的独立价值，同时提供与学习系统一致的量化体验和成就激励。通过统一的番茄钟、统一的成就体系、统一的统计可视化，用户可以在一个平台上看到自己"输入大脑的所有高质量信息"------无论是为了考试的函数练习，还是为了兴趣的小说阅读。

学习RPG 认知操作系统 · 设计哲学与设计目的

 

------一份关于"学习如何学习"的个人实验

 

一、设计哲学

 

1.1 核心信条：学习的"白箱化"

 

传统学习是一个黑箱。你投入时间，产出某种"感觉"------觉得自己掌握了、觉得自己退步了、觉得今天效率很高。但这些都是主观判断，缺乏可验证的量化锚点。

 

学习RPG的根本哲学是：学习过程可以被量化，而且这种量化能反过来指导学习本身。 每一次刷题、每一次背诵、每一次考试，都是关于"你如何学习"的实验数据。系统不告诉你"应该学什么"，而是告诉你"你学得怎么样"，让你自己做出更明智的决策。

 

这不是一个教学系统，而是一个认知镜面------它试图照见你学习过程中那些肉眼看不见的变化：一个知识点的记忆是如何衰减的、一个技能是如何从"入门"走向"精通"的、今天的专注投入是否真的转化为了长期记忆。

 

1.2 数据溯源闭包原则

 

系统中任何非用户直接输入的数值，都必须能从历史记录中推导得出。

 

这意味着：

 

· 不存在"天降神参"------所有算法权重都由用户的数据决定

· 不存在"预设学科难度"------学科难度的评估完全来自用户在该学科的遗忘速率和正确率表现

· 不存在"固定的每日学习上限"------上限由用户过去30天的实际学习容量动态计算

 

冷启动时可以使用基于认知科学文献的弱先验（如初始半衰期3天、初始能力值50），但这些先验被设计为可退化的------数据积累后，先验的权重指数级下降，最终完全被个人数据替代。

 

1.3 低输入负担原则

 

一个学习系统如果要求用户花大量时间记录，就会陷入"为了记录而学习"的悖论。因此，系统设计遵循以下优先级：

 

1\. 能不输入的，绝对不让用户输入------通过教辅联动、章节映射、时间推断，自动补全90%的字段

2\. 能推断的，绝对不要求精确------通过个人习惯学习、正确率偏差微调，在缺失数据时做出合理估计

3\. 能从历史学的，绝对不预设固定值------订正时间占比、最优学习时长、最佳复习时机，全部从用户数据中学习

 

目标：用户每日记录投入不超过30秒。理想状态下，5秒完成一条记录------搜索章节、点击提交、放下手机开始学习。

 

1.4 自适应而非预设

 

市面上几乎所有学习工具都是预设模型------它们假设所有人都以相同速率遗忘、同一学科对所有人都同样困难、学习时间越长收获越大。

 

学习RPG采用自适应模型------从用户的数据中学习用户的规律。

 

· 半衰期不是固定的1.5天，而是从用户每次复习的间隔和正确率中反推的个性化中位数

· 学科难度不是预设的标签，而是从各科知识点的实际半衰期对比中动态计算

· 每日容量不是500XP的硬编码，而是从过去30天学习时长的80分位数自动得出

· 订正时间占比不是20%的猜测，而是从用户偶尔明确标注的数据中学到的个人习惯

 

系统越用越懂你，因为每一次记录都在训练它。

 

1.5 认知科学驱动

 

所有核心算法都有认知心理学文献的支撑：

 

· 遗忘曲线：基于艾宾浩斯1885年实验的指数衰减模型，由Murre和Dros在2015年复制验证

· 间隔重复最优时机：复习触发阈值设定在保留率降至80%时，而非降至50%时，这是基于Wozniak和Gorzelanczyk对最优复习间隔的数学推导

· 测试效应：检索练习比重复学习更有效，活动类型权重设计基于Roediger和Karpicke的2006年实证

· 必要难度理论：Bjork提出的"学习过程中付出的认知努力越大，长期记忆越牢固"，体现在订正时间获得更高XP的设计中

· 最近发展区：难度匹配度算法基于Vygotsky的理论，最优学习内容应略高于当前能力

· 认知负荷理论：Sweller的工作记忆模型指导了多知识点学习时的复杂度加权设计

 

1.6 单用户深度拟合

 

这是一个只为你服务的系统。它不需要考虑"通用模型"，不需要为了市场迎合任何人的使用习惯。这意味着：

 

· 所有算法参数都可以做到极致的个性化------你一个人的数据足以训练你一个人的模型

· 所有界面和交互都可以按你的偏好来设计------不需要兼容任何你不用的场景

· 所有数据完全归你所有------存储在你自己控制的GitHub仓库中，不依赖任何第三方服务

 

这是一个"为自己做的工具"所能达到的极致：它不是最好的学习系统，但它是最适合你的学习系统。

 

二、设计目的

 

2.1 量化"学会"的模糊边界

 

"我学会了吗？"这是每个学习者都会问的问题。但"学会"是一个模糊的概念------你可能今天会做这道题，一周后就忘了；你可能在章节练习中正确率很高，但综合考试中却提取不出来。

 

学习RPG试图用一组连续变化的数字来描述这个模糊状态：

 

· 温度（0-100）：衡量一个知识点的"记忆热度"。刚学完是80，一天不复习可能降到50，一周后可能只剩20

· 掌握度（0-100）：衡量一个技能的"综合掌握水平"，由下属知识点的温度、历史正确率和掌握占比加权合成

· 半衰期（天）：衡量你对某知识的"记忆持久力"。半衰期越长，意味着这个知识已经从"临时记忆"转变为"长期存储"

· 经验值：不是随机的游戏币，而是学习效率、学科难度、进步速度的综合反映

 

这些数字让"学会"从一个二元判断变成了连续谱------你可以精确地知道自己离"真正掌握"还有多远。

 

2.2 用有限时间做最优决策

 

时间是每个学习者最稀缺的资源。学习RPG的核心价值主张是：帮你用最少的时间，在最准确的时机，复习最需要复习的内容。

 

系统通过以下机制实现这一目标：

 

· 智能复习推荐：不是简单地按"温度最低"排序，而是用背包算法在给定时间预算下求解最优组合

· 复习时机优化：基于80%保留率阈值，在"还没忘"和"已经忘了"之间的最佳时间点提醒复习

· 提分潜力诊断：找出掌握度低、考试权重高、近期投入少的技能，优先建议分配学习时间

· 假性熟练检测：识别"连续高正确率但极低订正时间"的表面掌握，提醒深度检测

· 考试周期建议：在合适的时机（累积学习量达标、多技能进步显著时）主动建议综合考试

 

2.3 构建"成长可见"的正向循环

 

学习最怕的是看不到进步。单次刷题的微观变化无法被感知，但长期积累的宏观变化可以。

 

学习RPG通过以下方式让成长"被看见"：

 

· 技能掌握度的渐进式攀升：从40%到60%到80%，每一个突破都是一枚成就

· 月度学习报告：展示过去30天的总投入、各科技能成长、进步最快的领域

· 成就系统：60+成就覆盖坚持、积累、突破、探索、传奇五个维度，每一个徽章都是一个成长故事

· 统计可视化：时间趋势、学科分布、效率变化、时段热力图------从数据中发现自己的学习模式

 

2.4 整合"学习"与"生活"的数据边界

 

真正的成长不只发生在刷题中。阅读拓展认知边界，锻炼影响大脑供氧和记忆巩固效率，专注力是学习的基础设施。

 

学习RPG逐步将这些维度纳入统一框架：

 

· 阅读系统（v1.2.0）：追踪阅读时长、分类分布、阅读速度趋势，让"输入大脑的高质量信息"被可视化

· 番茄钟系统（v1.1.0）：追踪专注时长、中断率、最佳专注时段，理解自己的注意力规律

· 未来可能的扩展：锻炼记录、睡眠追踪等，将个人认知状态置于更完整的生理-心理背景下

 

这不是功能的堆砌，而是建立一个以"你"为中心的认知数据聚合器------所有影响"你今天能学多好"的因素，都能在一个平台上看到。

 

三、对项目自身的反思

 

学习RPG是一个"元学习"工具------它帮助用户思考"我是如何学习的"。但它本身也是一个学习过程：关于"如何设计一个学习系统"的学习。

 

从v0.1到v1.0，每一个版本都在回答一个问题：

 

· v0.8.0："经验值如何反映真实的个人成长？"

· v0.9.0："如何将扁平的知识点组织成有意义的技能结构？"

· v0.10.0："如何用优化算法给出可执行的复习建议？"

· v0.11.0："如何将记录成本降到几乎为零？"

· v0.12.0："如何让成长变得可见、可感、可追？"

· v0.13.0："如何主动提醒用户进行阶段性检测？"

· v0.14.0："如何从宏观层面分析学习行为模式？"

· v0.15.0："如何让所有这些功能在一个清晰、美观的界面中共存？"

· v1.0.0："如何让这一切稳定、可靠、可维护？"

 

这些问题没有终极答案，但每一次迭代都在逼近一个更完善的理解------不仅是关于"如何设计学习系统"，更是关于"学习本身是什么"。

 

四、结语

 

学习RPG是一个个人项目。它不会成为下一个爆款App，不会获得融资，不会上架应用商店。但它做了一件几乎所有商业软件都不愿或不能做的事：为一个人，深入到底，去理解学习过程的每一个细节。

 

它的价值不在于代码行数（约12000行），不在于功能数量，而在于：

 

· 它让你对自己的学习有了前所未有的清晰认识

· 它帮你节省了大量的决策时间------每天打开系统，就知道该复习什么

· 它是你学习旅程的忠实见证者------每一分钟的投入都被记录，每一点进步都被量化

 

如果你用了这个系统一年后，回过头看那些数据------技能掌握度的攀升曲线、累计学习时长、一本本读完的书、一个个解锁的成就------你会看到一条清晰的成长轨迹。那不是模糊的"我感觉自己进步了"，而是可追溯、可验证、可量化的你的学习史。

 

这，就是学习RPG存在的唯一目的。
