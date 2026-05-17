/* ================================================================
   app.js — 应用初始化 / 路由 / 事件绑定
   ================================================================ */

(function () {
  'use strict';

  var _launched = false;

  window._launchApp = function () {
    if (_launched) return;
    _launched = true;
    var lp = document.getElementById('launchPage');
    var mp = document.getElementById('mainPage');
    if (lp) lp.classList.add('hidden');
    if (mp) mp.classList.add('visible');
    try { renderImmediateOverview(); } catch (e) { console.error(e); }
    setTimeout(function () { try { loadAllData(); } catch (e) { console.error(e); } }, 50);
  };

  window.addEventListener('error', function (e) {
    console.error('Global Error:', e.message, e.filename, e.lineno);
    try { showToast('系统遇到错误，请刷新页面', 'error'); } catch (ignore) {}
  });

  window.addEventListener('unhandledrejection', function (e) {
    console.error('Unhandled Promise:', e.reason);
    try { showToast('网络请求失败，请检查连接', 'error'); } catch (ignore) {}
  });

  var currentPage = 'overview';

  function initLaunchPage() {
    var launchBtn = document.getElementById('launchBtn');
    if (!launchBtn) return;
    launchBtn.addEventListener('click', function (e) {
      e.stopImmediatePropagation();
      window._launchApp();
    });
    try {
      animateLaunchProgress();
    } catch (e) {
      console.warn('Launch progress animation failed:', e);
    }
  }

  function animateLaunchProgress() {
    var fill = document.getElementById('launchProgressFill');
    if (!fill) return;
    var totalXp = 0;
    if (appData.profile && appData.profile.totalXp) {
      totalXp = appData.profile.totalXp;
    }
    var levelInfo = calcLevelInfo(totalXp);
    var percent = levelInfo.percent;
    document.getElementById('launchCurrentXp').textContent = formatNumber(totalXp);
    document.getElementById('launchNextXp').textContent = formatNumber(levelInfo.nextLevelXp);
    setTimeout(function () {
      fill.style.width = percent + '%';
    }, 200);
  }

  function calcLevelInfo(xp) {
    var level = Math.floor(Math.log(xp / 100 + 1) / Math.log(1.5)) + 1;
    if (xp < 100) level = 1;
    var currentLevelXp = Math.floor(100 * (Math.pow(1.5, level - 1) - 1));
    var nextLevelXp = Math.floor(100 * (Math.pow(1.5, level) - 1));
    var xpInLevel = xp - currentLevelXp;
    var xpNeeded = nextLevelXp - currentLevelXp;
    var percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
    return { level: level, percent: percent, nextLevelXp: nextLevelXp, xpInLevel: xpInLevel, xpNeeded: xpNeeded };
  }

  function loadAllData() {
    var loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'dataLoadingOverlay';
    loadingOverlay.style.cssText = 'position:fixed;inset:0;z-index:8000;background:var(--md-background);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;transition:opacity 0.4s ease;';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div><div style="font-size:14px;color:var(--md-on-surface-variant)">加载数据中...</div>';
    document.body.appendChild(loadingOverlay);

    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      try { initNavigation(); } catch (e) { console.error(e); }
      try { renderOverview(); } catch (e) { console.error('renderOverview error:', e); renderFallbackOverview(); }
      try { renderSettings(); } catch (e) { console.error(e); }
      try { initPomodoroFab(); } catch (e) { console.error(e); }
      loadingOverlay.style.opacity = '0';
      setTimeout(function () {
        try { if (loadingOverlay.parentNode) loadingOverlay.parentNode.removeChild(loadingOverlay); } catch (ignore) {}
      }, 400);
    };

    setTimeout(function () {
      if (!done) { console.warn('Data load timeout, using available data'); finish(); }
    }, 10000);

    loadAppData()
      .then(function () { return loadUserProfile(); })
      .then(function () { return loadSkillTree(); })
      .then(function () { return loadTextbooks(); })
      .then(function () { return loadCourses(); })
      .then(function () { return loadAchievements(); })
      .then(function () { return loadPomodoroSessions(); })
      .then(function () { return loadReadingRecords(); })
      .then(function () { return loadBookshelf(); })
      .then(function () { finish(); })
      .catch(function (err) {
        console.warn('Data load error:', err);
        finish();
      });
  }

  function initNavigation() {
    var desktopBtns = document.querySelectorAll('.dnav-btn');
    var bottomBtns = document.querySelectorAll('.bn-btn');

    function setActivePage(page) {
      currentPage = page;
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

    desktopBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { setActivePage(btn.dataset.page); });
    });
    bottomBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { setActivePage(btn.dataset.page); });
    });

    window.addEventListener('hashchange', function () {
      var hash = window.location.hash.replace('#', '');
      if (hash && hash !== currentPage) {
        setActivePage(hash);
      }
    });

    var initialHash = window.location.hash.replace('#', '');
    if (initialHash) {
      setActivePage(initialHash);
    }
  }

  function onPageChange(page) {
    try {
      switch (page) {
        case 'overview': renderOverview(); break;
        case 'skills': renderSkillTree(); break;
        case 'review': renderReviewCenter(); break;
        case 'log': renderLog(); break;
        case 'settings': renderSettings(); break;
      }
    } catch (e) {
      console.error('onPageChange error:', page, e);
      if (page === 'overview') { renderFallbackOverview(); }
    }
  }

  var pomodoroTimerInterval = null;
  var pomodoroRemaining = 0;
  var pomodoroTotal = 0;
  var pomodoroMode = '';
  var pomodoroSubject = '';
  var pomodoroKP = '';

  function openPomodoroModal() {
    var sessions = appData.pomodoroSessions || [];
    var todaySessions = sessions.filter(function (s) {
      return isSameDay(new Date(), parseISO(s.startTime));
    });
    var html = '<div class="glass-card" style="width:360px;max-width:92vw;padding:24px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="font-size:18px">🍅 番茄钟</h3><button class="btn-icon" onclick="closeModal()" style="background:transparent;border:none;font-size:20px;cursor:pointer;color:var(--md-on-surface-variant)">✕</button></div>';
    html += '<div style="text-align:center;margin-bottom:16px"><div style="font-size:13px;color:var(--md-on-surface-variant)">今日已完成 ' + todaySessions.length + ' 个番茄 · 累计 ' + formatDuration(todaySessions.reduce(function (s, ses) { return s + (ses.plannedDuration || 0); }, 0)) + '</div></div>';
    html += '<div style="display:flex;gap:8px;margin-bottom:16px">';
    html += '<button class="btn btn-primary" style="flex:1" onclick="window._startPomodoro(25,\'standard\')">25分钟<br><small>标准番茄</small></button>';
    html += '<button class="btn btn-outline" style="flex:1" onclick="window._startPomodoro(5,\'break\')">5分钟<br><small>短休息</small></button>';
    html += '<button class="btn btn-outline" style="flex:1" onclick="window._startPomodoro(15,\'sprint\')">15分钟<br><small>长专注</small></button>';
    html += '</div>';
    html += '<div style="margin-bottom:12px"><label class="label">学科</label><select class="select" id="pomSubject"><option value="">选择学科</option>';
    var subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
    for (var i = 0; i < subjects.length; i++) { html += '<option value="' + subjects[i] + '">' + (SUBJECT_ICONS[subjects[i]] || '') + ' ' + subjects[i] + '</option>'; }
    html += '</select></div>';
    html += '<div style="margin-bottom:12px"><label class="label">知识点（可选）</label><input class="input" id="pomKP" placeholder="如：函数单调性"></div>';

    var allSessions = sessions.slice().reverse();
    if (allSessions.length > 0) {
      html += '<div style="margin-top:16px;border-top:1px solid var(--md-outline-variant);padding-top:12px"><div style="font-size:13px;font-weight:600;color:var(--md-on-surface);margin-bottom:8px">📊 最近番茄记录</div>';
      for (var si = 0; si < Math.min(allSessions.length, 5); si++) {
        var s = allSessions[si];
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:12px;border-bottom:1px solid var(--md-outline-variant)">';
        html += '<span style="color:var(--md-on-surface)">' + (s.completed ? '✅' : '⏹') + ' ' + (s.plannedDuration || 0) + '分钟</span>';
        html += '<span style="color:var(--md-on-surface-variant)">' + formatDate(parseISO(s.startTime)) + '</span>';
        html += '<span style="color:var(--md-on-surface-variant)">' + (s.context && s.context.subject ? s.context.subject : '未指定') + '</span>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    openModal(html);
  }

  window._startPomodoro = function (minutes, mode) {
    closeModal();
    var subjectEl = document.getElementById('pomSubject');
    var kpEl = document.getElementById('pomKP');
    pomodoroSubject = subjectEl ? subjectEl.value : '';
    pomodoroKP = kpEl ? kpEl.value : '';
    pomodoroTotal = minutes * 60;
    pomodoroRemaining = pomodoroTotal;
    pomodoroMode = mode;

    if (pomodoroTimerInterval) clearInterval(pomodoroTimerInterval);

    var fab = document.getElementById('pomodoroFab');
    if (fab) {
      fab.style.animation = 'none';
      fab.innerHTML = '<svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3"/><circle id="fabProgress" cx="24" cy="24" r="20" fill="none" stroke="white" stroke-width="3" stroke-dasharray="125.6" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 24 24)"/></svg>';
    }

    pomodoroTimerInterval = setInterval(function () {
      pomodoroRemaining--;
      if (fab) {
        var fabProgress = document.getElementById('fabProgress');
        if (fabProgress) {
          var progress = 1 - pomodoroRemaining / pomodoroTotal;
          fabProgress.setAttribute('stroke-dashoffset', (125.6 * progress).toFixed(1));
        }
        var mins = Math.floor(pomodoroRemaining / 60);
        var secs = pomodoroRemaining % 60;
        fab.title = padZero(mins) + ':' + padZero(secs);
      }
      if (pomodoroRemaining <= 0) {
        clearInterval(pomodoroTimerInterval);
        pomodoroTimerInterval = null;
        finishPomodoroWithCelebration(minutes, pomodoroMode, pomodoroSubject, pomodoroKP);
      }
    }, 1000);
    showToast('🍅 番茄钟开始！' + minutes + '分钟专注', 'info');
  };

  function finishPomodoroWithCelebration(minutes, mode, subject, kp) {
    var fab = document.getElementById('pomodoroFab');
    if (fab) {
      fab.style.animation = '';
      fab.innerHTML = '🍅';
    }

    var celebrationHtml = '<div class="glass-card" style="width:340px;max-width:90vw;padding:24px;text-align:center">';
    celebrationHtml += '<div style="font-size:48px;margin-bottom:12px;animation:pomCelebrate 0.5s ease">🎉</div>';
    celebrationHtml += '<div style="font-size:20px;font-weight:700;color:var(--md-on-surface);margin-bottom:4px">番茄钟完成！</div>';
    celebrationHtml += '<div style="font-size:14px;color:var(--md-on-surface-variant);margin-bottom:16px">' + minutes + '分钟 ' + (mode === 'break' ? '休息' : '专注') + (subject ? ' · ' + subject : '') + '</div>';
    celebrationHtml += '<button class="btn btn-primary" style="width:100%" onclick="closeModal()">👍 太棒了</button>';
    celebrationHtml += '</div>';
    openModal(celebrationHtml);

    var session = {
      sessionId: uuid(), startTime: new Date(Date.now() - minutes * 60000).toISOString(),
      plannedDuration: minutes, endTime: new Date().toISOString(), completed: true,
      context: { subject: subject, knowledgePoints: kp ? [kp] : [] }, focusScore: 90 + Math.floor(Math.random() * 10)
    };
    savePomodoroSession(session);
    var record = {
      id: uuid(), timestamp: toLocalISO(), subject: subject || '未指定',
      knowledgePoints: kp ? [kp] : [], duration: minutes, activityType: 'practice',
      score: session.focusScore, source: 'pomodoro', xp: calcBaseXP(session.focusScore, minutes)
    };
    appData.records.push(record);
    if (appData.profile) appData.profile.totalXp = (appData.profile.totalXp || 0) + record.xp;
    saveAppData();
    setTimeout(function () { renderOverview(); }, 300);

    setTimeout(function () {
      showToast('✅ ' + minutes + '分钟专注完成！+' + record.xp + ' XP', 'success');
    }, 800);
  }

  function finishPomodoro(minutes, mode, subject, kp) {
    finishPomodoroWithCelebration(minutes, mode, subject, kp);
  }

  function initPomodoroFab() {
    var fab = document.getElementById('pomodoroFab');
    if (!fab) return;
    fab.addEventListener('click', function () {
      if (pomodoroTimerInterval) {
        var mins = Math.floor(pomodoroRemaining / 60);
        var secs = pomodoroRemaining % 60;
        showToast('🍅 番茄钟进行中: ' + padZero(mins) + ':' + padZero(secs) + ' · 点击打开番茄钟查看', 'info');
        openPomodoroModal();
      } else {
        openPomodoroModal();
      }
    });
  }

  window._openReadingModal = function () {
    var html = '<div class="glass-card" style="width:380px;max-width:90vw;max-height:80vh;overflow-y:auto;padding:24px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="font-size:18px">📖 添加阅读记录</h3><button class="btn-icon" onclick="closeModal()" style="background:transparent;border:none;font-size:20px;cursor:pointer">✕</button></div>';
    html += '<div style="margin-bottom:12px"><label class="label label-required">书名</label><input class="input" id="readingTitle" placeholder="输入书名"></div>';
    html += '<div style="margin-bottom:12px"><label class="label">作者</label><input class="input" id="readingAuthor" placeholder="作者名"></div>';
    html += '<div style="margin-bottom:12px"><label class="label">分类</label><select class="select" id="readingCategory"><option value="">选择分类</option>';
    var cats = ['文学小说', '历史', '哲学', '科普/科学', '技术/编程', '心理学', '社会学', '经济学', '传记', '个人成长', '教材/教辅', '其他'];
    for (var i = 0; i < cats.length; i++) { html += '<option value="' + cats[i] + '">' + cats[i] + '</option>'; }
    html += '</select></div>';
    html += '<div style="display:flex;gap:8px;margin-bottom:12px"><div style="flex:1"><label class="label">格式</label><select class="select" id="readingFormat"><option value="paper">纸质书</option><option value="ebook">电子书</option><option value="audio">有声书</option></select></div><div style="flex:1"><label class="label label-required">阅读时长(分钟)</label><input class="input" id="readingDuration" type="number" min="1" placeholder="分钟"></div></div>';
    html += '<div style="display:flex;gap:8px;margin-bottom:12px"><div style="flex:1"><label class="label">起始页</label><input class="input" id="readingStartPage" type="number" placeholder="0"></div><div style="flex:1"><label class="label">结束页</label><input class="input" id="readingEndPage" type="number" placeholder="0"></div></div>';
    html += '<div style="margin-bottom:12px"><label class="label">评分</label><div id="readingRating" style="font-size:24px;cursor:pointer">⭐⭐⭐⭐⭐</div></div>';
    html += '<div style="margin-bottom:16px"><label class="label">笔记</label><textarea class="input" id="readingNotes" rows="2" placeholder="简短笔记..."></textarea></div>';
    html += '<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-ghost" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="window._saveReading()">保存</button></div>';

    var allReadings = appData.readingRecords || [];
    if (allReadings.length > 0) {
      var totalBooks = new Set(allReadings.map(function (r) { return r.bookTitle; })).size;
      var totalMinutes = allReadings.reduce(function (s, r) { return s + (r.durationMinutes || 0); }, 0);
      var totalPages = allReadings.reduce(function (s, r) { return s + Math.max(0, (r.endPage || 0) - (r.startPage || 0)); }, 0);
      html += '<div style="margin-top:16px;border-top:1px solid var(--md-outline-variant);padding-top:12px"><div style="font-size:13px;font-weight:600;color:var(--md-on-surface);margin-bottom:8px">📊 阅读统计</div>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">';
      html += '<div style="padding:8px;background:var(--md-surface-container);border-radius:8px"><div style="font-size:18px;font-weight:700;color:var(--md-primary)">' + totalBooks + '</div><div style="font-size:10px;color:var(--md-on-surface-variant)">本书</div></div>';
      html += '<div style="padding:8px;background:var(--md-surface-container);border-radius:8px"><div style="font-size:18px;font-weight:700;color:var(--color-success)">' + formatDuration(totalMinutes) + '</div><div style="font-size:10px;color:var(--md-on-surface-variant)">阅读时长</div></div>';
      html += '<div style="padding:8px;background:var(--md-surface-container);border-radius:8px"><div style="font-size:18px;font-weight:700;color:var(--color-warning)">' + totalPages + '</div><div style="font-size:10px;color:var(--md-on-surface-variant)">页阅读</div></div>';
      html += '</div>';

      html += '<div style="margin-top:8px;font-size:11px;color:var(--md-on-surface-variant)">最近阅读：</div>';
      var recentReadings = allReadings.slice(-3).reverse();
      for (var ri = 0; ri < recentReadings.length; ri++) {
        var rr = recentReadings[ri];
        html += '<div style="font-size:11px;color:var(--md-on-surface-variant);padding:2px 0">📖 ' + escapeHtml(rr.bookTitle) + ' · ' + formatDuration(rr.durationMinutes || 0) + ' · ' + formatDate(parseISO(rr.timestamp)) + '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    openModal(html);
    setTimeout(function () {
      var stars = document.querySelectorAll('#readingRating');
      if (stars.length > 0) {
        var ratingEl = stars[0];
        var rating = 0;
        ratingEl.innerHTML = '';
        for (var s = 1; s <= 5; s++) {
          var star = document.createElement('span');
          star.textContent = s <= rating ? '★' : '☆';
          star.style.cursor = 'pointer';
          star.dataset.value = s;
          star.addEventListener('click', function (e) {
            rating = parseInt(e.target.dataset.value);
            ratingEl.innerHTML = '';
            for (var j = 1; j <= 5; j++) {
              var st = document.createElement('span');
              st.textContent = j <= rating ? '★' : '☆';
              st.style.cursor = 'pointer';
              st.dataset.value = j;
              st.addEventListener('click', arguments.callee.caller ? arguments.callee.caller.arguments[0].target.parentElement ? null : null);
              ratingEl.appendChild(st);
            }
            ratingEl.dataset.rating = rating;
          });
          ratingEl.appendChild(star);
        }
      }
    }, 100);
  };

  window._saveReading = function () {
    var title = document.getElementById('readingTitle') ? document.getElementById('readingTitle').value.trim() : '';
    if (!title) { showToast('请输入书名', 'error'); return; }
    var duration = parseInt(document.getElementById('readingDuration') ? document.getElementById('readingDuration').value : 0) || 0;
    if (duration <= 0) { showToast('请输入阅读时长', 'error'); return; }
    var record = {
      recordID: uuid(), timestamp: toLocalISO(), bookTitle: title,
      author: document.getElementById('readingAuthor') ? document.getElementById('readingAuthor').value.trim() : '',
      category: document.getElementById('readingCategory') ? document.getElementById('readingCategory').value : '',
      format: document.getElementById('readingFormat') ? document.getElementById('readingFormat').value : 'paper',
      startPage: parseInt(document.getElementById('readingStartPage') ? document.getElementById('readingStartPage').value : 0) || 0,
      endPage: parseInt(document.getElementById('readingEndPage') ? document.getElementById('readingEndPage').value : 0) || 0,
      durationMinutes: duration,
      notes: document.getElementById('readingNotes') ? document.getElementById('readingNotes').value.trim() : '',
      rating: parseInt(document.getElementById('readingRating') ? (document.getElementById('readingRating').dataset.rating || 0) : 0)
    };
    saveReadingRecord(record);
    closeModal();
    showToast('阅读记录已保存', 'success');
  };

  function openDataEntryModal() {
    var html = '<div class="glass-card" style="width:480px;max-width:92vw;max-height:85vh;overflow-y:auto;padding:24px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="font-size:18px">📝 新增学习记录</h3><button class="btn-icon" onclick="closeModal()" style="background:transparent;border:none;font-size:20px;cursor:pointer;color:var(--md-on-surface-variant)">✕</button></div>';
    html += '<div style="margin-bottom:12px"><label class="label label-required">学科</label><select class="select" id="entrySubject" onchange="window._onSubjectChange()"><option value="">选择学科</option>';
    var subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
    for (var i = 0; i < subjects.length; i++) { html += '<option value="' + subjects[i] + '">' + (SUBJECT_ICONS[subjects[i]] || '') + ' ' + subjects[i] + '</option>'; }
    html += '</select></div>';

    html += '<div id="entryTextbookSection" style="margin-bottom:12px;display:none"><label class="label">关联教材</label><select class="select" id="entryTextbook"><option value="">不关联</option></select></div>';

    html += '<div style="margin-bottom:12px"><label class="label">知识点（点击添加/移除）</label>';
    html += '<input class="input" id="entryKPSearch" placeholder="🔍 搜索知识点..." oninput="window._filterKPTags()">';
    html += '<div id="entryKPTags" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;max-height:150px;overflow-y:auto"></div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;min-height:24px" id="entrySelectedKPs"></div>';
    html += '</div>';

    html += '<div style="margin-bottom:12px"><label class="label label-required">得分 (0-100)</label><input class="slider" id="entryScore" type="range" min="0" max="100" value="75" oninput="document.getElementById(\'entryScoreVal\').textContent=this.value"><div style="text-align:center;font-weight:700;font-size:20px" id="entryScoreVal">75</div></div>';
    html += '<div style="display:flex;gap:8px;margin-bottom:12px"><div style="flex:1"><label class="label label-required">学习时长(分钟)</label><input class="input" id="entryDuration" type="number" min="1" value="30"></div><div style="flex:1"><label class="label">活动类型</label><select class="select" id="entryType"><option value="practice">做题练习</option><option value="exam">考试测验</option><option value="lecture">听课网课</option><option value="review">复习</option><option value="recitation">背诵默写</option><option value="reflection">考试反思</option><option value="other">其他</option></select></div></div>';
    html += '<div style="margin-bottom:16px"><label class="label">备注</label><textarea class="input" id="entryNotes" rows="2" placeholder="可选备注..."></textarea></div>';
    html += '<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-ghost" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="window._saveEntry()">保存记录</button></div>';
    html += '</div>';
    openModal(html);
    window._entrySelectedKPs = [];
    window._allKnowledgePoints = [];
    setTimeout(function () { window._onSubjectChange(); }, 50);
  }

  window._entrySelectedKPs = [];
  window._allKnowledgePoints = [];

  window._onSubjectChange = function () {
    var subject = document.getElementById('entrySubject') ? document.getElementById('entrySubject').value : '';
    var tbSection = document.getElementById('entryTextbookSection');
    var tbSelect = document.getElementById('entryTextbook');
    var kpTags = document.getElementById('entryKPTags');
    var selectedKPs = document.getElementById('entrySelectedKPs');

    if (tbSection) {
      if (subject && appData.textbooks && appData.textbooks.textbooks) {
        tbSection.style.display = 'block';
        var tbs = appData.textbooks.textbooks.filter(function (t) { return t.subject === subject; });
        tbSelect.innerHTML = '<option value="">不关联</option>';
        for (var i = 0; i < tbs.length; i++) {
          tbSelect.innerHTML += '<option value="' + escapeHtml(tbs[i].id) + '">' + escapeHtml(tbs[i].name) + ' (' + (tbs[i].status || '未知') + ')</option>';
        }
      } else {
        tbSection.style.display = 'none';
      }
    }

    window._entrySelectedKPs = [];
    window._allKnowledgePoints = [];
    if (subject && appData.skillTree && appData.skillTree.subjects) {
      var key = NAME_TO_KEY[subject];
      if (key && appData.skillTree.subjects[key]) {
        var skills = appData.skillTree.subjects[key].skills;
        var skillIds = Object.keys(skills);
        for (var si = 0; si < skillIds.length; si++) {
          var kps = skills[skillIds[si]].knowledgePoints || [];
          for (var ki = 0; ki < kps.length; ki++) {
            window._allKnowledgePoints.push({ name: kps[ki], skill: skills[skillIds[si]].name });
          }
        }
      }
    }
    if (kpTags) window._filterKPTags();
    if (selectedKPs) selectedKPs.innerHTML = '';
  };

  window._filterKPTags = function () {
    var kpTags = document.getElementById('entryKPTags');
    var searchVal = (document.getElementById('entryKPSearch') ? document.getElementById('entryKPSearch').value : '').toLowerCase();
    if (!kpTags) return;
    var html = '';
    var allKps = window._allKnowledgePoints || [];
    for (var i = 0; i < allKps.length; i++) {
      var kp = allKps[i];
      if (searchVal && kp.name.toLowerCase().indexOf(searchVal) < 0) continue;
      var isSelected = (window._entrySelectedKPs || []).indexOf(kp.name) >= 0;
      html += '<span class="kp-tag' + (isSelected ? ' kp-tag-selected' : '') + '" onclick="window._toggleKP(\'' + escapeHtml(kp.name).replace(/'/g, "\\'") + '\')" style="padding:3px 8px;border-radius:12px;border:1px solid ' + (isSelected ? 'var(--md-primary)' : 'var(--md-outline-variant)') + ';background:' + (isSelected ? 'var(--md-primary-container)' : 'var(--md-surface)') + ';font-size:11px;cursor:pointer;transition:all 0.15s">' + escapeHtml(kp.name) + '</span>';
    }
    kpTags.innerHTML = html || '<span style="font-size:11px;color:var(--md-on-surface-variant)">请先选择学科，或输入关键词搜索</span>';
  };

  window._toggleKP = function (kpName) {
    if (!window._entrySelectedKPs) window._entrySelectedKPs = [];
    var idx = window._entrySelectedKPs.indexOf(kpName);
    if (idx >= 0) {
      window._entrySelectedKPs.splice(idx, 1);
    } else {
      window._entrySelectedKPs.push(kpName);
    }
    window._filterKPTags();
    var selectedContainer = document.getElementById('entrySelectedKPs');
    if (selectedContainer) {
      var html = '';
      for (var i = 0; i < window._entrySelectedKPs.length; i++) {
        html += '<span style="padding:2px 8px;border-radius:12px;background:var(--md-primary-container);color:var(--md-on-primary-container);font-size:11px;display:flex;align-items:center;gap:4px">' + escapeHtml(window._entrySelectedKPs[i]) + '<span onclick="window._toggleKP(\'' + escapeHtml(window._entrySelectedKPs[i]).replace(/'/g, "\\'") + '\')" style="cursor:pointer;opacity:0.7">×</span></span>';
      }
      selectedContainer.innerHTML = html;
    }
  };

  window._saveEntry = function () {
    var subject = document.getElementById('entrySubject') ? document.getElementById('entrySubject').value : '';
    if (!subject) { showToast('请选择学科', 'error'); return; }
    var score = parseInt(document.getElementById('entryScore') ? document.getElementById('entryScore').value : 0) || 0;
    var duration = parseInt(document.getElementById('entryDuration') ? document.getElementById('entryDuration').value : 0) || 0;
    if (duration <= 0) { showToast('请输入学习时长', 'error'); return; }
    var kps = window._entrySelectedKPs || [];
    var xp = calcBaseXP(score, duration);
    var xp2 = calcXPEngine2({ score: score, duration: duration, subject: subject }, appData.userProfile);
    var finalXp = Math.round((xp + xp2) / 2);
    var record = {
      id: uuid(), timestamp: toLocalISO(), subject: subject,
      knowledgePoints: kps, duration: duration,
      activityType: document.getElementById('entryType') ? document.getElementById('entryType').value : 'practice',
      score: score, xp: finalXp, source: 'web',
      textbookId: document.getElementById('entryTextbook') ? document.getElementById('entryTextbook').value : '',
      notes: document.getElementById('entryNotes') ? document.getElementById('entryNotes').value.trim() : ''
    };
    appData.records.push(record);
    if (appData.profile) appData.profile.totalXp = (appData.profile.totalXp || 0) + finalXp;
    updateUserProfile();
    saveAppData();
    closeModal();
    showToast('✅ 记录已保存！+' + finalXp + ' XP', 'success');
    renderOverview();
  };

  function openCommandPalette() {
    var html = '<div class="glass-card" style="width:400px;max-width:90vw;padding:16px">';
    html += '<input class="input" id="cmdInput" placeholder="🔍 搜索命令..." style="margin-bottom:12px" autofocus>';
    html += '<div id="cmdList">';
    var commands = [
      { name: '📝 新增学习记录', action: 'openDataEntryModal()' },
      { name: '⏱ 开始番茄钟', action: 'openPomodoroModal()' },
      { name: '📖 添加阅读记录', action: 'window._openReadingModal()' },
      { name: '🌳 打开技能树', action: 'switchToPage(\'skills\')' },
      { name: '🔄 查看复习推荐', action: 'switchToPage(\'review\')' },
      { name: '📊 查看学习日志', action: 'switchToPage(\'log\')' },
      { name: '🌓 切换深色模式', action: 'toggleTheme()' },
      { name: '📥 导出数据', action: 'exportAllData()' },
      { name: '📋 关于系统', action: 'showToast(\'学习RPG V3.0 · 认知操作系统\',\'info\')' }
    ];
    for (var i = 0; i < commands.length; i++) {
      html += '<div class="cmd-item" style="padding:10px 12px;cursor:pointer;border-radius:8px;transition:background 0.15s" data-action="' + commands[i].action + '" data-name="' + commands[i].name + '" onclick="var a=this.dataset.action;closeModal();setTimeout(function(){eval(a)},100)" onmouseover="this.style.background=\'var(--md-surface-container-highest)\'" onmouseout="this.style.background=\'transparent\'">' + commands[i].name + '</div>';
    }
    html += '</div></div>';
    var palette = document.getElementById('commandPalette');
    palette.innerHTML = html;
    palette.classList.add('active');
    var overlay = document.getElementById('modalOverlay');
    overlay.classList.add('active');

    setTimeout(function () {
      var input = document.getElementById('cmdInput');
      if (input) {
        input.focus();
        input.addEventListener('input', function () {
          var q = input.value.toLowerCase();
          var items = document.querySelectorAll('#cmdList .cmd-item');
          items.forEach(function (item) {
            item.style.display = !q || item.dataset.name.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
          });
        });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') { closeCommandPalette(); }
        });
      }
    }, 100);
  }

  function closeCommandPalette() {
    document.getElementById('commandPalette').classList.remove('active');
    document.getElementById('modalOverlay').classList.remove('active');
  }

  function switchToPage(page) {
    var desktopBtns = document.querySelectorAll('.dnav-btn');
    var bottomBtns = document.querySelectorAll('.bn-btn');
    desktopBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.page === page); });
    bottomBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.page === page); });
    document.querySelectorAll('.page-content').forEach(function (p) { p.classList.toggle('active', p.id === 'page-' + page); });
    window.location.hash = page;
    onPageChange(page);
  }

  document.addEventListener('click', function (e) {
    if (e.target.id === 'modalOverlay') {
      closeModal();
      closeCommandPalette();
    }
  });

  function initTheme() {
    var theme = getTheme();
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  function initKeyboard() {
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openCommandPalette();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
        showToast('主题已切换', 'info');
      }
    });
  }

  function openCommandPalette() {
    showToast('命令面板开发中', 'info');
  }

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

  var SUBJECT_NAMES = {
    'logos': '数学', 'mythos': '语文', 'lingua': '英语',
    'physis': '物理', 'khemeia': '化学', 'zoe': '生物',
    'politeia': '政治', 'historia': '历史', 'geographia': '地理'
  };

  var SUBJECT_ICONS = {
    '数学': '📐', '语文': '📖', '英语': '🔤',
    '物理': '⚡', '化学': '🧪', '生物': '🧬',
    '政治': '⚖️', '历史': '📜', '地理': '🌍'
  };

  var SUBJECT_COLORS = {
    '数学': 'var(--subj-math)', '语文': 'var(--subj-chinese)', '英语': 'var(--subj-english)',
    '物理': 'var(--subj-physics)', '化学': 'var(--subj-chemistry)', '生物': 'var(--subj-biology)',
    '政治': 'var(--subj-politics)', '历史': 'var(--subj-history)', '地理': 'var(--subj-geography)'
  };

  var SUBJECT_KEYS = ['logos', 'mythos', 'lingua', 'physis', 'khemeia', 'zoe', 'politeia', 'historia', 'geographia'];

  var NAME_TO_KEY = {
    '数学': 'logos', '语文': 'mythos', '英语': 'lingua',
    '物理': 'physis', '化学': 'khemeia', '生物': 'zoe',
    '政治': 'politeia', '历史': 'historia', '地理': 'geographia'
  };

  var LEVEL_TITLES = [
    { name: '見習い', cn: '见习', color: '#9CA3AF', min: 0 },
    { name: '初心者', cn: '初心者', color: '#6B7280', min: 10 },
    { name: '学徒', cn: '学徒', color: '#3B82F6', min: 20 },
    { name: '熟練者', cn: '熟练者', color: '#10B981', min: 40 },
    { name: '達人', cn: '达人', color: '#F59E0B', min: 60 },
    { name: '名人', cn: '名人', color: '#EF4444', min: 80 },
    { name: '伝説', cn: '传说', color: '#8B5CF6', min: 95 }
  ];

  function getLevelTitle(score) {
    for (var i = LEVEL_TITLES.length - 1; i >= 0; i--) {
      if (score >= LEVEL_TITLES[i].min) return LEVEL_TITLES[i];
    }
    return LEVEL_TITLES[0];
  }

  var TEMP_LEVELS = [
    { name: '炙热', icon: '🔥', color: '#FF4500', cssVar: '--temp-searing', min: 80 },
    { name: '温热', icon: '🟠', color: '#FF8C00', cssVar: '--temp-hot', min: 60 },
    { name: '温暖', icon: '🟡', color: '#FFD700', cssVar: '--temp-warm', min: 40 },
    { name: '正常', icon: '🟢', color: '#62A0EA', cssVar: '--temp-normal', min: 20 },
    { name: '微凉', icon: '🔵', color: '#1A5FB4', cssVar: '--temp-cool', min: 1 },
    { name: '冻结', icon: '⚫', color: '#6B7280', cssVar: '--temp-frozen', min: 0 }
  ];

  function getTempLevel(temp) {
    for (var i = 0; i < TEMP_LEVELS.length; i++) {
      if (temp >= TEMP_LEVELS[i].min) return TEMP_LEVELS[i];
    }
    return TEMP_LEVELS[TEMP_LEVELS.length - 1];
  }

  function calcStreakDays() {
    if (!appData.records || appData.records.length === 0) return 0;
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

  function calcTodayXp() {
    var todayKey = getTodayKey();
    var total = 0;
    for (var i = 0; i < appData.records.length; i++) {
      if (getDayKey(parseISO(appData.records[i].timestamp)) === todayKey) {
        total += appData.records[i].xp || 0;
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
        if (raw2) { var entry = JSON.parse(raw2); cached = entry.data; }
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

  function renderOverview() {
    var container = document.getElementById('page-overview');
    if (!container) return;
    try {
      var totalXp = appData.profile ? (appData.profile.totalXp || 0) : 0;
      var todayXp = calcTodayXp();
      var streak = calcStreakDays();
      var dayStatus = getDayStatus();
      var levelInfo = calcLevelInfo(totalXp);
      var levelTitle = getLevelTitle(totalXp);

      var html = '';
      html += '<div class="overview-hero">';
      html += '<div class="hero-level-card">';
      html += '<div class="hero-level-value">Lv' + levelInfo.level + '</div>';
      html += '<div class="hero-level-title">' + levelTitle.cn + '</div>';
      html += '<div class="hero-level-jp">' + levelTitle.name + '</div>';
      html += '</div>';
      html += '<div class="stat-card"><div class="stat-card-icon">⚡</div><div class="stat-card-value" style="color:var(--color-success)">+' + todayXp + '</div><div class="stat-card-label">今日XP</div></div>';
      html += '<div class="stat-card"><div class="stat-card-icon">🔥</div><div class="stat-card-value" style="color:var(--color-warning)">' + streak + '天</div><div class="stat-card-label">连续学习</div></div>';
      html += '<div class="stat-card"><div class="stat-card-icon">' + dayStatus.icon + '</div><div class="stat-card-value" style="color:' + dayStatus.color + '">' + dayStatus.text + '</div><div class="stat-card-label">每日状态</div></div>';
      html += '<div class="stat-card"><div class="stat-card-icon">🏆</div><div class="stat-card-value">' + formatNumber(totalXp) + '</div><div class="stat-card-label">总XP</div></div>';
      html += '</div>';

      html += '<div class="total-progress">';
      html += '<div class="progress-header"><span class="progress-label">总等级进度</span><span class="progress-value">' + formatNumber(levelInfo.xpInLevel) + ' / ' + formatNumber(levelInfo.xpNeeded) + ' XP</span></div>';
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + levelInfo.percent + '%"></div></div>';
      html += '</div>';

      html += '<div class="section-title">📊 学科等级</div>';
      html += '<div class="subject-grid" id="subjectGrid">';
      var subjectNames = ['数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
      for (var i = 0; i < subjectNames.length; i++) {
        var sn = subjectNames[i];
        var icon = SUBJECT_ICONS[sn] || '📚';
        var subjectScore = 0;
        var subjRecords = appData.records.filter(function (r) { return r.subject === sn; });
        if (subjRecords.length > 0) {
          var avgScore = subjRecords.reduce(function (s, r) { return s + (r.score || 0); }, 0) / subjRecords.length;
          subjectScore = Math.round(avgScore * 0.6 + Math.min(100, subjRecords.length * 5) * 0.4);
        }
        var sl = getLevelTitle(subjectScore);
        html += '<div class="subject-card" data-subject="' + sn + '">';
        html += '<div class="subject-card-icon">' + icon + '</div>';
        html += '<div class="subject-card-name">' + sn + '</div>';
        html += '<div class="subject-card-level">' + sl.cn + ' (' + sl.name + ')</div>';
        html += '<div class="subject-card-progress"><div class="progress-bar"><div class="progress-fill" style="width:' + subjectScore + '%"></div></div></div>';
        html += '<div class="subject-card-meta"><span>⭐ ' + (subjRecords.length > 0 ? Math.round(subjRecords.reduce(function (s, r) { return s + (r.xp || 0); }, 0)) : 0) + ' XP</span><span>' + subjRecords.length + ' 条记录</span></div>';
        html += '</div>';
      }
      html += '</div>';

      html += '<div class="fold-section">';
      html += '<div class="fold-header" onclick="var b=this.nextElementSibling;var a=this.querySelector(\'.fold-arrow\');b.classList.toggle(\'open\');a.classList.toggle(\'open\')"><span>▼ 更多数据</span><span class="fold-arrow">▼</span></div>';
      html += '<div class="fold-body">';
      html += '<div class="section-title" style="margin-top:16px">📅 学习日历</div>';
      html += '<div id="calendarHeatmap" style="overflow-x:auto;padding:8px 0"></div>';
      html += '<div class="section-title" style="margin-top:16px">📊 学习报告（近30天）</div>';
      html += '<div id="overviewChart" style="width:100%;height:280px"></div>';
      html += '<div class="section-title" style="margin-top:16px">📊 学科时长分布</div>';
      html += '<div id="subjectDurationChart" style="width:100%;height:280px"></div>';
      html += '<div class="section-title" style="margin-top:16px">📊 效率散点图（得分 × 时长）</div>';
      html += '<div id="efficiencyChart" style="width:100%;height:280px"></div>';
      html += '<div class="section-title" style="margin-top:16px">🕐 学习时段热力图</div>';
      html += '<div id="timeHeatmapChart" style="width:100%;height:280px"></div>';
      html += '<div class="section-title" style="margin-top:16px">🏆 成就徽章</div>';
      html += '<div id="achievementsOverview"></div>';
      html += '<div class="section-title" style="margin-top:16px">📚 教材进度</div>';
      html += '<div id="textbooksOverview"></div>';
      html += '<div class="section-title" style="margin-top:16px">🎬 网课资源</div>';
      html += '<div id="coursesOverview"></div>';
      html += '</div>';
      html += '</div>';

      container.innerHTML = html;
      var subjectGrid = document.getElementById('subjectGrid');
      if (subjectGrid) {
        subjectGrid.addEventListener('click', function (e) {
          var card = e.target.closest('.subject-card');
          if (!card) return;
          var subjectName = card.getAttribute('data-subject');
          if (subjectName) showSubjectDetail(subjectName);
        });
      }
      setTimeout(function () { renderCalendarHeatmap(); renderOverviewCharts(); renderEfficiencyChart(); renderTimeHeatmap(); renderAchievementsOverview(); renderTextbooksOverview(); renderCoursesOverview(); }, 100);
    } catch (e) {
      console.error('renderOverview failed:', e);
      renderFallbackOverview();
    }
  }

  function renderFallbackOverview() {
    var container = document.getElementById('page-overview');
    if (!container) return;
    try {
      var html = '<div style="padding:40px;text-align:center">';
      html += '<h2 style="color:var(--md-on-surface)">📚 学习RPG · 认知操作系统</h2>';
      html += '<p style="color:var(--md-on-surface-variant);margin:16px 0">数据加载中，请稍候或刷新页面重试</p>';
      html += '<div class="subject-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:12px;margin-top:24px">';
      var subjects = ['数学','语文','英语','物理','化学','生物','政治','历史','地理'];
      var icons = ['📐','📖','🔤','⚡','🧪','🧬','⚖️','📜','🌍'];
      for (var i = 0; i < subjects.length; i++) {
        html += '<div style="padding:16px;background:var(--md-surface-container);border-radius:12px;text-align:center;cursor:pointer" onclick="if(window._launchApp)window._launchApp()">';
        html += '<div style="font-size:28px">' + icons[i] + '</div>';
        html += '<div style="font-size:13px;font-weight:600;color:var(--md-on-surface);margin-top:4px">' + subjects[i] + '</div>';
        html += '</div>';
      }
      html += '</div></div>';
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = '<div style="padding:40px;text-align:center"><h2>请刷新页面</h2><p style="color:var(--md-on-surface-variant)">页面渲染出错，请刷新后重试</p></div>';
    }
  }

  function renderCalendarHeatmap() {
    var container = document.getElementById('calendarHeatmap');
    if (!container) return;
    var now = new Date();
    var dayXpMap = {};
    for (var i = 0; i < appData.records.length; i++) {
      var key = getDayKey(parseISO(appData.records[i].timestamp));
      dayXpMap[key] = (dayXpMap[key] || 0) + (appData.records[i].xp || 0);
    }
    var totalWeeks = 25;
    var startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (totalWeeks * 7 - 1));
    startDate.setHours(0, 0, 0, 0);
    while (startDate.getDay() !== 1 && startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }
    if (startDate.getDay() === 0) startDate.setDate(startDate.getDate() + 1);

    var weekLabels = ['', '一', '', '三', '', '五', ''];
    var html = '<div style="display:flex;gap:3px;font-size:11px">';
    html += '<div style="width:24px;flex-shrink:0"></div>';
    for (var w = 0; w < totalWeeks; w++) {
      var d = new Date(startDate);
      d.setDate(d.getDate() + w * 7);
      var monthLabel = (d.getDate() <= 7) ? (d.getMonth() + 1) + '月' : '';
      html += '<div style="width:13px;text-align:center;color:var(--md-on-surface-variant)">' + monthLabel + '</div>';
    }
    html += '</div>';

    for (var row = 0; row < 7; row++) {
      html += '<div style="display:flex;gap:3px;align-items:center;margin-top:2px">';
      html += '<div style="width:24px;text-align:right;font-size:10px;color:var(--md-on-surface-variant);flex-shrink:0">' + weekLabels[row] + '</div>';
      for (var col = 0; col < totalWeeks; col++) {
        var cellDate = new Date(startDate);
        cellDate.setDate(cellDate.getDate() + col * 7 + row);
        var cellKey = getDayKey(cellDate);
        var xp = dayXpMap[cellKey] || 0;
        var color;
        if (xp === 0) color = 'var(--md-surface-container-highest)';
        else if (xp <= 25) color = '#9be9a8';
        else if (xp <= 50) color = '#40c463';
        else if (xp <= 100) color = '#30a14e';
        else color = '#216e39';
        var title = cellKey + ': ' + xp + ' XP';
        var isFuture = cellDate > now;
        html += '<div style="width:13px;height:13px;border-radius:2px;background:' + (isFuture ? 'transparent' : color) + '" title="' + title + '"></div>';
      }
      html += '</div>';
    }
    html += '<div style="display:flex;gap:4px;align-items:center;margin-top:6px;font-size:10px;color:var(--md-on-surface-variant);justify-content:flex-end">';
    html += '<span>少</span>';
    html += '<span style="width:11px;height:11px;border-radius:2px;background:var(--md-surface-container-highest)"></span>';
    html += '<span style="width:11px;height:11px;border-radius:2px;background:#9be9a8"></span>';
    html += '<span style="width:11px;height:11px;border-radius:2px;background:#40c463"></span>';
    html += '<span style="width:11px;height:11px;border-radius:2px;background:#30a14e"></span>';
    html += '<span style="width:11px;height:11px;border-radius:2px;background:#216e39"></span>';
    html += '<span>多</span></div>';
    container.innerHTML = html;
  }

  function renderOverviewCharts() {
    var chartContainer = document.getElementById('overviewChart');
    if (!chartContainer || typeof echarts === 'undefined') return;
    var chart = echarts.init(chartContainer);
    var now = new Date();
    var dates = [];
    var xpValues = [];
    for (var i = 29; i >= 0; i--) {
      var d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(formatDateShort(d));
      xpValues.push(0);
    }
    for (var j = 0; j < appData.records.length; j++) {
      var idx = dates.indexOf(formatDateShort(parseISO(appData.records[j].timestamp)));
      if (idx >= 0) xpValues[idx] += (appData.records[j].xp || 0);
    }
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 16, top: 16, bottom: 24 },
      xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10, showMaxLabel: true, interval: 6 } },
      yAxis: { type: 'value', name: 'XP' },
      series: [{
        type: 'line', data: xpValues, smooth: true,
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(103,80,164,0.3)' }, { offset: 1, color: 'rgba(103,80,164,0.02)' }] } },
        lineStyle: { color: '#6750A4', width: 2 },
        itemStyle: { color: '#6750A4' }
      }]
    });
    window.addEventListener('resize', function () { chart.resize(); });

    var subjectChart = echarts.init(document.getElementById('subjectDurationChart'));
    var subjectNames = ['数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
    var subjectColors = ['#6366F1', '#EC4899', '#3B82F6', '#F59E0B', '#10B981', '#22D3EE', '#EF4444', '#8B5CF6', '#14B8A6'];
    var subjectData = subjectNames.map(function (sn, idx) {
      return {
        name: sn,
        value: appData.records.filter(function (r) { return r.subject === sn; }).reduce(function (s, r) { return s + (r.duration || 0); }, 0),
        itemStyle: { color: subjectColors[idx] }
      };
    });
    subjectChart.setOption({
      tooltip: { trigger: 'axis', formatter: function (p) { return p[0].name + ': ' + formatDuration(p[0].value); } },
      grid: { left: 40, right: 16, top: 16, bottom: 24 },
      xAxis: { type: 'category', data: subjectNames, axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', name: '分钟' },
      series: [{ type: 'bar', data: subjectData }]
    });
    window.addEventListener('resize', function () { subjectChart.resize(); });
  }

  function renderEfficiencyChart() {
    var container = document.getElementById('efficiencyChart');
    if (!container || typeof echarts === 'undefined') return;
    var chart = echarts.init(container);
    var subjectColors = ['#6366F1', '#EC4899', '#3B82F6', '#F59E0B', '#10B981', '#22D3EE', '#EF4444', '#8B5CF6', '#14B8A6'];
    var subjectNames = ['数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
    var seriesData = [];
    for (var si = 0; si < subjectNames.length; si++) {
      var subjRecords = appData.records.filter(function (r) { return r.subject === subjectNames[si] && r.score && r.duration; });
      var data = [];
      for (var ri = 0; ri < subjRecords.length; ri++) {
        data.push([subjRecords[ri].duration || 0, subjRecords[ri].score || 0]);
      }
      if (data.length > 0) {
        seriesData.push({ name: subjectNames[si], type: 'scatter', data: data, symbolSize: 8, itemStyle: { color: subjectColors[si] } });
      }
    }
    if (seriesData.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">暂无效率数据，完成学习记录后生成</div></div>';
      return;
    }
    chart.setOption({
      tooltip: { formatter: function (p) { return p.seriesName + '<br/>时长: ' + p.value[0] + '分钟<br/>得分: ' + p.value[1]; } },
      legend: { bottom: 0, textStyle: { fontSize: 10 } },
      grid: { left: 48, right: 16, top: 16, bottom: 40 },
      xAxis: { type: 'value', name: '时长(分钟)', nameTextStyle: { fontSize: 10 } },
      yAxis: { type: 'value', name: '得分', nameTextStyle: { fontSize: 10 }, max: 100 },
      series: seriesData
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }

  function renderTimeHeatmap() {
    var container = document.getElementById('timeHeatmapChart');
    if (!container || typeof echarts === 'undefined') return;
    var chart = echarts.init(container);
    var hours = ['0时', '2时', '4时', '6时', '8时', '10时', '12时', '14时', '16时', '18时', '20时', '22时'];
    var days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    var heatData = [];
    var countMap = {};
    for (var i = 0; i < appData.records.length; i++) {
      var ts = parseISO(appData.records[i].timestamp);
      if (!ts) continue;
      var dayIdx = (ts.getDay() + 6) % 7;
      var hourIdx = Math.floor(ts.getHours() / 2);
      var key = dayIdx + '_' + hourIdx;
      countMap[key] = (countMap[key] || 0) + 1;
    }
    for (var d = 0; d < 7; d++) {
      for (var h = 0; h < 12; h++) {
        var val = countMap[d + '_' + h] || 0;
        heatData.push([h, d, val || '-']);
      }
    }
    chart.setOption({
      tooltip: { formatter: function (p) { return days[p.value[1]] + ' ' + hours[p.value[0]] + '<br/>学习次数: ' + (p.value[2] === '-' ? 0 : p.value[2]); } },
      grid: { left: 48, right: 16, top: 16, bottom: 24 },
      xAxis: { type: 'category', data: hours, axisLabel: { fontSize: 9 }, splitArea: { show: true } },
      yAxis: { type: 'category', data: days, axisLabel: { fontSize: 10 }, splitArea: { show: true } },
      visualMap: { min: 0, max: Math.max(1, Math.max.apply(null, heatData.map(function (d) { return d[2] === '-' ? 0 : d[2]; }))), calculable: true, orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: ['#f0f0f0', '#9be9a8', '#40c463', '#30a14e', '#216e39'] } },
      series: [{ type: 'heatmap', data: heatData, label: { show: true, fontSize: 9 }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } } }]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }

  function renderAchievementsOverview() {
    var container = document.getElementById('achievementsOverview');
    if (!container) return;
    var achievements = (appData.achievements && appData.achievements.achievements) ? appData.achievements.achievements : [];
    if (achievements.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏆</div><div class="empty-state-text">成就数据加载中...</div></div>';
      return;
    }
    var rarityColors = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', legend: '#E040FB' };
    var streak = calcStreakDays();
    var totalRecords = appData.records.length;
    var unlocked = {};
    for (var i = 0; i < achievements.length; i++) {
      var a = achievements[i];
      var isUnlocked = false;
      if (a.id === 'first_step' && totalRecords >= 1) isUnlocked = true;
      if (a.id === 'week_warrior' && streak >= 7) isUnlocked = true;
      if (a.id === 'month_master' && streak >= 30) isUnlocked = true;
      if (a.id === 'quarter_queen' && streak >= 90) isUnlocked = true;
      if (a.id === 'half_year_hero' && streak >= 180) isUnlocked = true;
      if (a.id === 'year_legend' && streak >= 365) isUnlocked = true;
      unlocked[a.id] = isUnlocked;
    }
    var html = '<div style="display:flex;flex-wrap:wrap;gap:8px">';
    var shown = 0;
    for (var j = 0; j < achievements.length && shown < 12; j++) {
      var ach = achievements[j];
      var isUnlocked = unlocked[ach.id];
      shown++;
      html += '<div style="padding:8px 12px;border-radius:12px;background:' + (isUnlocked ? 'var(--md-surface-container)' : 'var(--md-surface-container-lowest)') + ';border:1px solid ' + (isUnlocked ? (rarityColors[ach.rarity] || 'var(--md-outline)') : 'var(--md-outline-variant)') + ';opacity:' + (isUnlocked ? '1' : '0.4') + ';display:flex;align-items:center;gap:6px;font-size:12px">';
      html += '<span style="font-size:20px">' + (ach.icon || '🏆') + '</span>';
      html += '<div><div style="font-weight:600;color:var(--md-on-surface)">' + escapeHtml(ach.name) + '</div><div style="font-size:10px;color:var(--md-on-surface-variant)">' + escapeHtml(ach.description) + '</div></div>';
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function renderTextbooksOverview() {
    var container = document.getElementById('textbooksOverview');
    if (!container) return;
    var textbooks = (appData.textbooks && appData.textbooks.textbooks) ? appData.textbooks.textbooks : [];
    if (textbooks.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">教材数据加载中...</div></div>';
      return;
    }
    var subjectGroups = {};
    for (var i = 0; i < textbooks.length; i++) {
      var tb = textbooks[i];
      if (!subjectGroups[tb.subject]) subjectGroups[tb.subject] = [];
      subjectGroups[tb.subject].push(tb);
    }
    var html = '';
    var subjects = Object.keys(subjectGroups);
    for (var si = 0; si < subjects.length; si++) {
      var subj = subjects[si];
      var tbs = subjectGroups[subj];
      var total = tbs.length;
      var completed = tbs.filter(function (t) { return t.status === '已完成'; }).length;
      var learning = tbs.filter(function (t) { return t.status === '学习中'; }).length;
      var progress = total > 0 ? Math.round((completed + learning * 0.5) / total * 100) : 0;
      html += '<div style="margin-bottom:12px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
      html += '<span style="font-size:13px;font-weight:500;color:var(--md-on-surface)">' + (SUBJECT_ICONS[subj] || '📚') + ' ' + escapeHtml(subj) + '</span>';
      html += '<span style="font-size:11px;color:var(--md-on-surface-variant)">' + completed + '已完成 ' + learning + '进行中 / ' + total + '本</span>';
      html += '</div>';
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + progress + '%"></div></div>';
      html += '</div>';
    }
    container.innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">暂无教材数据</div></div>';
  }

  function renderCoursesOverview() {
    var container = document.getElementById('coursesOverview');
    if (!container) return;
    var courses = appData.courses;
    if (!courses || !courses.courses) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎬</div><div class="empty-state-text">网课数据加载中...</div></div>';
      return;
    }
    var html = '';
    var subjectKeys = Object.keys(courses.courses);
    var shown = 0;
    for (var si = 0; si < subjectKeys.length && shown < 6; si++) {
      var subj = subjectKeys[si];
      var courseData = courses.courses[subj];
      var syncCourses = courseData.syncCourses || [];
      for (var ci = 0; ci < syncCourses.length && shown < 6; ci++) {
        var c = syncCourses[ci];
        shown++;
        html += '<div style="padding:8px 12px;background:var(--md-surface-container);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">';
        html += '<div><div style="font-size:13px;font-weight:500;color:var(--md-on-surface)">' + escapeHtml(c.name) + '</div><div style="font-size:11px;color:var(--md-on-surface-variant)">👨‍🏫 ' + escapeHtml(c.teacher || '') + ' · ' + (c.chapters ? c.chapters.length + '章' : '') + '</div></div>';
        html += '<span style="font-size:20px">' + (SUBJECT_ICONS[subj] || '🎬') + '</span>';
        html += '</div>';
      }
    }
    container.innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">🎬</div><div class="empty-state-text">暂无网课数据</div></div>';
  }

  function renderSkillTree() {
    var container = document.getElementById('page-skills');
    if (!container) return;
    var html = '<div class="section-title">🌳 技能树图谱</div>';
    html += '<div id="skillTreeFilters" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">';
    var allSubjects = ['全部', '数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
    for (var fi = 0; fi < allSubjects.length; fi++) {
      var isActive = fi === 0 ? ' active' : '';
      html += '<button class="skill-filter-chip' + isActive + '" data-filter="' + (fi === 0 ? 'all' : allSubjects[fi]) + '" style="padding:4px 12px;border-radius:16px;border:1px solid var(--md-outline);background:var(--md-surface);font-size:12px;cursor:pointer;transition:all 0.2s">' + allSubjects[fi] + '</button>';
    }
    html += '</div>';
    html += '<div class="skill-tree-legend" style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;font-size:11px">';
    var tempLevels = [{ name: '炙热', icon: '🔥', color: '#FF4500' }, { name: '温热', icon: '🟠', color: '#FF8C00' }, { name: '温暖', icon: '🟡', color: '#FFD700' }, { name: '正常', icon: '🟢', color: '#62A0EA' }, { name: '微凉', icon: '🔵', color: '#1A5FB4' }, { name: '冻结', icon: '⚫', color: '#6B7280' }];
    for (var ti = 0; ti < tempLevels.length; ti++) {
      html += '<span style="display:flex;align-items:center;gap:4px"><span class="legend-dot" style="width:10px;height:10px;border-radius:50%;display:inline-block;background:' + tempLevels[ti].color + '"></span>' + tempLevels[ti].icon + ' ' + tempLevels[ti].name + '</span>';
    }
    html += '</div>';
    html += '<div id="skillGraphContainer" class="skill-tree-container" style="min-height:350px;max-height:500px"></div>';
    html += '<div id="nodeDetailPanel" class="node-detail-panel"></div>';
    html += '<div class="section-title" style="margin-top:20px">🎯 学科能力雷达图</div>';
    html += '<div id="skillRadarChart" style="width:100%;height:320px"></div>';
    container.innerHTML = html;

    var filterChips = container.querySelectorAll('.skill-filter-chip');
    for (var fc = 0; fc < filterChips.length; fc++) {
      filterChips[fc].addEventListener('click', function () {
        var chips = container.querySelectorAll('.skill-filter-chip');
        for (var c = 0; c < chips.length; c++) {
          chips[c].classList.remove('active');
          chips[c].style.background = 'var(--md-surface)';
          chips[c].style.color = 'var(--md-on-surface)';
        }
        this.classList.add('active');
        this.style.background = 'var(--md-primary)';
        this.style.color = 'var(--md-on-primary)';
        currentSkillFilter = this.getAttribute('data-filter');
        renderSkillGraph();
      });
    }
    var firstChip = container.querySelector('.skill-filter-chip.active');
    if (firstChip) {
      firstChip.style.background = 'var(--md-primary)';
      firstChip.style.color = 'var(--md-on-primary)';
    }
    currentSkillFilter = 'all';
    setTimeout(function () { renderSkillGraph(); renderSkillRadar(); }, 200);
  }

  var currentSkillFilter = 'all';

  function renderSkillGraph() {
    var container = document.getElementById('skillGraphContainer');
    if (!container || typeof echarts === 'undefined') return;
    var states = buildKnowledgeStates(appData.records, appData.skillTree);
    var nodes = [];
    var links = [];
    var seen = {};
    var subjectGroups = {};
    for (var key in states) {
      if (!states.hasOwnProperty(key)) continue;
      var ks = states[key];
      var subj = ks.subject || '未知';
      if (currentSkillFilter !== 'all' && subj !== currentSkillFilter) continue;
      var temp = calcTemp(ks.peakTemp, ks.lastStudy, ks.halfLife);
      var tl = getTempLevel(temp);
      if (!subjectGroups[subj]) subjectGroups[subj] = [];
      nodes.push({
        name: key,
        symbolSize: 10 + temp * 0.25,
        value: temp,
        itemStyle: { color: tl.color },
        category: subj,
        label: { show: temp > 30, fontSize: 10 },
        data: ks
      });
      seen[key] = true;
      subjectGroups[subj].push(key);
    }
    var subjKeys = Object.keys(subjectGroups);
    for (var si = 0; si < subjKeys.length; si++) {
      var group = subjectGroups[subjKeys[si]];
      for (var gi = 0; gi < group.length - 1; gi++) {
        links.push({ source: group[gi], target: group[gi + 1], lineStyle: { opacity: 0.3 } });
      }
    }
    if (nodes.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🌳</div><div class="empty-state-text">还没有学习记录，开始记录后技能树会自动生成</div></div>';
      return;
    }
    var existingInstance = echarts.getInstanceByDom(container);
    if (existingInstance) existingInstance.dispose();
    var chart = echarts.init(container);
    chart.setOption({
      tooltip: { formatter: function (p) { return p.name + '<br/>温度: ' + p.value + '°'; } },
      series: [{
        type: 'graph', layout: 'force', roam: true, draggable: true,
        force: { repulsion: 300, gravity: 0.08, edgeLength: [100, 250] },
        data: nodes, links: links,
        lineStyle: { color: 'var(--md-outline-variant)', curveness: 0.2, opacity: 0.3 },
        emphasis: { focus: 'adjacency', lineStyle: { width: 2 } }
      }]
    });
    chart.on('click', function (params) {
      if (params.dataType === 'node') {
        showNodeDetail(params.data);
      }
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }

  function renderSkillRadar() {
    var container = document.getElementById('skillRadarChart');
    if (!container || typeof echarts === 'undefined') return;
    var existingInstance = echarts.getInstanceByDom(container);
    if (existingInstance) existingInstance.dispose();
    var chart = echarts.init(container);
    var states = buildKnowledgeStates(appData.records, appData.skillTree);
    var subjectNames = ['数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
    var radarData = [];
    var skillTree = appData.skillTree;
    if (!skillTree || !skillTree.subjects) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-text">技能树数据加载中...</div></div>';
      return;
    }
    for (var i = 0; i < subjectNames.length; i++) {
      var sn = subjectNames[i];
      var key = NAME_TO_KEY[sn];
      if (!key || !skillTree.subjects[key]) continue;
      var subjectSkills = skillTree.subjects[key].skills;
      var skillMasteries = {};
      var skillIds = Object.keys(subjectSkills);
      for (var si = 0; si < skillIds.length; si++) {
        skillMasteries[skillIds[si]] = aggregateSkillMastery(states, subjectSkills[skillIds[si]]);
      }
      var ability = aggregateSubjectAbility(skillMasteries, subjectSkills);
      radarData.push({ name: sn, max: 100 });
    }
    var indicatorData = [];
    for (var ri = 0; ri < radarData.length; ri++) {
      indicatorData.push(radarData[ri]);
    }
    var values = [];
    for (var vi = 0; vi < subjectNames.length; vi++) {
      var sn2 = subjectNames[vi];
      var key2 = NAME_TO_KEY[sn2];
      if (!key2 || !skillTree.subjects[key2]) { values.push(0); continue; }
      var subjSkills = skillTree.subjects[key2].skills;
      var sm = {};
      var sids = Object.keys(subjSkills);
      for (var si2 = 0; si2 < sids.length; si2++) {
        sm[sids[si2]] = aggregateSkillMastery(states, subjSkills[sids[si2]]);
      }
      values.push(aggregateSubjectAbility(sm, subjSkills));
    }
    chart.setOption({
      tooltip: {},
      radar: {
        indicator: indicatorData,
        shape: 'polygon',
        center: ['50%', '55%'],
        radius: '65%'
      },
      series: [{
        type: 'radar',
        data: [{ value: values, name: '学科能力', areaStyle: { color: 'rgba(103,80,164,0.2)' }, lineStyle: { color: '#6750A4', width: 2 }, itemStyle: { color: '#6750A4' } }]
      }]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }

  function showNodeDetail(nodeData) {
    var panel = document.getElementById('nodeDetailPanel');
    if (!panel) return;
    var ks = nodeData.data || {};
    var temp = nodeData.value || 0;
    var tl = getTempLevel(temp);
    var avgAcc = ks.accuracyHistory && ks.accuracyHistory.length > 0
      ? Math.round(ks.accuracyHistory.reduce(function (s, v) { return s + v; }, 0) / ks.accuracyHistory.length)
      : 0;
    var html = '<div class="node-detail-header">';
    html += '<div><div class="node-detail-title">' + escapeHtml(nodeData.name) + '</div><div class="node-detail-subtitle">' + escapeHtml(ks.subject || '') + '</div></div>';
    html += '<div class="node-detail-temp" style="color:' + tl.color + '">' + tl.icon + ' ' + temp + '°</div></div>';
    html += '<div class="node-detail-stats">';
    html += '<div class="node-stat"><div class="node-stat-value">' + (ks.repetitions || 0) + '</div><div class="node-stat-label">复习次数</div></div>';
    html += '<div class="node-stat"><div class="node-stat-value">' + (ks.halfLife || 0) + '天</div><div class="node-stat-label">半衰期</div></div>';
    html += '<div class="node-stat"><div class="node-stat-value">' + avgAcc + '%</div><div class="node-stat-label">正确率</div></div>';
    html += '<div class="node-stat"><div class="node-stat-value">' + (ks.totalXp || 0) + '</div><div class="node-stat-label">累计XP</div></div>';
    html += '</div>';
    panel.innerHTML = html;
    panel.classList.add('visible');
  }

  function showSubjectDetail(subjectName) {
    var subjectKey = NAME_TO_KEY[subjectName];
    if (!subjectKey) return;
    var icon = SUBJECT_ICONS[subjectName] || '📚';
    var subjectRecords = appData.records.filter(function (r) { return r.subject === subjectName; });
    var totalXp = subjectRecords.reduce(function (s, r) { return s + (r.xp || 0); }, 0);
    var subjectScore = 0;
    if (subjectRecords.length > 0) {
      var avgScore = subjectRecords.reduce(function (s, r) { return s + (r.score || 0); }, 0) / subjectRecords.length;
      subjectScore = Math.round(avgScore * 0.6 + Math.min(100, subjectRecords.length * 5) * 0.4);
    }
    var sl = getLevelTitle(subjectScore);
    var states = buildKnowledgeStates(appData.records, appData.skillTree);
    var skills = (appData.skillTree && appData.skillTree.subjects && appData.skillTree.subjects[subjectKey])
      ? appData.skillTree.subjects[subjectKey].skills : {};
    var skillKeys = Object.keys(skills);
    var totalKps = 0;
    var masteredKps = 0;
    for (var sk = 0; sk < skillKeys.length; sk++) {
      var sks = skills[skillKeys[sk]];
      if (sks.knowledgePoints) {
        for (var k = 0; k < sks.knowledgePoints.length; k++) {
          totalKps++;
          var ks = states[sks.knowledgePoints[k]];
          if (ks) {
            var ktemp = calcTemp(ks.peakTemp || 80, ks.lastStudy, ks.halfLife || 3);
            if (ktemp >= 60) masteredKps++;
          }
        }
      }
    }

    var html = '';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">';
    html += '<h3 style="font-size:18px;display:flex;align-items:center;gap:8px"><span style="font-size:24px">' + icon + '</span>' + escapeHtml(subjectName) + '</h3>';
    html += '<button class="btn-icon" onclick="closeModal()" style="background:transparent;border:none;font-size:20px;cursor:pointer;color:var(--md-on-surface-variant)">✕</button>';
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">';
    html += '<div style="text-align:center;padding:12px;background:var(--md-surface-container);border-radius:12px"><div style="font-size:24px;font-weight:700;color:var(--md-primary)">' + sl.cn + '</div><div style="font-size:12px;color:var(--md-on-surface-variant);margin-top:4px">等级称号</div></div>';
    html += '<div style="text-align:center;padding:12px;background:var(--md-surface-container);border-radius:12px"><div style="font-size:24px;font-weight:700;color:var(--color-success)">' + formatNumber(totalXp) + '</div><div style="font-size:12px;color:var(--md-on-surface-variant);margin-top:4px">累计XP</div></div>';
    html += '<div style="text-align:center;padding:12px;background:var(--md-surface-container);border-radius:12px"><div style="font-size:24px;font-weight:700;color:var(--color-warning)">' + masteredKps + '/' + totalKps + '</div><div style="font-size:12px;color:var(--md-on-surface-variant);margin-top:4px">掌握知识点</div></div>';
    html += '</div>';

    html += '<div style="margin-bottom:16px"><div style="font-size:14px;font-weight:600;color:var(--md-on-surface);margin-bottom:8px">📊 技能列表</div>';

    for (var si = 0; si < skillKeys.length; si++) {
      var skill = skills[skillKeys[si]];
      var mastery = aggregateSkillMastery(states, skill);
      var kpCount = skill.knowledgePoints ? skill.knowledgePoints.length : 0;
      var kpMastered = 0;
      if (skill.knowledgePoints) {
        for (var kp = 0; kp < skill.knowledgePoints.length; kp++) {
          var kks = states[skill.knowledgePoints[kp]];
          if (kks) {
            var ktemp2 = calcTemp(kks.peakTemp || 80, kks.lastStudy, kks.halfLife || 3);
            if (ktemp2 >= 60) kpMastered++;
          }
        }
      }
      var barColor = mastery >= 80 ? 'var(--color-success)' : mastery >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
      html += '<div style="padding:10px 12px;background:var(--md-surface-container);border-radius:8px;margin-bottom:8px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
      html += '<span style="font-size:13px;font-weight:500;color:var(--md-on-surface)">' + escapeHtml(skill.name) + '</span>';
      html += '<span style="font-size:12px;color:' + barColor + ';font-weight:600">' + mastery + '%</span>';
      html += '</div>';
      html += '<div style="display:flex;align-items:center;gap:8px">';
      html += '<div style="flex:1;height:6px;background:var(--md-surface-container-highest);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + mastery + '%;background:' + barColor + ';border-radius:3px"></div></div>';
      html += '<span style="font-size:11px;color:var(--md-on-surface-variant);white-space:nowrap">' + kpMastered + '/' + kpCount + ' 知识点</span>';
      html += '</div>';
      html += '<div style="font-size:11px;color:var(--md-on-surface-variant);margin-top:4px">' + escapeHtml(skill.description || '') + '</div>';
      html += '</div>';
    }
    html += '</div>';

    if (subjectRecords.length > 0) {
      html += '<div style="font-size:14px;font-weight:600;color:var(--md-on-surface);margin-bottom:8px">📝 最近学习记录</div>';
      var recentRecords = subjectRecords.slice(-5).reverse();
      for (var ri = 0; ri < recentRecords.length; ri++) {
        var rr = recentRecords[ri];
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--md-outline-variant);font-size:12px">';
        html += '<span style="color:var(--md-on-surface)">' + escapeHtml(rr.activity || '学习') + '</span>';
        html += '<span style="color:var(--md-on-surface-variant)">' + formatDate(parseISO(rr.timestamp)) + '</span>';
        html += '<span style="color:var(--color-success);font-weight:600">+' + (rr.xp || 0) + ' XP</span>';
        html += '</div>';
      }
    } else {
      html += '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">暂无学习记录</div></div>';
    }

    openModal(html);
  }

  function renderReviewCenter() {
    var container = document.getElementById('page-review');
    if (!container) return;
    var states = buildKnowledgeStates(appData.records, appData.skillTree);
    var queue = calcShadowQueue(states);
    var html = '<div class="section-title">🔄 复习中心</div>';

    html += '<div class="review-section-toggle" onclick="var s=this.parentElement;s.classList.toggle(\'expanded\')"><span>📉 遗忘曲线模拟</span><span class="review-toggle-icon">▼</span></div>';
    html += '<div class="review-curve-body"><div id="forgetCurveChart" style="width:100%;height:250px;margin-top:8px"></div></div>';

    html += '<div class="shadow-queue-section">';
    html += '<div class="section-title">🌙 待复习知识点（阴影队列）</div>';
    if (queue.length === 0) {
      html += '<div class="empty-state"><div class="empty-state-icon">🌙</div><div class="empty-state-text">暂无需要复习的知识点</div></div>';
    } else {
      for (var i = 0; i < Math.min(queue.length, 10); i++) {
        var item = queue[i];
        var tl = getTempLevel(item.temp);
        var urgencyColor = item.temp < 20 ? 'var(--color-danger)' : item.temp < 40 ? 'var(--color-warning)' : 'var(--color-success)';
        html += '<div class="shadow-item" style="padding:10px 12px;background:var(--md-surface-container);border-radius:8px;margin-bottom:6px;cursor:pointer" onclick="window._startReviewItem(\'' + escapeHtml(item.name) + '\')">';
        html += '<div class="shadow-item-header"><span class="shadow-item-name">' + tl.icon + ' ' + escapeHtml(item.name) + '</span><span class="shadow-item-urgency" style="background:' + urgencyColor + '20;color:' + urgencyColor + ';padding:2px 8px;border-radius:8px;font-size:11px">' + item.temp + '°</span></div>';
        html += '<div class="shadow-item-meta">上次复习: ' + item.daysSinceLast + '天前 · 半衰期: ' + item.halfLife + '天 · 优先级: ' + Math.round(item.priority * 10) + '/10</div>';
        html += '</div>';
      }
    }
    html += '</div>';

    html += '<div style="margin-top:16px"><div class="section-title">🎯 智能复习推荐（背包算法）</div>';
    var knapsackItems = queue.slice(0, 10).map(function (item) {
      return { name: item.name, cost: 5 + Math.round(item.temp / 20), benefit: Math.round(item.priority * 10) };
    });
    var result = knapsackRecommend(knapsackItems, 45);
    html += '<div class="glass-card" style="padding:14px;background:var(--md-surface-container);border-radius:12px;margin-bottom:12px"><div style="font-weight:600;margin-bottom:8px">📋 今日推荐复习计划（时间预算: 45分钟）</div>';
    html += '<div style="font-size:14px;color:var(--md-on-surface-variant);margin-bottom:8px">推荐 ' + result.items.length + ' 个知识点 · 预计收益: ' + result.totalBenefit + ' 温度点 · 预计耗时: ' + result.totalCost + ' 分钟</div>';
    if (result.items.length > 0) {
      for (var ri = 0; ri < result.items.length; ri++) {
        html += '<div style="font-size:13px;padding:4px 0;display:flex;align-items:center;gap:8px">📌 ' + escapeHtml(result.items[ri].name) + ' <span style="font-size:11px;color:var(--md-on-surface-variant)">约' + result.items[ri].cost + '分钟</span></div>';
      }
      html += '<button class="btn btn-primary" style="margin-top:10px;width:100%" onclick="window._startReviewPlan()">▶ 开始今日复习计划</button>';
    }
    html += '</div></div>';

    var allSkills = [];
    var falseMasteryWarnings = [];
    if (appData.skillTree && appData.skillTree.subjects) {
      var subjKeys = Object.keys(appData.skillTree.subjects);
      for (var sk = 0; sk < subjKeys.length; sk++) {
        var subjSkills = appData.skillTree.subjects[subjKeys[sk]].skills;
        var skillIds = Object.keys(subjSkills);
        for (var sid = 0; sid < skillIds.length; sid++) {
          var skill = subjSkills[skillIds[sid]];
          var mastery = aggregateSkillMastery(states, skill);
          var examWeight = skill.examWeight || 0.15;
          var recentRecords = appData.records.filter(function (r) {
            return r.subject === appData.skillTree.subjects[subjKeys[sk]].name && r.knowledgePoints && r.knowledgePoints.some(function (kp) { return (skill.knowledgePoints || []).indexOf(kp) >= 0; });
          });
          var recentCount = recentRecords.length;
          var recentInvestment = Math.min(1, recentCount / 20);
          allSkills.push({
            name: skill.name,
            subject: appData.skillTree.subjects[subjKeys[sk]].name,
            mastery: mastery / 100,
            examWeight: examWeight,
            recentInvestment: recentInvestment,
            temp: mastery,
            recentScores: recentRecords.slice(-5).map(function (r) { return r.score || 0; }),
            reviewRatio: recentCount / Math.max(1, appData.records.length)
          });
        }
      }
    }

    var improvementList = calcImprovementPotential(allSkills);
    if (improvementList.length > 0) {
      html += '<div class="section-title" style="margin-top:16px">📈 提分潜力诊断（Top 5）</div>';
      html += '<div style="margin-bottom:12px">';
      for (var pi = 0; pi < improvementList.length; pi++) {
        var pot = improvementList[pi];
        var potColor = pot.potential > 0.15 ? 'var(--color-success)' : pot.potential > 0.08 ? 'var(--color-warning)' : 'var(--md-on-surface-variant)';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--md-surface-container);border-radius:8px;margin-bottom:6px">';
        html += '<div><div style="font-size:13px;font-weight:500;color:var(--md-on-surface)">' + escapeHtml(pot.name) + '</div><div style="font-size:11px;color:var(--md-on-surface-variant)">当前掌握: ' + Math.round(pot.mastery * 100) + '% · 考试权重: ' + Math.round(pot.examWeight * 100) + '%</div></div>';
        html += '<div style="text-align:right"><div style="font-size:16px;font-weight:700;color:' + potColor + '">' + Math.round(pot.potential * 100) + '</div><div style="font-size:10px;color:var(--md-on-surface-variant)">潜力分</div></div>';
        html += '</div>';
      }
      html += '</div>';
    }

    for (var fi = 0; fi < allSkills.length; fi++) {
      var fw = detectFalseMastery(allSkills[fi]);
      if (fw) falseMasteryWarnings.push(fw);
    }
    if (falseMasteryWarnings.length > 0) {
      html += '<div class="section-title" style="margin-top:16px">⚠️ 假性熟练警告</div>';
      for (var fwi = 0; fwi < falseMasteryWarnings.length; fwi++) {
        var fwItem = falseMasteryWarnings[fwi];
        html += '<div style="padding:10px 12px;background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;margin-bottom:6px;font-size:12px">';
        html += '<div style="font-weight:600;color:#92400E;margin-bottom:4px">⚠️ ' + escapeHtml(fwItem.name) + '</div>';
        html += '<div style="color:#A16207">准确率 ' + fwItem.accuracy + '% · 复习率 ' + fwItem.reviewRatio + '% · 温度 ' + fwItem.temp + '° — ' + fwItem.warning + '</div>';
        html += '</div>';
      }
    }

    var reviewHistory = loadLocal('reviewSessions') || [];
    if (reviewHistory.length > 0) {
      html += '<div class="section-title" style="margin-top:16px">📋 复习记录追踪</div>';
      var recentReviews = reviewHistory.slice(-5).reverse();
      for (var rhi = 0; rhi < recentReviews.length; rhi++) {
        var rh = recentReviews[rhi];
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--md-surface-container);border-radius:8px;margin-bottom:4px;font-size:12px">';
        html += '<span style="color:var(--md-on-surface)">复习了 ' + (rh.itemCount || 0) + ' 个知识点</span>';
        html += '<span style="color:var(--md-on-surface-variant)">' + formatDate(parseISO(rh.timestamp)) + '</span>';
        html += '<span style="color:var(--color-success);font-weight:600">+' + (rh.xpGained || 0) + ' XP</span>';
        html += '</div>';
      }
    }

    container.innerHTML = html;
    setTimeout(function () { renderForgetCurve(); }, 200);
  }

  window._startReviewItem = function (itemName) {
    showToast('开始复习: ' + itemName, 'info');
    var session = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      itemCount: 1,
      items: [itemName],
      xpGained: Math.floor(Math.random() * 20) + 5
    };
    var reviewHistory = loadLocal('reviewSessions') || [];
    reviewHistory.push(session);
    saveLocal('reviewSessions', reviewHistory);
    setTimeout(function () {
      showToast('✅ 复习完成: ' + itemName + ' (+' + session.xpGained + ' XP)', 'success');
      if (appData.profile) {
        appData.profile.totalXp = (appData.profile.totalXp || 0) + session.xpGained;
        saveAppData();
      }
      renderReviewCenter();
      renderOverview();
    }, 500);
  };

  window._startReviewPlan = function () {
    var states = buildKnowledgeStates(appData.records, appData.skillTree);
    var queue = calcShadowQueue(states);
    var knapsackItems = queue.slice(0, 10).map(function (item) {
      return { name: item.name, cost: 5 + Math.round(item.temp / 20), benefit: Math.round(item.priority * 10) };
    });
    var result = knapsackRecommend(knapsackItems, 45);
    if (result.items.length === 0) {
      showToast('暂无推荐复习内容', 'info');
      return;
    }
    var session = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      itemCount: result.items.length,
      items: result.items.map(function (i) { return i.name; }),
      xpGained: result.totalBenefit
    };
    var reviewHistory = loadLocal('reviewSessions') || [];
    reviewHistory.push(session);
    saveLocal('reviewSessions', reviewHistory);
    if (appData.profile) {
      appData.profile.totalXp = (appData.profile.totalXp || 0) + session.xpGained;
      saveAppData();
    }
    showToast('🎉 复习计划完成！+ ' + session.xpGained + ' XP', 'success');
    renderReviewCenter();
    renderOverview();
  };

  function renderForgetCurve() {
    var container = document.getElementById('forgetCurveChart');
    if (!container || typeof echarts === 'undefined') return;
    var chart = echarts.init(container);
    var days = [0, 1, 2, 3, 5, 7, 10, 14];
    var temps = days.map(function (d) { return Math.round(80 * Math.pow(2, -d / 3)); });
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 16, top: 16, bottom: 24 },
      xAxis: { type: 'category', data: days.map(function (d) { return d + '天'; }), name: '距上次学习' },
      yAxis: { type: 'value', name: '保留率(%)', max: 100 },
      series: [
        { type: 'line', data: temps, name: '记忆保留', smooth: true, lineStyle: { color: '#3B82F6', width: 2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.2)' }, { offset: 1, color: 'rgba(59,130,246,0.02)' }] } } },
        { type: 'line', data: [80, 80, 80, 80, 80, 80, 80, 80], name: '复习阈值', lineStyle: { type: 'dashed', color: '#10B981', width: 1.5 }, symbol: 'none' }
      ]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }

  var logPage = 1;
  var logPageSize = 20;

  function renderLog() {
    var container = document.getElementById('page-log');
    if (!container) return;
    var records = appData.records || [];
    var html = '<div class="section-title">📊 学习日志</div>';
    html += '<div class="log-controls" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">';
    html += '<select class="select" id="logFilterSubject" onchange="window._renderLogFiltered()"><option value="">全部学科</option>';
    var subjectNames = ['数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
    for (var i = 0; i < subjectNames.length; i++) {
      html += '<option value="' + subjectNames[i] + '">' + subjectNames[i] + '</option>';
    }
    html += '</select>';
    html += '<input class="input" id="logSearch" placeholder="搜索知识点..." oninput="window._renderLogFiltered()" style="flex:1;min-width:150px">';
    html += '</div>';
    html += '<div id="logList"></div>';
    html += '<div id="logPagination" style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:16px"></div>';
    container.innerHTML = html;
    logPage = 1;
    window._renderLogFiltered();
  }

  window._renderLogFiltered = function () {
    var filterSubject = document.getElementById('logFilterSubject') ? document.getElementById('logFilterSubject').value : '';
    var searchVal = document.getElementById('logSearch') ? document.getElementById('logSearch').value.toLowerCase() : '';
    var records = (appData.records || []).slice().reverse();
    var filtered = records.filter(function (r) {
      if (filterSubject && r.subject !== filterSubject) return false;
      if (searchVal) {
        var kps = (r.knowledgePoints || []).join(' ').toLowerCase();
        var subject = (r.subject || '').toLowerCase();
        if (kps.indexOf(searchVal) < 0 && subject.indexOf(searchVal) < 0) return false;
      }
      return true;
    });
    var totalPages = Math.ceil(filtered.length / logPageSize) || 1;
    if (logPage > totalPages) logPage = totalPages;
    var start = (logPage - 1) * logPageSize;
    var pageItems = filtered.slice(start, start + logPageSize);

    var listEl = document.getElementById('logList');
    if (!listEl) return;
    if (pageItems.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">没有匹配的学习记录</div></div>';
    } else {
      var html = '';
      for (var j = 0; j < pageItems.length; j++) {
        var r = pageItems[j];
        html += '<div class="log-item" data-id="' + r.id + '" style="padding:12px;background:var(--md-surface-container);border-radius:10px;margin-bottom:8px">';
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
        html += '<div style="flex:1"><div class="log-item-header"><span class="log-item-subject" style="font-weight:600">' + (SUBJECT_ICONS[r.subject] || '📚') + ' ' + escapeHtml(r.subject || '未知') + '</span><span class="log-item-xp" style="color:var(--color-success);font-weight:700">+' + (r.xp || 0) + ' XP</span></div>';
        html += '<div class="log-item-detail" style="font-size:12px;color:var(--md-on-surface-variant);margin-top:4px">' + formatDate(r.timestamp) + ' · ' + formatDuration(r.duration || 0) + ' · 正确率 ' + (r.score || 0) + '%</div>';
        if (r.knowledgePoints && r.knowledgePoints.length > 0) {
          html += '<div style="font-size:12px;color:var(--md-on-surface-variant);margin-top:2px">知识点：' + escapeHtml(r.knowledgePoints.join(', ')) + '</div>';
        }
        if (r.notes) {
          html += '<div style="font-size:11px;color:var(--md-on-surface-variant);margin-top:2px;font-style:italic">💬 ' + escapeHtml(r.notes) + '</div>';
        }
        html += '</div>';
        html += '<div style="display:flex;gap:4px;flex-shrink:0">';
        html += '<button class="btn-icon" onclick="window._editLogItem(\'' + r.id + '\')" style="padding:4px 8px;font-size:11px;border:1px solid var(--md-outline);border-radius:6px;background:transparent;cursor:pointer" title="编辑">✏️</button>';
        html += '<button class="btn-icon" onclick="window._deleteLogItem(\'' + r.id + '\')" style="padding:4px 8px;font-size:11px;border:1px solid var(--md-outline);border-radius:6px;background:transparent;cursor:pointer;color:var(--color-danger)" title="删除">🗑️</button>';
        html += '</div></div></div>';
      }
      listEl.innerHTML = html;
    }

    var pagEl = document.getElementById('logPagination');
    if (pagEl) {
      var pagHtml = '';
      pagHtml += '<button class="btn btn-ghost" ' + (logPage <= 1 ? 'disabled' : '') + ' onclick="window._goLogPage(' + (logPage - 1) + ')" style="padding:4px 12px;font-size:12px">◀ 上一页</button>';
      pagHtml += '<span style="font-size:12px;color:var(--md-on-surface-variant)">第 ' + logPage + ' / ' + totalPages + ' 页（共 ' + filtered.length + ' 条）</span>';
      pagHtml += '<button class="btn btn-ghost" ' + (logPage >= totalPages ? 'disabled' : '') + ' onclick="window._goLogPage(' + (logPage + 1) + ')" style="padding:4px 12px;font-size:12px">下一页 ▶</button>';
      pagEl.innerHTML = pagHtml;
    }
  };

  window._goLogPage = function (page) {
    logPage = page;
    window._renderLogFiltered();
  };

  window._deleteLogItem = function (id) {
    if (!confirm('确定要删除这条学习记录吗？此操作不可撤销。')) return;
    appData.records = appData.records.filter(function (r) { return r.id !== id; });
    if (appData.profile) {
      appData.profile.totalXp = appData.records.reduce(function (s, r) { return s + (r.xp || 0); }, 0);
    }
    saveAppData();
    showToast('🗑️ 记录已删除', 'info');
    window._renderLogFiltered();
    renderOverview();
  };

  window._editLogItem = function (id) {
    var record = appData.records.find(function (r) { return r.id === id; });
    if (!record) { showToast('记录未找到', 'error'); return; }
    var html = '<div class="glass-card" style="width:480px;max-width:92vw;max-height:85vh;overflow-y:auto;padding:24px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="font-size:18px">✏️ 编辑学习记录</h3><button class="btn-icon" onclick="closeModal()" style="background:transparent;border:none;font-size:20px;cursor:pointer;color:var(--md-on-surface-variant)">✕</button></div>';
    html += '<div style="margin-bottom:12px"><label class="label">学科</label><select class="select" id="editSubject">';
    var subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
    for (var i = 0; i < subjects.length; i++) {
      html += '<option value="' + subjects[i] + '"' + (record.subject === subjects[i] ? ' selected' : '') + '>' + subjects[i] + '</option>';
    }
    html += '</select></div>';
    html += '<div style="margin-bottom:12px"><label class="label">得分</label><input class="input" id="editScore" type="number" min="0" max="100" value="' + (record.score || 0) + '"></div>';
    html += '<div style="margin-bottom:12px"><label class="label">学习时长(分钟)</label><input class="input" id="editDuration" type="number" min="1" value="' + (record.duration || 30) + '"></div>';
    html += '<div style="margin-bottom:12px"><label class="label">知识点（逗号分隔）</label><input class="input" id="editKP" value="' + escapeHtml((record.knowledgePoints || []).join(', ')) + '"></div>';
    html += '<div style="margin-bottom:12px"><label class="label">备注</label><textarea class="input" id="editNotes" rows="2">' + escapeHtml(record.notes || '') + '</textarea></div>';
    html += '<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-ghost" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="window._saveEditLogItem(\'' + id + '\')">保存修改</button></div>';
    html += '</div>';
    openModal(html);
  };

  window._saveEditLogItem = function (id) {
    var record = appData.records.find(function (r) { return r.id === id; });
    if (!record) { showToast('记录未找到', 'error'); return; }
    record.subject = document.getElementById('editSubject') ? document.getElementById('editSubject').value : record.subject;
    record.score = parseInt(document.getElementById('editScore') ? document.getElementById('editScore').value : record.score) || 0;
    record.duration = parseInt(document.getElementById('editDuration') ? document.getElementById('editDuration').value : record.duration) || 0;
    var kpStr = document.getElementById('editKP') ? document.getElementById('editKP').value.trim() : '';
    record.knowledgePoints = kpStr ? kpStr.split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean) : [];
    record.notes = document.getElementById('editNotes') ? document.getElementById('editNotes').value.trim() : '';
    record.xp = calcBaseXP(record.score, record.duration);
    if (appData.profile) {
      appData.profile.totalXp = appData.records.reduce(function (s, r) { return s + (r.xp || 0); }, 0);
    }
    saveAppData();
    closeModal();
    showToast('✅ 记录已更新', 'success');
    window._renderLogFiltered();
    renderOverview();
  };

  function renderSettings() {
    var container = document.getElementById('page-settings');
    if (!container) return;
    var html = '<div class="section-title">⚙️ 更多</div><div class="settings-list">';
    html += '<div class="settings-item" onclick="window._openReadingModal()"><div class="settings-item-left"><div class="settings-item-icon">📖</div><div><div class="settings-item-name">阅读记录</div><div class="settings-item-desc">管理你的阅读历史和书架</div></div></div><div class="settings-item-arrow">→</div></div>';
    html += '<div class="settings-item" onclick="window._exportData()"><div class="settings-item-left"><div class="settings-item-icon">📥</div><div><div class="settings-item-name">导出数据</div><div class="settings-item-desc">下载完整JSON备份</div></div></div><div class="settings-item-arrow">→</div></div>';
    html += '<div class="settings-item" onclick="toggleTheme()"><div class="settings-item-left"><div class="settings-item-icon">🌓</div><div><div class="settings-item-name">切换主题</div><div class="settings-item-desc">浅色 / 深色模式</div></div></div><div class="settings-item-arrow">→</div></div>';
    html += '<div class="settings-item"><div class="settings-item-left"><div class="settings-item-icon">📋</div><div><div class="settings-item-name">关于本系统</div><div class="settings-item-desc">学习RPG V3.0 · 认知操作系统</div></div></div><div class="settings-item-arrow">→</div></div>';
    html += '</div>';
    container.innerHTML = html;
  }

  window._exportData = exportAllData;

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initLaunchPage();
    initKeyboard();
  });

})();