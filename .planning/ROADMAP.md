# ROADMAP — 学习RPG · 认知操作系统

**Version:** 1.0
**Date:** 2026-05-23
**Phases:** 10
**Total Requirements:** 100

---

## Phase Overview

| Phase | Name | Requirements | Dependencies | Status |
|-------|------|--------------|--------------|--------|
| 1 | 架构基础 | ARCH-01 ~ ARCH-20 (20) | None | [ ] |
| 2 | 数据系统 | DATA-01 ~ DATA-15 (15) | Phase 1 | [ ] |
| 3 | 核心算法 | ALGO-01 ~ ALGO-15 (15) | Phase 2 | [ ] |
| 4 | 概览页渲染 | VIEW-01 ~ VIEW-14 (14) | Phase 3 | [ ] |
| 5 | 技能树系统 | SKILL-01 ~ SKILL-10 (10) | Phase 3 | [ ] |
| 6 | 复习中心 | REV-01 ~ REV-08 (8) | Phase 3 | [ ] |
| 7 | 数据录入 | ENTRY-01 ~ ENTRY-06 (6) | Phase 3 | [ ] |
| 8 | 日志管理 | LOG-01 ~ LOG-05 (5) | Phase 7 | [ ] |
| 9 | 番茄钟系统 | POM-01 ~ POM-05 (5) | Phase 7 | [ ] |
| 10 | 阅读+发布 | READ-01, REL-01 (2) | Phase 4-9 | [ ] |

---

## Dependency Graph

```
Phase 1 (架构基础)
    ↓
Phase 2 (数据系统)
    ↓
Phase 3 (核心算法)
    ↓
    ├─→ Phase 4 (概览页渲染)
    ├─→ Phase 5 (技能树系统)
    ├─→ Phase 6 (复习中心)
    └─→ Phase 7 (数据录入)
              ↓
         ┌────┴────┐
         ↓         ↓
    Phase 8     Phase 9
    (日志管理)  (番茄钟系统)
         └────┬────┘
              ↓
        Phase 10 (阅读+发布)
```

---

## Phase Details

### Phase 1: 架构基础

**Goal:** 建立完整的前端项目骨架，实现所有 UI 基础设施

**Mode:** yolo

**Requirements:**
- ARCH-01: 项目目录结构初始化
- ARCH-02: theme.css — MD3 色彩体系
- ARCH-03: layout.css — 响应式布局
- ARCH-04: components.css — 基础组件样式
- ARCH-05: pages.css — 5 页面布局骨架
- ARCH-06: app.js — 应用初始化
- ARCH-07: utils.js — 工具函数库
- ARCH-08: data.js — localStorage 读写层
- ARCH-09: 启动页
- ARCH-10: 底部导航栏
- ARCH-11: 桌面端顶部导航栏
- ARCH-12: 页面路由系统
- ARCH-13: Header 组件
- ARCH-14: 概览页骨架 — Hero Stats
- ARCH-15: 等级卡片
- ARCH-16: 学科卡片网格
- ARCH-17: 折叠面板
- ARCH-18: 番茄钟 FAB
- ARCH-19: 深色模式切换
- ARCH-20: 响应式全局适配

**Success Criteria:**
1. 浏览器打开 index.html 能看到启动页，点击 LAUNCH 进入主界面
2. 5 个 Tab 切换正常，URL hash 同步，fadeInUp 动画流畅
3. 浅色/深色主题切换正常，localStorage 持久化
4. 3 个响应式断点（768/480/360px）布局正确
5. 所有组件（按钮/卡片/输入框/弹窗/进度条）样式统一

**Estimated Versions:** v0.1.0 ~ v0.1.9 (20 versions)

---

### Phase 2: 数据系统

**Goal:** 实现完整的数据加载、缓存、持久化和同步机制

**Mode:** yolo

**Requirements:**
- DATA-01: GitHub 数据加载 — 4 源并发
- DATA-02: localStorage 缓存层 — 24h 过期
- DATA-03: 兜底数据系统 — FALLBACK_DATA
- DATA-04: 数据格式转换 — 兼容 v1.0 + v2.0
- DATA-05: 后台静默更新
- DATA-06: 数据加载 UI
- DATA-07: user_profile.json 加载
- DATA-08: skill-tree.json 加载
- DATA-09: textbooks.json 加载
- DATA-10: courses.json 加载
- DATA-11: achievements.json 加载
- DATA-12: pomodoro-sessions.json 读写
- DATA-13: reading-records.json 读写
- DATA-14: bookshelf.json 自动同步
- DATA-15: 数据导出

**Dependencies:** Phase 1 (需要 data.js 基础层)

**Success Criteria:**
1. 首次打开自动从 GitHub 加载数据，30s 超时后使用兜底数据
2. 第二次打开从缓存秒开，后台静默刷新
3. 9 科 42 技能 + 596 知识点 + 55 成就正确加载
4. localStorage 读写失败时优雅降级（隐私模式）
5. exportAllData() 导出完整 JSON 文件

**Estimated Versions:** v0.2.0 ~ v0.2.9 (15 versions)

---

### Phase 3: 核心算法

**Goal:** 实现所有认知科学算法，为 UI 渲染提供数据计算能力

**Mode:** yolo

**Requirements:**
- ALGO-01: GitHub 同步 — syncToGitHub()
- ALGO-02: 温度模型 — calcTemp()
- ALGO-03: 温度等级映射 — getTempLevel()
- ALGO-04: 动态半衰期 — calcHalfLife()
- ALGO-05: 学科等级算法 — calcSubjectLevel()
- ALGO-06: XP 基础引擎 — calcBaseXP()
- ALGO-07: XP 引擎 2.0 基础产出
- ALGO-08: XP 引擎 2.0 质量乘数
- ALGO-09: XP 引擎 2.0 全局调节
- ALGO-10: 进步动量 — calcMomentum()
- ALGO-11: 阴影队列 — calcShadowQueue()
- ALGO-12: 背包算法 — knapsackRecommend()
- ALGO-13: 提分潜力诊断 — calcImprovementPotential()
- ALGO-14: 假性熟练检测 — detectFalseMastery()
- ALGO-15: 用户画像自适应 — updateUserProfile()

**Dependencies:** Phase 2 (需要数据系统提供输入数据)

**Success Criteria:**
1. calcTemp() 输出与 Legacy 版本一致（±0.01 精度）
2. calcXPEngine2() 多因子计算正确，无双公式冲突
3. calcShadowQueue() 返回按 priority 降序的复习队列
4. knapsackRecommend() 在 60 分钟预算内返回最优组合
5. detectFalseMastery() 能识别假性熟练知识点

**Estimated Versions:** v0.3.0 ~ v0.3.9 (15 versions)

---

### Phase 4: 概览页渲染

**Goal:** 概览页所有组件接入真实数据，展示学习全貌

**Mode:** yolo

**Requirements:**
- VIEW-01: Hero Stats 真实渲染
- VIEW-02: 等级卡片渲染
- VIEW-03: 学科卡片真实渲染
- VIEW-04: 学科卡片交互
- VIEW-05: 成就展示区
- VIEW-06: 考试反思卡片
- VIEW-07: 学习日历热力图
- VIEW-08: 教材进度地图
- VIEW-09: 网课进度展示
- VIEW-10: 学习报告 — ECharts 折线图
- VIEW-11: 学科时长柱状图
- VIEW-12: 薄弱点识别
- VIEW-13: 效率散点图
- VIEW-14: 时段热力图

**Dependencies:** Phase 3 (需要算法输出)

**Success Criteria:**
1. Hero Stats 4 项数据正确显示，null 安全
2. 9 科学科卡片按等级降序排列，点击展开技能详情
3. 学习日历热力图 169 天数据正确，GitHub 风格绿色
4. ECharts 图表（折线/柱状/散点/热力图）渲染正确
5. 深色模式下所有图表颜色适配

**Estimated Versions:** v0.4.0 ~ v0.4.9 (14 versions)

---

### Phase 5: 技能树系统

**Goal:** 力导向图可视化技能掌握状态，支持交互探索

**Mode:** yolo

**Requirements:**
- SKILL-01: 知识点数据构建 — buildKnowledgeStates()
- SKILL-02: 技能聚合 — aggregateSkillMastery()
- SKILL-03: 学科聚合 — aggregateSubjectAbility()
- SKILL-04: 特长检测 — detectTalents()
- SKILL-05: ECharts 力导向图 — 基础渲染
- SKILL-06: 力导向图交互 — 点击节点详情面板
- SKILL-07: 力导向图学科切换 — 下拉过滤
- SKILL-08: 技能雷达图
- SKILL-09: 技能树图例
- SKILL-10: 技能树移动端适配

**Dependencies:** Phase 3 (需要算法输出)

**Success Criteria:**
1. 力导向图正确渲染 9 科 42 技能节点
2. 节点颜色 = 温度等级，大小 = 掌握度
3. 点击节点弹出详情面板（温度/半衰期/XP/历史）
4. 下拉过滤学科，非选中节点淡出 opacity:0.2
5. 移动端高度 300px，触摸手势可拖拽/缩放

**Estimated Versions:** v0.5.0 ~ v0.5.9 (10 versions)

---

### Phase 6: 复习中心

**Goal:** 基于阴影队列和背包算法，提供科学复习推荐

**Mode:** yolo

**Requirements:**
- REV-01: 遗忘曲线图表
- REV-02: 阴影队列渲染
- REV-03: 智能复习推荐面板
- REV-04: 提分潜力诊断面板
- REV-05: 假性熟练检测面板
- REV-06: 开始复习流程
- REV-07: 复习记录追踪
- REV-08: 考试推荐触发

**Dependencies:** Phase 3 (需要算法输出)

**Success Criteria:**
1. 遗忘曲线双折线（保留曲线 + 80% 阈值线）正确渲染
2. 阴影队列按 priority 降序，温度颜色映射正确
3. 背包推荐在 60 分钟预算内返回最优知识点组合
4. 假性熟练检测能识别并警告可疑知识点
5. 点击"开始复习"自动创建番茄钟并预填配置

**Estimated Versions:** v0.6.0 ~ v0.6.9 (8 versions)

---

### Phase 7: 数据录入

**Goal:** 完整的学习记录录入流程，支持三级联动和智能搜索

**Mode:** yolo

**Requirements:**
- ENTRY-01: 数据录入弹窗 UI
- ENTRY-02: 学科→教材→章节三级联动下拉
- ENTRY-03: 倒排索引搜索 — 5 级匹配
- ENTRY-04: 知识点多选标签 chip
- ENTRY-05: 做题/订正时间自动推断
- ENTRY-06: 保存记录→全链路联动

**Dependencies:** Phase 3 (需要算法计算 XP/温度)

**Success Criteria:**
1. 录入弹窗表单完整，必填字段校验通过
2. 三级联动下拉选择流畅，教材/章节数据正确
3. 搜索支持精确/前缀/子串/模糊/拼音 5 级匹配
4. 保存记录后 XP/温度/技能/成就全链路更新
5. 生成的记录 ID 唯一，时间戳正确

**Estimated Versions:** v0.7.0 ~ v0.7.9 (6 versions)

---

### Phase 8: 日志管理

**Goal:** 学习记录的查看、筛选、搜索、编辑、删除

**Mode:** yolo

**Requirements:**
- LOG-01: 日志列表渲染 — 分页 20 条，滚动加载
- LOG-02: 日志筛选器 — 学科/活动类型/时间范围
- LOG-03: 日志搜索 — 关键词匹配 + 高亮
- LOG-04: 记录编辑 — 弹窗预填→修改→保存→重算
- LOG-05: 记录删除 — 确认弹窗→移除→重算→刷新

**Dependencies:** Phase 7 (需要数据录入功能)

**Success Criteria:**
1. 日志列表按时间倒序，分页 20 条，滚动加载更多
2. 筛选器实时刷新，显示匹配计数
3. 搜索支持知识点/学科/备注关键词匹配，高亮显示
4. 编辑记录后 XP/温度/技能全链路重算
5. 删除记录需确认，删除后刷新所有页面

**Estimated Versions:** v0.8.0 ~ v0.8.9 (5 versions)

---

### Phase 9: 番茄钟系统

**Goal:** 完整的番茄钟计时器，支持配置、计时、评分、历史

**Mode:** yolo

**Requirements:**
- POM-01: 番茄钟弹窗 — 计时前配置
- POM-02: 番茄钟计时中 — SVG 环形进度 + 倒计时
- POM-03: 番茄钟完成后 — 动画 + 评分 + 一键生成记录
- POM-04: 番茄钟后台追踪 — 切出检测 + 专注评分
- POM-05: 番茄钟历史 — 会话列表 + 统计面板

**Dependencies:** Phase 7 (需要数据录入生成记录)

**Success Criteria:**
1. 3 种模式（25🍅/5☕/15⚡）配置正确
2. SVG 环形进度动画流畅，倒计时 MM:SS 准确
3. 完成后显示评分界面，一键生成学习记录
4. 切出浏览器时检测并记录中断
5. 历史面板显示完成率/平均专注/总时长统计

**Estimated Versions:** v0.9.0 ~ v0.9.9 (5 versions)

---

### Phase 10: 阅读+发布

**Goal:** 阅读记录系统 + 全局集成测试 + 正式发布

**Mode:** yolo

**Requirements:**
- READ-01: 阅读记录系统 — 弹窗 + 列表 + 筛选 + 书架 + 图表
- REL-01: 全局集成测试 + 全链路验证 + 文档同步 + 正式发布

**Dependencies:** Phase 4-9 (需要所有功能完成)

**Success Criteria:**
1. 阅读记录弹窗表单完整，书架网格/列表视图切换
2. 月度柱状图 + 分类饼图渲染正确
3. 全链路测试通过：录入→XP→温度→技能→成就→复习
4. PWA 安装正常，离线可用
5. GitHub Pages 部署成功，版本号 v1.0.0

**Estimated Versions:** v0.10.0 ~ v0.10.9 (2 versions)

---

## Milestones

| Milestone | Phases | Target |
|-----------|--------|--------|
| M1: 骨架完成 | Phase 1 | v0.1.9 |
| M2: 数据就绪 | Phase 2 | v0.2.9 |
| M3: 算法完成 | Phase 3 | v0.3.9 |
| M4: UI 可用 | Phase 4-6 | v0.6.9 |
| M5: 功能完整 | Phase 7-9 | v0.9.9 |
| M6: 正式发布 | Phase 10 | v1.0.0 |

---

## Risk Factors

| Risk | Impact | Mitigation |
|------|--------|------------|
| ECharts 力导向图性能 | 42 节点可能卡顿 | 限制节点数量，学科过滤 |
| localStorage 5MB 限制 | 大量记录可能超限 | 数据压缩，定期导出 |
| GitHub API 速率限制 | 60 次/小时（无 Token） | 缓存策略，Token 配置提示 |
| Legacy 算法移植精度 | 新旧版本计算不一致 | 单元测试对比，±0.01 容差 |

---

*Generated: 2026-05-23 by GSD new-project workflow*
