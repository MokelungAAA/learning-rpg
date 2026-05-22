const docx = require("docx");
const fs = require("fs");

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, PageBreak
} = docx;

// Helper: heading
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, bold: true, size: 32 })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, bold: true, size: 26 })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, bold: true, size: 22 })] });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 21, ...opts })]
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 21 })]
  });
}
function boldP(label, text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: label, bold: true, size: 21 }),
      new TextRun({ text, size: 21 })
    ]
  });
}

// Helper: table
function makeTable(headers, rows) {
  const headerCells = headers.map(h => new TableCell({
    shading: { type: ShadingType.SOLID, color: "2B579A" },
    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })] })],
    width: { size: 100 / headers.length, type: WidthType.PERCENTAGE }
  }));
  const dataRows = rows.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 20 })] })],
      width: { size: 100 / headers.length, type: WidthType.PERCENTAGE }
    }))
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells }), ...dataRows]
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 200 }, children: [] });
}

async function main() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // ===== TITLE =====
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "学习RPG · 认知操作系统", bold: true, size: 44, color: "2B579A" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "需求整理文档 v0.1", size: 28, color: "666666" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "文档日期：2026-05-23 | 项目版本：0.0", size: 20, color: "999999" })]
        }),
        spacer(),

        // ===== 1. PROJECT OVERVIEW =====
        h1("一、项目概述"),
        p("学习RPG · 认知操作系统是一个基于心理学原理的 gamified 学习追踪系统。核心理念：将学习过程可视化、游戏化，通过科学算法驱动智能推荐，帮助用户实现「三分学、七分输出」的高效学习模式。"),
        spacer(),
        h2("1.1 核心价值"),
        bullet("学习可视化 — 所有学习活动（刷题、网课、背诵、阅读）一目了然"),
        bullet("智能推荐 — 基于遗忘曲线、间隔效应等心理学原理，精确到知识点级别的复习建议"),
        bullet("游戏化激励 — 经验值、等级、技能树、成就系统，让学习有成就感"),
        bullet("低摩擦记录 — 微信简写 + 番茄钟自动记录，降低记录成本"),
        spacer(),
        h2("1.2 技术定位"),
        bullet("纯前端单用户应用，部署在 GitHub Pages"),
        bullet("数据存储：GitHub 仓库 JSON 文件"),
        bullet("无后端服务器，无数据库"),
        bullet("版本策略：从 0.0 开始，核心功能完善后进入 1.0"),
        spacer(),

        // ===== 2. SYSTEM ARCHITECTURE =====
        h1("二、系统架构"),
        h2("2.1 六大子系统"),
        makeTable(
          ["子系统", "核心功能", "优先级"],
          [
            ["经验值/等级系统", "学科XP → 总XP → 等级，含晋级门禁", "P0 核心"],
            ["技能树系统", "知识点掌握度 → 技能 → 学科，可视化", "P0 核心"],
            ["推荐引擎", "基于遗忘曲线+间隔效应，理科到小节/文科到题型", "P0 核心"],
            ["番茄钟系统", "计时+自动记录，减少手动录入", "P0 核心"],
            ["阅读记录系统", "书架式展示，读书/听书/笔记三种类型", "P1 重要"],
            ["数据面板", "多维度数据可视化统计", "P1 重要"],
            ["成就系统", "里程碑成就，精美展示", "P2 锦上添花"],
          ]
        ),
        spacer(),

        // ===== 3. EXPERIENCE & LEVEL SYSTEM =====
        h1("三、经验值与等级系统"),
        h2("3.1 经验值架构"),
        p("经验值采用四层聚合结构："),
        boldP("第一层：", "单次学习活动 → 基础经验值（基于时长、正确率、活动类型）"),
        boldP("第二层：", "知识点经验值 → 同一知识点所有活动的累积"),
        boldP("第三层：", "技能/学科经验值 → 该学科下所有知识点的加权汇总"),
        boldP("第四层：", "总经验值 → 所有学科经验值之和 → 全局等级"),
        spacer(),
        h2("3.2 学科经验值计算"),
        p("每个学科独立计算经验值，公式核心要素："),
        bullet("基础XP = f(时长, 正确率)"),
        bullet("活动类型权重：刷题(1.2) > 默写(1.15) > 订正(1.1) > 笔记整理(1.0) > 网课(0.7) > 阅读(0.5)"),
        bullet("输出活动（刷题/默写/订正）比输入活动（网课/阅读）权重更高"),
        bullet("边际收益递减：同一知识点连续刷题，后续XP逐渐降低"),
        spacer(),
        h2("3.3 等级与晋级门禁"),
        p("总等级从1级开始，经验值累积升级。关键节点设有晋级门禁，需要通过考试检测："),
        makeTable(
          ["等级区间", "解锁条件", "对应考试水平"],
          [
            ["1-10级", "累积经验即可，无门禁", "基础积累期"],
            ["10级 → 11级", "学考模拟卷 ≥ 70%", "学考合格水平"],
            ["20级 → 21级", "学考模拟卷 ≥ 80%", "学考良好水平"],
            ["30级 → 31级", "学考模拟卷 ≥ 90%", "学考优秀水平"],
            ["40级 → 41级", "高考模拟卷 ≥ 70%", "高考合格水平"],
            ["50级 → 51级", "高考模拟卷 ≥ 80%", "高考良好水平"],
            ["60级 → 61级", "高考模拟卷 ≥ 90%", "高考优秀水平"],
          ]
        ),
        p("注：考试成绩由用户手动录入，系统不出题。"),
        spacer(),

        // ===== 4. SKILL TREE =====
        h1("四、技能树系统"),
        h2("4.1 结构设计"),
        p("技能树采用三层聚合结构："),
        boldP("知识点（叶子节点）：", "最细粒度，如「数学必修2 §5.3 两角和与差的正弦」"),
        boldP("技能（中间节点）：", "一组相关知识点的集合，如「三角函数」"),
        boldP("学科（根节点）：", "9个学科节点，显示总经验值和等级"),
        spacer(),
        h2("4.2 文理分科"),
        makeTable(
          ["分类", "学科", "推荐粒度"],
          [
            ["理科", "数学、物理、化学、生物", "精确到小节知识点（§5.3）"],
            ["文科", "语文、英语、政治、历史、地理", "按题型分类（阅读理解、古诗文默写等）"],
          ]
        ),
        spacer(),
        h2("4.3 掌握度计算"),
        p("每个知识点的掌握度基于多个因素动态计算："),
        bullet("正确率（最近N次的加权平均）"),
        bullet("复习频率（是否按间隔复习）"),
        bullet("遗忘程度（基于艾宾浩斯曲线的当前温度值）"),
        bullet("输出比例（该知识点的学习中，输出活动占比多少）"),
        spacer(),

        // ===== 5. RECOMMENDATION ENGINE =====
        h1("五、推荐引擎"),
        h2("5.1 核心心理学原理"),
        makeTable(
          ["原理", "说明", "系统应用"],
          [
            ["艾宾浩斯遗忘曲线", "记忆随时间衰减，复习可以重置曲线", "计算每个知识点的当前温度值"],
            ["间隔效应", "两次学习之间的间隔越长(到最优值)，记忆越牢固", "计算最优复习间隔"],
            ["交错效应", "混合不同题型比集中刷同一种效果更好", "推荐任务时主动交错学科和题型"],
            ["测试效应", "主动回忆（输出）比被动重读有效得多", "输出活动权重高于输入活动"],
            ["三分学七分输出", "输出是学习的核心", "追踪输入/输出比，低于3:7时提醒"],
            ["过度学习检测", "正确率持续>90%，边际收益急剧下降", "建议该知识点「可以放一放了」"],
            ["元认知校准", "自信度高但实际错误的知识点最危险", "重点标记并优先推荐"],
            ["疲劳曲线", "连续学习超时正确率下降", "检测并建议休息"],
          ]
        ),
        spacer(),
        h2("5.2 个性化算法"),
        p("系统通过持续收集用户数据，逐步拟合个人化的学习参数："),
        bullet("个人遗忘速度 — 每个学科/知识点的实际遗忘半衰期"),
        bullet("时段效率 — 不同时间段的正确率差异，发现黄金学习时间"),
        bullet("学科差异 — 哪科学得快、哪科学得慢"),
        bullet("输入/输出比 — 追踪每周比例，确保输出>70%"),
        bullet("疲劳阈值 — 连续学习多久后正确率开始下降"),
        spacer(),
        h2("5.3 推荐粒度"),
        boldP("理科推荐：", "精确到具体小节知识点，如「建议复习数学必修2 §5.3，预计用时15分钟」"),
        boldP("文科推荐：", "按题型推荐，如「建议练习英语阅读理解3篇，预计用时25分钟」"),
        boldP("推荐展示：", "显示每个推荐项的原因（遗忘程度、距上次复习天数、优先级分数）"),
        spacer(),

        // ===== 6. POMODORO =====
        h1("六、番茄钟系统"),
        h2("6.1 核心功能"),
        bullet("标准番茄钟计时（25分钟工作 + 5分钟休息）"),
        bullet("支持自定义时长"),
        bullet("番茄钟结束时自动弹出记录表单，预填时间和学科"),
        bullet("可选择活动类型（刷题/默写/笔记/网课等）"),
        bullet("支持在番茄钟进行中快速标记知识点"),
        spacer(),
        h2("6.2 数据联动"),
        bullet("番茄钟记录自动转化为学习记录，写入数据文件"),
        bullet("精确到秒的时长记录，比手动录入更准确"),
        bullet("减少微信助手的录入负担 — 在电脑前学习时优先用番茄钟"),
        spacer(),

        // ===== 7. READING SYSTEM =====
        h1("七、阅读记录系统"),
        h2("7.1 书架展示"),
        p("以书架形式直观展示所有阅读记录，每本书是一个卡片："),
        bullet("书名、作者、封面（可选）"),
        bullet("阅读进度（已读页数/总页数）"),
        bullet("阅读类型标记：📖 读书 | 🎧 听书 | 📝 笔记"),
        bullet("累计阅读时长"),
        bullet("最近阅读日期"),
        spacer(),
        h2("7.2 阅读记录"),
        bullet("每次阅读记录：日期 + 时长 + 类型（读书/听书/笔记）"),
        bullet("阅读也产生经验值，但权重较低（输入活动）"),
        bullet("后期可扩展：与 Obsidian 笔记库联动"),
        spacer(),

        // ===== 8. DATA ENTRY =====
        h1("八、数据录入方式"),
        h2("8.1 微信助手 → GitHub（主要方式）"),
        p("通过微信发送简短消息，Claude 解析后自动写入 GitHub 数据文件。"),
        h3("标准化简写格式"),
        p("格式：[科目][教材][章节]。[活动] [时长]。[细节（可选）]"),
        spacer(),
        h3("活动类型关键词映射"),
        makeTable(
          ["关键词", "活动类型", "说明"],
          [
            ["刷题/做题/练习", "practice", "主动输出，权重最高"],
            ["默写/背诵/听写", "recitation", "主动回忆，高权重"],
            ["订正/纠错/改错", "correction", "从错误中学习，高权重"],
            ["笔记/整理/归纳", "note_taking", "知识整理，中等权重"],
            ["网课/视频/听课", "lecture", "被动输入，较低权重"],
            ["阅读/看书", "reading", "被动输入，较低权重"],
          ]
        ),
        spacer(),
        h3("简写示例"),
        makeTable(
          ["微信消息", "解析结果"],
          [
            ["数学53必修2§5.3 刷题50m 8/10", "数学 · 必修2 §5.3 · 刷题 · 50分钟 · 80%正确率"],
            ["英语人教选必1U3 背诵30m 默写85%", "英语 · 选必1 Unit3 · 背诵 · 30分钟 · 85%正确率"],
            ["物理步步高§4.2 网课40m+笔记20m", "物理 · §4.2 · 网课40分钟 + 笔记20分钟"],
            ["化学必修1§2.1 刷题35m 错3道", "化学 · 必修1 §2.1 · 刷题 · 35分钟 · 错3道"],
          ]
        ),
        spacer(),
        h2("8.2 番茄钟自动记录"),
        p("在电脑前学习时，使用番茄钟自动记录，结束时填写活动详情。"),
        spacer(),
        h2("8.3 网站内手动编辑"),
        p("支持在网站内对已有数据进行基本编辑："),
        bullet("修改某次记录的时间、时长、正确率"),
        bullet("删除误录的数据"),
        bullet("调整学科/知识点分类"),
        bullet("录入考试成绩（用于等级门禁检测）"),
        bullet("注意：不含算法参数编辑功能"),
        spacer(),

        // ===== 9. DATA PANELS =====
        h1("九、数据面板与可视化"),
        h2("9.1 统计模块"),
        bullet("总览面板 — 总经验值、等级、学习总时长、连续学习天数"),
        bullet("学科面板 — 各学科独立XP、掌握度分布、正确率趋势"),
        bullet("时间面板 — 日/周/月学习时长分布，黄金学习时段"),
        bullet("输入/输出面板 — 输入vs输出比例可视化，确保70%输出"),
        bullet("遗忘监控 — 各知识点温度值，红色预警遗忘严重的内容"),
        spacer(),
        h2("9.2 技能树可视化"),
        bullet("力导向图或树状图展示知识结构"),
        bullet("节点颜色表示掌握度（红→黄→绿）"),
        bullet("节点大小表示经验值"),
        bullet("点击节点查看详情（历史记录、遗忘曲线）"),
        spacer(),
        h2("9.3 书架面板"),
        bullet("书架式布局，展示所有在读/已读书籍"),
        bullet("阅读进度条、累计时长、最近阅读日期"),
        bullet("按阅读类型筛选"),
        spacer(),

        // ===== 10. ACHIEVEMENTS =====
        h1("十、成就系统"),
        p("成就系统作为长期激励机制，具体设计后续细化。初步方向："),
        bullet("里程碑成就 — 「首次学习」「连续7天」「100小时」等"),
        bullet("学科成就 — 「数学达人」「英语通」等学科专属"),
        bullet("特殊成就 — 「夜猫子」「早起鸟」「全科学习」等"),
        bullet("成就展示 — 精美的卡片式展示，有解锁动画"),
        spacer(),

        // ===== 11. DATA MODEL =====
        h1("十一、数据模型"),
        h2("11.1 学习记录"),
        makeTable(
          ["字段", "类型", "说明"],
          [
            ["id", "string", "UUID唯一标识"],
            ["timestamp", "ISO日期", "记录时间"],
            ["subject", "string", "学科标识（如 math/english/physics）"],
            ["topic", "string", "知识点/章节（如 §5.3 / Unit3）"],
            ["activityType", "enum", "practice/recitation/correction/note/lecture/reading"],
            ["duration", "number", "时长（分钟）"],
            ["accuracy", "number?", "正确率（百分比，可选）"],
            ["source", "enum", "web/pomodoro/wechat"],
            ["xp", "number", "本次获得经验值"],
            ["notes", "string?", "备注（可选）"],
          ]
        ),
        spacer(),
        h2("11.2 知识点状态"),
        makeTable(
          ["字段", "类型", "说明"],
          [
            ["key", "string", "如 math/§5.3"],
            ["mastery", "number", "掌握度 0-100"],
            ["temperature", "number", "当前温度值（遗忘程度）"],
            ["halfLife", "number", "个人化半衰期（天）"],
            ["lastStudied", "ISO日期", "最近学习时间"],
            ["totalXP", "number", "该知识点累计XP"],
            ["history", "array", "学习历史记录"],
          ]
        ),
        spacer(),
        h2("11.3 阅读记录"),
        makeTable(
          ["字段", "类型", "说明"],
          [
            ["id", "string", "UUID"],
            ["title", "string", "书名"],
            ["author", "string?", "作者（可选）"],
            ["type", "enum", "reading/listening/note"],
            ["duration", "number", "本次时长（分钟）"],
            ["date", "ISO日期", "阅读日期"],
            ["progress", "number?", "进度百分比（可选）"],
          ]
        ),
        spacer(),
        h2("11.4 番茄钟记录"),
        makeTable(
          ["字段", "类型", "说明"],
          [
            ["id", "string", "UUID"],
            ["startTime", "ISO日期", "开始时间"],
            ["endTime", "ISO日期", "结束时间"],
            ["duration", "number", "实际时长（秒）"],
            ["subject", "string", "学科"],
            ["activityType", "enum", "活动类型"],
            ["completed", "boolean", "是否完成（未被打断）"],
          ]
        ),
        spacer(),
        h2("11.5 成绩记录（门禁用）"),
        makeTable(
          ["字段", "类型", "说明"],
          [
            ["id", "string", "UUID"],
            ["examType", "enum", "mock_academic/mock_gaokao"],
            ["score", "number", "得分百分比"],
            ["date", "ISO日期", "考试日期"],
            ["subjects", "object", "各科得分明细"],
          ]
        ),
        spacer(),

        // ===== 12. TECH STACK =====
        h1("十二、技术栈"),
        makeTable(
          ["层级", "技术", "说明"],
          [
            ["语言", "HTML5 + CSS3 + JavaScript ES6+", "纯前端，无框架"],
            ["图表", "ECharts 5.x", "力导向图、雷达图、热力图、折线图"],
            ["存储", "GitHub JSON 文件", "通过 GitHub API 读写"],
            ["部署", "GitHub Pages", "静态托管"],
            ["PWA", "Service Worker + manifest.json", "离线支持"],
            ["设计语言", "Material Design 2/3", "卡片布局、底部导航"],
          ]
        ),
        spacer(),

        // ===== 13. NAVIGATION =====
        h1("十三、页面导航"),
        p("采用5 Tab底部导航 + 数据面板入口的结构："),
        makeTable(
          ["Tab", "页面", "核心内容"],
          [
            ["总览", "Overview", "总XP/等级、学科概览、今日任务、数据快览"],
            ["技能树", "Skill Tree", "知识结构可视化、掌握度热力图"],
            ["推荐", "Review", "智能推荐任务、遗忘预警、番茄钟入口"],
            ["日志", "Log", "学习记录列表、阅读记录、筛选搜索"],
            ["更多", "Settings", "数据管理、成就展示、设置、关于"],
          ]
        ),
        spacer(),

        // ===== 14. VERSION STRATEGY =====
        h1("十四、版本策略"),
        h2("14.1 版本编号"),
        bullet("从 v0.0 开始"),
        bullet("核心功能全部实现且稳定后，进入 v1.0"),
        bullet("后续采用语义化版本（major.minor.patch）"),
        spacer(),
        h2("14.2 核心功能清单（v1.0 前必须完成）"),
        bullet("✅ 经验值系统（学科XP → 总XP → 等级）"),
        bullet("✅ 等级晋级门禁"),
        bullet("✅ 技能树可视化"),
        bullet("✅ 推荐引擎（遗忘曲线 + 间隔效应 + 交错效应）"),
        bullet("✅ 番茄钟系统"),
        bullet("✅ 微信数据录入（标准化简写格式）"),
        bullet("✅ 基本数据编辑"),
        bullet("✅ 数据面板（至少总览+学科+时间）"),
        bullet("✅ 阅读记录系统（书架式）"),
        bullet("⬜ 成就系统（v1.0后迭代）"),
        spacer(),

        // ===== 15. OPEN QUESTIONS =====
        h1("十五、待确认事项"),
        p("以下问题需要在后续讨论中确认："),
        bullet("成就系统的具体设计（成就数量、分类、解锁条件）"),
        bullet("学科教材的具体目录结构（需要录入各科教辅的章节列表）"),
        bullet("等级经验值曲线（每级需要多少XP，是否指数增长）"),
        bullet("技能树的可视化形式（力导向图 vs 树状图 vs 其他）"),
        bullet("Obsidian笔记库联动的具体方案"),
        bullet("PWA离线功能的范围"),
        spacer(),

        // ===== FOOTER =====
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: "— 文档结束 —", size: 20, color: "999999", italics: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "学习RPG · 认知操作系统 | 需求整理文档 v0.1 | 2026-05-23", size: 18, color: "BBBBBB" })]
        }),
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("E:/Htmls/LTS Program/.planning/需求整理文档-v0.1.docx", buffer);
  console.log("Done: .planning/需求整理文档-v0.1.docx");
}

main().catch(e => { console.error(e); process.exit(1); });
