/* ================================================================
   app-simple.js — 最简单版本，确保能运行
   ================================================================ */

console.log('✅ app-simple.js is loading!');

// 首先暴露全局函数
var _launched = false;
window._launchApp = function () {
  console.log('🚀 window._launchApp called!');
  if (_launched) return;
  _launched = true;
  
  // 1. 隐藏启动页
  var launchPage = document.getElementById('launchPage');
  if (launchPage) {
    launchPage.classList.add('hidden');
    console.log('✅ launchPage hidden');
  }
  
  // 2. 显示主页面
  var mainPage = document.getElementById('mainPage');
  if (mainPage) {
    mainPage.classList.add('visible');
    console.log('✅ mainPage visible');
  }
  
  // 3. 尝试渲染内容
  try {
    renderImmediateOverview();
    console.log('✅ renderImmediateOverview called');
  } catch (e) {
    console.error('❌ renderImmediateOverview error:', e);
    renderFallbackOverview();
  }
};

console.log('✅ window._launchApp defined!');

// renderImmediateOverview 函数
function renderImmediateOverview() {
  var container = document.getElementById('page-overview');
  if (!container) return;
  
  // 获取数据
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
  var todayXp = 0;
  for (var i = 0; i < records.length; i++) {
    try {
      var ts = records[i].timestamp;
      if (ts && getDayKey(parseISO(ts)) === todayKey) {
        todayXp += records[i].xp || 0;
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

  var html = '';
  html += '<div class="overview-hero">';
  html += '<div class="hero-level-card">';
  html += '<div class="hero-level-value">Lv' + level + '</div>';
  html += '<div class="hero-level-title">' + getLevelTitle(totalXp).cn + '</div>';
  html += '<div class="hero-level-jp">' + getLevelTitle(totalXp).name + '</div>';
  html += '</div>';
  html += '<div class="stat-card"><div class="stat-card-icon">⚡</div><div class="stat-card-value" style="color:var(--color-success)">+' + todayXp + '</div><div class="stat-card-label">今日XP</div></div>';
  html += '<div class="stat-card"><div class="stat-card-icon">🔥</div><div class="stat-card-value" style="color:var(--color-warning)">' + calcStreakDays() + '天</div><div class="stat-card-label">连续学习</div></div>';
  html += '<div class="stat-card"><div class="stat-card-icon">' + getDayStatus().icon + '</div><div class="stat-card-value" style="color:' + getDayStatus().color + '">' + getDayStatus().text + '</div><div class="stat-card-label">每日状态</div></div>';
  html += '<div class="stat-card"><div class="stat-card-icon">🏆</div><div class="stat-card-value">' + formatNumber(totalXp) + '</div><div class="stat-card-label">总XP</div></div>';
  html += '</div>';
  html += '<div class="total-progress">';
  html += '<div class="progress-header"><span class="progress-label">总等级进度</span><span class="progress-value">' + formatNumber(xpInLevel) + ' / ' + formatNumber(xpNeeded) + ' XP</span></div>';
  html += '<div class="progress-bar"><div class="progress-fill" style="width:' + percent + '%"></div></div>';
  html += '</div>';
  html += '<div class="section-title">📊 学科等级</div><div class="subject-grid">';
  var subjects = ['数学','语文','英语','物理','化学','生物','政治','历史','地理'];
  var icons = ['📐','📖','🔤','⚡','🧪','🧬','⚖️','📜','🌍'];
  for (var j = 0; j < subjects.length; j++) {
    var subjRecs = records.filter(function(r) { return r.subject === subjects[j]; });
    var subjScore = 0;
    if (subjRecs.length > 0) {
      var avg = subjRecs.reduce(function(s,r) { return s + (r.score||0); }, 0) / subjRecs.length;
      subjScore = Math.round(avg * 0.6 + Math.min(100, subjRecs.length * 5) * 0.4);
    }
    var slTitle = getLevelTitle(subjScore);
    var subjXp = subjRecs.length > 0 ? Math.round(subjRecs.reduce(function(s,r){ return s + (r.xp||0); }, 0)) : 0;
    html += '<div class="subject-card"><div class="subject-card-icon">' + icons[j] + '</div><div class="subject-card-name">' + subjects[j] + '</div><div class="subject-card-level">' + slTitle.cn + '(' + slTitle.name + ')</div><div class="subject-card-progress"><div class="progress-bar"><div class="progress-fill" style="width:' + subjScore + '%"></div></div></div><div class="subject-card-meta"><span>⭐' + subjXp + 'XP</span><span>' + subjRecs.length + '条记录</span></div></div>';
  }
  html += '</div>';
  try { container.innerHTML = html; } catch (e) { console.error(e); }
}

function renderFallbackOverview() {
  var container = document.getElementById('page-overview');
  if (!container) return;
  container.innerHTML = '<div style="padding:40px;text-align:center"><h2>📚 学习RPG</h2><p style="color:var(--md-on-surface-variant)">系统已启动，请添加数据！</p></div>';
}

function calcStreakDays() {
  if (!appData || !appData.records || appData.records.length === 0) return 0;
  var days = new Set();
  for (var i = 0; i < appData.records.length; i++) {
    days.add(getDayKey(parseISO(appData.records[i].timestamp)));
  }
  var streak = 0;
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  while (true) {
    if (days.has(getDayKey(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  var todayKey = getDayKey();
  if (!days.has(todayKey) && streak > 0) {
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (!days.has(getDayKey(yesterday))) {
      streak = 0;
    }
  }
  return streak;
}

function getDayStatus() {
  var day = new Date().getDay();
  if (day === 0) return { icon: '📝', text: '复盘日', color: '#8B5CF6' };
  if (day === 6) return { icon: '🎯', text: '周末', color: '#10B981' };
  return { icon: '📖', text: '平日', color: '#3B82F6' };
}

// 初始化按钮事件
document.addEventListener('DOMContentLoaded', function () {
  console.log('✅ DOMContentLoaded');
  
  var launchBtn = document.getElementById('launchBtn');
  if (launchBtn) {
    console.log('✅ Found launchBtn');
    launchBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window._launchApp();
    });
    console.log('✅ Event listener added');
  } else {
    console.error('❌ launchBtn not found');
  }
  
  // 初始化启动页进度条
  try {
    var fill = document.getElementById('launchProgressFill');
    if (fill && appData && appData.profile) {
      var totalXp = appData.profile.totalXp || 0;
      var level = Math.floor(Math.log(totalXp / 100 + 1) / Math.log(1.5)) + 1;
      if (totalXp < 100) level = 1;
      var currentLevelXp = Math.floor(100 * (Math.pow(1.5, level - 1) - 1));
      var nextLevelXp = Math.floor(100 * (Math.pow(1.5, level) - 1));
      var xpInLevel = totalXp - currentLevelXp;
      var xpNeeded = nextLevelXp - currentLevelXp;
      var percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
      fill.style.width = percent + '%';
      var launchCurrentXp = document.getElementById('launchCurrentXp');
      var launchNextXp = document.getElementById('launchNextXp');
      if (launchCurrentXp) launchCurrentXp.textContent = formatNumber(totalXp);
      if (launchNextXp) launchNextXp.textContent = formatNumber(nextLevelXp);
    }
  } catch (e) {
    console.warn('Launch progress animation failed:', e);
  }
});

console.log('✅ app-simple.js fully loaded!');
