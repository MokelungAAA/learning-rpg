// nlp-parser.js — 自然语言解析器（§18.6.2）
// 输入: "数学30分钟函数单调性75分"
// 输出: { subject, duration, score, knowledgePoints, activityType }
import { SUBJECTS } from '../config.js';
import { SUBJECTS_DATA } from '../data/subjects.js';

// 学科关键词映射（支持简称/别名）
const SUBJECT_ALIASES = {
  '数学': 'logos', 'math': 'logos', '数': 'logos',
  '语文': 'mythos', 'chinese': 'mythos', '语': 'mythos',
  '英语': 'lingua', 'english': 'lingua', '英': 'lingua',
  '物理': 'physis', 'physics': 'physis', '物': 'physis',
  '化学': 'khemeia', 'chemistry': 'khemeia', '化': 'khemeia',
  '生物': 'zoe', 'biology': 'zoe', '生': 'zoe',
  '政治': 'politeia', 'politics': 'politeia', '政': 'politeia',
  '历史': 'historia', 'history': 'historia', '史': 'historia',
  '地理': 'geographia', 'geography': 'geographia', '地': 'geographia',
};

// 活动类型关键词
const ACTIVITY_KEYWORDS = [
  { keywords: ['背', '默写', '记', '背诵'], type: 'recitation' },
  { keywords: ['刷', '做', '练', '题'], type: 'practice' },
  { keywords: ['复习', '回顾', '重看'], type: 'review' },
  { keywords: ['考试', '测验', '模考'], type: 'exam' },
  { keywords: ['听', '网课', '视频', '课'], type: 'lecture' },
];

// 构建知识点索引（用于模糊匹配）
let kpIndex = null;
function buildKPIndex() {
  if (kpIndex) return kpIndex;
  kpIndex = [];
  for (const [sid, data] of Object.entries(SUBJECTS_DATA)) {
    if (!data.textbooks) continue;
    for (const tb of data.textbooks) {
      for (const ch of tb.chapters) {
        for (const sec of ch.sections) {
          for (const kp of (sec.knowledgePoints || [])) {
            kpIndex.push({ kp, subjectId: sid, subjectName: data.name });
          }
        }
      }
    }
  }
  return kpIndex;
}

// 从文本中提取学科
function extractSubject(text) {
  for (const [alias, id] of Object.entries(SUBJECT_ALIASES)) {
    if (text.includes(alias)) return { id, matched: alias };
  }
  return null;
}

// 从文本中提取时长
// 支持: "30分钟" "1小时" "1.5h" "半小时" "45min"
function extractDuration(text) {
  // "X小时" → X*60
  let m = text.match(/(\d+\.?\d*)\s*小时/);
  if (m) return { value: Math.round(parseFloat(m[1]) * 60), matched: m[0] };
  // "半小时" → 30
  if (text.includes('半小时')) return { value: 30, matched: '半小时' };
  // "X分钟" or "X分" (但不匹配"得分")
  m = text.match(/(\d+\.?\d*)\s*分钟/);
  if (m) return { value: Math.round(parseFloat(m[1])), matched: m[0] };
  // "Xh" or "X小时"
  m = text.match(/(\d+\.?\d*)\s*[hH小时]/);
  if (m) return { value: Math.round(parseFloat(m[1]) * 60), matched: m[0] };
  // "Xmin"
  m = text.match(/(\d+\.?\d*)\s*[mM][iI]?[nN]?/);
  if (m && parseFloat(m[1]) <= 300) return { value: Math.round(parseFloat(m[1])), matched: m[0] };
  // 纯数字+分钟暗示 (2位数，默认为分钟)
  m = text.match(/(\d{2,3})\s*分(?![钟])/);
  if (m && !text.includes('得分') && !text.includes('分$')) {
    const num = parseInt(m[1]);
    if (num >= 10 && num <= 300) return { value: num, matched: m[0] };
  }
  return null;
}

// 从文本中提取得分
// 支持: "75分" "得分75" "75%" "20:25" "20/25" "对了15/20题"
function extractScore(text) {
  // "X分" (排除时长的"分钟")
  let m = text.match(/(?:得分|分数|成绩)?\s*(\d{1,3})\s*分(?!钟)/);
  if (m) { const v = parseInt(m[1]); if (v <= 100) return { value: v, matched: m[0] }; }
  // "X%"
  m = text.match(/(\d{1,3})\s*%/);
  if (m) { const v = parseInt(m[1]); if (v <= 100) return { value: v, matched: m[0] }; }
  // "得分X"
  m = text.match(/得分\s*(\d{1,3})/);
  if (m) { const v = parseInt(m[1]); if (v <= 100) return { value: v, matched: m[0] }; }
  // "对了X/Y题"
  m = text.match(/对了?\s*(\d+)\s*[/\/]\s*(\d+)\s*题/);
  if (m) { const pct = Math.round(parseInt(m[1]) / parseInt(m[2]) * 100); return { value: pct, matched: m[0] }; }
  // "X:Y" 或 "X/Y"（正确数:总数，如 "20:25" 或 "20/25"）
  m = text.match(/(\d{1,3})\s*[:\/]\s*(\d{1,3})/);
  if (m) {
    const correct = parseInt(m[1]);
    const total = parseInt(m[2]);
    if (total > 0 && correct <= total && total <= 200) {
      return { value: Math.round(correct / total * 100), matched: m[0] };
    }
  }
  return null;
}

// 从文本中提取活动类型
function extractActivityType(text) {
  for (const { keywords, type } of ACTIVITY_KEYWORDS) {
    for (const kw of keywords) {
      if (text.includes(kw)) return { type, matched: kw };
    }
  }
  return null;
}

// 从文本中提取知识点（匹配知识点库）
function extractKnowledgePoints(text, subjectId) {
  const index = buildKPIndex();
  const found = [];
  // 先按学科过滤
  const candidates = subjectId
    ? index.filter(k => k.subjectId === subjectId)
    : index;
  for (const item of candidates) {
    if (text.includes(item.kp) && !found.includes(item.kp)) {
      found.push(item.kp);
    }
  }
  // 如果没找到精确匹配，尝试关键词
  if (found.length === 0) {
    // 提取文本中可能的知识点（去掉已识别的部分）
    const cleaned = text.replace(/\d+\.?\d*\s*(分钟|小时|[hH]|[mM][iI]?[nN]?)/g, '')
      .replace(/\d{1,3}\s*分(?!钟)/g, '')
      .replace(/得分/g, '')
      .trim();
    // 如果剩余文本长度>=2，可能是知识点
    if (cleaned.length >= 2) {
      for (const item of candidates) {
        if (item.kp.includes(cleaned) || cleaned.includes(item.kp.slice(0, 2))) {
          found.push(item.kp);
          if (found.length >= 3) break;
        }
      }
    }
  }
  return found;
}

// 主解析函数
export function parseNaturalLanguage(input) {
  if (!input || input.trim().length < 2) return null;
  const text = input.trim();
  const result = {
    subject: null,
    subjectName: null,
    duration: null,
    score: null,
    knowledgePoints: [],
    activityType: 'practice',
    raw: text,
  };

  // 1. 提取学科
  const subj = extractSubject(text);
  if (subj) {
    result.subject = subj.id;
    const s = SUBJECTS.find(s => s.id === subj.id);
    result.subjectName = s ? s.name : subj.id;
  }

  // 2. 提取时长
  const dur = extractDuration(text);
  if (dur) result.duration = dur.value;

  // 3. 提取得分
  const score = extractScore(text);
  if (score) result.score = score.value;

  // 4. 提取活动类型
  const activity = extractActivityType(text);
  if (activity) result.activityType = activity.type;

  // 5. 提取知识点
  result.knowledgePoints = extractKnowledgePoints(text, result.subject);

  return result;
}

// 获取解析结果的置信度（0-1）
export function getConfidence(result) {
  if (!result) return 0;
  let score = 0;
  if (result.subject) score += 0.3;
  if (result.duration) score += 0.3;
  if (result.score !== null) score += 0.2;
  if (result.knowledgePoints.length > 0) score += 0.2;
  return score;
}

// 获取解析结果的描述文本
export function formatResult(result) {
  if (!result) return '无法解析';
  const parts = [];
  if (result.subjectName) parts.push(result.subjectName);
  if (result.duration) parts.push(`${result.duration}分钟`);
  if (result.score !== null) parts.push(`${result.score}分`);
  if (result.knowledgePoints.length > 0) parts.push(`知识点: ${result.knowledgePoints.join(', ')}`);
  return parts.join(' · ') || '信息不足';
}
