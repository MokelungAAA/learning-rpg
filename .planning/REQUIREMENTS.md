# REQUIREMENTS — 学习RPG · 认知操作系统

**Version:** 1.0
**Date:** 2026-05-23
**Source:** PROJECT.md, Legacy/docs/tasks.md, Legacy/docs/学习RPG参考文档.md

---

## v1 Requirements

> v1 = must ship in this milestone. Grouped by category, each with a unique REQ-ID.

### Architecture Foundation

| REQ-ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| ARCH-01 | 项目目录结构初始化（css/js/data 目录，备份旧文件） | 1 | [ ] |
| ARCH-02 | theme.css — MD3 色彩体系 CSS 变量，浅色/深色双主题 | 1 | [ ] |
| ARCH-03 | layout.css — 响应式布局（3 断点 768/480/360），导航占位，safe-area | 1 | [ ] |
| ARCH-04 | components.css — 按钮/卡片/输入框/弹窗/进度条基础组件 | 1 | [ ] |
| ARCH-05 | pages.css — 5 个页面布局骨架 | 1 | [ ] |
| ARCH-06 | app.js — 应用初始化、模块加载顺序、全局错误捕获 | 1 | [ ] |
| ARCH-07 | utils.js — 日期格式化、UUID v4、深拷贝、debounce/throttle | 1 | [ ] |
| ARCH-08 | data.js — localStorage 安全读写、缓存管理 | 1 | [ ] |
| ARCH-09 | 启动页 — Logo + 系统名 + 进度条 + LAUNCH 按钮 + 渐隐动画 | 1 | [ ] |
| ARCH-10 | 底部导航栏 — 4 Tab + 1个叠加按钮，SVG 图标，悬浮定位 | 1 | [ ] |
| ARCH-11 | 桌面端顶部导航栏 — Pill 按钮组，≥768px 显示，双向同步 | 1 | [ ] |
| ARCH-12 | 页面路由系统 — switchPage()，fadeInUp 动画，URL hash 同步 | 1 | [ ] |
| ARCH-13 | Header 组件 — 品牌标识 + 版本号，响应式 | 1 | [ ] |
| ARCH-14 | 概览页骨架 — Hero Stats 4 列统计卡片 | 1 | [ ] |
| ARCH-15 | 等级卡片 — Lv + 称号 + 日语罗马字 + 进度条 | 1 | [ ] |
| ARCH-16 | 学科卡片网格 — 9 科 Legado 书架风格，3 列→2 列→列表 | 1 | [ ] |
| ARCH-17 | 折叠面板 — 更多数据区域，折叠展开动画 | 1 | [ ] |
| ARCH-18 | 番茄钟 FAB — 56×56px 圆形，fixed 右下角，pulse 动画 | 1 | [ ] |
| ARCH-19 | 深色模式切换 — data-theme 切换，localStorage 持久化 | 1 | [ ] |
| ARCH-20 | 响应式全局适配 — 3 断点验证，44px 触摸目标 | 1 | [ ] |

### Data System

| REQ-ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| DATA-01 | GitHub 数据加载 — 4 源并发，30s 超时，file:// 跳过 | 2 | [ ] |
| DATA-02 | localStorage 缓存层 — 24h 过期 + 版本号管理 | 2 | [ ] |
| DATA-03 | 兜底数据系统 — FALLBACK_DATA 默认集 | 2 | [ ] |
| DATA-04 | 数据格式转换 — 兼容 v1.0 + v2.0 | 2 | [ ] |
| DATA-05 | 后台静默更新 — 缓存秒开 + 后台刷新 | 2 | [ ] |
| DATA-06 | 数据加载 UI — 进度条 + 数据源标识 + 错误提示 + 重试 | 2 | [ ] |
| DATA-07 | user_profile.json 加载 — 21 参数初始化 + 类型校验 | 2 | [ ] |
| DATA-08 | skill-tree.json 加载 — 9 科 42 技能验证 | 2 | [ ] |
| DATA-09 | textbooks.json 加载 — 596 知识点，倒排索引 | 2 | [ ] |
| DATA-10 | courses.json 加载 — 6 学科 5 讲师，courseIndex | 2 | [ ] |
| DATA-11 | achievements.json 加载 — 55 成就 5 稀有度，含 5 隐藏 | 2 | [ ] |
| DATA-12 | pomodoro-sessions.json 读写 | 2 | [ ] |
| DATA-13 | reading-records.json 读写 | 2 | [ ] |
| DATA-14 | bookshelf.json 自动同步 | 2 | [ ] |
| DATA-15 | 数据导出 — exportAllData() 导出完整 JSON | 2 | [ ] |

### Core Algorithms

| REQ-ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| ALGO-01 | GitHub 同步 — syncToGitHub() 推送，速率限制显示 | 3 | [ ] |
| ALGO-02 | 温度模型 — calcTemp() 实现 | 3 | [ ] |
| ALGO-03 | 温度等级映射 — getTempLevel() → 6 级 | 3 | [ ] |
| ALGO-04 | 动态半衰期 — calcHalfLife() 三层因子 | 3 | [ ] |
| ALGO-05 | 学科等级算法 — calcSubjectLevel() S=B^0.3×D^0.4×E^0.3 | 3 | [ ] |
| ALGO-06 | XP 基础引擎 — calcBaseXP() | 3 | [ ] |
| ALGO-07 | XP 引擎 2.0 基础产出 — rawXP 计算 | 3 | [ ] |
| ALGO-08 | XP 引擎 2.0 质量乘数 — qual 计算 | 3 | [ ] |
| ALGO-09 | XP 引擎 2.0 全局调节 — decay + softCap | 3 | [ ] |
| ALGO-10 | 进步动量 — calcMomentum() 线性回归 → tanh 压缩 | 3 | [ ] |
| ALGO-11 | 阴影队列 — calcShadowQueue() | 3 | [ ] |
| ALGO-12 | 背包算法 — knapsackRecommend() | 3 | [ ] |
| ALGO-13 | 提分潜力诊断 — calcImprovementPotential() | 3 | [ ] |
| ALGO-14 | 假性熟练检测 — detectFalseMastery() | 3 | [ ] |
| ALGO-15 | 用户画像自适应 — updateUserProfile() EMA 更新 | 3 | [ ] |

### Overview Page Rendering

| REQ-ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| VIEW-01 | Hero Stats 真实渲染 | 4 | [ ] |
| VIEW-02 | 等级卡片渲染 — Lv(log 曲线) + 称号 + 进度条 | 4 | [ ] |
| VIEW-03 | 学科卡片真实渲染 — 9 科按等级降序 | 4 | [ ] |
| VIEW-04 | 学科卡片交互 — 点击展开技能详情 | 4 | [ ] |
| VIEW-05 | 成就展示区 — 最近 3 个已解锁徽章 | 4 | [ ] |
| VIEW-06 | 考试反思卡片 | 4 | [ ] |
| VIEW-07 | 学习日历热力图 — GitHub 风格 169 天 | 4 | [ ] |
| VIEW-08 | 教材进度地图 — 学科→教材联动 | 4 | [ ] |
| VIEW-09 | 网课进度展示 — 学科→讲师联动 | 4 | [ ] |
| VIEW-10 | 学习报告 — ECharts 折线图 30 天 XP 趋势 | 4 | [ ] |
| VIEW-11 | 学科时长柱状图 | 4 | [ ] |
| VIEW-12 | 薄弱点识别 — 掌握度最低 5 个知识点 | 4 | [ ] |
| VIEW-13 | 效率散点图 — 时长 vs 正确率 | 4 | [ ] |
| VIEW-14 | 时段热力图 — 星期 × 6 时段 | 4 | [ ] |

### Skill Tree System

| REQ-ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| SKILL-01 | 知识点数据构建 — buildKnowledgeStates() | 5 | [ ] |
| SKILL-02 | 技能聚合 — aggregateSkillMastery() | 5 | [ ] |
| SKILL-03 | 学科聚合 — aggregateSubjectAbility() | 5 | [ ] |
| SKILL-04 | 特长检测 — detectTalents() | 5 | [ ] |
| SKILL-05 | ECharts 力导向图 — 基础渲染 | 5 | [ ] |
| SKILL-06 | 力导向图交互 — 点击节点详情面板 | 5 | [ ] |
| SKILL-07 | 力导向图学科切换 — 下拉过滤 | 5 | [ ] |
| SKILL-08 | 技能雷达图 — 9 学科 + 单学科子技能 | 5 | [ ] |
| SKILL-09 | 技能树图例 — 6 级温度颜色 | 5 | [ ] |
| SKILL-10 | 技能树移动端适配 | 5 | [ ] |

### Review Center

| REQ-ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| REV-01 | 遗忘曲线图表 — ECharts 双折线 | 6 | [ ] |
| REV-02 | 阴影队列渲染 — 待复习知识点卡片 | 6 | [ ] |
| REV-03 | 智能复习推荐面板 — 时间预算 + 背包结果 | 6 | [ ] |
| REV-04 | 提分潜力诊断面板 — Top 5 高潜力技能 | 6 | [ ] |
| REV-05 | 假性熟练检测面板 — 警告列表 | 6 | [ ] |
| REV-06 | 开始复习流程 — 推荐→番茄钟→预填配置 | 6 | [ ] |
| REV-07 | 复习记录追踪 — updateKnowledgeState() | 6 | [ ] |
| REV-08 | 考试推荐触发 — 4 条件检测 | 6 | [ ] |

### Data Entry

| REQ-ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| ENTRY-01 | 数据录入弹窗 UI — 完整表单 + 校验 | 7 | [ ] |
| ENTRY-02 | 学科→教材→章节三级联动下拉 | 7 | [ ] |
| ENTRY-03 | 倒排索引搜索 — 5 级匹配 | 7 | [ ] |
| ENTRY-04 | 知识点多选标签 chip | 7 | [ ] |
| ENTRY-05 | 做题/订正时间自动推断 — EMA | 7 | [ ] |
| ENTRY-06 | 保存记录→全链路联动 | 7 | [ ] |

### Log Management

| REQ-ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| LOG-01 | 日志列表渲染 — 分页 20 条，滚动加载 | 8 | [ ] |
| LOG-02 | 日志筛选器 — 学科/活动类型/时间范围 | 8 | [ ] |
| LOG-03 | 日志搜索 — 关键词匹配 + 高亮 | 8 | [ ] |
| LOG-04 | 记录编辑 — 弹窗预填→修改→保存→重算 | 8 | [ ] |
| LOG-05 | 记录删除 — 确认弹窗→移除→重算→刷新 | 8 | [ ] |

### Pomodoro System

| REQ-ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| POM-01 | 番茄钟弹窗 — 计时前配置 | 9 | [ ] |
| POM-02 | 番茄钟计时中 — SVG 环形进度 + 倒计时 | 9 | [ ] |
| POM-03 | 番茄钟完成后 — 动画 + 评分 + 一键生成记录 | 9 | [ ] |
| POM-04 | 番茄钟后台追踪 — 切出检测 + 专注评分 | 9 | [ ] |
| POM-05 | 番茄钟历史 — 会话列表 + 统计面板 | 9 | [ ] |

### Reading & Release

| REQ-ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| READ-01 | 阅读记录系统 — 弹窗 + 列表 + 筛选 + 书架 + 图表 | 10 | [ ] |
| REL-01 | 全局集成测试 + 全链路验证 + 文档同步 + 正式发布 | 10 | [ ] |

---

## v2 Requirements (Deferred)

> v2 = valuable but not blocking for v1 milestone. Ship when ready.

暂无 v2 需求。所有功能已归入 v1 或 Out of Scope。

---

## Out of Scope

> Explicitly excluded, with reasoning.

| Item | Reason |
|------|--------|
| 多用户支持 | 单用户系统，不需要登录/注册/权限 |
| 后端服务器 | 纯前端，localStorage + GitHub API 足够 |
| 移动端原生 App | PWA 方案已满足需求 |
| AI 推荐/ChatBot | 算法驱动，不需要 LLM |
| 社交功能 | 单用户深度使用，不需要排行榜/分享 |
| 国际化 | 中文界面，不需要多语言 |

---

## Traceability

> Maps each REQ-ID to its roadmap phase. Filled by ROADMAP.md.

| Category | REQ-IDs | Phase |
|----------|---------|-------|
| Architecture | ARCH-01 ~ ARCH-20 | Phase 1: 架构基础 |
| Data System | DATA-01 ~ DATA-15 | Phase 2: 数据系统 |
| Core Algorithms | ALGO-01 ~ ALGO-15 | Phase 3: 核心算法 |
| Overview Page | VIEW-01 ~ VIEW-14 | Phase 4: 概览页渲染 |
| Skill Tree | SKILL-01 ~ SKILL-10 | Phase 5: 技能树系统 |
| Review Center | REV-01 ~ REV-08 | Phase 6: 复习中心 |
| Data Entry | ENTRY-01 ~ ENTRY-06 | Phase 7: 数据录入 |
| Log Management | LOG-01 ~ LOG-05 | Phase 8: 日志管理 |
| Pomodoro | POM-01 ~ POM-05 | Phase 9: 番茄钟系统 |
| Reading & Release | READ-01, REL-01 | Phase 10: 阅读+发布 |

**Total v1 Requirements:** 100
**Total Phases:** 10

---

*Generated: 2026-05-23 by GSD new-project workflow*
