# 学习RPG · data.json 数据格式规范

> 版本：v0.5.0 | 最后更新：2026-05-10
> 本文档供 AI 助手（如微信AI）写入数据时参考。

---

## 一、文件位置

- **GitHub 仓库**：`https://github.com/MokelungAAA/learning-rpg`
- **文件路径**：仓库根目录下的 `data.json`
- **网页读取地址**：`https://raw.githubusercontent.com/MokelungAAA/learning-rpg/main/data.json`

---

## 二、完整 JSON 结构

```json
{
  "version": "1.0",
  "lastUpdated": "2026-05-10T12:00:00+08:00",
  "profile": {
    "learnerName": "墨澜",
    "globalBaseHalfLife": 4.0,
    "subjectModifiers": {
      "数学": 1.2,
      "物理": 1.2,
      "化学": 1.1,
      "语文": 1.0,
      "英语": 1.0,
      "历史": 1.0,
      "地理": 1.0,
      "生物": 0.9,
      "政治": 0.8
    },
    "tempBoostGain": 0.4,
    "tempBoostBase": 10,
    "avgReviewsPerWeek": 0
  },
  "subjects": {
    "数学": {
      "totalXp": 500,
      "nodes": [
        {
          "id": "math-001",
          "name": "二次方程求根公式",
          "peakTemp": 85,
          "lastStudy": "2026-05-10T14:30:00+08:00",
          "halfLifeDays": 4.8,
          "repetitions": 3,
          "accuracyHistory": [80, 90, 85],
          "totalXp": 150
        }
      ]
    }
  },
  "log": [
    {
      "id": "log-001",
      "timestamp": "2026-05-10T14:30:00+08:00",
      "subject": "数学",
      "knowledgePoints": ["二次方程求根公式"],
      "durationMinutes": 30,
      "activityType": "practice",
      "totalQuestions": 10,
      "correctCount": 8,
      "accuracy": 80,
      "xp": 40
    }
  ]
}
```

---

## 三、字段详细说明

### 3.1 顶层字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version` | string | ✅ | 固定 `"1.0"`，数据格式版本号 |
| `lastUpdated` | string | ✅ | ISO 8601 时间戳，表示数据最后更新时间 |
| `profile` | object | ✅ | 学习者全局参数 |
| `subjects` | object | ✅ | 九大学科数据，key 为学科中文名 |
| `log` | array | ✅ | 学习记录数组，按时间正序排列（旧的在前） |

### 3.2 profile（全局参数）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `learnerName` | string | ✅ | 学习者名称 |
| `globalBaseHalfLife` | number | ✅ | 全局基础半衰期（天），默认 `4.0`。值越大遗忘越慢 |
| `subjectModifiers` | object | ✅ | 各学科难度修正系数。`>1` 表示该学科更难（遗忘更快），`<1` 表示更容易 |
| `tempBoostGain` | number | ✅ | 复习升温增益系数，默认 `0.4` |
| `tempBoostBase` | number | ✅ | 复习升温基础值，默认 `10` |
| `avgReviewsPerWeek` | number | ❌ | 每周平均复习次数（统计用，可不填） |

**subjectModifiers 各学科说明：**

| 学科 | 默认值 | 含义 |
|------|--------|------|
| 数学 | 1.2 | 较难，遗忘较快 |
| 物理 | 1.2 | 较难 |
| 化学 | 1.1 | 略难 |
| 语文 | 1.0 | 中等 |
| 英语 | 1.0 | 中等 |
| 历史 | 1.0 | 中等 |
| 地理 | 1.0 | 中等 |
| 生物 | 0.9 | 较易 |
| 政治 | 0.8 | 较易，遗忘较慢 |

### 3.3 subjects（学科数据）

`subjects` 是一个对象，key 为学科中文名（必须是以下九个之一）：

**数学、语文、英语、物理、化学、生物、政治、历史、地理**

每个学科的结构：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `totalXp` | number | ✅ | 该学科累计获得的总 XP |
| `nodes` | array | ✅ | 知识点节点数组 |

### 3.4 node（知识点节点）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识符，建议格式：`{学科英文}-xxx`，如 `math-001`、`phy-002` |
| `name` | string | ✅ | 知识点名称，如 `"二次方程求根公式"` |
| `peakTemp` | number | ✅ | 最近一次复习后的峰值温度（0-100）。新知识点首次学习后设为 85 |
| `lastStudy` | string | ✅ | 最后一次学习时间，ISO 8601 格式 |
| `halfLifeDays` | number | ✅ | 当前动态半衰期（天）。首次学习时系统会根据学科自动计算，AI 写入时可填默认值 `4.0` |
| `repetitions` | number | ✅ | 累计复习次数 |
| `accuracyHistory` | array | ✅ | 历次正确率数组，如 `[80, 90, 85]` 表示三次复习的正确率分别为 80%、90%、85% |
| `totalXp` | number | ✅ | 该知识点累计获得的 XP |

### 3.5 log（学习记录）

每条记录代表一次学习活动。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识符，建议格式：`log-xxx` |
| `timestamp` | string | ✅ | 学习时间，ISO 8601 格式 |
| `subject` | string | ✅ | 学科中文名（九大学科之一） |
| `knowledgePoints` | array | ✅ | 涉及的知识点名称数组，如 `["二次方程求根公式", "韦达定理"]` |
| `durationMinutes` | number | ✅ | 学习时长（分钟） |
| `activityType` | string | ✅ | 活动类型，取值见下方 |
| `totalQuestions` | number | 条件 | 总题数（practice/exam 时必填） |
| `correctCount` | number | 条件 | 正确题数（practice/exam 时必填） |
| `accuracy` | number | 条件 | 正确率百分比 0-100（practice/exam 时必填） |
| `xp` | number | ✅ | 本次活动获得的 XP |
| `result` | string | 条件 | 背诵结果（recitation 时必填），取值：`"perfect"` / `"partial"` / `"failed"` |

**activityType 取值：**

| 值 | 含义 | 必填字段 | XP 计算参考 |
|----|------|----------|------------|
| `practice` | 刷题练习 | totalQuestions, correctCount, accuracy | accuracy × 0.5 × durationMinutes |
| `exam` | 考试测验 | totalQuestions, correctCount, accuracy | accuracy × 0.8 × durationMinutes |
| `recitation` | 背诵记忆 | result | perfect=100, partial=60, failed=20 |

---

## 四、AI 写入数据时的规则

### 4.1 新增一条学习记录

1. 在 `log` 数组末尾追加一条新记录
2. 更新 `lastUpdated` 为当前时间
3. 更新对应学科的 `totalXp`（加上本次 XP）
4. 更新对应知识点的 `peakTemp`、`lastStudy`、`repetitions`、`accuracyHistory`、`totalXp`
5. 如果是全新知识点，在对应学科的 `nodes` 数组中新增一个节点

### 4.2 peakTemp 计算规则

复习后的峰值温度由系统自动计算（基于 accuracy 和 boost 参数），AI 写入时使用以下简化规则：

- **accuracy ≥ 90%**：peakTemp = 90
- **accuracy ≥ 70%**：peakTemp = 75
- **accuracy ≥ 50%**：peakTemp = 55
- **accuracy < 50%**：peakTemp = 35
- **背诵 perfect**：peakTemp = 90
- **背诵 partial**：peakTemp = 60
- **背诵 failed**：peakTemp = 30

### 4.3 XP 计算规则（简化版）

| 活动类型 | 公式 |
|----------|------|
| practice | `Math.round(accuracy × 0.5 × durationMinutes / 10)` |
| exam | `Math.round(accuracy × 0.8 × durationMinutes / 10)` |
| recitation perfect | `Math.round(durationMinutes × 3)` |
| recitation partial | `Math.round(durationMinutes × 1.5)` |
| recitation failed | `Math.round(durationMinutes × 0.5)` |

最低 5 XP，最高 200 XP（单次）。

### 4.4 halfLifeDays 写入规则

- **新知识点首次学习**：填 `4.0`（系统会根据学科修正系数自动调整）
- **已有知识点复习后**：保持原值不变（系统内部会自动更新，AI 不需要改）

### 4.5 注意事项

1. **不要删除已有的 log 记录**，只追加新的
2. **不要修改已有节点的 id**
3. **时间格式**必须使用 ISO 8601：`"2026-05-10T14:30:00+08:00"`
4. **accuracyHistory** 只追加新的正确率值，不要删除旧的
5. **JSON 格式**必须合法（注意逗号、引号、不允许注释）
6. **字符编码**：UTF-8

---

## 五、完整写入示例

假设墨澜在 2026-05-10 做了一次数学刷题练习：

```json
{
  "version": "1.0",
  "lastUpdated": "2026-05-10T15:00:00+08:00",
  "profile": {
    "learnerName": "墨澜",
    "globalBaseHalfLife": 4.0,
    "subjectModifiers": {
      "数学": 1.2, "物理": 1.2, "化学": 1.1,
      "语文": 1.0, "英语": 1.0, "历史": 1.0, "地理": 1.0,
      "生物": 0.9, "政治": 0.8
    },
    "tempBoostGain": 0.4,
    "tempBoostBase": 10,
    "avgReviewsPerWeek": 3
  },
  "subjects": {
    "数学": {
      "totalXp": 540,
      "nodes": [
        {
          "id": "math-001",
          "name": "二次方程求根公式",
          "peakTemp": 75,
          "lastStudy": "2026-05-10T15:00:00+08:00",
          "halfLifeDays": 4.8,
          "repetitions": 4,
          "accuracyHistory": [80, 90, 85, 70],
          "totalXp": 190
        }
      ]
    },
    "语文": { "totalXp": 0, "nodes": [] },
    "英语": { "totalXp": 0, "nodes": [] },
    "物理": { "totalXp": 0, "nodes": [] },
    "化学": { "totalXp": 0, "nodes": [] },
    "生物": { "totalXp": 0, "nodes": [] },
    "政治": { "totalXp": 0, "nodes": [] },
    "历史": { "totalXp": 0, "nodes": [] },
    "地理": { "totalXp": 0, "nodes": [] }
  },
  "log": [
    {
      "id": "log-001",
      "timestamp": "2026-05-10T14:30:00+08:00",
      "subject": "数学",
      "knowledgePoints": ["二次方程求根公式"],
      "durationMinutes": 30,
      "activityType": "practice",
      "totalQuestions": 10,
      "correctCount": 8,
      "accuracy": 80,
      "xp": 40
    },
    {
      "id": "log-002",
      "timestamp": "2026-05-10T15:00:00+08:00",
      "subject": "数学",
      "knowledgePoints": ["二次方程求根公式"],
      "durationMinutes": 20,
      "activityType": "practice",
      "totalQuestions": 10,
      "correctCount": 7,
      "accuracy": 70,
      "xp": 40
    }
  ]
}
```

---

## 六、网页如何读取数据

网页通过以下流程读取 `data.json`：

1. 页面加载时，从 `https://raw.githubusercontent.com/MokelungAAA/learning-rpg/main/data.json` 拉取数据
2. `convertGitHubDataToAppData()` 函数将 JSON 转换为内部数据结构
3. 转换后自动计算：全局等级、学科等级、温度、阴影队列、推荐列表
4. 如果拉取失败，使用内置的空演示数据

**AI 写入数据后，只需将更新后的 `data.json` 推送到 GitHub 仓库的 `main` 分支，网页下次加载时自动获取最新数据。**
