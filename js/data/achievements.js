// achievements.js — 成就定义列表（59个成就，5大类，5级稀有度）
// condition 结构: { type, operator, value }
//   type 对应统计字段(pomodoro_count/level/streak_days/total_xp 等)
// rarity 等级: bronze < silver < gold < legendary < hidden
// category 分类: persistence / knowledge / mastery / explore / legend
export const ACHIEVEMENTS = [
  // ═══════════════════════════════════════════
  // 坚持之力 (persistence) — 14个
  // ═══════════════════════════════════════════
  {
    id: 'ach_streak_3', name: '三日之约', description: '连续学习 3 天',
    category: 'persistence', rarity: 'bronze', icon: '🔥',
    condition: { type: 'streak_days', operator: '>=', value: 3 },
  },
  {
    id: 'ach_streak_7', name: '一周不断', description: '连续学习 7 天',
    category: 'persistence', rarity: 'bronze', icon: '🔥',
    condition: { type: 'streak_days', operator: '>=', value: 7 },
  },
  {
    id: 'ach_streak_14', name: '双周毅力', description: '连续学习 14 天',
    category: 'persistence', rarity: 'silver', icon: '🔥',
    condition: { type: 'streak_days', operator: '>=', value: 14 },
  },
  {
    id: 'ach_streak_30', name: '月度坚持', description: '连续学习 30 天',
    category: 'persistence', rarity: 'silver', icon: '🔥',
    condition: { type: 'streak_days', operator: '>=', value: 30 },
  },
  {
    id: 'ach_streak_60', name: '双月不辍', description: '连续学习 60 天',
    category: 'persistence', rarity: 'gold', icon: '🔥',
    condition: { type: 'streak_days', operator: '>=', value: 60 },
  },
  {
    id: 'ach_streak_100', name: '百日修行', description: '连续学习 100 天',
    category: 'persistence', rarity: 'gold', icon: '🔥',
    condition: { type: 'streak_days', operator: '>=', value: 100 },
  },
  {
    id: 'ach_streak_365', name: '年度坚持', description: '连续学习 365 天',
    category: 'persistence', rarity: 'legendary', icon: '🔥',
    condition: { type: 'streak_days', operator: '>=', value: 365 },
  },
  {
    id: 'ach_study_1h', name: '初学者', description: '累计学习 1 小时',
    category: 'persistence', rarity: 'bronze', icon: '⏰',
    condition: { type: 'total_minutes', operator: '>=', value: 60 },
  },
  {
    id: 'ach_study_10h', name: '十小时', description: '累计学习 10 小时',
    category: 'persistence', rarity: 'bronze', icon: '⏰',
    condition: { type: 'total_minutes', operator: '>=', value: 600 },
  },
  {
    id: 'ach_study_50h', name: '五十小时', description: '累计学习 50 小时',
    category: 'persistence', rarity: 'silver', icon: '⏰',
    condition: { type: 'total_minutes', operator: '>=', value: 3000 },
  },
  {
    id: 'ach_study_100h', name: '百小时学者', description: '累计学习 100 小时',
    category: 'persistence', rarity: 'gold', icon: '⏰',
    condition: { type: 'total_minutes', operator: '>=', value: 6000 },
  },
  {
    id: 'ach_study_500h', name: '五百小时', description: '累计学习 500 小时',
    category: 'persistence', rarity: 'legendary', icon: '⏰',
    condition: { type: 'total_minutes', operator: '>=', value: 30000 },
  },
  {
    id: 'ach_study_1000h', name: '千小时大师', description: '累计学习 1000 小时',
    category: 'persistence', rarity: 'legendary', icon: '⏰',
    condition: { type: 'total_minutes', operator: '>=', value: 60000 },
  },
  {
    id: 'ach_pomodoro_1', name: '第一个番茄', description: '完成你的第一个番茄钟',
    category: 'persistence', rarity: 'bronze', icon: '🍅',
    condition: { type: 'pomodoro_count', operator: '>=', value: 1 },
  },
  {
    id: 'ach_pomodoro_10', name: '番茄达人', description: '累计完成 10 个番茄钟',
    category: 'persistence', rarity: 'bronze', icon: '🍅',
    condition: { type: 'pomodoro_count', operator: '>=', value: 10 },
  },
  {
    id: 'ach_pomodoro_50', name: '番茄大师', description: '累计完成 50 个番茄钟',
    category: 'persistence', rarity: 'silver', icon: '🍅',
    condition: { type: 'pomodoro_count', operator: '>=', value: 50 },
  },
  {
    id: 'ach_pomodoro_100', name: '番茄宗师', description: '累计完成 100 个番茄钟',
    category: 'persistence', rarity: 'gold', icon: '🍅',
    condition: { type: 'pomodoro_count', operator: '>=', value: 100 },
  },
  {
    id: 'ach_pomodoro_200', name: '番茄传奇', description: '累计完成 200 个番茄钟',
    category: 'persistence', rarity: 'legendary', icon: '🍅',
    condition: { type: 'pomodoro_count', operator: '>=', value: 200 },
  },
  {
    id: 'ach_pomodoro_500', name: '番茄之神', description: '累计完成 500 个番茄钟',
    category: 'persistence', rarity: 'legendary', icon: '🍅',
    condition: { type: 'pomodoro_count', operator: '>=', value: 500 },
  },

  // ═══════════════════════════════════════════
  // 博学之路 (knowledge) — 15个
  // ═══════════════════════════════════════════
  {
    id: 'ach_subjects_1', name: '初窥门径', description: '学习 1 个学科',
    category: 'knowledge', rarity: 'bronze', icon: '📚',
    condition: { type: 'unique_subjects', operator: '>=', value: 1 },
  },
  {
    id: 'ach_subjects_3', name: '三科学者', description: '学习 3 个学科',
    category: 'knowledge', rarity: 'bronze', icon: '📚',
    condition: { type: 'unique_subjects', operator: '>=', value: 3 },
  },
  {
    id: 'ach_subjects_5', name: '五科学者', description: '学习 5 个学科',
    category: 'knowledge', rarity: 'silver', icon: '📚',
    condition: { type: 'unique_subjects', operator: '>=', value: 5 },
  },
  {
    id: 'ach_subjects_7', name: '七科学者', description: '学习 7 个学科',
    category: 'knowledge', rarity: 'silver', icon: '📚',
    condition: { type: 'unique_subjects', operator: '>=', value: 7 },
  },
  {
    id: 'ach_subjects_9', name: '全科学者', description: '在所有 9 个学科中都有学习记录',
    category: 'knowledge', rarity: 'gold', icon: '🌈',
    condition: { type: 'unique_subjects', operator: '>=', value: 9 },
  },
  {
    id: 'ach_xp_100', name: '百XP', description: '累计获得 100 XP',
    category: 'knowledge', rarity: 'bronze', icon: '✨',
    condition: { type: 'total_xp', operator: '>=', value: 100 },
  },
  {
    id: 'ach_xp_500', name: '五百XP', description: '累计获得 500 XP',
    category: 'knowledge', rarity: 'bronze', icon: '✨',
    condition: { type: 'total_xp', operator: '>=', value: 500 },
  },
  {
    id: 'ach_xp_1000', name: '千XP', description: '累计获得 1,000 XP',
    category: 'knowledge', rarity: 'silver', icon: '✨',
    condition: { type: 'total_xp', operator: '>=', value: 1000 },
  },
  {
    id: 'ach_xp_5000', name: '五千XP', description: '累计获得 5,000 XP',
    category: 'knowledge', rarity: 'gold', icon: '✨',
    condition: { type: 'total_xp', operator: '>=', value: 5000 },
  },
  {
    id: 'ach_xp_10000', name: '万XP传奇', description: '累计获得 10,000 XP',
    category: 'knowledge', rarity: 'legendary', icon: '✨',
    condition: { type: 'total_xp', operator: '>=', value: 10000 },
  },
  {
    id: 'ach_record_1', name: '第一条记录', description: '创建第一条学习记录',
    category: 'knowledge', rarity: 'bronze', icon: '📝',
    condition: { type: 'record_count', operator: '>=', value: 1 },
  },
  {
    id: 'ach_record_10', name: '十条记录', description: '累计创建 10 条学习记录',
    category: 'knowledge', rarity: 'bronze', icon: '📝',
    condition: { type: 'record_count', operator: '>=', value: 10 },
  },
  {
    id: 'ach_record_50', name: '勤学者', description: '累计创建 50 条学习记录',
    category: 'knowledge', rarity: 'silver', icon: '📚',
    condition: { type: 'record_count', operator: '>=', value: 50 },
  },
  {
    id: 'ach_record_100', name: '百记录', description: '累计创建 100 条学习记录',
    category: 'knowledge', rarity: 'gold', icon: '📚',
    condition: { type: 'record_count', operator: '>=', value: 100 },
  },
  {
    id: 'ach_record_500', name: '记录大师', description: '累计创建 500 条学习记录',
    category: 'knowledge', rarity: 'legendary', icon: '📚',
    condition: { type: 'record_count', operator: '>=', value: 500 },
  },

  // ═══════════════════════════════════════════
  // 精进之魂 (mastery) — 18个
  // ═══════════════════════════════════════════
  {
    id: 'ach_score_perfect', name: '满分达人', description: '单次学习正确率达到 100%',
    category: 'mastery', rarity: 'silver', icon: '💯',
    condition: { type: 'max_score_rate', operator: '>=', value: 1.0 },
  },
  {
    id: 'ach_perfect_3', name: '三连满分', description: '连续 3 次正确率 100%',
    category: 'mastery', rarity: 'gold', icon: '💯',
    condition: { type: 'perfect_in_a_row', operator: '>=', value: 3 },
  },
  {
    id: 'ach_perfect_10', name: '十连满分', description: '连续 10 次正确率 100%',
    category: 'mastery', rarity: 'legendary', icon: '💯',
    condition: { type: 'perfect_in_a_row', operator: '>=', value: 10 },
  },
  {
    id: 'ach_level_10', name: '十级学徒', description: '达到等级 10',
    category: 'mastery', rarity: 'bronze', icon: '⭐',
    condition: { type: 'level', operator: '>=', value: 10 },
  },
  {
    id: 'ach_level_25', name: '二十五级学者', description: '达到等级 25',
    category: 'mastery', rarity: 'silver', icon: '⭐',
    condition: { type: 'level', operator: '>=', value: 25 },
  },
  {
    id: 'ach_level_50', name: '五十级大师', description: '达到等级 50',
    category: 'mastery', rarity: 'gold', icon: '🌟',
    condition: { type: 'level', operator: '>=', value: 50 },
  },
  {
    id: 'ach_level_80', name: '八十级宗师', description: '达到等级 80',
    category: 'mastery', rarity: 'legendary', icon: '🌟',
    condition: { type: 'level', operator: '>=', value: 80 },
  },
  {
    id: 'ach_subj_math_5', name: '数学达人', description: '数学学科达到 5 级',
    category: 'mastery', rarity: 'silver', icon: '📐',
    condition: { type: 'subject_level', subject: 'logos', operator: '>=', value: 5 },
  },
  {
    id: 'ach_subj_math_7', name: '数学大师', description: '数学学科达到 7 级',
    category: 'mastery', rarity: 'gold', icon: '📐',
    condition: { type: 'subject_level', subject: 'logos', operator: '>=', value: 7 },
  },
  {
    id: 'ach_subj_eng_5', name: '英语达人', description: '英语学科达到 5 级',
    category: 'mastery', rarity: 'silver', icon: '🌍',
    condition: { type: 'subject_level', subject: 'lingua', operator: '>=', value: 5 },
  },
  {
    id: 'ach_subj_eng_7', name: '英语大师', description: '英语学科达到 7 级',
    category: 'mastery', rarity: 'gold', icon: '🌍',
    condition: { type: 'subject_level', subject: 'lingua', operator: '>=', value: 7 },
  },
  {
    id: 'ach_subj_phy_5', name: '物理达人', description: '物理学科达到 5 级',
    category: 'mastery', rarity: 'silver', icon: '⚛️',
    condition: { type: 'subject_level', subject: 'physis', operator: '>=', value: 5 },
  },
  {
    id: 'ach_subj_phy_7', name: '物理大师', description: '物理学科达到 7 级',
    category: 'mastery', rarity: 'gold', icon: '⚛️',
    condition: { type: 'subject_level', subject: 'physis', operator: '>=', value: 7 },
  },
  {
    id: 'ach_single_subj_10h', name: '单科十小时', description: '单科学习 10 小时',
    category: 'mastery', rarity: 'silver', icon: '📖',
    condition: { type: 'single_subject_hours', operator: '>=', value: 10 },
  },
  {
    id: 'ach_single_subj_50h', name: '单科五十小时', description: '单科学习 50 小时',
    category: 'mastery', rarity: 'gold', icon: '📖',
    condition: { type: 'single_subject_hours', operator: '>=', value: 50 },
  },
  {
    id: 'ach_single_subj_100h', name: '单科百小时', description: '单科学习 100 小时',
    category: 'mastery', rarity: 'legendary', icon: '📖',
    condition: { type: 'single_subject_hours', operator: '>=', value: 100 },
  },
  {
    id: 'ach_improve_20', name: '大幅进步', description: '单次正确率比上次提高 20% 以上',
    category: 'mastery', rarity: 'silver', icon: '📈',
    condition: { type: 'score_improvement', operator: '>=', value: 20 },
  },
  {
    id: 'ach_improve_40', name: '飞跃进步', description: '单次正确率比上次提高 40% 以上',
    category: 'mastery', rarity: 'gold', icon: '📈',
    condition: { type: 'score_improvement', operator: '>=', value: 40 },
  },

  // ═══════════════════════════════════════════
  // 探索之心 (explore) — 6个
  // ═══════════════════════════════════════════
  {
    id: 'ach_first_review', name: '温故知新', description: '完成第一次复习',
    category: 'explore', rarity: 'bronze', icon: '🔄',
    condition: { type: 'review_count', operator: '>=', value: 1 },
  },
  {
    id: 'ach_first_reading', name: '开卷有益', description: '创建第一条阅读记录',
    category: 'explore', rarity: 'bronze', icon: '📖',
    condition: { type: 'reading_count', operator: '>=', value: 1 },
  },
  {
    id: 'ach_reading_10', name: '书虫', description: '创建 10 条阅读记录',
    category: 'explore', rarity: 'silver', icon: '📖',
    condition: { type: 'reading_count', operator: '>=', value: 10 },
  },
  {
    id: 'ach_night_owl', name: '夜猫子', description: '在凌晨 0-5 点学习',
    category: 'explore', rarity: 'bronze', icon: '🦉',
    condition: { type: 'study_at_night', operator: '>=', value: 1 },
  },
  {
    id: 'ach_early_bird', name: '早起的鸟', description: '在早上 5-7 点学习',
    category: 'explore', rarity: 'bronze', icon: '🐦',
    condition: { type: 'study_at_dawn', operator: '>=', value: 1 },
  },
  {
    id: 'ach_speed_demon', name: '极速番茄', description: '在 15 分钟内完成一个番茄钟',
    category: 'explore', rarity: 'silver', icon: '⚡',
    condition: { type: 'fast_pomodoro', operator: '>=', value: 1 },
  },

  // ═══════════════════════════════════════════
  // 传奇之巅 (legend) — 6个（含5个隐藏）
  // ═══════════════════════════════════════════
  {
    id: 'ach_all_legendary', name: '全科传说', description: '所有 9 个学科都达到传说级',
    category: 'legend', rarity: 'legendary', icon: '👑',
    condition: { type: 'all_subject_legendary', operator: '>=', value: 1 },
  },

  // --- 隐藏成就 (hidden) ---
  {
    id: 'ach_hidden_export', name: '数据守护者', description: '???',
    category: 'legend', rarity: 'hidden', icon: '🔮',
    condition: { type: 'export_data', operator: '>=', value: 1 },
    hidden: true, revealName: '数据守护者', revealDesc: '导出过数据备份',
  },
  {
    id: 'ach_hidden_cmd', name: '键盘侠', description: '???',
    category: 'legend', rarity: 'hidden', icon: '🔮',
    condition: { type: 'use_command_palette', operator: '>=', value: 1 },
    hidden: true, revealName: '键盘侠', revealDesc: '使用过命令面板 (Ctrl+K)',
  },
  {
    id: 'ach_hidden_3am', name: '凌晨战士', description: '???',
    category: 'legend', rarity: 'hidden', icon: '🔮',
    condition: { type: 'study_at_3am', operator: '>=', value: 1 },
    hidden: true, revealName: '凌晨战士', revealDesc: '在凌晨 3 点学习',
  },
  {
    id: 'ach_hidden_speedrun', name: '速通达人', description: '???',
    category: 'legend', rarity: 'hidden', icon: '🔮',
    condition: { type: 'speedrun_500xp', operator: '>=', value: 1 },
    hidden: true, revealName: '速通达人', revealDesc: '单日获得 500+ XP',
  },
  {
    id: 'ach_hidden_bookworm', name: '书海无涯', description: '???',
    category: 'legend', rarity: 'hidden', icon: '🔮',
    condition: { type: 'reading_count', operator: '>=', value: 50 },
    hidden: true, revealName: '书海无涯', revealDesc: '创建 50 条阅读记录',
  },
];

// 按 id 精确查找单个成就
export function getAchievementById(id) {
  return ACHIEVEMENTS.find(a => a.id === id) || null;
}

// 按分类筛选成就列表
export function getAchievementsByCategory(category) {
  return ACHIEVEMENTS.filter(a => a.category === category);
}
