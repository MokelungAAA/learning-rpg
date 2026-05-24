# LTS 学习RPG · 认知操作系统

> 面向高中生墨澜的单用户学习追踪 RPG 系统。游戏化机制（XP、等级、成就）+ 认知科学算法（遗忘曲线、间隔重复、背包推荐）驱动个人学习管理。

**技术栈:** HTML5 + CSS3 + vanilla JS + ECharts 5.x
**存储:** localStorage + GitHub Contents API 同步
**部署:** GitHub Pages / 本地浏览器直接打开

---

## 目录

1. [给龙虾助手的快速指南](#1-给龙虾助手的快速指南)
2. [数据文件与存储结构](#2-数据文件与存储结构)
3. [学习记录写入规范](#3-学习记录写入规范)
4. [阅读记录写入规范](#4-阅读记录写入规范)
5. [核心算法详解](#5-核心算法详解)
6. [学科体系](#6-学科体系)
7. [GitHub API 写入流程](#7-github-api-写入流程)

---

## 1. 给龙虾助手的快速指南

龙虾助手（clawbot）通过微信接收用户的自然语言学习记录，解析后写入 GitHub 仓库。**本文件是你的唯一参考——读完就能正确工作。**

### 你需要做的事

1. **接收** 用户的自然语言消息（如"背了20分钟英语单词"）
2. **解析** 出：学科、时长、得分（可选）、知识点（可选）、活动类型（可选）
3. **构造** 符合 [第3节](#3-学习记录写入规范) 格式的 JSON 记录
4. **写入** GitHub 仓库的 `data/lts_study_records.json` 文件

### 你不需要做的事

- 不需要理解温度/半衰期/XP 等算法细节（那是前端的事）
- 不需要计算 XP（前端会自动重算）
- 不需要管理知识点状态（前端会自动更新）

---

## 2. 数据文件与存储结构

### 2.1 仓库地址

```
https://github.com/MokelungAAA/learning-rpg
```

### 2.2 关键数据文件

| 文件路径 | 说明 | 写入方 |
|----------|------|--------|
| `data/lts_study_records.json` | 学习记录（主数据） | 龙虾助手 + 前端 |
| `data/lts_reading_records.json` | 阅读记录 | 龙虾助手 + 前端 |
| `data/data.json` | 学科+教辅+成就定义（只读） | 前端 |
| `data/sync-config.js` | GitHub 同步配置 | 前端 |

### 2.3 学习记录文件结构

```json
{
  "version": "2.0",
  "lastUpdated": "2026-05-24T06:19:51.532Z",
  "learnerName": "墨澜",
  "schema": "lts_study_record",
  "schemaVersion": 1,
  "records": [
    {
      "id": "rec-{timestamp}-{random}",
      "timestamp": "2026-05-24T12:00:00.000Z",
      "subject": "biology",
      "textbook": "解题觉醒·必修二",
      "chapter": "",
      "section": "3.2",
      "knowledgePoints": [],
      "score": 75,
      "duration": 30,
      "practiceDuration": 24,
      "reviewDuration": 6,
      "activityType": "practice",
      "notes": "生物解题觉醒必修二3.2节",
      "totalQuestions": 0,
      "correctQuestions": 0,
      "examScores": null,
      "xp": 0
    }
  ]
}
```

---

## 3. 学习记录写入规范

### 3.1 必填字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | string | 唯一ID，格式 `rec-{timestamp}-{random4}` | `rec-1779596397320-abc1` |
| `timestamp` | string | ISO 8601 格式，固定为当天中午12:00 UTC | `2026-05-24T12:00:00.000Z` |
| `subject` | string | 学科英文ID（见 [第6节](#6-学科体系)） | `"biology"` |
| `duration` | number | 总学习时长（分钟） | `30` |
| `activityType` | string | 活动类型（见下方） | `"practice"` |
| `notes` | string | 用户原话摘要 | `"生物解题觉醒必修二3.2节"` |

### 3.2 可选字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `score` | number | `0` | 得分（0-100），无得分信息时填 0 |
| `textbook` | string | `""` | 教辅名称 |
| `chapter` | string | `""` | 章节 |
| `section` | string | `""` | 节 |
| `knowledgePoints` | array | `[]` | 知识点ID数组（暂留空） |
| `practiceDuration` | number | `duration * 0.8` | 做题时长（分钟） |
| `reviewDuration` | number | `duration * 0.2` | 订正时长（分钟） |
| `totalQuestions` | number | `0` | 总题数 |
| `correctQuestions` | number | `0` | 正确题数 |
| `examScores` | null | `null` | 考试成绩（暂为 null） |
| `xp` | number | `0` | 经验值（前端自动重算，写 0 即可） |

### 3.3 活动类型 (activityType)

| 关键词 | activityType | 说明 |
|--------|-------------|------|
| 刷、做、练、题、卷子 | `practice` | 做题练习 |
| 复习、回顾、重看 | `review` | 间隔复习 |
| 考试、测验、模考 | `exam` | 考试 |
| 听、网课、视频、课 | `lecture` | 听课 |
| 背、默写、记、背诵 | `recitation` | 背诵默写 |
| 读、阅读 | `reading` | 阅读 |
| （无明确信息） | `practice` | 默认 |

### 3.4 timestamp 规则

- **以学习开始时间为准**，不特殊处理凌晨
- 如果用户说"今天"，使用当天日期
- 如果用户说"昨天"，使用前一天日期
- 时间统一设为 **当天中午 12:00 UTC**（即北京时间 20:00），除非用户明确给出了具体时间
- 格式：`YYYY-MM-DDTHH:MM:SS.000Z`

### 3.5 自然语言解析示例

**用户消息 → 解析结果：**

```
"背了20分钟英语单词"
→ subject: "english", duration: 20, activityType: "recitation", notes: "背了20分钟英语单词"

"物理刷了一个小时的力学，得分85"
→ subject: "physics", duration: 60, score: 85, activityType: "practice", notes: "物理刷了一个小时的力学，得分85"

"听了45分钟的数学网课"
→ subject: "math", duration: 45, activityType: "lecture", notes: "听了45分钟的数学网课"

"复习化学离子键20分钟"
→ subject: "chemistry", duration: 20, activityType: "review", notes: "复习化学离子键20分钟"

"数学做了一套卷子90分钟75分"
→ subject: "math", duration: 90, score: 75, activityType: "practice", notes: "数学做了一套卷子90分钟75分"

"生物解题觉醒必修二3.2节做了28分钟"
→ subject: "biology", duration: 28, textbook: "解题觉醒·必修二", section: "3.2", activityType: "practice", notes: "生物解题觉醒必修二3.2节做了28分钟"
```

### 3.6 学科匹配

| 关键词 | subject ID |
|--------|-----------|
| 数学、math | `math` |
| 语文、chinese | `chinese` |
| 英语、english、eng | `english` |
| 物理、physics | `physics` |
| 化学、chemistry、chem | `chemistry` |
| 生物、biology、bio | `biology` |
| 政治、politics | `politics` |
| 历史、history | `history` |
| 地理、geography、geo | `geography` |

### 3.7 时长匹配

| 格式 | 解析结果 | 示例 |
|------|----------|------|
| `N分钟` | N | "30分钟" → 30 |
| `N小时` | N×60 | "1小时" → 60 |
| `Nh` | N×60 | "1.5h" → 90 |
| `半小时` | 30 | "半小时" → 30 |
| `一个半小时` | 90 | "一个半小时" → 90 |

### 3.8 得分匹配

| 格式 | 解析结果 | 示例 |
|------|----------|------|
| `N分` | N | "75分" → 75 |
| `得分N` | N | "得分80" → 80 |
| `N%` | N | "90%" → 90 |
| `正确率N%` | N | "正确率85%" → 85 |
| `对了M/N题` | M/N×100 | "对了15/20题" → 75 |
| （无） | 0 | 无得分信息时 |

### 3.9 防重复机制

- 检查最近 10 条记录的 `timestamp` 和 `subject`
- 如果 **5 分钟内**相同学科的记录已存在，跳过写入
- 回复用户："检测到重复记录，已跳过"

### 3.10 回复模板

**成功：**
```
✅ 已记录：
📐 数学 · 30分钟 · 75分
知识点：函数单调性
类型：刷题
```

**解析失败：**
```
❓ 无法理解你的消息。
请用格式：学科+时长+得分
例如："数学30分钟75分"
```

---

## 4. 阅读记录写入规范

### 4.1 文件结构

```json
{
  "version": "1.0",
  "lastUpdated": "2026-05-24T06:19:51.532Z",
  "records": [
    {
      "id": "read-{timestamp}-{random}",
      "timestamp": "2026-05-24T12:00:00.000Z",
      "bookName": "活着",
      "author": "余华",
      "type": "reading",
      "durationMinutes": 60,
      "pages": 50,
      "currentPage": 120,
      "notes": "读到第三章，福贵开始败家"
    }
  ]
}
```

### 4.2 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 唯一ID，格式 `read-{timestamp}-{random4}` |
| `timestamp` | string | 是 | ISO 8601 格式 |
| `bookName` | string | 是 | 书名 |
| `author` | string | 否 | 作者 |
| `type` | string | 是 | 固定 `"reading"` |
| `durationMinutes` | number | 是 | 阅读时长（分钟） |
| `pages` | number | 否 | 本次阅读页数 |
| `currentPage` | number | 否 | 当前页码 |
| `notes` | string | 否 | 阅读笔记/感悟 |

### 4.3 自然语言解析示例

```
"读了30分钟《活着》，读到第120页"
→ bookName: "活着", durationMinutes: 30, currentPage: 120, notes: "读了30分钟《活着》，读到第120页"

"看了一个小时余华的《活着》，做了些笔记"
→ bookName: "活着", author: "余华", durationMinutes: 60, notes: "看了一个小时余华的《活着》，做了些笔记"

"睡前读了20页《三体》40分钟"
→ bookName: "三体", durationMinutes: 40, pages: 20, notes: "睡前读了20页《三体》40分钟"
```

### 4.4 识别阅读类消息的关键词

- "读"、"看了"、"阅读"、"翻了"、"读了X页"、"读到第X页"

---

## 5. 核心算法详解

> 本节供参考。龙虾助手不需要实现这些算法——前端会自动计算。但了解原理有助于理解数据结构。

### 5.1 温度模型（Temperature）

温度是 **衰减指标**，范围 0-100，反映"当前记忆的新鲜程度"。

```
T(t) = T_peak × 2^(-t / t_half)
```

| 变量 | 说明 |
|------|------|
| `T(t)` | 当前温度 |
| `T_peak` | 学习后达到的峰值温度（最高 100） |
| `t` | 距上次学习的时间（天） |
| `t_half` | 半衰期（天），动态计算 |

**温度等级：**

| 级别 | 温度范围 | 颜色 | 含义 |
|------|----------|------|------|
| 炙热 | ≥ 90 | 🔴 | 刚学过，记忆清晰 |
| 温热 | 70 - 89 | 🟠 | 记忆较好 |
| 温暖 | 50 - 69 | 🟡 | 开始遗忘 |
| 正常 | 30 - 49 | 🔵 | 需要复习 |
| 微凉 | 10 - 29 | 🔷 | 遗忘较多 |
| 冻结 | < 10 | ⬜ | 几乎完全遗忘 |

### 5.2 动态半衰期（Half-Life）

半衰期决定记忆衰减的快慢，受三层因子影响：

```
t_half = t_base × f_subject × f_accuracy × f_streak

约束: t_half ∈ [0.5, 30] 天
```

| 参数 | 说明 | 范围 |
|------|------|------|
| `t_base` | 基础半衰期（默认 7 天） | - |
| `f_subject` | 学科系数（EMA 自动拟合） | 0.8 - 1.2 |
| `f_accuracy` | 得分率系数（高分延长半衰期） | 0.5 - 1.5 |
| `f_streak` | 连续天数系数（连续越长越稳定） | 0.8 - 1.2 |

### 5.3 掌握度（Mastery）

掌握度是 **累积指标**，范围 0-1，反映"对知识点的整体掌握水平"。**不随时间衰减。**

```
mastery_new = mastery_old × (1 - α) + scoreRate × α

α = 0.15 × weight
weight = min(2.0, 1 + studyCount × 0.1)
```

### 5.4 XP 引擎 2.0

```
XP = round(rawXP × quality × decay × softCap)
```

**rawXP（基础产出）：**
```
rawXP = durationMinutes × subjectCoeff × difficultyCoeff
```

**quality（质量乘数）：**
```
quality = clamp(1 + (scoreRate - 0.5) × 0.4, 0.8, 1.2)
```
- 得分率 100% → quality = 1.2
- 得分率 50% → quality = 1.0
- 得分率 0% → quality = 0.8

**decay（衰减系数）：**
```
decay = clamp(1 - todayXP / dailyCap, 0.5, 1.0)
dailyCap = userLevel × 100 + 500
```

**softCap（软上限）：** 当今日 XP 超过 dailyCap 的 80% 时，收益递减。

### 5.5 阴影队列（Shadow Queue）

阴影队列决定"今天该复习什么"。按紧急度排序：

```
urgency = (80 - currentTemp) × examWeight / max(1, daysUntilExam)
```

- 温度越低 → 越紧急
- 考试权重越高 → 越紧急
- 距考试越近 → 越紧急

### 5.6 背包算法（Knapsack）

0/1 动态规划，在时间预算内选择最优复习组合：

```
benefit = urgency × (1 - mastery)
cost = 预估复习时长（至少 1 分钟）
```

在给定时间预算内，返回收益最高的知识点组合。

### 5.7 假性熟练检测

三个条件同时满足时触发警告：
1. 得分率 > 85%
2. 纠错时间 < 10%
3. 温度 < 60（知识点已冷）

含义：高正确率可能只是因为题目简单或记忆尚存，不是真正掌握。

### 5.8 进步动量（Momentum）

最近 10 条学习记录的得分率线性回归斜率，经 tanh 压缩到 [-0.3, 0.3]：
- 正值 → 进步中，XP 加成
- 负值 → 退步中，XP 减成

---

## 6. 学科体系

| 学科ID | 中文名 | 内部代号 | emoji |
|--------|--------|----------|-------|
| `math` | 数学 | logos | 📐 |
| `chinese` | 语文 | mythos | 📖 |
| `english` | 英语 | lingua | 🔤 |
| `physics` | 物理 | physis | ⚡ |
| `chemistry` | 化学 | khemeia | 🧪 |
| `biology` | 生物 | zoe | 🧬 |
| `politics` | 政治 | politeia | 📋 |
| `history` | 历史 | historia | 📜 |
| `geography` | 地理 | geographia | 🌍 |

**选科信息：** 墨澜选科为 **物化生**（物理、化学、生物），这三科权重更高。

---

## 7. GitHub API 写入流程

### 7.1 写入步骤

```
1. GET /repos/{owner}/{repo}/contents/{path}
   → 获取当前文件内容 + SHA

2. 解析当前 JSON，追加新记录到 records 数组末尾

3. 更新 lastUpdated 字段为当前时间

4. PUT /repos/{owner}/{repo}/contents/{path}
   Headers: Authorization: token {PAT}
   Body: {
     "message": "clawbot: 添加学习记录 - {学科} {时长}分钟",
     "content": base64(更新后的JSON),
     "sha": 当前SHA
   }
```

### 7.2 ID 生成规则

```javascript
// 学习记录
`rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
// 例: rec-1779596397320-l230

// 阅读记录
`read-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
// 例: read-1779596397320-def4
```

### 7.3 注意事项

- **幂等性：** 先检查防重复，再写入
- **并发安全：** GET 和 PUT 之间如果 SHA 变了，PUT 会失败（409 Conflict），需要重试
- **编码：** JSON 内容用 `btoa(unescape(encodeURIComponent(json)))` 编码为 base64
- **commit message：** 格式 `clawbot: 添加学习记录 - {学科中文} {时长}分钟`

---

## 附录：项目文件结构

```
LTS Program/
├── index.html              # 入口文件
├── css/                    # 样式文件
├── js/                     # 脚本文件
│   ├── app.js              # 应用入口
│   ├── router.js           # 路由系统
│   ├── store.js            # 全局状态
│   ├── data-engine.js      # 数据读写引擎
│   ├── sync-engine.js      # GitHub 同步引擎
│   ├── utils/              # 工具函数
│   │   ├── review-calc.js  # 复习算法
│   │   └── level.js        # 等级计算
│   └── pages/              # 页面模块
├── data/
│   ├── data.json           # 学科+教辅+成就定义
│   ├── lts_study_records.json    # 学习记录
│   └── lts_reading_records.json  # 阅读记录
├── docs/
│   └── clawbot-录入规范.md  # 龙虾助手详细规范
├── Legacy/                 # 旧版代码（参考用）
└── .planning/              # 项目规划文档
```

---

*最后更新: 2026-05-24*
*维护者: 墨澜 × Miku*
