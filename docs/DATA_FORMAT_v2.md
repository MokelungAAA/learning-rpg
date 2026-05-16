# data.json v2.0 精简格式规范

## 核心变化

**旧格式（7字段）→ 新格式（4字段）**

| 旧字段 | 新字段 | 说明 |
|--------|--------|------|
| subject, knowledgePoints, activityType, totalQuestions, correctCount, accuracy, xp | subject, textbook, chapter, score, duration | 大幅简化输入 |

## 新格式结构

```json
{
  "version": "2.0",
  "lastUpdated": "2026-05-10T15:30:00+08:00",
  "learnerName": "墨澜",
  "records": [
    {
      "id": "rec-001",
      "timestamp": "2026-05-10T14:30:00+08:00",
      "subject": "数学",
      "textbook": "必修第一册",
      "chapter": 3,
      "score": 75,
      "duration": 30
    }
  ]
}
```

## 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识，格式 `rec-xxx` |
| `timestamp` | string | ✅ | ISO 8601 时间戳 |
| `subject` | string | ✅ | 学科中文名（九大学科之一） |
| `textbook` | string | ✅ | 教材名称，如"必修第一册" |
| `chapter` | number | ✅ | 第几章（1, 2, 3...） |
| `score` | number | ✅ | 学习效果评分 0-100（正确率或自我评估） |
| `duration` | number | ✅ | 学习时长（分钟） |

## AI写入规则

### 1. 新增记录流程

```
用户输入：学了数学必修一第三章，30分钟，20题对15题

AI计算：
- score = 15/20 * 100 = 75
- duration = 30
- 自动生成 id 和 timestamp
- 写入 records 数组
```

### 2. 系统自动计算（网页端）

网页加载时自动完成：
- 根据 `subject` + `textbook` + `chapter` 查 `textbooks.json` 获取知识点列表
- 根据 `score` 计算 `peakTemp`（温度）
- 根据 `duration` 和 `score` 计算 `xp`
- 生成 `knowledgePoints` 并更新节点状态

### 3. score 映射规则

| score 范围 | 掌握程度 | peakTemp | 颜色 |
|------------|----------|----------|------|
| 90-100 | 优秀 | 90 | 🟢 |
| 75-89 | 良好 | 75 | 🟢 |
| 60-74 | 及格 | 60 | 🟡 |
| 40-59 | 薄弱 | 45 | 🟠 |
| 0-39 | 需加强 | 30 | 🔴 |

### 4. XP计算公式

```
xp = round(score * duration / 20)
最低 5 XP，最高 150 XP
```

## 示例

### 示例1：数学刷题
```json
{
  "id": "rec-001",
  "timestamp": "2026-05-10T14:30:00+08:00",
  "subject": "数学",
  "textbook": "必修第一册",
  "chapter": 3,
  "score": 75,
  "duration": 30
}
```

### 示例2：英语网课
```json
{
  "id": "rec-002",
  "timestamp": "2026-05-10T16:00:00+08:00",
  "subject": "英语",
  "textbook": "FREE高考英语·词汇班",
  "chapter": 5,
  "score": 90,
  "duration": 45
}
```

### 示例3：物理复习
```json
{
  "id": "rec-003",
  "timestamp": "2026-05-10T19:30:00+08:00",
  "subject": "物理",
  "textbook": "黄夫人·高一物理·力学",
  "chapter": 2,
  "score": 60,
  "duration": 40
}
```

## 与 textbooks.json / courses.json 的关联

```
data.json          textbooks.json/courses.json
   │                        │
   ├─ subject ──────────────┤
   ├─ textbook ─────────────┤
   └─ chapter ──────────────┘
```

网页通过这三个字段自动关联到具体的知识点列表。

## 迁移说明

v1.0 → v2.0 不兼容，需要重新录入数据。建议：
1. 备份旧 data.json
2. 按新格式重新录入近期记录
3. 旧记录可批量转换（如有需要）
