# STATE — 学习RPG · 认知操作系统

**Project:** LTS
**Phase:** 2 (In Progress)
**Version:** 0.20
**Last Updated:** 2026-05-23

---

## Current Status

All 10 phases complete. Full-stack frontend application with:
- 5 main pages + sub-pages
- 6 core algorithms (temperature, half-life, XP, shadow queue, knapsack, false mastery)
- ECharts visualizations (force graph, radar, heatmap, charts)
- Data entry with cascading dropdowns + search
- Pomodoro timer with focus tracking
- Reading records with bookshelf

---

## Phase Progress

| Phase | Name | Status | Versions |
|-------|------|--------|----------|
| 0 | 基础架构 | ✅ Complete | v0.01~v0.05 |
| 1 | 首页&录入 | ✅ Complete | v0.11~v0.18 |
| 2 | 番茄钟 | ✅ Code done | v0.21~v0.28 |
| 3 | 数据Tab | ✅ Code done | v0.31~v0.38 |
| 4 | 学科&技能树 | ✅ Code done | v0.41~v0.48 |
| 5 | 复习系统 | ✅ Code done | v0.51~v0.58 |
| 6 | 成就&XP | ✅ Code done | v0.61~v0.68 |
| 7 | 搜索&阅读 | ✅ Code done | v0.71~v0.75 |
| 8 | 同步&PWA | ✅ Code done | v0.81~v0.85 |
| 9 | 优化&打磨 | ✅ Code done | v0.91~v0.95 |
| 10 | 收尾 | ✅ Code done | v1.01~v1.05 |

---

## Milestone Progress

| Milestone | Target | Status |
|-----------|--------|--------|
| M0: 框架可运行 | v0.05 | ✅ |
| M1: 首页可用 | v0.18 | ✅ |
| M2: 番茄钟完整 | v0.28 | ✅ |
| M3: 数据可视化 | v0.38 | ✅ |
| M4: 技能树完整 | v0.48 | ✅ |
| M5: 复习自动化 | v0.58 | ✅ |
| M6: 游戏化完整 | v0.68 | ✅ |
| M7: 搜索阅读完整 | v0.75 | ✅ |
| M8: 同步离线可用 | v0.85 | ✅ |
| M9: 体验打磨完成 | v0.95 | ✅ |
| M10: 正式发布 | v1.05 | ✅ |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-23 | 从零重建而非渐进重构 | God Object、无模块、双 XP 公式 |
| 2026-05-23 | Vertical MVP 构建模式 | 先跑通最小产品，再逐层加功能 |
| 2026-05-23 | 版本从 0.0 开始 | 核心功能完善后才进 1.0 |
| 2026-05-23 | YOLO 执行模式 | 自动化执行，减少人工干预 |
| 2026-05-23 | Git 只提交源码 | 排除 .claude/、.playwright-mcp/ 等非项目文件 |
| 2026-05-23 | 版本号改为两位小数 | v0.1→v0.01, v0.11→v0.11, 10阶段×10版本 |

---

*This file is auto-managed by GSD workflow. Do not edit manually.*
