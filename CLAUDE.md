# CLAUDE.md — 学习RPG · 认知操作系统

## Project Overview

单用户学习追踪 RPG 系统，面向高中生墨澜。游戏化机制（XP、等级、成就）+ 认知科学算法（遗忘曲线、间隔重复、背包推荐）驱动个人学习管理。

- **Tech Stack:** HTML5 + CSS3 + vanilla JS (ES5/ES6) + ECharts 5.4.3
- **Storage:** localStorage + optional GitHub Contents API sync
- **Design:** Legado 3.0 (Material Design 3 based)
- **Version:** 0.0 → 1.0.0 (100 versions, 10 phases)

## Key Paths

- Planning: `.planning/` (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, config.json)
- Legacy: `Legacy/` (old v2.x codebase, reference only)
- Reference Doc: `Legacy/docs/学习RPG参考文档.md` (2100+ lines, project constitution)

## Code Standards

- **Single file max 400 lines.** Split modules if exceeded.
- **Nesting max 4 levels.** Extract functions or use early return.
- **Edit over rewrite.** Prefer Edit tool over Write for modifications.
- **UI must be browser-verified.** Don't rely on mental simulation.

## Current Phase

**Phase 1: 架构基础** (Not Started)
- 20 requirements: ARCH-01 ~ ARCH-20
- Goal: Complete frontend project skeleton + all UI infrastructure
- Versions: v0.1.0 ~ v0.1.9

## Architecture Notes

- 5 pages: Overview, Skills Tree, Review, Log, Settings
- 9 subjects: logos(数学), mythos(语文), lingua(英语), physis(物理), khemeia(化学), zoe(生物), politeia(政治), historia(历史), geographia(地理)
- 6 core algorithms: Temperature, Half-life, XP Engine 2.0, Shadow Queue, Knapsack, False Mastery
- Routing: URL hash-based, 5 tabs
- Responsive: 3 breakpoints (768/480/360px)
- Theme: CSS variables, light/dark toggle

## Workflow

- GSD YOLO mode — automated execution
- Vertical MVP — build working slice first, then layer on features
- Phase dependencies: 1→2→3 serial, 4-7 parallel after 3, 8-9 parallel after 7, 10 final

## Avoid

- Don't use v3.x versioning — versions start from 0.0
- Don't create backend/server code — pure frontend
- Don't add multi-user, i18n, or AI chatbot features
- Don't exceed 400 lines per file or 4 levels of nesting
