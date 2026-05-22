# PROJECT — 学习RPG · 认知操作系统

**Code:** LTS
**Type:** Brownfield (legacy codebase in `Legacy/`)
**Version:** 0.0 (从零开始)
**Created:** 2026-05-23

---

## What This Is

一个面向高中生（墨澜）的单用户学习追踪 RPG 系统。用游戏化机制（XP、等级、成就）和认知科学算法（遗忘曲线、间隔重复、0/1 背包推荐）驱动个人学习管理。纯前端实现，localStorage 持久化，可选 GitHub 同步。

**核心价值：** 让"今天该复习什么"这个问题有科学答案——基于温度模型和阴影队列，自动推荐最高收益的复习组合。

---

## Context

**用户：** 墨澜，深圳中学高一学生，选科物化生
**学科：** 9科（数学/语文/英语/物理/化学/生物/政治/历史/地理）
**设计语言：** Legado 3.0（Material Design 3 基础）
**技术栈：** HTML5 + CSS3 + vanilla JS（ES5/ES6 混合）+ ECharts 5.4.3
**存储：** localStorage + 可选 GitHub Contents API 同步
**部署：** 直接浏览器打开 / GitHub Pages / PWA

**前代版本：** v2.x 已有完整功能但存在架构问题（God Object、无模块系统、双 XP 公式、无测试）。旧代码已移入 `Legacy/`，从 v0.0 重建但保留核心算法逻辑。

**参考文档：** `Legacy/docs/学习RPG参考文档.md`（2100+ 行完整技术规格书）
**任务清单：** `Legacy/docs/tasks.md`（100 版本任务清单，10 个阶段）

---

## Requirements

### Validated

以下能力在 Legacy 代码中已实现并验证，v0.x 需要保留：

- ✓ 温度模型 — `calcTemp(peakTemp, lastStudy, halfLife)` → Ebbinghaus 遗忘曲线
- ✓ 6级温度映射 — 炙热/温热/温暖/正常/微凉/冻结
- ✓ 动态半衰期 — `baseHalfLife × subjectModifier × accuracy × streak`，边界 0.5-30 天
- ✓ XP 基础引擎 — `calcBaseXP(score, duration)` 简单公式
- ✓ XP 引擎 2.0 — `calcXPEngine2(record, profile)` 多因子复杂公式（PE/CE/momentum/decay/softCap）
- ✓ 阴影队列 — `calcShadowQueue()` 基于 urgency + priority 的间隔重复排序
- ✓ 背包推荐 — `knapsackRecommend()` 0/1 动态规划，60 分钟时间预算
- ✓ 假性熟练检测 — 连续高正确率 + 低订正 + 低温 → 警告
- ✓ localStorage 持久化 — 安全读写，try-catch 隐私模式降级
- ✓ GitHub 同步 — 4 源并发加载（Raw/jsDelivr/CORS/Pages），后台静默更新
- ✓ MD3 设计系统 — CSS 变量主题，浅色/深色双模式
- ✓ 5 页导航 — 总览/技能树/复习/日志/更多，hash 路由
- ✓ 响应式布局 — 3 断点（768/480/360px）
- ✓ PWA — Service Worker，manifest.json

### Active

v0.x 需要新建或重写的能力：

**阶段一：架构基础（01-20）**
- [ ] ARCH-01: 项目目录结构初始化（css/js/data 目录，备份旧文件）
- [ ] ARCH-02: theme.css — MD3 色彩体系 CSS 变量，浅色/深色双主题
- [ ] ARCH-03: layout.css — 响应式布局（3 断点），导航占位，safe-area
- [ ] ARCH-04: components.css — 按钮/卡片/输入框/弹窗/进度条基础组件
- [ ] ARCH-05: pages.css — 5 个页面布局骨架
- [ ] ARCH-06: app.js — 应用初始化、模块加载顺序、全局错误捕获
- [ ] ARCH-07: utils.js — 日期格式化、UUID v4、深拷贝、debounce/throttle
- [ ] ARCH-08: data.js — localStorage 安全读写、缓存管理
- [ ] ARCH-09: 启动页 — Logo + 系统名 + 进度条 + LAUNCH 按钮 + 渐隐动画
- [ ] ARCH-10: 底部导航栏 — 5 Tab，SVG 图标，fixed 定位
- [ ] ARCH-11: 桌面端顶部导航栏 — Pill 按钮组，≥768px 显示，双向同步
- [ ] ARCH-12: 页面路由系统 — switchPage()，fadeInUp 动画，URL hash 同步
- [ ] ARCH-13: Header 组件 — 品牌标识 + 版本号，响应式
- [ ] ARCH-14: 概览页骨架 — Hero Stats 4 列统计卡片
- [ ] ARCH-15: 等级卡片 — Lv + 称号 + 日语罗马字 + 进度条
- [ ] ARCH-16: 学科卡片网格 — 9 科 Legado 书架风格，3 列→2 列→列表
- [ ] ARCH-17: 折叠面板 — 更多数据区域，折叠展开动画
- [ ] ARCH-18: 番茄钟 FAB — 56×56px 圆形，fixed 右下角，pulse 动画
- [ ] ARCH-19: 深色模式切换 — data-theme 切换，localStorage 持久化
- [ ] ARCH-20: 响应式全局适配 — 3 断点验证，44px 触摸目标

**阶段二：数据系统（21-35）**
- [ ] DATA-01: GitHub 数据加载 — 4 源并发，30s 超时，file:// 跳过
- [ ] DATA-02: localStorage 缓存层 — 24h 过期 + 版本号管理
- [ ] DATA-03: 兜底数据系统 — FALLBACK_DATA 默认集
- [ ] DATA-04: 数据格式转换 — 兼容 v1.0 + v2.0
- [ ] DATA-05: 后台静默更新 — 缓存秒开 + 后台刷新
- [ ] DATA-06: 数据加载 UI — 进度条 + 数据源标识 + 错误提示 + 重试
- [ ] DATA-07: user_profile.json 加载 — 21 参数初始化 + 类型校验
- [ ] DATA-08: skill-tree.json 加载 — 9 科 42 技能验证
- [ ] DATA-09: textbooks.json 加载 — 596 知识点，倒排索引
- [ ] DATA-10: courses.json 加载 — 6 学科 5 讲师，courseIndex
- [ ] DATA-11: achievements.json 加载 — 55 成就 5 稀有度，含 5 隐藏
- [ ] DATA-12: pomodoro-sessions.json 读写
- [ ] DATA-13: reading-records.json 读写
- [ ] DATA-14: bookshelf.json 自动同步
- [ ] DATA-15: 数据导出 — exportAllData() 导出完整 JSON

**阶段三：核心算法（36-50）**
- [ ] ALGO-01: GitHub 同步 — syncToGitHub() 推送，速率限制显示
- [ ] ALGO-02: 温度模型 — calcTemp() 实现
- [ ] ALGO-03: 温度等级映射 — getTempLevel() → 6 级
- [ ] ALGO-04: 动态半衰期 — calcHalfLife() 三层因子
- [ ] ALGO-05: 学科等级算法 — calcSubjectLevel() S=B^0.3×D^0.4×E^0.3
- [ ] ALGO-06: XP 基础引擎 — calcBaseXP()
- [ ] ALGO-07: XP 引擎 2.0 基础产出 — rawXP 计算
- [ ] ALGO-08: XP 引擎 2.0 质量乘数 — qual 计算
- [ ] ALGO-09: XP 引擎 2.0 全局调节 — decay + softCap
- [ ] ALGO-10: 进步动量 — calcMomentum() 线性回归 → tanh 压缩
- [ ] ALGO-11: 阴影队列 — calcShadowQueue()
- [ ] ALGO-12: 背包算法 — knapsackRecommend()
- [ ] ALGO-13: 提分潜力诊断 — calcImprovementPotential()
- [ ] ALGO-14: 假性熟练检测 — detectFalseMastery()
- [ ] ALGO-15: 用户画像自适应 — updateUserProfile() EMA 更新

**阶段四：概览页渲染（51-64）**
- [ ] VIEW-01: Hero Stats 真实渲染
- [ ] VIEW-02: 等级卡片渲染 — Lv(log 曲线) + 称号 + 进度条
- [ ] VIEW-03: 学科卡片真实渲染 — 9 科按等级降序
- [ ] VIEW-04: 学科卡片交互 — 点击展开技能详情
- [ ] VIEW-05: 成就展示区 — 最近 3 个已解锁徽章
- [ ] VIEW-06: 考试反思卡片
- [ ] VIEW-07: 学习日历热力图 — GitHub 风格 169 天
- [ ] VIEW-08: 教材进度地图 — 学科→教材联动
- [ ] VIEW-09: 网课进度展示 — 学科→讲师联动
- [ ] VIEW-10: 学习报告 — ECharts 折线图 30 天 XP 趋势
- [ ] VIEW-11: 学科时长柱状图
- [ ] VIEW-12: 薄弱点识别 — 掌握度最低 5 个知识点
- [ ] VIEW-13: 效率散点图 — 时长 vs 正确率
- [ ] VIEW-14: 时段热力图 — 星期 × 6 时段

**阶段五：技能树系统（65-74）**
- [ ] SKILL-01: 知识点数据构建 — buildKnowledgeStates()
- [ ] SKILL-02: 技能聚合 — aggregateSkillMastery()
- [ ] SKILL-03: 学科聚合 — aggregateSubjectAbility()
- [ ] SKILL-04: 特长检测 — detectTalents()
- [ ] SKILL-05: ECharts 力导向图 — 基础渲染
- [ ] SKILL-06: 力导向图交互 — 点击节点详情面板
- [ ] SKILL-07: 力导向图学科切换 — 下拉过滤
- [ ] SKILL-08: 技能雷达图 — 9 学科 + 单学科子技能
- [ ] SKILL-09: 技能树图例 — 6 级温度颜色
- [ ] SKILL-10: 技能树移动端适配

**阶段六：复习中心（75-82）**
- [ ] REV-01: 遗忘曲线图表 — ECharts 双折线
- [ ] REV-02: 阴影队列渲染 — 待复习知识点卡片
- [ ] REV-03: 智能复习推荐面板 — 时间预算 + 背包结果
- [ ] REV-04: 提分潜力诊断面板 — Top 5 高潜力技能
- [ ] REV-05: 假性熟练检测面板 — 警告列表
- [ ] REV-06: 开始复习流程 — 推荐→番茄钟→预填配置
- [ ] REV-07: 复习记录追踪 — updateKnowledgeState()
- [ ] REV-08: 考试推荐触发 — 4 条件检测

**阶段七：数据录入（83-88）**
- [ ] ENTRY-01: 数据录入弹窗 UI — 完整表单 + 校验
- [ ] ENTRY-02: 学科→教材→章节三级联动下拉
- [ ] ENTRY-03: 倒排索引搜索 — 5 级匹配
- [ ] ENTRY-04: 知识点多选标签 chip
- [ ] ENTRY-05: 做题/订正时间自动推断 — EMA
- [ ] ENTRY-06: 保存记录→全链路联动

**阶段八：日志管理（89-93）**
- [ ] LOG-01: 日志列表渲染 — 分页 20 条，滚动加载
- [ ] LOG-02: 日志筛选器 — 学科/活动类型/时间范围
- [ ] LOG-03: 日志搜索 — 关键词匹配 + 高亮
- [ ] LOG-04: 记录编辑 — 弹窗预填→修改→保存→重算
- [ ] LOG-05: 记录删除 — 确认弹窗→移除→重算→刷新

**阶段九：番茄钟系统（94-98）**
- [ ] POM-01: 番茄钟弹窗 — 计时前配置
- [ ] POM-02: 番茄钟计时中 — SVG 环形进度 + 倒计时
- [ ] POM-03: 番茄钟完成后 — 动画 + 评分 + 一键生成记录
- [ ] POM-04: 番茄钟后台追踪 — 切出检测 + 专注评分
- [ ] POM-05: 番茄钟历史 — 会话列表 + 统计面板

**阶段十：阅读 + 发布（99-100）**
- [ ] READ-01: 阅读记录系统 — 弹窗 + 列表 + 筛选 + 书架 + 图表
- [ ] REL-01: 全局集成测试 + 全链路验证 + 文档同步 + 正式发布

### Out of Scope

- 多用户支持 — 单用户系统，不需要登录/注册/权限
- 后端服务器 — 纯前端，localStorage + GitHub API 足够
- 移动端原生 App — PWA 方案已满足需求
- AI 推荐/ChatBot — 算法驱动，不需要 LLM
- 社交功能 — 单用户深度使用，不需要排行榜/分享
- 国际化 — 中文界面，不需要多语言

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 从零重建而非渐进重构 | 旧代码 God Object、无模块系统、双 XP 公式，重构成本高于重写 | ✓ 已决定 |
| 保留核心算法逻辑 | 温度模型/半衰期/XP 引擎/阴影队列/背包推荐已验证有效 | ✓ 已决定 |
| 纯前端 + localStorage | 单用户场景，无需后端复杂度 | ✓ 已决定 |
| Legado 3.0 设计语言 | Material Design 3 色彩体系，一致性好 | ✓ 已决定 |
| 100 版本迭代计划 | 10 个阶段，每阶段 10+ 版本，渐进式交付 | ✓ 已决定 |
| ECharts 替代 Chart.js | 力导向图/热力图/雷达图原生支持，功能更强 | ✓ 已决定 |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

*Last updated: 2026-05-23 after initialization*
