// achievement.js — 成就浏览页（全部成就列表 + 解锁状态）
// 读取: STUDY_RECORDS, USER_PROFILE, ACHIEVEMENTS（持久化）
// 解锁逻辑: 持久化ID + 实时检测取并集（防止已解锁成就因数据变化消失）
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { checkAchievement, loadUnlockedIds } from '../utils/achievements-check.js';

const RARITY_LABELS = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };
const CATEGORY_LABELS = { progress: '进度', exploration: '探索', score: '成绩', easter: '彩蛋' };

export function render() {
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  const profile = Store.get(StorageKeys.USER_PROFILE) || {};
  // 已持久化的解锁 ID（永久保持）+ 实时检测新满足的
  const persistedIds = loadUnlockedIds();
  const liveUnlocked = ACHIEVEMENTS.filter(a => checkAchievement(a, records, profile)).map(a => a.id);
  const unlockedIds = new Set([...persistedIds, ...liveUnlocked]);

  const categories = ['progress', 'exploration', 'score', 'easter'];
  const sections = categories.map(cat => {
    const items = ACHIEVEMENTS.filter(a => a.category === cat).map(a => {
      const isUnlocked = unlockedIds.has(a.id);
      return `<div class="ach-card ${isUnlocked ? 'unlocked' : 'locked'} ${a.rarity}">
        <div class="ach-icon">${isUnlocked ? a.icon : '🔒'}</div>
        <div class="ach-info">
          <div class="ach-name">${a.name}</div>
          <div class="ach-desc">${a.description}</div>
          <div class="ach-rarity">${RARITY_LABELS[a.rarity] || a.rarity}</div>
        </div>
      </div>`;
    }).join('');
    return `<div class="ach-section">
      <div class="ach-section-title">${CATEGORY_LABELS[cat]}</div>
      <div class="ach-grid">${items}</div>
    </div>`;
  }).join('');

  return `<div class="page-enter">
    <a href="#/data" class="page-back">← 返回数据</a>
    <div class="ach-header">
      <div class="section-title">🏆 成就</div>
      <div class="ach-progress">${unlocked.length} / ${ACHIEVEMENTS.length} 已解锁</div>
    </div>
    ${sections}
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.64 · 成就持久化</p>
  </div>`;
}

// 无交互事件，返回空清理函数
export function afterRender() {
  return () => {};
}
