// debug.js — 算法调试工具页
// 功能: 数据质量检查 + XP 计算分解 + 算法参数展示 + 记录逐条审查
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys, SUBJECTS } from '../config.js';
import { calcXP, calcLevel } from '../utils/level.js';

const getRecords = () => Store.get(StorageKeys.STUDY_RECORDS) || [];
const getProfile = () => Store.get(StorageKeys.USER_PROFILE) || {};

// ── 数据质量检查 ──
function dataQualityChecks(records) {
  const issues = [];

  // 检查 xp=0 或 xp=1 的记录
  const lowXP = records.filter(r => r.xp <= 1);
  if (lowXP.length > 0) {
    issues.push({ level: 'warn', msg: `${lowXP.length} 条记录 XP≤1（可能未正确计算）` });
  }

  // 检查缺失字段
  const missingSubject = records.filter(r => !r.subject);
  if (missingSubject.length > 0) {
    issues.push({ level: 'error', msg: `${missingSubject.length} 条记录缺少学科` });
  }

  const missingDuration = records.filter(r => !r.duration || r.duration <= 0);
  if (missingDuration.length > 0) {
    issues.push({ level: 'error', msg: `${missingDuration.length} 条记录缺少时长` });
  }

  const missingTimestamp = records.filter(r => !r.timestamp);
  if (missingTimestamp.length > 0) {
    issues.push({ level: 'error', msg: `${missingTimestamp.length} 条记录缺少时间戳` });
  }

  // 检查 activityType 分布
  const typeCount = {};
  records.forEach(r => { typeCount[r.activityType || 'unknown'] = (typeCount[r.activityType || 'unknown'] || 0) + 1; });
  const unknownTypes = typeCount['unknown'] || 0;
  if (unknownTypes > 0) {
    issues.push({ level: 'warn', msg: `${unknownTypes} 条记录缺少活动类型` });
  }

  // 检查 score 分布
  const withScore = records.filter(r => r.score > 0).length;
  const noScore = records.length - withScore;
  issues.push({ level: 'info', msg: `有分数: ${withScore} 条, 无分数: ${noScore} 条` });

  // 检查时间连续性
  const dates = [...new Set(records.map(r => r.timestamp?.slice(0, 10)))].sort();
  if (dates.length > 1) {
    const gaps = [];
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr - prev) / 86400000;
      if (diff > 1) gaps.push(`${dates[i - 1]} → ${dates[i]} (${diff}天)`);
    }
    if (gaps.length > 0) {
      issues.push({ level: 'info', msg: `日期间隔: ${gaps.join(', ')}` });
    }
  }

  return issues;
}

// ── XP 分解展示 ──
function xpBreakdown(record, profile) {
  const xppm = profile.xpBasePerMinute || 2.0;
  const score = record.score || 0;
  const duration = record.duration || 0;
  const hasScore = (record.activityType === 'practice' || record.activityType === 'exam') && score > 0;

  let rawXP, calcPath;
  if (hasScore) {
    const PE = score / 100;
    const CE = Math.min(1, score / 100 * 1.2);
    const practiceDur = record.practiceDuration || duration * 0.8;
    const reviewDur = record.reviewDuration || duration * 0.2;
    rawXP = practiceDur * xppm * PE + reviewDur * xppm * CE * 1.3;
    calcPath = `有分数: rawXP = ${practiceDur}×${xppm}×${PE.toFixed(2)} + ${reviewDur}×${xppm}×${CE.toFixed(2)}×1.3 = ${rawXP.toFixed(1)}`;
  } else {
    rawXP = duration * xppm * 0.6;
    calcPath = `无分数: rawXP = ${duration}×${xppm}×0.6 = ${rawXP.toFixed(1)}`;
  }

  const weights = profile.activityWeights || {};
  const activityWeight = weights[record.activityType] || 1.0;

  return {
    rawXP: rawXP.toFixed(1),
    activityWeight,
    calcPath,
    hasScore,
    finalXP: record.xp,
  };
}

// ── 按学科统计 ──
function subjectStats(records) {
  const stats = {};
  for (const r of records) {
    if (!stats[r.subject]) {
      stats[r.subject] = { count: 0, totalMin: 0, totalXP: 0, avgScore: 0, scoreCount: 0 };
    }
    const s = stats[r.subject];
    s.count++;
    s.totalMin += r.duration || 0;
    s.totalXP += r.xp || 0;
    if (r.score > 0) {
      s.avgScore += r.score;
      s.scoreCount++;
    }
  }
  for (const [id, s] of Object.entries(stats)) {
    s.avgScore = s.scoreCount > 0 ? Math.round(s.avgScore / s.scoreCount) : 0;
  }
  return stats;
}

// ── 渲染 ──
export function render() {
  const records = getRecords();
  const profile = getProfile();
  const issues = dataQualityChecks(records);
  const subStats = subjectStats(records);

  // 数据质量
  const issuesHtml = issues.map(i => {
    const icon = i.level === 'error' ? '🔴' : i.level === 'warn' ? '🟡' : '🔵';
    return `<div class="debug-issue">${icon} ${i.msg}</div>`;
  }).join('');

  // 学科统计
  const subjectHtml = SUBJECTS.map(s => {
    const st = subStats[s.id];
    if (!st) return `<div class="debug-subject"><span class="debug-sub-name">${s.name}</span><span class="debug-sub-val">无数据</span></div>`;
    return `<div class="debug-subject">
      <span class="debug-sub-name">${s.name}</span>
      <span class="debug-sub-val">${st.count}条 · ${st.totalMin}分 · ${st.totalXP}XP</span>
      ${st.avgScore > 0 ? `<span class="debug-sub-score">均分${st.avgScore}%</span>` : ''}
    </div>`;
  }).join('');

  // 算法参数
  const algoParams = `
    <div class="debug-param"><span>xpBasePerMinute</span><span>${profile.xpBasePerMinute || 2.0}</span></div>
    <div class="debug-param"><span>baseReviewRatio</span><span>${profile.baseReviewRatio || 0.20}</span></div>
    <div class="debug-param"><span>decayRateForXP</span><span>${profile.decayRateForXP || 0.00005}</span></div>
    <div class="debug-param"><span>dailyXPLimit</span><span>${profile.dailyXPLimit || 500}</span></div>
    <div class="debug-param"><span>globalBaseHalfLife</span><span>${profile.globalBaseHalfLife || 3.0}天</span></div>
  `;

  // 最近10条记录 XP 分解
  const recent = records.slice(-10).reverse().map(r => {
    const bd = xpBreakdown(r, profile);
    const date = r.timestamp?.slice(0, 10) || '';
    const subject = SUBJECTS.find(s => s.id === r.subject)?.name || r.subject;
    return `<div class="debug-record">
      <div class="debug-rec-header">
        <span class="debug-rec-date">${date}</span>
        <span class="debug-rec-subject">${subject}</span>
        <span class="debug-rec-type">${r.activityType || '?'}</span>
        <span class="debug-rec-xp">${bd.finalXP}XP</span>
      </div>
      <div class="debug-rec-detail">
        ${bd.calcPath}
        <br>活动权重: ${bd.activityWeight} | 时长: ${r.duration}分 | 分数: ${r.score || '无'}
      </div>
    </div>`;
  }).join('');

  return `<div class="page-enter">
    <a href="#/" class="page-back">← 返回</a>
    <div class="debug-header">🔧 算法调试工具</div>

    <div class="debug-section">
      <h3 class="debug-title">📊 数据质量</h3>
      <div class="debug-summary">
        <span>总记录: ${records.length}</span>
        <span>总XP: ${records.reduce((s, r) => s + (r.xp || 0), 0)}</span>
        <span>等级: ${calcLevel(records.reduce((s, r) => s + (r.xp || 0), 0))}</span>
      </div>
      <div class="debug-issues">${issuesHtml || '<div class="debug-issue">🔵 无问题</div>'}</div>
    </div>

    <div class="debug-section">
      <h3 class="debug-title">📈 学科统计</h3>
      <div class="debug-subjects">${subjectHtml}</div>
    </div>

    <div class="debug-section">
      <h3 class="debug-title">⚙️ 算法参数</h3>
      <div class="debug-params">${algoParams}</div>
    </div>

    <div class="debug-section">
      <h3 class="debug-title">🔍 最近10条 XP 分解</h3>
      <div class="debug-records">${recent}</div>
    </div>

    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs);text-align:center">v0.130 · 调试工具</p>
  </div>`;
}

export function afterRender() {
  return () => {};
}
