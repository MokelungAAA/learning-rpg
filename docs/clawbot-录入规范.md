# clawbot 微信机器人 — 学习记录录入规范

**版本:** 1.0
**更新日期:** 2026-05-24
**适用平台:** clawbot (微信机器人)

---

## 1. 概述

clawbot 通过微信接收用户的自然语言学习记录，解析后写入 GitHub 仓库的学习数据文件。用户只需发一条消息，即可完成学习记录的录入。

**仓库地址:** https://github.com/MokelungAAA/learning-rpg
**数据文件路径:** `data/study-records.json`

---

## 2. 消息格式

### 2.1 自然语言格式（推荐）

用户可以用任意自然语言描述学习内容，clawbot 需要解析以下要素：

| 要素 | 必填 | 示例 | 说明 |
|------|------|------|------|
| 学科 | 是 | 数学、英语、物理 | 9学科之一 |
| 时长 | 是 | 30分钟、1小时、1.5h | 学习时长 |
| 得分 | 否 | 75分、得分80、正确率90% | 默认75 |
| 知识点 | 否 | 函数单调性、离子键 | 可多个 |
| 活动类型 | 否 | 刷题、复习、听课 | 默认practice |

**示例消息:**
```
今天学了30分钟数学函数单调性得分75
背了20分钟英语单词
物理刷了一个小时的力学，得分85
复习化学离子键20分钟
数学做了一套卷子90分钟75分
听了45分钟的数学网课
```

### 2.2 命令格式（备选）

```
/record 数学 30 75 函数单调性
/record 英语 20 80 单词 -type=review
/record 物理 60 85 力学 -type=practice
```

**命令参数:**
```
/record <学科> <时长> [得分] [知识点...] [-type=活动类型]
```

---

## 3. 解析规则

### 3.1 学科匹配

| 关键词 | 学科ID | 学科中文 |
|--------|--------|----------|
| 数学、math | math | 数学 |
| 语文、chinese | chinese | 语文 |
| 英语、english、eng | english | 英语 |
| 物理、physics | physics | 物理 |
| 化学、chemistry、chem | chemistry | 化学 |
| 生物、biology、bio | biology | 生物 |
| 政治、politics | politics | 政治 |
| 历史、history | history | 历史 |
| 地理、geography、geo | geography | 地理 |

**匹配优先级:** 精确匹配 > 前缀匹配 > 包含匹配

### 3.2 时长匹配

| 格式 | 解析结果 | 示例 |
|------|----------|------|
| `N分钟` | N | "30分钟" → 30 |
| `N小时` | N×60 | "1小时" → 60 |
| `Nh` | N×60 | "1.5h" → 90 |
| `Nmin` | N | "30min" → 30 |
| `半小时` | 30 | "半小时" → 30 |
| `一个半小时` | 90 | "一个半小时" → 90 |

### 3.3 得分匹配

| 格式 | 解析结果 | 示例 |
|------|----------|------|
| `N分` | N | "75分" → 75 |
| `得分N` | N | "得分80" → 80 |
| `N%` | N | "90%" → 90 |
| `正确率N%` | N | "正确率85%" → 85 |
| `对了M/N题` | M/N×100 | "对了15/20题" → 75 |
| 默认 | 75 | 无得分信息时 |

### 3.4 活动类型推断

| 关键词 | 活动类型 | 说明 |
|--------|----------|------|
| 背、默写、记、背诵 | recitation | 背诵默写 |
| 刷、做、练、题、卷子 | practice | 做题练习 |
| 复习、回顾、重看 | review | 间隔复习 |
| 考试、测验、模考 | exam | 考试 |
| 听、网课、视频、课 | lecture | 听课 |
| 默认 | practice | 无明确信息时 |

### 3.5 知识点提取

1. 从消息中去除已识别的学科、时长、得分、活动类型
2. 剩余文本尝试匹配知识点库（从 `data/textbooks.js` 加载）
3. 如果匹配不上，将剩余文本作为自由文本知识点记录

---

## 4. GitHub 数据写入

### 4.1 数据文件结构

**文件路径:** `data/study-records.json`

```json
{
  "version": "1.0",
  "records": [
    {
      "id": "rec-uuid-001",
      "timestamp": "2026-05-24T15:30:00+08:00",
      "subject": "math",
      "duration": 30,
      "score": 75,
      "knowledgePoints": ["函数单调性"],
      "activityType": "practice",
      "textbook": "",
      "chapter": "",
      "section": "",
      "practiceDuration": 24,
      "reviewDuration": 6,
      "totalQuestions": 0,
      "correctCount": 0,
      "source": "clawbot",
      "notes": ""
    }
  ]
}
```

### 4.2 记录字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | UUID格式唯一ID |
| timestamp | string | 是 | ISO 8601格式，带时区 |
| subject | string | 是 | 学科英文ID |
| duration | number | 是 | 学习时长（分钟） |
| score | number | 否 | 得分0-100，默认75 |
| knowledgePoints | string[] | 否 | 知识点数组 |
| activityType | string | 否 | 活动类型，默认practice |
| textbook | string | 否 | 教材名称 |
| chapter | string | 否 | 章节 |
| section | string | 否 | 节 |
| practiceDuration | number | 否 | 做题时长，默认duration×0.8 |
| reviewDuration | number | 否 | 订正时长，默认duration×0.2 |
| totalQuestions | number | 否 | 总题数 |
| correctCount | number | 否 | 正确题数 |
| source | string | 是 | 数据来源，固定"clawbot" |
| notes | string | 否 | 备注 |

### 4.3 GitHub Contents API 写入流程

```
1. GET /repos/{owner}/{repo}/contents/{path}
   → 获取当前文件内容 + SHA

2. 解析当前JSON，追加新记录

3. PUT /repos/{owner}/{repo}/contents/{path}
   Headers: Authorization: token {PAT}
   Body: {
     "message": "clawbot: 添加学习记录 - {学科} {时长}分钟",
     "content": base64(更新后的JSON),
     "sha": 当前SHA
   }
```

### 4.4 防重复机制

- 检查最近10条记录的 timestamp 和 subject
- 如果5分钟内相同学科的记录已存在，跳过写入
- 回复用户"检测到重复记录，已跳过"

---

## 5. 回复模板

### 5.1 成功

```
✅ 已记录：
📐 数学 · 30分钟 · 75分
知识点：函数单调性
类型：刷题
```

### 5.2 解析失败

```
❓ 无法理解你的消息。
请用格式：学科+时长+得分
例如："数学30分钟75分"
```

### 5.3 重复记录

```
⚠️ 检测到重复记录（5分钟内已有数学记录），已跳过。
```

### 5.4 写入失败

```
❌ 写入失败，请稍后重试。
错误信息：{error_message}
```

---

## 6. 示例对话

**用户:** 今天学了30分钟数学函数单调性得分75

**clawbot:**
```
✅ 已记录：
📐 数学 · 30分钟 · 75分
知识点：函数单调性
类型：刷题
```

---

**用户:** 背了20分钟英语单词

**clawbot:**
```
✅ 已记录：
🔤 英语 · 20分钟 · 75分
类型：背诵
```

---

**用户:** 物理刷了一个小时的力学，得分85

**clawbot:**
```
✅ 已记录：
⚡ 物理 · 60分钟 · 85分
知识点：力学
类型：刷题
```

---

**用户:** 听了45分钟的数学网课

**clawbot:**
```
✅ 已记录：
📐 数学 · 45分钟 · 75分
类型：听课
```
