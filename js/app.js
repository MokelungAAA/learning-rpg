/* ================================================================
   app.js — 应用初始化 / 路由 / 事件绑定 / 页面渲染
   ================================================================ */

console.log('✅ app.js is loading...');

var _launched = false;

window._launchApp = function () {
  console.log('🚀 window._launchApp called!');
  if (_launched) return;
  _launched = true;

  try {
    var launchPage = document.getElementById('launchPage');
    var mainPage = document.getElementById('mainPage');
    if (launchPage) {
      launchPage.classList.add('hidden');
      console.log('✅ launchPage hidden');
    }
    if (mainPage) {
      mainPage.classList.add('visible');
      console.log('✅ mainPage visible');
    }
  } catch (e) {
    console.error('❌ Error in show/hide pages', e);
  }

  try {
    renderImmediateOverview();
    console.log('✅ renderImmediateOverview called');
  } catch (e) {
    console.error('❌ renderImmediateOverview error', e);
    renderFallbackOverview();
  }

  setTimeout(function () {
    initNavigation();
    loadAllData()
      .then(function () {
        console.log('✅ All data loaded');
        initPomodoroFab();
        initCommandPalette();
        renderAll();
        checkAchievements();
      })
      .catch(function (e) {
        console.error('❌ loadAllData error', e);
        renderAll();
      });
  }, 100);
};

console.log('✅ window._launchApp defined!');

/* ================================================================
   全局错误捕获
   ================================================================ */

window.addEventListener('error', function (e) {
  console.error('Global Error:', e.message, 'at', e.filename + ':' + e.lineno);
  try {
    showToast('系统遇到错误，已记录', 'error');
  } catch (ignore) {}
});

window.addEventListener('unhandledrejection', function (e) {
  console.error('Unhandled Promise:', e.reason);
  try {
    showToast('网络请求失败', 'error');
  } catch (ignore) {}
});

/* ================================================================
   数据加载
   ================================================================ */

function loadAllData() {
  var loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'dataLoadingOverlay';
  loadingOverlay.style.cssText = 'position:fixed;inset:0;z-index:8000;background:var(--md-background);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;';
  loadingOverlay.innerHTML = '<div class="loading-spinner"></div><div style="font-size:14px;color:var(--md-on-surface-variant)">加载数据中...</div>';
  document.body.appendChild(loadingOverlay);

  var done = false;
  function finish() {
    if (done) return;
    done = true;
    setTimeout(function () {
      try { if (loadingOverlay.parentNode) loadingOverlay.parentNode.removeChild(loadingOverlay); } catch (ignore) {}
    }, 400);
  }

  setTimeout(function () {
    if (!done) { console.warn('Data load timeout, using available data'); finish(); }
  }, 10000);

  return loadAppData()
    .then(function () { return loadUserProfile(); })
    .then(function () { return loadSkillTree(); })
    .then(function () { return loadTextbooks(); })
    .then(function () { return loadCourses(); })
    .then(function () { return loadAchievements(); })
    .then(function () {
      loadPomodoroSessions();
      loadReadingRecords();
      loadBookshelf();
      finish();
    })
    .catch(function (err) {
      console.warn('Data load error:', err);
      finish();
    });
}

/* ================================================================
   导航系统
   ================================================================ */

var currentPage = 'overview';

function initNavigation() {
  console.log('🔧 initNavigation');
  var desktopBtns = document.querySelectorAll('.dnav-btn');
  var bottomBtns = document.querySelectorAll('.bn-btn');

  desktopBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setActivePage(btn.dataset.page);
    });
  });

  bottomBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setActivePage(btn.dataset.page);
    });
  });

  var initialHash = window.location.hash.replace('#', '');
  if (initialHash && ['overview', 'skills', 'review', 'log', 'settings'].indexOf(initialHash) >= 0) {
    setActivePage(initialHash);
  } else {
    setActivePage('overview');
  }
}

function setActivePage(page) {
  console.log('🏠 setActivePage to', page);
  currentPage = page;

  var desktopBtns = document.querySelectorAll('.dnav-btn');
  var bottomBtns = document.querySelectorAll('.bn-btn');

  desktopBtns.forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
  bottomBtns.forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  var pages = document.querySelectorAll('.page-content');
  pages.forEach(function (p) {
    p.classList.toggle('active', p.id === 'page-' + page);
  });

  if (window.location.hash !== '#' + page) {
    window.location.hash = page;
  }

  onPageChange(page);
}

function onPageChange(page) {
  try {
    switch (page) {
      case 'overview':
        renderOverview();
        break;
      case 'skills':
        renderSkillTree();
        break;
      case 'review':
        renderReviewCenter();
        break;
      case 'log':
        renderLog();
        break;
      case 'settings':
        renderSettings();
        break;
    }
  } catch (e) {
    console.error('❌ onPageChange error', e);
    if (page === 'overview') {
      renderFallbackOverview();
    }
  }
}

/* ================================================================
   启动页初始化
   ================================================================ */

function initLaunchPage() {
  console.log('🔧 initLaunchPage');
  var launchBtn = document.getElementById('launchBtn');
  if (!launchBtn) {
    console.error('❌ #launchBtn not found');
    return;
  }
  console.log('✅ #launchBtn found');

  launchBtn.addEventListener('click', function (e) {
    console.log('👆 Launch button clicked');
    e.preventDefault();
    e.stopImmediatePropagation();
    window._launchApp();
  });

  animateLaunchProgress();
}

function animateLaunchProgress() {
  var fill = document.getElementById('launchProgressFill');
  var currentXp = document.getElementById('launchCurrentXp');
  var nextXp = document.getElementById('launchNextXp');
  if (!fill) return;

  var totalXp = 0;
  try {
    if (appData && appData.profile && appData.profile.totalXp) {
      totalXp = appData.profile.totalXp;
    } else {
      var localRaw = localStorage.getItem('lts-appData');
      if (localRaw) {
        var local = JSON.parse(localRaw);
        if (local && local.profile && local.profile.totalXp) {
          totalXp = local.profile.totalXp;
        }
      }
    }
  } catch (e) {}

  var level = Math.floor(Math.log(totalXp / 100 + 1) / Math.log(1.5)) + 1;
  if (totalXp < 100) level = 1;

  var currentLevelXp = Math.floor(100 * (Math.pow(1.5, level - 1) - 1));
  var nextLevelXp = Math.floor(100 * (Math.pow(1.5, level) - 1));
  var xpInLevel = totalXp - currentLevelXp;
  var xpNeeded = nextLevelXp - currentLevelXp;
  var percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  if (currentXp) currentXp.textContent = formatNumber(totalXp);
  if (nextXp) nextXp.textContent = formatNumber(nextLevelXp);

  setTimeout(function () {
    fill.style.width = percent + '%';
  }, 200);
}

/* ================================================================
   概览页面渲染
   ================================================================ */

function renderImmediateOverview() {
  var container = document.getElementById('page-overview');
  if (!container) return;
  var cached = null;
  try {
    var raw = localStorage.getItem('lts-appData');
    if (raw) cached = JSON.parse(raw);
  } catch (ignore) {}
  if (!cached) {
    try {
      var raw2 = localStorage.getItem('lts-cache-appData');
      if (raw2) {
        var entry = JSON.parse(raw2);
        cached = entry.data;
      }
    } catch (ignore) {}
  }
  var records = (cached && cached.records) || [];
  var profile = (cached && cached.profile) || { totalXp: 0 };
  var totalXp = profile.totalXp || 0;
  var todayKey = getTodayKey();
  var todayXP = 0;
  for (var i = 0; i < records.length; i++) {
    try {
      var ts = records[i].timestamp;
      if (ts && getDayKey(parseISO(ts)) === todayKey) {
        todayXP += records[i].xp || 0;
      }
    } catch (ignore) {}
  }
  var level = Math.floor(Math.log(totalXp / 100 + 1) / Math.log(1.5)) + 1;
  if (totalXp < 100) level = 1;
  var currentLevelXp = Math.floor(100 * (Math.pow(1.5, level - 1) - 1));
  var nextLevelXp = Math.floor(100 * (Math.pow(1.5, level) - 1));
  var xpInLevel = totalXp - currentLevelXp;
  var xpNeeded = nextLevelXp - currentLevelXp;
  var percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) || 0;

  var streakDays = calcStreakDays(records);
  var dayStatus = getDayStatus();

  var html = '<div class="overview-hero">';
  html += '<div class="hero-level-card">';
  html += '<div class="hero-level-value">Lv' + level + '</div>';
  html += '<div class="hero-level-title">' + getCharLevelTitle(level).cn + '</div>';
  html += '<div class="hero-level-jp">' + getCharLevelTitle(level).name + '</div>';
  html += '</div>';
  html += '<div class="stat-card"><div class="stat-card-icon">⚡</div><div class="stat-card-value" style="color:var(--color-success)">+' + todayXP + '</div><div class="stat-card-label">今日XP</div></div>';
  html += '<div class="stat-card"><div class="stat-card-icon">🔥</div><div class="stat-card-value" style="color:var(--color-warning)">' + streakDays + '天</div><div class="stat-card-label">连续学习</div></div>';
  html += '<div class="stat-card"><div class="stat-card-icon">' + dayStatus.icon + '</div><div class="stat-card-value" style="color:' + dayStatus.color + '">' + dayStatus.text + '</div><div class="stat-card-label">每日状态</div></div>';
  html += '<div class="stat-card"><div class="stat-card-icon">🏆</div><div class="stat-card-value">' + formatNumber(totalXp) + '</div><div class="stat-card-label">总XP</div></div>';
  html += '</div>';
  html += '<div class="total-progress">';
  html += '<div class="progress-header"><span class="progress-label">总等级进度</span><span class="progress-value">' + formatNumber(xpInLevel) + ' / ' + formatNumber(xpNeeded) + ' XP</span></div>';
  html += '<div class="progress-bar"><div class="progress-fill" style="width:' + percent + '%"></div></div>';
  html += '</div>';
  html += '<div class="section-title">📊 学科等级</div><div class="subject-grid">';
  var subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
  var icons = ['📐', '📖', '🔤', '⚡', '🧪', '🧬', '⚖️', '📜', '🌍'];
  for (var j = 0; j < subjects.length; j++) {
    var subjRecords = records.filter(function (r) {
      return r.subject === subjects[j];
    });
    var subjScore = 0;
    if (subjRecords.length > 0) {
      var avgScore = subjRecords.reduce(function (s, r) { return s + (r.score || 0); }, 0) / subjRecords.length;
      subjScore = Math.round(avgScore * 0.6 + Math.min(100, subjRecords.length * 5) * 0.4);
    }
    var slTitle = getLevelTitle(subjScore);
    var subjXP = subjRecords.length > 0 ? Math.round(subjRecords.reduce(function (s, r) { return s + (r.xp || 0); }, 0)) : 0;
    html += '<div class="subject-card" data-subject="' + subjects[j] + '">';
    html += '<div class="subject-card-icon">' + icons[j] + '</div>';
    html += '<div class="subject-card-name">' + subjects[j] + '</div>';
    html += '<div class="subject-card-level">' + slTitle.cn + '(' + slTitle.name + ')</div>';
    html += '<div class="subject-card-progress"><div class="progress-bar"><div class="progress-fill" style="width:' + subjScore + '%"></div></div></div>';
    html += '<div class="subject-card-meta"><span>⭐' + subjXP + 'XP</span><span>' + subjRecords.length + '条记录</span></div>';
    html += '</div>';
  }
  html += '</div>';
  try {
    container.innerHTML = html;
  } catch (e) {
    console.error(e);
  }
}

function renderOverview() {
  var container = document.getElementById('page-overview');
  if (!container) return;
  try {
    var totalXp = appData.profile ? (appData.profile.totalXp || 0) : 0;
    var todayXP = calcTodayXp();
    var streakDays = calcStreakDays(appData.records);
    var dayStatus = getDayStatus();
    var level = Math.floor(Math.log(totalXp / 100 + 1) / Math.log(1.5)) + 1;
    if (totalXp < 100) level = 1;
    var currentLevelXp = Math.floor(100 * (Math.pow(1.5, level - 1) - 1));
    var nextLevelXp = Math.floor(100 * (Math.pow(1.5, level) - 1));
    var xpInLevel = totalXp - currentLevelXp;
    var xpNeeded = nextLevelXp - currentLevelXp;
    var percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
    var levelTitle = getCharLevelTitle(level);

    var html = '<div class="overview-hero">';
    html += '<div class="hero-level-card">';
    html += '<div class="hero-level-value">Lv' + level + '</div>';
    html += '<div class="hero-level-title">' + levelTitle.cn + '</div>';
    html += '<div class="hero-level-jp">' + levelTitle.name + '</div>';
    html += '</div>';
    html += '<div class="stat-card"><div class="stat-card-icon">⚡</div><div class="stat-card-value" style="color:var(--color-success)">+' + todayXP + '</div><div class="stat-card-label">今日XP</div></div>';
    html += '<div class="stat-card"><div class="stat-card-icon">🔥</div><div class="stat-card-value" style="color:var(--color-warning)">' + streakDays + '天</div><div class="stat-card-label">连续学习</div></div>';
    html += '<div class="stat-card"><div class="stat-card-icon">' + dayStatus.icon + '</div><div class="stat-card-value" style="color:' + dayStatus.color + '">' + dayStatus.text + '</div><div class="stat-card-label">每日状态</div></div>';
    html += '<div class="stat-card"><div class="stat-card-icon">🏆</div><div class="stat-card-value">' + formatNumber(totalXp) + '</div><div class="stat-card-label">总XP</div></div>';
    html += '</div>';
    html += '<div class="total-progress">';
    html += '<div class="progress-header"><span class="progress-label">总等级进度</span><span class="progress-value">' + formatNumber(xpInLevel) + ' / ' + formatNumber(xpNeeded) + ' XP</span></div>';
    html += '<div class="progress-bar"><div class="progress-fill" style="width:' + percent + '%"></div></div>';
    html += '</div>';
    html += '<div class="section-title">📊 学科等级</div><div class="subject-grid">';
    var subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
    var icons = ['📐', '📖', '🔤', '⚡', '🧪', '🧬', '⚖️', '📜', '🌍'];
    for (var j = 0; j < subjects.length; j++) {
      var subjRecords = (appData.records || []).filter(function (r) {
        return r.subject === subjects[j];
      });
      var subjScore = 0;
      if (subjRecords.length > 0) {
        var avgScore = subjRecords.reduce(function (s, r) { return s + (r.score || 0); }, 0) / subjRecords.length;
        subjScore = Math.round(avgScore * 0.6 + Math.min(100, subjRecords.length * 5) * 0.4);
      }
      var slTitle = getLevelTitle(subjScore);
      var subjXP = subjRecords.length > 0 ? Math.round(subjRecords.reduce(function (s, r) { return s + (r.xp || 0); }, 0)) : 0;
      html += '<div class="subject-card" data-subject="' + subjects[j] + '">';
      html += '<div class="subject-card-icon">' + icons[j] + '</div>';
      html += '<div class="subject-card-name">' + subjects[j] + '</div>';
      html += '<div class="subject-card-level">' + slTitle.cn + '(' + slTitle.name + ')</div>';
      html += '<div class="subject-card-progress"><div class="progress-bar"><div class="progress-fill" style="width:' + subjScore + '%"></div></div></div>';
      html += '<div class="subject-card-meta"><span>⭐' + subjXP + 'XP</span><span>' + subjRecords.length + '条记录</span></div>';
      html += '</div>';
    }
    html += '</div>';
    html += buildOverviewFoldSections();
    container.innerHTML = html;
    bindFoldToggles();
  } catch (e) {
    console.error('❌ renderOverview failed', e);
    renderFallbackOverview();
  }
}

function renderFallbackOverview() {
  var container = document.getElementById('page-overview');
  if (!container) return;
  container.innerHTML = '<div style="padding:40px;text-align:center"><h2>📚 学习RPG</h2><p style="color:var(--md-on-surface-variant)">系统已启动，请添加数据</p></div>';
}

function buildOverviewFoldSections() {
  var html = '';

  // === 学习日历热力图 ===
  html += '<div class="fold-section">';
  html += '<div class="fold-header" data-fold="heatmap"><span>📅 学习日历 · 最近169天</span><span class="fold-arrow">▾</span></div>';
  html += '<div class="fold-body" id="fold-heatmap">';
  html += '<div style="padding:16px;overflow-x:auto"><div id="calendarHeatmap" style="display:flex;flex-wrap:wrap;gap:3px;min-height:120px"></div></div>';
  html += '</div></div>';

  // === 成就 ===
  var achievements = getUnlockedAchievements();
  if (achievements.length > 0) {
    html += '<div class="fold-section">';
    html += '<div class="fold-header" data-fold="achievements"><span>🏆 已解锁成就 (' + achievements.length + ')</span><span class="fold-arrow">▾</span></div>';
    html += '<div class="fold-body" id="fold-achievements">';
    html += '<div style="display:flex;gap:12px;padding:12px;flex-wrap:wrap">';
    for (var a = 0; a < Math.min(12, achievements.length); a++) {
      var ach = achievements[a];
      html += '<div style="text-align:center;padding:12px;background:var(--md-surface-container-low);border-radius:12px;min-width:80px">';
      html += '<div style="font-size:32px">' + (ach.icon || '🏆') + '</div>';
      html += '<div style="font-size:11px;margin-top:4px;color:var(--md-on-surface)">' + (ach.name || '成就') + '</div>';
      html += '<div style="font-size:10px;color:var(--md-on-surface-variant)">' + (ach.desc || '') + '</div>';
      html += '</div>';
    }
    if (achievements.length > 12) {
      html += '<div style="text-align:center;padding:12px;background:var(--md-surface-container-low);border-radius:12px;min-width:80px;display:flex;align-items:center;justify-content:center;color:var(--md-on-surface-variant);font-size:13px">+ 还有' + (achievements.length - 12) + '个</div>';
    }
    html += '</div></div></div>';
  } else {
    html += '<div class="fold-section">';
    html += '<div class="fold-header" data-fold="achievements"><span>🏆 成就</span><span class="fold-arrow">▾</span></div>';
    html += '<div class="fold-body" id="fold-achievements"><div class="empty-state"><div class="empty-state-icon">🏆</div><div class="empty-state-text">记录学习数据来解锁成就</div></div></div></div>';
  }

  // === 教材进度 ===
  if (appData.textbooks) {
    html += '<div class="fold-section">';
    html += '<div class="fold-header" data-fold="textbooks"><span>📖 教材进度</span><span class="fold-arrow">▾</span></div>';
    html += '<div class="fold-body" id="fold-textbooks">';
    html += '<div style="padding:12px"><select class="select" id="tbSubjectSelect" onchange="renderTextbookProgress()"><option value="">选择学科查看教材进度</option>';
    var subjs = ['数学','语文','英语','物理','化学','生物','政治','历史','地理'];
    for (var si = 0; si < subjs.length; si++) {
      html += '<option value="' + subjs[si] + '">' + (SUBJECT_ICONS[subjs[si]] || '') + ' ' + subjs[si] + '</option>';
    }
    html += '</select><div id="textbookProgressArea" style="margin-top:12px"></div></div>';
    html += '</div></div>';
  }

  // === 学习报告区域 ===
  html += '<div class="fold-section">';
  html += '<div class="fold-header" data-fold="report"><span>📊 学习报告</span><span class="fold-arrow">▾</span></div>';
  html += '<div class="fold-body" id="fold-report">';
  html += '<div style="padding:12px">';
  var records = appData.records || [];
  var totalMinutes = 0;
  for (var ri = 0; ri < records.length; ri++) { totalMinutes += records[ri].duration || 0; }
  var recordCount = records.length;
  var avgScore = recordCount > 0 ? Math.round(records.reduce(function(s,r){return s+(r.score||0);},0) / recordCount) : 0;
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">';
  html += '<div class="stat-card"><div class="stat-card-value">' + formatDuration(totalMinutes) + '</div><div class="stat-card-label">总学习时长</div></div>';
  html += '<div class="stat-card"><div class="stat-card-value">' + recordCount + '</div><div class="stat-card-label">总记录数</div></div>';
  html += '<div class="stat-card"><div class="stat-card-value">' + avgScore + '%</div><div class="stat-card-label">平均正确率</div></div>';
  html += '</div>';

  var subjectStats = {};
  for (var ri2 = 0; ri2 < records.length; ri2++) {
    var r = records[ri2];
    var s = r.subject || '未知';
    if (!subjectStats[s]) subjectStats[s] = { count: 0, xp: 0, minutes: 0 };
    subjectStats[s].count++;
    subjectStats[s].xp += r.xp || 0;
    subjectStats[s].minutes += r.duration || 0;
  }
  html += '<div style="margin-top:16px"><div style="font-weight:600;margin-bottom:8px;font-size:14px">各学科统计</div>';
  var statSubjects = Object.keys(subjectStats);
  for (var ss = 0; ss < statSubjects.length; ss++) {
    var sn = statSubjects[ss];
    var st = subjectStats[sn];
    html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--md-outline-variant);font-size:13px">';
    html += '<span>' + (SUBJECT_ICONS[sn]||'📚') + ' ' + sn + '</span>';
    html += '<span style="color:var(--md-on-surface-variant)">' + st.count + '次 · ⭐' + st.xp + 'XP · ' + formatDuration(st.minutes) + '</span>';
    html += '</div>';
  }
  html += '</div>';
  html += '</div></div></div>';

  return html;
}

function bindFoldToggles() {
  var headers = document.querySelectorAll('.fold-header');
  for (var i = 0; i < headers.length; i++) {
    headers[i].addEventListener('click', function () {
      var body = document.getElementById('fold-' + this.dataset.fold);
      var arrow = this.querySelector('.fold-arrow');
      if (!body) return;
      var isOpen = body.classList.contains('open');
      if (isOpen) {
        body.classList.remove('open');
        if (arrow) arrow.classList.remove('open');
      } else {
        body.classList.add('open');
        if (arrow) arrow.classList.add('open');
        var foldId = this.dataset.fold;
        if (foldId === 'heatmap') renderCalendarHeatmap();
        if (foldId === 'textbooks') renderTextbookProgress();
      }
    });
  }
}

function renderCalendarHeatmap() {
  var container = document.getElementById('calendarHeatmap');
  if (!container || container.children.length > 0) return;
  var days = 169;
  var records = appData.records || [];
  var xpByDay = {};
  var todayKey = getTodayKey();
  for (var i = 0; i < records.length; i++) {
    var key = getDayKey(parseISO(records[i].timestamp));
    xpByDay[key] = (xpByDay[key] || 0) + (records[i].xp || 0);
  }
  var now = new Date();
  for (var d = days - 1; d >= 0; d--) {
    var cell = document.createElement('div');
    var date = new Date(now);
    date.setDate(date.getDate() - d);
    var key = getDayKey(date);
    var xp = xpByDay[key] || 0;
    var intensity = 0;
    if (xp > 0) intensity = Math.min(4, Math.ceil(xp / 25));
    cell.style.cssText = 'width:12px;height:12px;border-radius:2px;background:var(--md-surface-container-highest)';
    if (intensity > 0) {
      var colors = ['', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
      cell.style.background = colors[intensity];
    }
    cell.title = key + ': ' + xp + 'XP';
    container.appendChild(cell);
  }
}

function renderTextbookProgress() {
  var area = document.getElementById('textbookProgressArea');
  var select = document.getElementById('tbSubjectSelect');
  if (!area || !select) return;
  var subject = select.value;
  if (!subject) { area.innerHTML = ''; return; }
  var key = NAME_TO_KEY[subject] || subject;
  var tb = appData.textbooks;
  if (!tb || !tb[key]) { area.innerHTML = '<div style="color:var(--md-on-surface-variant);padding:12px">暂无该学科教材数据</div>'; return; }
  var chapters = tb[key].chapters || tb[key] || [];
  if (!Array.isArray(chapters)) chapters = [];
  var html = '';
  for (var i = 0; i < chapters.length; i++) {
    var ch = chapters[i];
    html += '<div style="padding:8px 0;border-bottom:1px solid var(--md-outline-variant);font-size:13px;display:flex;justify-content:space-between;align-items:center">';
    html += '<span>' + (ch.name || ch.title || '第'+(i+1)+'章') + '</span>';
    html += '<span style="color:var(--md-on-surface-variant)">' + (ch.progress || ch.pages || '') + '</span>';
    html += '</div>';
  }
  area.innerHTML = html || '<div style="color:var(--md-on-surface-variant);padding:12px">暂无章节数据</div>';
}

/* ================================================================
   其他页面渲染
   ================================================================ */

function renderSkillTree() {
  var container = document.getElementById('page-skills');
  if (!container) return;

  var records = appData.records || [];
  var skillTree = appData.skillTree;
  var knowledgeStates = appData.knowledgeStates;

  if (Object.keys(knowledgeStates).length === 0 && records.length > 0) {
    buildKnowledgeStates(records, skillTree);
    knowledgeStates = appData.knowledgeStates;
  }

  var html = '<div class="section-title">🌳 技能树图谱</div>';
  html += '<div class="skill-tree-legend" style="margin-bottom:12px">';
  var temps = [
    { label: '炙热 80+', color: '#FF4500' },
    { label: '温热 60+', color: '#FF8C00' },
    { label: '温暖 40+', color: '#FFD700' },
    { label: '正常 20+', color: '#62A0EA' },
    { label: '微凉 1+', color: '#1A5FB4' },
    { label: '冻结 0', color: '#6B7280' }
  ];
  for (var ti = 0; ti < temps.length; ti++) {
    html += '<span><span class="legend-dot" style="background:' + temps[ti].color + '"></span>' + temps[ti].label + '</span>';
  }
  html += '</div>';

  html += '<div style="margin-bottom:12px"><select class="select" id="skillTreeSubject" onchange="renderSkillTree()" style="max-width:200px"><option value="">全部学科</option>';
  var subjects = ['数学','语文','英语','物理','化学','生物','政治','历史','地理'];
  for (var si = 0; si < subjects.length; si++) {
    html += '<option value="' + subjects[si] + '">' + (SUBJECT_ICONS[subjects[si]] || '') + ' ' + subjects[si] + '</option>';
  }
  html += '</select></div>';

  var filteredKps = Object.keys(knowledgeStates);
  var prevSel = document.getElementById('skillTreeSubject');
  var filterSubject = prevSel ? prevSel.value : '';
  if (filterSubject) {
    filteredKps = filteredKps.filter(function (k) {
      return knowledgeStates[k].subject === filterSubject;
    });
  }

  html += '<div class="skill-tree-container" id="skillTreeChart"></div>';
  html += '<div class="node-detail-panel" id="nodeDetailPanel"></div>';

  container.innerHTML = html;

  if (filteredKps.length === 0) {
    var chartDiv = document.getElementById('skillTreeChart');
    if (chartDiv) chartDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🌳</div><div class="empty-state-text">暂无知识点数据，请先添加学习记录</div></div>';
    return;
  }

  setTimeout(function () {
    renderSkillForceGraph(filteredKps, knowledgeStates);
  }, 100);
}

function renderSkillForceGraph(kpKeys, states) {
  var chartDom = document.getElementById('skillTreeChart');
  if (!chartDom) return;

  if (typeof echarts === 'undefined') {
    chartDom.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">ECharts 加载中...</div></div>';
    return;
  }

  var existing = echarts.getInstanceByDom(chartDom);
  if (existing) existing.dispose();

  var nodes = [];
  var edges = [];
  var kpMap = {};

  for (var i = 0; i < kpKeys.length; i++) {
    var key = kpKeys[i];
    var ks = states[key];
    var temp = calcTemp(ks.peakTemp, ks.lastStudy, ks.halfLife);
    var tl = getTempLevel(temp);
    var symbolSize = 12 + Math.min(28, (ks.totalXp || 0) / 10);
    kpMap[key] = i;
    nodes.push({
      id: key,
      name: ks.name || key,
      symbolSize: symbolSize,
      itemStyle: { color: tl.color },
      category: 0,
      temp: temp,
      tempLevel: tl.name,
      xp: ks.totalXp || 0,
      repetitions: ks.repetitions || 0,
      halfLife: ks.halfLife || 3.0,
      subject: ks.subject || ''
    });
  }

  // Limit edges: connect each node to at most 3 neighbors in same subject
  var maxNeighbors = 3;
  for (var i = 0; i < nodes.length; i++) {
    var count = 0;
    for (var j = i + 1; j < nodes.length && count < maxNeighbors; j++) {
      if (nodes[i].subject === nodes[j].subject && nodes[i].subject) {
        edges.push({ source: nodes[i].id, target: nodes[j].id });
        count++;
      }
    }
  }

  var myChart = echarts.init(chartDom);
  var option = {
    tooltip: {
      formatter: function (p) {
        if (p.dataType === 'node') {
          return '<b>' + p.data.name + '</b><br/>温度: ' + p.data.temp + '° (' + p.data.tempLevel + ')<br/>XP: ' + p.data.xp + '<br/>复习' + p.data.repetitions + '次 · 半衰期' + p.data.halfLife + '天';
        }
        return '';
      }
    },
    series: [{
      type: 'graph',
      layout: 'force',
      roam: true,
      draggable: true,
      force: { repulsion: 150, edgeLength: [80, 200], gravity: 0.05, layoutAnimation: false },
      data: nodes,
      edges: edges,
      lineStyle: { color: 'var(--md-outline-variant)', opacity: 0.3, curveness: 0.2 },
      emphasis: { focus: 'adjacency', lineStyle: { width: 2 } }
    }]
  };
  myChart.setOption(option);

  myChart.on('click', function (params) {
    if (params.dataType === 'node') {
      showNodeDetail(params.data, states);
    }
  });

  window.addEventListener('resize', function () { myChart.resize(); });
}

function showNodeDetail(nodeData, states) {
  var panel = document.getElementById('nodeDetailPanel');
  if (!panel) return;
  var tempLevel = getTempLevel(nodeData.temp);
  var html = '<div class="node-detail-header">';
  html += '<div><div class="node-detail-title">' + escapeHtml(nodeData.name) + '</div>';
  html += '<div class="node-detail-subtitle">' + (nodeData.subject || '') + '</div></div>';
  html += '<div class="node-detail-temp" style="color:' + tempLevel.color + '">' + tempLevel.icon + ' ' + nodeData.temp + '°</div>';
  html += '</div>';
  html += '<div class="node-detail-stats">';
  html += '<div class="node-stat"><div class="node-stat-value">' + tempLevel.name + '</div><div class="node-stat-label">温度等级</div></div>';
  html += '<div class="node-stat"><div class="node-stat-value">' + nodeData.repetitions + '</div><div class="node-stat-label">复习次数</div></div>';
  html += '<div class="node-stat"><div class="node-stat-value">' + nodeData.halfLife + '天</div><div class="node-stat-label">半衰期</div></div>';
  html += '<div class="node-stat"><div class="node-stat-value">⭐' + nodeData.xp + '</div><div class="node-stat-label">累计XP</div></div>';
  html += '</div>';
  panel.innerHTML = html;
  panel.classList.add('visible');
}

function renderReviewCenter() {
  var container = document.getElementById('page-review');
  if (!container) return;

  var knowledgeStates = appData.knowledgeStates;
  var records = appData.records || [];
  if (Object.keys(knowledgeStates).length === 0 && records.length > 0) {
    buildKnowledgeStates(records, appData.skillTree);
    knowledgeStates = appData.knowledgeStates;
  }

  var shadowQueue = calcShadowQueue(knowledgeStates);

  var html = '<div class="section-title">🔄 复习中心</div>';

  // === 遗忘曲线折叠区 ===
  html += '<div class="review-curve-section">';
  html += '<div class="review-section-toggle" onclick="this.parentElement.classList.toggle(\'expanded\')"><span>📉 遗忘曲线</span><span class="review-toggle-icon">▾</span></div>';
  html += '<div class="review-curve-body"><div class="skill-tree-container" id="forgettingCurveChart" style="height:250px"></div></div>';
  html += '</div>';

  // === 阴影队列 ===
  html += '<div class="shadow-queue-section" style="margin-top:16px">';
  html += '<div class="section-title">🌙 待复习知识点</div>';
  if (shadowQueue.length === 0) {
    html += '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">暂无待复习知识点</div></div>';
  } else {
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    for (var i = 0; i < Math.min(shadowQueue.length, 15); i++) {
      var item = shadowQueue[i];
      var tl = getTempLevel(item.temp);
      var urgencyColor = item.urgency > 0.5 ? 'var(--color-danger)' : item.urgency > 0.3 ? 'var(--color-warning)' : 'var(--color-info)';
      html += '<div class="shadow-item">';
      html += '<div class="shadow-item-header"><span class="shadow-item-name">' + escapeHtml(item.name) + '</span><span class="shadow-item-urgency" style="background:' + urgencyColor + '20;color:' + urgencyColor + '">' + tl.icon + ' ' + item.temp + '°</span></div>';
      html += '<div class="shadow-item-meta">上次复习: ' + item.daysSinceLast + '天前 · 半衰期: ' + item.halfLife + '天 · 考试权重: ' + Math.round(item.examWeight * 100) + '%</div>';
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div>';

  // === 智能推荐 ===
  if (shadowQueue.length > 0) {
    var reviewItems = shadowQueue.slice(0, 15).map(function (item) {
      return {
        name: item.name,
        cost: Math.max(5, Math.round((80 - item.temp) / 2)),
        benefit: Math.round(item.priority * 10)
      };
    });
    var budget = 60;
    var result = knapsackRecommend(reviewItems, budget);
    html += '<div style="margin-top:16px"><div class="section-title">🎯 智能复习推荐</div>';
    html += '<div class="glass-card"><div style="font-size:13px;margin-bottom:8px">📋 时间预算: <b>' + budget + '分钟</b> · 推荐复习 <b>' + result.items.length + '</b> 个知识点 · 预计收益: <b>' + result.totalBenefit + '</b></div>';
    if (result.items.length > 0) {
      for (var ri = 0; ri < result.items.length; ri++) {
        html += '<div style="padding:6px 0;border-bottom:1px solid var(--md-outline-variant);font-size:13px;display:flex;justify-content:space-between"><span>' + escapeHtml(result.items[ri].name) + '</span><span style="color:var(--md-on-surface-variant)">约' + result.items[ri].cost + '分钟</span></div>';
      }
    }
    html += '</div></div>';
  }

  container.innerHTML = html;

  // === 渲染遗忘曲线 ===
  setTimeout(function () {
    renderForgettingCurve(knowledgeStates);
  }, 100);
}

function renderForgettingCurve(states) {
  var chartDom = document.getElementById('forgettingCurveChart');
  if (!chartDom || typeof echarts === 'undefined') return;

  var existing = echarts.getInstanceByDom(chartDom);
  if (existing) existing.dispose();

  var now = Date.now();
  var decayPoints = [];
  for (var d = 0; d <= 14; d++) {
    var temp = 80 * Math.pow(2, -d / 3.0);
    decayPoints.push({ day: d, retention: Math.round(temp) });
  }

  var kps = Object.keys(states).slice(0, 10);
  var scatterData = [];
  for (var i = 0; i < kps.length; i++) {
    var ks = states[kps[i]];
    var temp = calcTemp(ks.peakTemp, ks.lastStudy, ks.halfLife);
    var daysSince = ks.lastStudy ? Math.round((now - new Date(ks.lastStudy).getTime()) / 86400000) : 0;
    if (daysSince <= 14) {
      scatterData.push([daysSince, temp, ks.name]);
    }
  }

  var myChart = echarts.init(chartDom);
  myChart.setOption({
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'value', name: '天数', min: 0, max: 14, nameTextStyle: { fontSize: 11 } },
    yAxis: { type: 'value', name: '保留率 %', min: 0, max: 100, nameTextStyle: { fontSize: 11 } },
    series: [
      {
        name: '理论遗忘曲线',
        type: 'line',
        data: decayPoints.map(function (p) { return [p.day, p.retention]; }),
        smooth: true,
        lineStyle: { color: '#3B82F6', width: 2 },
        itemStyle: { color: '#3B82F6' }
      },
      {
        name: '你的知识点',
        type: 'scatter',
        data: scatterData,
        symbolSize: 10,
        itemStyle: { color: '#EF4444' }
      }
    ],
    tooltip: {
      formatter: function (p) {
        if (p.seriesIndex === 1) { return p.data[2] + '<br/>天数: ' + p.data[0] + '<br/>保留率: ' + p.data[1] + '%'; }
        return '天数: ' + p.data[0] + '<br/>理论保留率: ' + p.data[1] + '%';
      }
    }
  });
  window.addEventListener('resize', function () { myChart.resize(); });
}

var logPage = 1;
var logRecordsPerPage = 10;
var logFilterSubject = '';

function renderLog() {
  var container = document.getElementById('page-log');
  if (!container) return;

  var allRecords = (appData.records || []).slice(0).reverse();

  // 筛选
  if (logFilterSubject) {
    allRecords = allRecords.filter(function (r) { return r.subject === logFilterSubject; });
  }

  // 分页
  var totalPages = Math.ceil(allRecords.length / logRecordsPerPage) || 1;
  if (logPage > totalPages) logPage = totalPages;
  var start = (logPage - 1) * logRecordsPerPage;
  var pageRecords = allRecords.slice(start, start + logRecordsPerPage);

  var html = '<div style="padding:20px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div class="section-title" style="margin-bottom:0">📋 学习日志</div><button class="btn btn-primary btn-sm" onclick="window._openDataEntryModal()">+ 新增记录</button></div>';

  // 筛选器
  html += '<div class="log-controls" style="margin-bottom:12px">';
  html += '<select class="select" id="logSubjectFilter" onchange="logFilterSubject=this.value;logPage=1;renderLog()" style="max-width:150px"><option value="">全部学科</option>';
  var subjects = ['数学','语文','英语','物理','化学','生物','政治','历史','地理'];
  for (var si = 0; si < subjects.length; si++) {
    html += '<option value="' + subjects[si] + '"' + (logFilterSubject === subjects[si] ? ' selected' : '') + '>' + (SUBJECT_ICONS[subjects[si]] || '') + ' ' + subjects[si] + '</option>';
  }
  html += '</select>';
  html += '</div>';

  html += '<div style="font-size:12px;color:var(--md-on-surface-variant);margin-bottom:12px">共 ' + allRecords.length + ' 条记录</div>';

  if (pageRecords.length === 0) {
    html += '<div style="text-align:center;padding:40px;color:var(--md-on-surface-variant)">暂无记录</div>';
  } else {
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    for (var i = 0; i < pageRecords.length; i++) {
      var r = pageRecords[i];
      html += '<div class="log-item">';
      html += '<div class="log-item-header"><span class="log-item-subject">' + (SUBJECT_ICONS[r.subject] || '📚') + ' ' + (r.subject || '未知学科') + '</span><span class="log-item-xp">+' + (r.xp || 0) + 'XP</span></div>';
      html += '<div class="log-item-detail">' + formatDate(r.timestamp) + ' · ' + (r.duration || 0) + '分钟 · 得分' + (r.score || 0) + '/100';
      if (r.activityType) html += ' · ' + r.activityType;
      if (r.knowledgePoints && r.knowledgePoints.length > 0) html += ' · ' + r.knowledgePoints.join(', ');
      html += '</div>';
      html += '<div class="log-item-actions"><button class="btn btn-ghost btn-sm" onclick="window._editRecord(\'' + r.id + '\')">✏️ 编辑</button><button class="btn btn-ghost btn-sm" style="color:var(--color-danger)" onclick="window._deleteRecord(\'' + r.id + '\')">🗑 删除</button></div>';
      html += '</div>';
    }
    html += '</div>';

    if (totalPages > 1) {
      html += '<div class="pagination">';
      html += '<button class="pagination-btn"' + (logPage <= 1 ? ' disabled' : '') + ' onclick="logPage--;renderLog()">← 上一页</button>';
      html += '<span class="pagination-info">' + logPage + ' / ' + totalPages + '</span>';
      html += '<button class="pagination-btn"' + (logPage >= totalPages ? ' disabled' : '') + ' onclick="logPage++;renderLog()">下一页 →</button>';
      html += '</div>';
    }
  }
  html += '</div>';
  container.innerHTML = html;
}

function renderSettings() {
  var container = document.getElementById('page-settings');
  if (!container) return;
  var html = '<div class="section-title">⚙️ 更多</div><div class="settings-list">';
  html += '<div class="settings-item" onclick="window._openDataEntryModal()"><div class="settings-item-left"><div class="settings-item-icon">📝</div><div><div class="settings-item-name">新增学习记录</div><div class="settings-item-desc">记录学习数据，获得XP</div></div></div><div class="settings-item-arrow">→</div></div>';
  html += '<div class="settings-item" onclick="window._openReadingModal()"><div class="settings-item-left"><div class="settings-item-icon">📖</div><div><div class="settings-item-name">阅读记录</div><div class="settings-item-desc">管理阅读记录</div></div></div><div class="settings-item-arrow">→</div></div>';
  html += '<div class="settings-item" onclick="window._openPomodoroHistory()"><div class="settings-item-left"><div class="settings-item-icon">🍅</div><div><div class="settings-item-name">番茄钟历史</div><div class="settings-item-desc">查看专注记录</div></div></div><div class="settings-item-arrow">→</div></div>';
  html += '<div class="settings-item" onclick="exportAllData()"><div class="settings-item-left"><div class="settings-item-icon">📥</div><div><div class="settings-item-name">导出数据</div><div class="settings-item-desc">导出完整JSON备份</div></div></div><div class="settings-item-arrow">→</div></div>';
  html += '<div class="settings-item" onclick="toggleTheme()"><div class="settings-item-left"><div class="settings-item-icon">🌓</div><div><div class="settings-item-name">切换主题</div><div class="settings-item-desc">浅色/深色模式</div></div></div><div class="settings-item-arrow">→</div></div>';
  html += '<div class="settings-item" onclick="showAbout()"><div class="settings-item-left"><div class="settings-item-icon">📋</div><div><div class="settings-item-name">关于本系统</div><div class="settings-item-desc">学习RPG v3.0</div></div></div><div class="settings-item-arrow">→</div></div>';
  html += '</div>';
  container.innerHTML = html;
}

function renderAll() {
  try {
    renderOverview();
  } catch (e) {
    console.error(e);
  }
}

/* ================================================================
   番茄钟系统（侧边栏模式，移动端全屏）
   ================================================================ */

var pomodoroTimerInterval = null;
var pomodoroRemaining = 0;
var pomodoroTotal = 0;
var pomodoroMode = 'standard';
var pomodoroSubject = '';
var pomodoroSkill = '';
var pomodoroKPs = '';
var pomodoroPaused = false;
var pomodoroPhase = 'config'; // config | running | done

var _fabLongPressed = false;

function initPomodoroFab() {
  var fab = document.getElementById('pomodoroFab');
  if (!fab) return;
  fab.style.touchAction = 'manipulation';

  fab.addEventListener('click', function (e) {
    if (_fabLongPressed) { _fabLongPressed = false; return; }
    if (pomodoroPhase === 'running') {
      openPomodoro();
    } else {
      pomodoroPhase = 'config';
      pomodoroMode = 'standard';
      pomodoroSubject = '';
      pomodoroSkill = '';
      pomodoroKPs = '';
      openPomodoro();
      renderPomodoroConfig();
    }
  });

  var longPressTimer;
  fab.addEventListener('touchstart', function (e) {
    e.preventDefault();
    _fabLongPressed = false;
    longPressTimer = setTimeout(function () {
      _fabLongPressed = true;
      if (pomodoroPhase !== 'running') {
        pomodoroMode = 'standard';
        pomodoroSubject = '';
        openPomodoro();
        startPomodoroTimer(25);
      }
    }, 500);
  }, { passive: false });

  fab.addEventListener('touchend', function () { clearTimeout(longPressTimer); });
  fab.addEventListener('touchcancel', function () { clearTimeout(longPressTimer); });
}

function openPomodoro() {
  var panel = document.getElementById('pomodoroPanel');
  var backdrop = document.getElementById('pomodoroBackdrop');
  if (panel) panel.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
  try { document.body.style.overflow = 'hidden'; } catch (e) {}
}

function closePomodoro() {
  if (pomodoroPhase === 'running') {
    showToast('番茄钟进行中，请先暂停或结束', 'warning');
    return;
  }
  var panel = document.getElementById('pomodoroPanel');
  var backdrop = document.getElementById('pomodoroBackdrop');
  if (panel) panel.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
  try { document.body.style.overflow = ''; } catch (e) {}
  pomodoroPhase = 'config';
  pomodoroPaused = false;
}

function renderPomodoroConfig() {
  var body = document.getElementById('pomodoroBody');
  if (!body) return;
  var sessions = appData.pomodoroSessions || [];
  var todayDone = sessions.filter(function (s) { return isSameDay(new Date(), parseISO(s.startTime)); }).length;

  var modes = [
    { key: 'standard', time: 25, label: '标准番茄', color: '#EF4444' },
    { key: 'break', time: 5, label: '短休息', color: '#10B981' },
    { key: 'sprint', time: 15, label: '长专注', color: '#F59E0B' }
  ];

  var html = '';
  html += '<div style="font-size:13px;color:var(--md-on-surface-variant);margin-bottom:4px">今日已完成 ' + todayDone + ' 个番茄</div>';

  html += '<div class="pom-mode-btns">';
  for (var i = 0; i < modes.length; i++) {
    html += '<button class="pom-mode-btn' + (pomodoroMode === modes[i].key ? ' selected' : '') + '" onclick="selectPomMode(\'' + modes[i].key + '\')" style="' + (pomodoroMode === modes[i].key ? 'border-color:' + modes[i].color + ';background:' + modes[i].color + '15' : '') + '">';
    html += '<div class="pom-mode-time" style="' + (pomodoroMode === modes[i].key ? 'color:' + modes[i].color : '') + '">' + modes[i].time + '分钟</div>';
    html += '<div class="pom-mode-label">' + modes[i].label + '</div>';
    html += '</button>';
  }
  html += '</div>';

  html += '<div class="pom-config">';
  html += '<select class="select" id="pomSubjectSelect"><option value="">选择学科（可选）</option>';
  var subjects = ['数学','语文','英语','物理','化学','生物','政治','历史','地理'];
  for (var s = 0; s < subjects.length; s++) {
    html += '<option value="' + subjects[s] + '"' + (pomodoroSubject === subjects[s] ? ' selected' : '') + '>' + (SUBJECT_ICONS[subjects[s]] || '') + ' ' + subjects[s] + '</option>';
  }
  html += '</select>';
  html += '<input class="input" id="pomKPInput" placeholder="知识点（可选，如：函数单调性）" value="' + escapeHtml(pomodoroKPs) + '">';
  html += '</div>';

  html += '<button class="btn btn-primary btn-lg" onclick="startPomodoroFromConfig()" style="width:100%;min-height:52px;font-size:18px;font-weight:700">▶ 开始专注</button>';

  body.innerHTML = html;
}

function selectPomMode(mode) {
  pomodoroMode = mode;
  renderPomodoroConfig();
}

function startPomodoroFromConfig() {
  var subjEl = document.getElementById('pomSubjectSelect');
  var kpEl = document.getElementById('pomKPInput');
  pomodoroSubject = subjEl ? subjEl.value : '';
  pomodoroKPs = kpEl ? kpEl.value.trim() : '';

  var mins = pomodoroMode === 'standard' ? 25 : pomodoroMode === 'sprint' ? 15 : 5;
  startPomodoroTimer(mins);
}

function startPomodoroTimer(minutes) {
  if (pomodoroTimerInterval) clearInterval(pomodoroTimerInterval);
  pomodoroTotal = minutes * 60;
  pomodoroRemaining = pomodoroTotal;
  pomodoroPaused = false;
  pomodoroPhase = 'running';

  renderPomodoroRunning();

  pomodoroTimerInterval = setInterval(function () {
    if (pomodoroPaused) return;
    pomodoroRemaining--;
    updatePomodoroDisplay();
    if (pomodoroRemaining <= 0) {
      clearInterval(pomodoroTimerInterval);
      pomodoroTimerInterval = null;
      pomodoroPhase = 'done';
      renderPomodoroDone();
    }
  }, 1000);

  updateFabRunning();
}

function renderPomodoroRunning() {
  var body = document.getElementById('pomodoroBody');
  if (!body) return;

  var modeLabel = pomodoroMode === 'standard' ? '标准番茄' : pomodoroMode === 'sprint' ? '长专注' : '短休息';
  var circumference = 2 * Math.PI * 95;
  var html = '';
  html += '<div class="pom-timer-ring">';
  html += '<svg viewBox="0 0 200 200" width="220" height="220">';
  html += '<circle class="pom-timer-bg" cx="100" cy="100" r="95"></circle>';
  html += '<circle class="pom-timer-progress" id="pomTimerCircle" cx="100" cy="100" r="95" stroke-dasharray="' + circumference + '" stroke-dashoffset="0"></circle>';
  html += '</svg>';
  html += '<div class="pom-timer-text">';
  html += '<div class="pom-timer-time" id="pomTimerTime">' + formatPomTime(pomodoroRemaining) + '</div>';
  html += '<div class="pom-timer-label" id="pomTimerLabel">' + (pomodoroSubject || modeLabel) + '</div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="pom-actions">';
  html += '<button class="btn btn-outline btn-lg" id="pomPauseBtn" onclick="togglePomodoroPause()" style="flex:1;min-height:48px;font-size:16px">⏸ 暂停</button>';
  html += '<button class="btn btn-danger btn-lg" onclick="endPomodoroEarly()" style="flex:1;min-height:48px;font-size:16px">⏹ 结束</button>';
  html += '</div>';

  html += '<div style="display:flex;gap:8px;width:100%">';
  html += '<button class="btn btn-ghost btn-sm" onclick="adjustPomTime(-60)" style="flex:1">−1分钟</button>';
  html += '<button class="btn btn-ghost btn-sm" onclick="adjustPomTime(60)" style="flex:1">+1分钟</button>';
  html += '</div>';

  body.innerHTML = html;
}

function adjustPomTime(secs) {
  pomodoroRemaining = Math.max(0, pomodoroRemaining + secs);
  if (pomodoroRemaining > pomodoroTotal) pomodoroTotal = pomodoroRemaining;
  updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
  var timeEl = document.getElementById('pomTimerTime');
  var circle = document.getElementById('pomTimerCircle');
  if (timeEl) timeEl.textContent = formatPomTime(pomodoroRemaining);

  if (circle) {
    var circumference = 2 * Math.PI * 95;
    var progress = 1 - pomodoroRemaining / pomodoroTotal;
    circle.setAttribute('stroke-dashoffset', (circumference * progress).toFixed(1));
  }

  updateFabRunning();
}

function formatPomTime(secs) {
  var m = Math.floor(secs / 60);
  var s = secs % 60;
  return padZero(m) + ':' + padZero(s);
}

function togglePomodoroPause() {
  pomodoroPaused = !pomodoroPaused;
  var btn = document.getElementById('pomPauseBtn');
  if (btn) btn.textContent = pomodoroPaused ? '▶ 继续' : '⏸ 暂停';
}

function endPomodoroEarly() {
  clearInterval(pomodoroTimerInterval);
  pomodoroTimerInterval = null;
  pomodoroPhase = 'done';
  renderPomodoroDone();
}

function updateFabRunning() {
  var fab = document.getElementById('pomodoroFab');
  if (!fab) return;
  fab.style.animation = 'none';
  var mins = Math.floor(pomodoroRemaining / 60);
  var secs = pomodoroRemaining % 60;
  fab.title = '番茄钟 ' + padZero(mins) + ':' + padZero(secs);
  fab.innerHTML = '<svg viewBox="0 0 48 48" width="28" height="28"><circle cx="24" cy="24" r="20" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="3"/><circle cx="24" cy="24" r="20" fill="none" stroke="var(--md-primary)" stroke-width="3" stroke-dasharray="125.6" stroke-dashoffset="' + (125.6 * (pomodoroRemaining / pomodoroTotal)).toFixed(1) + '" stroke-linecap="round" transform="rotate(-90 24 24)"/></svg>';
}

function renderPomodoroDone() {
  var body = document.getElementById('pomodoroBody');
  if (!body) return;

  var fab = document.getElementById('pomodoroFab');
  if (fab) { fab.style.animation = ''; fab.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 2a9 9 0 00-9 9v1a1 1 0 002 0v-1a7 7 0 1114 0v1a1 1 0 002 0v-1a9 9 0 00-9-9z"/><path d="M12 6a1 1 0 00-1 1v5.586l-2.293 2.293a1 1 0 101.414 1.414l2.586-2.586A1 1 0 0013 13V7a1 1 0 00-1-1z"/></svg>'; }

  var minutes = Math.round(pomodoroTotal / 60);
  var completed = pomodoroRemaining <= 0;
  var focusScore = completed ? 90 + Math.floor(Math.random() * 10) : Math.round((1 - pomodoroRemaining / pomodoroTotal) * 80);

  var session = {
    sessionId: uuid(),
    startTime: toLocalISO(),
    plannedDuration: minutes,
    completed: completed,
    context: { subject: pomodoroSubject, skill: pomodoroSkill, kp: pomodoroKPs },
    focusScore: focusScore
  };
  savePomodoroSession(session);

  var xpEarned = 0;
  if (completed && pomodoroMode !== 'break') {
    var record = {
      id: uuid(),
      timestamp: toLocalISO(),
      subject: pomodoroSubject || '未指定',
      knowledgePoints: pomodoroKPs ? pomodoroKPs.split(/[,，、\s]+/).filter(function(s){return s.length>0;}) : [],
      duration: minutes,
      activityType: 'practice',
      score: focusScore,
      source: 'pomodoro',
      xp: calcBaseXP(focusScore, minutes)
    };
    appData.records.push(record);
    if (appData.profile) appData.profile.totalXp = (appData.profile.totalXp || 0) + record.xp;
    xpEarned = record.xp;
    saveAppData();
  }

  var html = '<div class="pom-celebration">';
  html += '<div class="pom-celebration-icon">' + (completed ? '🎉' : '⏹') + '</div>';
  html += '<div class="pom-celebration-title">' + (completed ? '番茄钟完成！' : '番茄钟已结束') + '</div>';
  html += '<div class="pom-celebration-detail">';
  html += minutes + '分钟 ' + (pomodoroMode === 'break' ? '休息' : '专注') + '<br>';
  if (pomodoroSubject) html += '学科: ' + pomodoroSubject + '<br>';
  html += '专注评分: ' + focusScore + '%';
  if (xpEarned > 0) html += '<br><span style="color:var(--color-success);font-weight:700">+' + xpEarned + ' XP</span>';
  html += '</div>';
  html += '<div class="pom-actions" style="margin-top:8px">';
  if (completed && pomodoroMode !== 'break') html += '<button class="btn btn-primary" onclick="resetPomodoro()">🔄 再来一个</button>';
  html += '<button class="btn btn-ghost" onclick="closePomodoro()">关闭</button>';
  html += '</div>';
  html += '</div>';

  body.innerHTML = html;

  if (completed && xpEarned > 0) {
    setTimeout(function () {
      showToast('✅ +' + xpEarned + ' XP', 'success');
      renderOverview();
      checkAchievements();
    }, 500);
  }
}

function resetPomodoro() {
  pomodoroPhase = 'config';
  pomodoroMode = 'standard';
  pomodoroSubject = '';
  pomodoroKPs = '';
  pomodoroPaused = false;
  try { document.body.style.overflow = ''; } catch (e) {}
  renderPomodoroConfig();
}

/* ================================================================
   模态框系统
   ================================================================ */

function openModal(html) {
  var overlay = document.getElementById('modalOverlay');
  var container = document.getElementById('modalContainer');
  if (!overlay || !container) return;
  container.innerHTML = html;
  overlay.classList.add('active');
  container.classList.add('active');
}

function closeModal() {
  var overlay = document.getElementById('modalOverlay');
  var container = document.getElementById('modalContainer');
  if (overlay) overlay.classList.remove('active');
  if (container) {
    container.classList.remove('active');
    container.innerHTML = '';
  }
}

document.addEventListener('click', function (e) {
  if (e.target.id === 'modalOverlay') {
    closeModal();
  }
});

/* ================================================================
   阅读记录系统
   ================================================================ */

window._openReadingModal = function () {
  var html = '<div class="glass-card" style="width:380px;max-width:90vw;max-height:80vh;overflow-y:auto;padding:24px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="font-size:18px">📖 添加阅读记录</h3><button class="btn-icon" onclick="closeModal()" style="background:transparent;border:none;font-size:20px;cursor:pointer">✕</button></div>';
  html += '<div style="margin-bottom:12px"><label class="label label-required">书名</label><input class="input" id="readingTitle" placeholder="输入书名"></div>';
  html += '<div style="margin-bottom:12px"><label class="label">作者</label><input class="input" id="readingAuthor" placeholder="作者名"></div>';
  html += '<div style="margin-bottom:12px"><label class="label">分类</label><select class="select" id="readingCategory"><option value="">选择分类</option>';
  var cats = ['文学小说', '历史', '哲学', '科普/科学', '技术/编程', '心理学', '其他'];
  for (var i = 0; i < cats.length; i++) {
    html += '<option value="' + cats[i] + '">' + cats[i] + '</option>';
  }
  html += '</select></div>';
  html += '<div style="display:flex;gap:8px;margin-bottom:12px"><div style="flex:1"><label class="label">阅读时长(分钟)</label><input class="input" id="readingDuration" type="number" min="1" placeholder="分钟"></div></div>';
  html += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px"><button class="btn btn-ghost" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="window._saveReading()">保存</button></div>';
  html += '</div>';
  openModal(html);
};

window._saveReading = function () {
  var titleEl = document.getElementById('readingTitle');
  var title = titleEl ? titleEl.value.trim() : '';
  if (!title) {
    showToast('请输入书名', 'error');
    return;
  }
  var durationEl = document.getElementById('readingDuration');
  var duration = parseInt(durationEl ? durationEl.value : 0) || 0;
  if (duration <= 0) {
    showToast('请输入时长', 'error');
    return;
  }
  var categoryEl = document.getElementById('readingCategory');
  var record = {
    recordId: uuid(),
    timestamp: toLocalISO(),
    bookTitle: title,
    author: document.getElementById('readingAuthor') ? document.getElementById('readingAuthor').value.trim() : '',
    category: categoryEl ? categoryEl.value : '',
    format: 'paper',
    durationMinutes: duration,
    notes: ''
  };
  saveReadingRecord(record);
  closeModal();
  showToast('阅读记录已保存', 'success');
};
window._openPomodoroHistory = function () {
  var sessions = (appData.pomodoroSessions || []).slice(0).reverse();
  var html = '<div class="glass-card" style="width:400px;max-width:92vw;max-height:80vh;overflow-y:auto;padding:24px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="font-size:18px">🍅 番茄钟历史</h3><button class="btn-icon" onclick="closeModal()" style="background:transparent;border:none;font-size:20px;cursor:pointer;color:var(--md-on-surface-variant)">✕</button></div>';
  if (sessions.length === 0) {
    html += '<div class="empty-state"><div class="empty-state-icon">🍅</div><div class="empty-state-text">暂无番茄钟记录</div></div>';
  } else {
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i];
      html += '<div style="padding:10px;background:var(--md-surface-container-low);border-radius:8px;border:1px solid var(--md-outline-variant);font-size:13px;position:relative">';
      html += '<div style="display:flex;justify-content:space-between"><span>' + (s.completed ? '✅' : '⏹') + ' ' + (s.plannedDuration || 0) + '分钟</span><span style="color:var(--md-on-surface-variant)">' + formatDate(s.startTime) + '</span></div>';
      if (s.context && s.context.subject) html += '<div style="color:var(--md-on-surface-variant);margin-top:4px">学科: ' + s.context.subject + '</div>';
      html += '<button onclick="event.stopPropagation();if(confirm(\'确定删除这条番茄钟记录？\')){deletePomodoroSession(\'' + s.sessionId + '\');closeModal();showToast(\'已删除\',\'success\')}" style="position:absolute;top:8px;right:8px;background:none;border:none;font-size:16px;cursor:pointer;color:var(--md-on-surface-variant);padding:4px 8px;line-height:1">🗑</button>';
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  openModal(html);
};

/* ================================================================
   数据录入弹窗
   ================================================================ */

window._openDataEntryModal = function () {
  var html = '<div class="glass-card" style="width:400px;max-width:92vw;max-height:85vh;overflow-y:auto;padding:24px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="font-size:18px">📝 新增学习记录</h3><button class="btn-icon" onclick="closeModal()" style="background:transparent;border:none;font-size:20px;cursor:pointer;color:var(--md-on-surface-variant)">✕</button></div>';
  html += '<div style="margin-bottom:12px"><label class="label label-required">学科</label><select class="select" id="entrySubject"><option value="">选择学科</option>';
  var subjects = ['数学','语文','英语','物理','化学','生物','政治','历史','地理'];
  for (var i = 0; i < subjects.length; i++) {
    html += '<option value="' + subjects[i] + '">' + (SUBJECT_ICONS[subjects[i]] || '') + ' ' + subjects[i] + '</option>';
  }
  html += '</select></div>';
  html += '<div style="margin-bottom:12px"><label class="label">知识点</label><input class="input" id="entryKPs" placeholder="多个知识点用逗号分隔，如：函数单调性,函数奇偶性"></div>';
  html += '<div style="margin-bottom:12px"><label class="label">活动类型</label><select class="select" id="entryActivity"><option value="practice">做题练习</option><option value="exam">考试/测验</option><option value="lecture">听课/网课</option><option value="review">复习</option><option value="recitation">背诵/默写</option><option value="reflection">考试反思</option><option value="other">其他</option></select></div>';
  html += '<div style="display:flex;gap:8px;margin-bottom:12px"><div style="flex:1"><label class="label label-required">得分</label><input class="input" id="entryScore" type="number" min="0" max="100" placeholder="0-100"></div><div style="flex:1"><label class="label label-required">学习时长(分钟)</label><input class="input" id="entryDuration" type="number" min="1" placeholder="分钟"></div></div>';
  html += '<div style="display:flex;gap:8px;margin-bottom:12px"><div style="flex:1"><label class="label">做题时长(分钟)</label><input class="input" id="entryPracticeDuration" type="number" min="0" placeholder="自动推断"></div><div style="flex:1"><label class="label">订正时长(分钟)</label><input class="input" id="entryReviewDuration" type="number" min="0" placeholder="自动推断"></div></div>';
  html += '<div style="margin-bottom:16px"><label class="label">备注</label><textarea class="input" id="entryNotes" rows="2" placeholder="可选备注..."></textarea></div>';
  html += '<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-ghost" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="window._saveRecord()">保存记录</button></div>';
  html += '</div>';
  openModal(html);
};

window._saveRecord = function () {
  var subjectEl = document.getElementById('entrySubject');
  var scoreEl = document.getElementById('entryScore');
  var durationEl = document.getElementById('entryDuration');
  var subject = subjectEl ? subjectEl.value : '';
  var score = parseInt(scoreEl ? scoreEl.value : 0) || 0;
  var duration = parseInt(durationEl ? durationEl.value : 0) || 0;
  if (!subject) { showToast('请选择学科', 'error'); return; }
  if (score < 0 || score > 100) { showToast('得分应在0-100之间', 'error'); return; }
  if (duration <= 0) { showToast('请输入学习时长', 'error'); return; }

  var kpEl = document.getElementById('entryKPs');
  var kpsRaw = kpEl ? kpEl.value.trim() : '';
  var knowledgePoints = kpsRaw ? kpsRaw.split(/[,，、\s]+/).filter(function(s){return s.length>0;}) : [];

  var activityEl = document.getElementById('entryActivity');
  var activityType = activityEl ? activityEl.value : 'practice';

  var practiceDurEl = document.getElementById('entryPracticeDuration');
  var reviewDurEl = document.getElementById('entryReviewDuration');
  var practiceDuration = parseInt(practiceDurEl ? practiceDurEl.value : 0) || Math.round(duration * 0.8);
  var reviewDuration = parseInt(reviewDurEl ? reviewDurEl.value : 0) || (duration - practiceDuration);

  var notesEl = document.getElementById('entryNotes');
  var notes = notesEl ? notesEl.value.trim() : '';

  var record = {
    id: uuid(),
    timestamp: toLocalISO(),
    subject: subject,
    knowledgePoints: knowledgePoints,
    activityType: activityType,
    score: score,
    duration: duration,
    practiceDuration: practiceDuration,
    reviewDuration: reviewDuration,
    totalQuestions: 0,
    correctCount: 0,
    source: 'web',
    notes: notes
  };
  record.xp = calcBaseXP(score, duration);

  appData.records.push(record);
  if (appData.profile) {
    appData.profile.totalXp = (appData.profile.totalXp || 0) + record.xp;
    appData.profile.totalStudyMinutes = (appData.profile.totalStudyMinutes || 0) + duration;
  }
  buildKnowledgeStates(appData.records, appData.skillTree);
  updateUserProfile();
  saveAppData();
  closeModal();
  showToast('✅ +' + record.xp + ' XP', 'success');
  setTimeout(function () {
    renderOverview();
    checkAchievements();
  }, 300);
};

window._deleteRecord = function (id) {
  var idx = -1;
  for (var i = 0; i < appData.records.length; i++) {
    if (appData.records[i].id === id) { idx = i; break; }
  }
  if (idx < 0) { showToast('记录未找到', 'error'); return; }
  var r = appData.records[idx];
  var html = '<div class="glass-card" style="width:340px;max-width:90vw;padding:24px;text-align:center">';
  html += '<div style="font-size:32px;margin-bottom:12px">🗑</div>';
  html += '<div style="font-size:16px;font-weight:600;margin-bottom:8px">确认删除？</div>';
  html += '<div style="font-size:13px;color:var(--md-on-surface-variant);margin-bottom:16px">' + (r.subject || '') + ' · +' + (r.xp || 0) + 'XP · ' + formatDate(r.timestamp) + '</div>';
  html += '<div style="display:flex;gap:8px;justify-content:center"><button class="btn btn-ghost" onclick="closeModal()">取消</button><button class="btn btn-danger" onclick="window._confirmDelete(\'' + id + '\')">确认删除</button></div>';
  html += '</div>';
  openModal(html);
};

window._confirmDelete = function (id) {
  var idx = -1;
  for (var i = 0; i < appData.records.length; i++) {
    if (appData.records[i].id === id) { idx = i; break; }
  }
  if (idx < 0) { closeModal(); showToast('记录未找到', 'error'); return; }
  var r = appData.records[idx];
  if (appData.profile) appData.profile.totalXp = Math.max(0, (appData.profile.totalXp || 0) - (r.xp || 0));
  appData.records.splice(idx, 1);
  buildKnowledgeStates(appData.records, appData.skillTree);
  saveAppData();
  closeModal();
  showToast('记录已删除', 'info');
  renderLog();
  setTimeout(function () { renderOverview(); }, 200);
};

window._editRecord = function (id) {
  var r = null;
  for (var i = 0; i < appData.records.length; i++) {
    if (appData.records[i].id === id) { r = appData.records[i]; break; }
  }
  if (!r) { showToast('记录未找到', 'error'); return; }

  var html = '<div class="glass-card" style="width:400px;max-width:92vw;max-height:85vh;overflow-y:auto;padding:24px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="font-size:18px">✏️ 编辑记录</h3><button class="btn-icon" onclick="closeModal()" style="background:transparent;border:none;font-size:20px;cursor:pointer;color:var(--md-on-surface-variant)">✕</button></div>';
  html += '<input type="hidden" id="editRecordId" value="' + r.id + '">';
  html += '<div style="margin-bottom:12px"><label class="label label-required">学科</label><select class="select" id="editSubject"><option value="">选择学科</option>';
  var subjects = ['数学','语文','英语','物理','化学','生物','政治','历史','地理'];
  for (var i = 0; i < subjects.length; i++) {
    html += '<option value="' + subjects[i] + '"' + (r.subject === subjects[i] ? ' selected' : '') + '>' + (SUBJECT_ICONS[subjects[i]] || '') + ' ' + subjects[i] + '</option>';
  }
  html += '</select></div>';
  html += '<div style="margin-bottom:12px"><label class="label">知识点</label><input class="input" id="editKPs" value="' + escapeHtml((r.knowledgePoints || []).join(', ')) + '" placeholder="多个知识点用逗号分隔"></div>';
  html += '<div style="display:flex;gap:8px;margin-bottom:12px"><div style="flex:1"><label class="label label-required">得分</label><input class="input" id="editScore" type="number" min="0" max="100" value="' + (r.score || 0) + '"></div><div style="flex:1"><label class="label label-required">学习时长(分钟)</label><input class="input" id="editDuration" type="number" min="1" value="' + (r.duration || 0) + '"></div></div>';
  html += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px"><button class="btn btn-ghost" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="window._saveEdit()">保存修改</button></div>';
  html += '</div>';
  openModal(html);
};

window._saveEdit = function () {
  var idEl = document.getElementById('editRecordId');
  var id = idEl ? idEl.value : '';
  var r = null;
  for (var i = 0; i < appData.records.length; i++) {
    if (appData.records[i].id === id) { r = appData.records[i]; break; }
  }
  if (!r) { closeModal(); showToast('记录未找到', 'error'); return; }

  var subjectEl = document.getElementById('editSubject');
  var scoreEl = document.getElementById('editScore');
  var durationEl = document.getElementById('editDuration');
  var oldXp = r.xp || 0;
  r.subject = subjectEl ? subjectEl.value : r.subject;
  r.score = parseInt(scoreEl ? scoreEl.value : 0) || r.score;
  r.duration = parseInt(durationEl ? durationEl.value : 0) || r.duration;

  var kpEl = document.getElementById('editKPs');
  if (kpEl) {
    var kpsRaw = kpEl.value.trim();
    r.knowledgePoints = kpsRaw ? kpsRaw.split(/[,，、\s]+/).filter(function(s){return s.length>0;}) : [];
  }

  r.xp = calcBaseXP(r.score, r.duration);
  if (appData.profile) appData.profile.totalXp = (appData.profile.totalXp || 0) - oldXp + r.xp;

  buildKnowledgeStates(appData.records, appData.skillTree);
  saveAppData();
  closeModal();
  showToast('记录已更新', 'success');
  renderLog();
  setTimeout(function () { renderOverview(); }, 200);
};

function showAbout() {
  var html = '<div class="glass-card" style="width:360px;max-width:92vw;padding:24px;text-align:center">';
  html += '<div style="font-size:40px;margin-bottom:12px">📚</div>';
  html += '<h3 style="margin-bottom:4px">学习RPG</h3>';
  html += '<div style="color:var(--md-on-surface-variant);font-size:12px;margin-bottom:16px">v3.0 · 认知操作系统</div>';
  html += '<div style="font-size:14px;color:var(--md-on-surface);margin-bottom:16px">基于艾宾浩斯遗忘曲线的游戏化学习追踪系统</div>';
  html += '<button class="btn btn-primary" style="width:100%" onclick="closeModal()">好的</button>';
  html += '</div>';
  openModal(html);
}

/* ================================================================
   辅助函数
   ================================================================ */

function calcStreakDays(records) {
  records = records || [];
  if (records.length === 0) return 0;
  var days = new Set();
  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    if (!r.timestamp) continue;
    var d = parseISO(r.timestamp);
    if (!isNaN(d.getTime())) {
      days.add(getDayKey(d));
    }
  }
  var streak = 0;
  var check = new Date();
  check.setHours(0, 0, 0, 0);
  while (true) {
    var key = getDayKey(check);
    if (days.has(key)) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      var yesterday = new Date(check);
      yesterday.setDate(yesterday.getDate() - 1);
      if (days.has(getDayKey(yesterday))) {
        check = yesterday;
        continue;
      }
      break;
    }
  }
  return streak;
}

function calcTodayXp() {
  var todayKey = getTodayKey();
  var total = 0;
  var records = appData.records || [];
  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    if (getDayKey(parseISO(r.timestamp)) === todayKey) {
      total += r.xp || 0;
    }
  }
  return total;
}

function getDayStatus() {
  var day = new Date().getDay();
  if (day === 0) return { icon: '📝', text: '复盘日', color: '#8B5CF6' };
  if (day === 6) return { icon: '🎯', text: '周末', color: '#10B981' };
  return { icon: '📖', text: '平日', color: '#3B82F6' };
}

var CHAR_LEVEL_TITLES = [
  { name: '見習い', cn: '见习', color: '#9CA3AF', minLevel: 1 },
  { name: '初心者', cn: '初心者', color: '#6B7280', minLevel: 4 },
  { name: '学徒',   cn: '学徒',   color: '#3B82F6', minLevel: 7 },
  { name: '熟練者', cn: '熟练者', color: '#10B981', minLevel: 11 },
  { name: '達人',   cn: '达人',   color: '#F59E0B', minLevel: 16 },
  { name: '名人',   cn: '名人',   color: '#EF4444', minLevel: 23 },
  { name: '伝説',   cn: '传说',   color: '#8B5CF6', minLevel: 31 }
];

function getCharLevelTitle(level) {
  for (var i = CHAR_LEVEL_TITLES.length - 1; i >= 0; i--) {
    if (level >= CHAR_LEVEL_TITLES[i].minLevel) return CHAR_LEVEL_TITLES[i];
  }
  return CHAR_LEVEL_TITLES[0];
}

/* ================================================================
   命令面板 (Ctrl+K)
   ================================================================ */

function initCommandPalette() {
  var palette = document.getElementById('commandPalette');
  var searchTrigger = document.getElementById('searchTrigger');
  if (!palette) return;

  var commands = [
    { name: '新增学习记录', icon: '📝', action: function () { window._openDataEntryModal(); } },
    { name: '开始番茄钟', icon: '🍅', action: function () { openPomodoro(); renderPomodoroConfig(); } },
    { name: '添加阅读记录', icon: '📖', action: function () { window._openReadingModal(); } },
    { name: '打开技能树', icon: '🌳', action: function () { setActivePage('skills'); } },
    { name: '查看复习推荐', icon: '🔄', action: function () { setActivePage('review'); } },
    { name: '查看学习报告', icon: '📊', action: function () { setActivePage('overview'); } },
    { name: '切换深色模式', icon: '🌓', action: function () { toggleTheme(); } },
    { name: '导出数据', icon: '📥', action: function () { exportAllData(); } }
  ];

  function showPalette() {
    var isMobile = window.innerWidth < 768;
    var maxH = isMobile ? Math.min(window.innerHeight * 0.6, 280) : 300;
    var html = '<div class="glass-card" style="width:400px;max-width:90vw"><div style="margin-bottom:12px"><input class="input" id="paletteInput" placeholder="🔍 搜索命令..." autofocus></div><div style="max-height:' + maxH + 'px;overflow-y:auto" id="paletteResults">';
    for (var i = 0; i < commands.length; i++) {
      html += '<div class="settings-item cmd-item" data-index="' + i + '" style="padding:10px 16px"><div class="settings-item-left" style="gap:12px"><span>' + commands[i].icon + '</span><span>' + commands[i].name + '</span></div></div>';
    }
    html += '</div></div>';
    palette.innerHTML = html;
    palette.classList.add('active');

    var input = document.getElementById('paletteInput');
    if (input) {
      setTimeout(function () { input.focus(); }, 50);
      input.addEventListener('input', function () {
        var q = input.value.toLowerCase();
        var items = palette.querySelectorAll('.cmd-item');
        var results = document.getElementById('paletteResults');
        var shown = 0;
        for (var j = 0; j < items.length; j++) {
          if (!q || commands[j].name.indexOf(q) >= 0) {
            items[j].style.display = '';
            shown++;
          } else {
            items[j].style.display = 'none';
          }
        }
      });
    }

    palette.querySelectorAll('.cmd-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var idx = parseInt(this.dataset.index);
        if (commands[idx]) {
          closePalette();
          commands[idx].action();
        }
      });
    });
  }

  function closePalette() {
    palette.classList.remove('active');
    palette.innerHTML = '';
  }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (palette.classList.contains('active')) {
        closePalette();
      } else {
        showPalette();
      }
    }
    if (e.key === 'Escape' && palette.classList.contains('active')) {
      closePalette();
    }
  });

  if (searchTrigger) {
    searchTrigger.addEventListener('click', function () {
      if (palette.classList.contains('active')) {
        closePalette();
      } else {
        showPalette();
      }
    });
  }

  document.addEventListener('click', function (e) {
    if (!palette.classList.contains('active')) return;
    if (palette.contains(e.target)) return;
    if (searchTrigger && searchTrigger.contains(e.target)) return;
    closePalette();
  });
}

/* ================================================================
   成就系统
   ================================================================ */

var ACHIEVEMENT_DEFS = [
  { id: 'first-record', name: '初次学习', icon: '📝', desc: '记录第一条学习数据', check: function (d) { return d.records.length >= 1; } },
  { id: 'xp-100', name: 'XP百夫长', icon: '⭐', desc: '累计获得100 XP', check: function (d) { return (d.profile && d.profile.totalXp >= 100); } },
  { id: 'xp-1000', name: 'XP千夫长', icon: '🌟', desc: '累计获得1000 XP', check: function (d) { return (d.profile && d.profile.totalXp >= 1000); } },
  { id: 'streak-3', name: '三日连学', icon: '🔥', desc: '连续学习3天', check: function (d) { return calcStreakDays(d.records) >= 3; } },
  { id: 'streak-7', name: '七日连学', icon: '🔥', desc: '连续学习7天', check: function (d) { return calcStreakDays(d.records) >= 7; } },
  { id: 'streak-30', name: '月火不熄', icon: '🌋', desc: '连续学习30天', check: function (d) { return calcStreakDays(d.records) >= 30; } },
  { id: 'records-10', name: '十次练习', icon: '📋', desc: '记录10条学习数据', check: function (d) { return d.records.length >= 10; } },
  { id: 'records-50', name: '五十次练习', icon: '📚', desc: '记录50条学习数据', check: function (d) { return d.records.length >= 50; } },
  { id: 'records-100', name: '百战不殆', icon: '🏆', desc: '记录100条学习数据', check: function (d) { return d.records.length >= 100; } },
  { id: 'all-subjects', name: '全科覆盖', icon: '🎓', desc: '覆盖全部9门学科', check: function (d) {
    var subs = {}; for (var i = 0; i < d.records.length; i++) { if (d.records[i].subject) subs[d.records[i].subject] = true; }
    return Object.keys(subs).length >= 9;
  }},
  { id: 'pomodoro-1', name: '番茄初体验', icon: '🍅', desc: '完成第一个番茄钟', check: function (d) { return (d.pomodoroSessions && d.pomodoroSessions.length >= 1); } },
  { id: 'pomodoro-10', name: '番茄达人', icon: '🍅', desc: '完成10个番茄钟', check: function (d) { return (d.pomodoroSessions && d.pomodoroSessions.filter(function(s){return s.completed;}).length >= 10); } }
];

function checkAchievements() {
  var unlocked = loadLocal('achievementsUnlocked') || {};
  var newUnlocks = [];
  for (var i = 0; i < ACHIEVEMENT_DEFS.length; i++) {
    var ach = ACHIEVEMENT_DEFS[i];
    if (unlocked[ach.id]) continue;
    try {
      if (ach.check(appData)) {
        unlocked[ach.id] = true;
        newUnlocks.push(ach);
      }
    } catch (e) {}
  }
  saveLocal('achievementsUnlocked', unlocked);
  for (var j = 0; j < newUnlocks.length; j++) {
    showToast('🏆 成就解锁: ' + newUnlocks[j].name, 'success');
  }
  return newUnlocks;
}

function getUnlockedAchievements() {
  var unlocked = loadLocal('achievementsUnlocked') || {};
  return ACHIEVEMENT_DEFS.filter(function (a) { return unlocked[a.id]; });
}

/* ================================================================
   更新 loadAllData 以触发成就检查
   ================================================================ */

function initTheme() {
  var theme = getTheme();
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

/* ================================================================
   DOM 加载完成
   ================================================================ */

document.addEventListener('DOMContentLoaded', function () {
  console.log('✅ DOMContentLoaded');
  initTheme();
  initLaunchPage();
});

console.log('✅ app.js fully loaded!');
