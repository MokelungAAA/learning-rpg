// recitation.js — 背诵/默写系统（语文古诗文）
// 记忆曲线: FSRS幂律衰减 + 自评修正
// 流程: 未背诵→推荐背诵→用户背诵→标记已背诵→推荐默写→用户默写→自评→修正记忆曲线
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';
import { PASSAGES, estimateReciteTime, estimateDictateTime } from '../data/recitation-passages.js';
import EventBus from '../event-bus.js';
import Toast from '../components/toast.js';

// 获取篇目的记忆状态
function getState() {
  return Store.get(StorageKeys.RECITATION_STATE) || {};
}

function saveState(state) {
  Store.set(StorageKeys.RECITATION_STATE, state);
}

// 获取单篇记忆数据
function getPassageState(passageId) {
  const state = getState();
  return state[passageId] || {
    status: 'not_started', // not_started / memorized / mastered
    memorizedAt: null,
    lastDictateAt: null,
    dictateCount: 0,
    selfRatings: [], // [{date, rating: 1-5, days_since_memorized}]
    halfLife: 1.0,   // 初始半衰期1天
    nextReviewAt: null,
  };
}

// 计算下一次复习时间（基于FSRS半衰期）
function calcNextReview(halfLife, lastReviewDate) {
  const next = new Date(lastReviewDate);
  next.setDate(next.getDate() + Math.max(1, Math.round(halfLife)));
  return next.toISOString().slice(0, 10);
}

// 根据自评修正半衰期 (FSRS-inspired)
// rating: 1=完全忘了, 2=大部分忘了, 3=记住一半, 4=基本记住, 5=完美默写
function updateHalfLife(oldHalfLife, rating) {
  const multipliers = { 1: 0.4, 2: 0.6, 3: 0.9, 4: 1.2, 5: 1.5 };
  const m = multipliers[rating] || 1.0;
  return Math.max(0.5, Math.min(30, oldHalfLife * m));
}

// 获取推荐列表: 按紧急度排序
function getRecommendations() {
  const state = getState();
  const today = new Date().toISOString().slice(0, 10);
  const recommendations = { recite: [], dictate: [] };

  for (const p of PASSAGES) {
    const ps = state[p.id] || { status: 'not_started', halfLife: 1.0, nextReviewAt: null, dictateCount: 0 };

    if (ps.status === 'not_started') {
      // 未背诵 → 推荐背诵
      recommendations.recite.push({
        ...p,
        urgency: 1, // 最高优先
        reason: '未背诵',
        estTime: estimateReciteTime(p),
      });
    } else if (ps.status === 'memorized') {
      // 已背诵 → 检查是否到了默写时间
      if (!ps.nextReviewAt || ps.nextReviewAt <= today) {
        const daysSince = ps.memorizedAt
          ? Math.round((Date.now() - new Date(ps.memorizedAt).getTime()) / 86400000)
          : 0;
        recommendations.dictate.push({
          ...p,
          urgency: ps.nextReviewAt === today ? 1 : (ps.nextReviewAt < today ? 0.5 : 2),
          reason: ps.dictateCount === 0 ? '首次默写' : `距上次${daysSince}天`,
          estTime: estimateDictateTime(p),
          halfLife: ps.halfLife,
          dictateCount: ps.dictateCount,
        });
      }
    }
    // mastered → 不再推荐（除非用户主动选择）
  }

  // 紧急度排序: 值越小越紧急
  recommendations.recite.sort((a, b) => a.urgency - b.urgency);
  recommendations.dictate.sort((a, b) => a.urgency - b.urgency);

  return recommendations;
}

// 统计数据
function getStats() {
  const state = getState();
  let notStarted = 0, memorized = 0, mastered = 0;
  for (const p of PASSAGES) {
    const s = (state[p.id] || {}).status || 'not_started';
    if (s === 'not_started') notStarted++;
    else if (s === 'memorized') memorized++;
    else if (s === 'mastered') mastered++;
  }
  return { total: PASSAGES.length, notStarted, memorized, mastered };
}

// 渲染页面
export function render() {
  const stats = getStats();
  const recs = getRecommendations();
  const state = getState();

  // 摘要条
  const summaryHtml = `<div class="recite-summary">
    <div class="recite-stat"><span class="recite-stat-num">${stats.total}</span><span class="recite-stat-label">总篇目</span></div>
    <div class="recite-stat"><span class="recite-stat-num">${stats.notStarted}</span><span class="recite-stat-label">未背诵</span></div>
    <div class="recite-stat"><span class="recite-stat-num">${stats.memorized}</span><span class="recite-stat-label">已背诵</span></div>
    <div class="recite-stat"><span class="recite-stat-num">${stats.mastered}</span><span class="recite-stat-label">已掌握</span></div>
  </div>`;

  // 今日推荐背诵
  let reciteHtml = '';
  if (recs.recite.length > 0) {
    const items = recs.recite.slice(0, 5).map(p =>
      `<div class="recite-item" data-id="${p.id}" data-action="recite">
        <div class="recite-item-left">
          <span class="recite-item-icon">📖</span>
          <div class="recite-item-info">
            <div class="recite-item-title">${p.title}</div>
            <div class="recite-item-meta">${p.author} · ${p.dynasty} · 约${p.estTime}分钟</div>
          </div>
        </div>
        <button class="recite-btn" data-id="${p.id}" data-action="recite">背诵</button>
      </div>`
    ).join('');
    reciteHtml = `<div class="fold-section">
      <div class="fold-header" data-fold="recite-todo">
        <span>📖 待背诵</span>
        <span class="fold-badge">${recs.recite.length}篇</span>
        <span class="fold-arrow">▾</span>
      </div>
      <div class="fold-body open" id="fold-recite-todo">
        <div class="fold-content"><div class="recite-list">${items}</div></div>
      </div>
    </div>`;
  }

  // 今日推荐默写
  let dictateHtml = '';
  if (recs.dictate.length > 0) {
    const items = recs.dictate.slice(0, 5).map(p =>
      `<div class="recite-item" data-id="${p.id}" data-action="dictate">
        <div class="recite-item-left">
          <span class="recite-item-icon">✍️</span>
          <div class="recite-item-info">
            <div class="recite-item-title">${p.title}</div>
            <div class="recite-item-meta">${p.reason} · 半衰期${p.halfLife?.toFixed(1)}天 · 约${p.estTime}分钟</div>
          </div>
        </div>
        <button class="recite-btn" data-id="${p.id}" data-action="dictate">默写</button>
      </div>`
    ).join('');
    dictateHtml = `<div class="fold-section">
      <div class="fold-header" data-fold="dictate-todo">
        <span>✍️ 待默写</span>
        <span class="fold-badge">${recs.dictate.length}篇</span>
        <span class="fold-arrow">▾</span>
      </div>
      <div class="fold-body open" id="fold-dictate-todo">
        <div class="fold-content"><div class="recite-list">${items}</div></div>
      </div>
    </div>`;
  }

  // 全部篇目列表（折叠）
  const allPassagesHtml = PASSAGES.map(p => {
    const ps = state[p.id] || { status: 'not_started' };
    const statusIcon = ps.status === 'mastered' ? '✅' : ps.status === 'memorized' ? '📝' : '⬜';
    return `<div class="recite-all-item" data-id="${p.id}">
      <span class="recite-all-status">${statusIcon}</span>
      <span class="recite-all-title">${p.title}</span>
      <span class="recite-all-author">${p.author}</span>
      <span class="recite-all-len">${p.length}字</span>
    </div>`;
  }).join('');

  return `<div class="page-enter">
    <div class="data-page-header">📝 背诵与默写</div>
    <a href="#/data" class="about-back">← 返回数据</a>
    ${summaryHtml}
    ${reciteHtml}
    ${dictateHtml}
    <div class="fold-section">
      <div class="fold-header" data-fold="all-passages">
        <span>📋 全部篇目</span>
        <span class="fold-badge">${PASSAGES.length}篇</span>
        <span class="fold-arrow">▾</span>
      </div>
      <div class="fold-body" id="fold-all-passages">
        <div class="fold-content"><div class="recite-all-list">${allPassagesHtml}</div></div>
      </div>
    </div>
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs);text-align:center">v0.131</p>
  </div>`;
}

// 自评弹窗
function showSelfRating(passageId, action) {
  const p = PASSAGES.find(x => x.id === passageId);
  if (!p) return;

  const modal = document.createElement('div');
  modal.className = 'recite-modal';
  modal.innerHTML = `<div class="recite-modal-backdrop"></div>
    <div class="recite-modal-content">
      <div class="recite-modal-header">${action === 'recite' ? '📖 背诵完成' : '✍️ 默写完成'} — ${p.title}</div>
      <div class="recite-modal-body">
        <div class="recite-modal-question">你觉得这次${action === 'recite' ? '背诵' : '默写'}得怎么样？</div>
        <div class="recite-rating-btns">
          <button class="recite-rating-btn" data-rating="1">😰<br>完全忘了</button>
          <button class="recite-rating-btn" data-rating="2">😕<br>大部分忘</button>
          <button class="recite-rating-btn" data-rating="3">😐<br>记住一半</button>
          <button class="recite-rating-btn" data-rating="4">😊<br>基本记住</button>
          <button class="recite-rating-btn" data-rating="5">🤩<br>完美默写</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('show'));

  const close = () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  };

  modal.querySelector('.recite-modal-backdrop').addEventListener('click', close);

  modal.querySelectorAll('.recite-rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rating = parseInt(btn.dataset.rating);
      handleRating(passageId, action, rating);
      close();
    });
  });
}

// 处理自评结果
function handleRating(passageId, action, rating) {
  const state = getState();
  if (!state[passageId]) state[passageId] = getPassageState(passageId);
  const ps = state[passageId];
  const today = new Date().toISOString().slice(0, 10);

  if (action === 'recite') {
    // 背诵完成 → 标记为已背诵
    ps.status = 'memorized';
    ps.memorizedAt = today;
    ps.halfLife = 1.0; // 初始半衰期1天
    ps.nextReviewAt = calcNextReview(ps.halfLife, today);
    ps.selfRatings.push({ date: today, rating, action: 'recite' });
  } else if (action === 'dictate') {
    // 默写完成 → 更新记忆曲线
    ps.dictateCount = (ps.dictateCount || 0) + 1;
    ps.lastDictateAt = today;
    ps.selfRatings.push({ date: today, rating, action: 'dictate' });

    // 根据自评修正半衰期
    ps.halfLife = updateHalfLife(ps.halfLife, rating);

    // 连续3次评分≥4 → 标记为已掌握
    const recent = ps.selfRatings.filter(r => r.action === 'dictate').slice(-3);
    if (recent.length >= 3 && recent.every(r => r.rating >= 4)) {
      ps.status = 'mastered';
    } else {
      ps.nextReviewAt = calcNextReview(ps.halfLife, today);
    }
  }

  state[passageId] = ps;
  saveState(state);

  // 记录为学习记录（计入XP）
  const p = PASSAGES.find(x => x.id === passageId);
  if (p) {
    const duration = action === 'recite' ? estimateReciteTime(p) : estimateDictateTime(p);
    EventBus.emit('record:added', {
      id: `recite-${Date.now()}`,
      timestamp: new Date().toISOString(),
      subject: 'chinese',
      textbook: '背诵默写',
      activityType: action === 'recite' ? 'recitation' : 'dictation',
      score: rating * 20, // 1-5 → 20-100
      duration,
      notes: `${action === 'recite' ? '背诵' : '默写'}: ${p.title} (自评${rating}/5)`,
    });
  }

  Toast.success(`${action === 'recite' ? '背诵' : '默写'}记录已保存！下次复习: ${ps.nextReviewAt || '已掌握'}`);
  window.location.reload();
}

// afterRender: 事件绑定
export function afterRender() {
  // 背诵/默写按钮
  const reciteBtns = document.querySelectorAll('.recite-btn');
  const onBtnClick = (e) => {
    const { id, action } = e.currentTarget.dataset;
    showSelfRating(id, action);
  };
  reciteBtns.forEach(b => b.addEventListener('click', onBtnClick));

  // 折叠面板
  const foldHeaders = document.querySelectorAll('.fold-header');
  const onFoldToggle = (e) => {
    const { fold: foldId } = e.currentTarget.dataset;
    const body = document.getElementById('fold-' + foldId);
    const arrow = e.currentTarget.querySelector('.fold-arrow');
    if (body) body.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
  };
  foldHeaders.forEach(h => h.addEventListener('click', onFoldToggle));

  // 全部篇目点击 → 打开自评
  const allItems = document.querySelectorAll('.recite-all-item');
  const onItemClick = (e) => {
    const id = e.currentTarget.dataset.id;
    const ps = getPassageState(id);
    if (ps.status === 'not_started') {
      showSelfRating(id, 'recite');
    } else {
      showSelfRating(id, 'dictate');
    }
  };
  allItems.forEach(i => i.addEventListener('click', onItemClick));

  return () => {
    reciteBtns.forEach(b => b.removeEventListener('click', onBtnClick));
    foldHeaders.forEach(h => h.removeEventListener('click', onFoldToggle));
    allItems.forEach(i => i.removeEventListener('click', onItemClick));
  };
}
