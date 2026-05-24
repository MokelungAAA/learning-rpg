// search.js — 共享搜索工具：Levenshtein + 拼音 + 模糊匹配
// 供 data-entry.js / search.js / command-palette.js 复用

// 拼音首字母映射（9学科 + 常用页面名）
export const PINYIN_MAP = {
  '数学': 'sx', '语文': 'yw', '英语': 'yy', '物理': 'wl',
  '化学': 'hx', '生物': 'sw', '政治': 'zz', '历史': 'ls', '地理': 'dl',
  '首页': 'sy', '数据': 'sj', '番茄钟': 'fqz', '技能树': 'jns',
  '复习中心': 'fxzx', '学习日志': 'xxrz', '阅读记录': 'ydjl',
  '设置': 'sz', '搜索页': 'ssy', '数据管理': 'sjgl',
  '成就': 'cj', '关于': 'gy', '导入': 'dr', '导出': 'dc',
};

// Levenshtein 编辑距离
export function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

// 拼音首字母匹配（查 PINYIN_MAP）
export function matchPinyin(text, query) {
  const pinyin = PINYIN_MAP[text];
  return pinyin && pinyin.includes(query.toLowerCase());
}

// 模糊匹配：子串 > 前缀 > 拼音 > Levenshtein（距离≤2）
// 返回匹配分数：0=不匹配, 1=模糊, 2=拼音, 3=精确子串/前缀
export function fuzzyMatch(text, query, pinyinHint) {
  const t = text.toLowerCase(), q = query.toLowerCase();
  if (t.includes(q) || t.startsWith(q)) return 3;
  if (pinyinHint && pinyinHint.includes(q)) return 2;
  if (matchPinyin(text, q)) return 2;
  // Levenshtein：短文本直接比较，长文本滑动窗口
  if (t.length <= 8 && levenshtein(t, q) <= 2) return 1;
  for (let i = 0; i <= t.length - q.length; i++) {
    if (levenshtein(t.slice(i, i + q.length), q) <= 2) return 1;
  }
  return 0;
}
