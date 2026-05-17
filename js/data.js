/* ================================================================
   data.js — 数据加载/缓存/持久化
   ================================================================ */

var DATA_VERSION = '3.0.0';
var GITHUB_REPO = 'MokelungAAA/learning-rpg';
var GITHUB_BRANCH = 'main';

var appData = {
  version: DATA_VERSION,
  records: [],
  profile: null,
  skillTree: null,
  achievements: [],
  pomodoroSessions: [],
  readingRecords: [],
  bookshelf: [],
  textbooks: null,
  courses: null,
  knowledgeStates: {},
  userProfile: null,
  dataSource: 'pending'
};

var FALLBACK_DATA = {
  version: DATA_VERSION,
  records: [],
  profile: {
    learnerName: '墨澜',
    totalXp: 0,
    totalStudyMinutes: 0,
    streakDays: 0
  }
};

function loadLocal(key) {
  try {
    var raw = localStorage.getItem('lts-' + key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('localStorage read failed for ' + key, e);
    return null;
  }
}

function saveLocal(key, data) {
  try {
    localStorage.setItem('lts-' + key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('localStorage write failed for ' + key, e);
    return false;
  }
}

function removeLocal(key) {
  try {
    localStorage.removeItem('lts-' + key);
  } catch (e) {}
}

function getCache(key) {
  try {
    var raw = localStorage.getItem('lts-cache-' + key);
    if (!raw) return null;
    var entry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > 86400000) {
      removeLocal('cache-' + key);
      return null;
    }
    return entry.data;
  } catch (e) {
    return null;
  }
}

function setCache(key, data) {
  try {
    localStorage.setItem('lts-cache-' + key, JSON.stringify({
      data: data,
      timestamp: Date.now(),
      version: DATA_VERSION
    }));
  } catch (e) {}
}

function fetchWithTimeout(url, timeoutMs) {
  timeoutMs = timeoutMs || 30000;
  return new Promise(function (resolve, reject) {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
      reject(new Error('Request timeout: ' + url));
    }, timeoutMs);
    fetch(url, { signal: controller.signal })
      .then(function (response) {
        clearTimeout(timer);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(resolve)
      .catch(function (err) {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function isFileProtocol() {
  return window.location.protocol === 'file:';
}

function buildGitHubUrls(path) {
  return [
    'https://raw.githubusercontent.com/' + GITHUB_REPO + '/' + GITHUB_BRANCH + '/' + path,
    'https://cdn.jsdelivr.net/gh/' + GITHUB_REPO + '@' + GITHUB_BRANCH + '/' + path,
    'https://mokelungaaa.github.io/learning-rpg/' + path
  ];
}

function loadFromMultiSource(path) {
  if (isFileProtocol()) {
    return loadLocalFile(path).catch(function () {
      return tryGitHubUrls(path);
    });
  }
  return tryGitHubUrls(path);
}

function tryGitHubUrls(path) {
  var urls = buildGitHubUrls(path);
  var errors = [];
  function tryUrl(index) {
    if (index >= urls.length) {
      return Promise.reject(new Error('All sources failed: ' + errors.join('; ')));
    }
    return fetchWithTimeout(urls[index]).catch(function (err) {
      errors.push(urls[index] + ': ' + err.message);
      return tryUrl(index + 1);
    });
  }
  return tryUrl(0);
}

function loadLocalFile(path) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', path, true);
    xhr.timeout = 5000;
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(new Error('JSON parse error: ' + path));
        }
      } else {
        reject(new Error('Local file not found: ' + path));
      }
    };
    xhr.onerror = function () { reject(new Error('XHR error: ' + path)); };
    xhr.ontimeout = function () { reject(new Error('XHR timeout: ' + path)); };
    xhr.send();
  });
}

function loadAppData() {
  var local = loadLocal('appData');
  if (local) {
    appData = local;
    appData.dataSource = 'local';
    console.log('📦 从 localStorage 加载数据 (' + (appData.records||[]).length + ' 条记录)');
    backgroundDataLoad();
    return Promise.resolve(appData);
  }

  var cached = getCache('appData');
  if (cached) {
    appData = deepClone(cached);
    appData.dataSource = 'cache';
    console.log('📦 从缓存加载数据 (' + (appData.records||[]).length + ' 条记录)');
    backgroundDataLoad();
    return Promise.resolve(appData);
  }

  return loadFromMultiSource('data/data.json')
    .then(function (data) {
      data = convertGitHubData(data);
      setCache('appData', data);
      saveLocal('appData', data);
      appData = data;
      appData.dataSource = 'github';
      console.log('📦 从 GitHub/本地文件加载数据 (' + (appData.records||[]).length + ' 条记录)');
      return appData;
    })
    .catch(function () {
      appData = deepClone(FALLBACK_DATA);
      appData.dataSource = 'fallback';
      return appData;
    });
}

function backgroundDataLoad() {
  loadFromMultiSource('data/data.json')
    .then(function (data) {
      data = convertGitHubData(data);
      setCache('appData', data);
      saveLocal('appData', data);
      var oldSource = appData.dataSource;
      appData = data;
      appData.dataSource = 'github';
      console.log('🔄 后台同步完成');
      if (oldSource === 'cache' || oldSource === 'local') {
        refreshUI();
      }
    })
    .catch(function () {
      console.log('🔄 后台同步跳过（离线）');
    });
}

function convertGitHubData(raw) {
  if (!raw) return deepClone(FALLBACK_DATA);
  var data = {
    version: raw.version || DATA_VERSION,
    records: [],
    profile: raw.profile || deepClone(FALLBACK_DATA.profile)
  };
  if (raw.records && Array.isArray(raw.records)) {
    data.records = raw.records;
  } else if (raw.subjects && raw.log) {
    var v1Records = [];
    var v1Log = raw.log || [];
    for (var i = 0; i < v1Log.length; i++) {
      var entry = v1Log[i];
      v1Records.push({
        id: entry.id || uuid(),
        timestamp: entry.timestamp || toLocalISO(),
        subject: entry.subject || '',
        knowledgePoints: entry.knowledgePoints || [],
        duration: entry.durationMinutes || 0,
        activityType: entry.activityType || 'practice',
        score: entry.accuracy || 0,
        totalQuestions: entry.totalQuestions || 0,
        correctCount: entry.correctCount || 0,
        xp: entry.xp || 0,
        source: entry._source || 'web'
      });
    }
    data.records = v1Records;
    data.profile.totalXp = raw.profile ? raw.profile.totalXp || 0 : 0;
  }
  if (!data.profile.totalXp && data.records.length > 0) {
    var sum = 0;
    for (var r = 0; r < data.records.length; r++) {
      sum += data.records[r].xp || 0;
    }
    data.profile.totalXp = sum;
  }
  return data;
}

function saveAppData() {
  saveLocal('appData', appData);
  setCache('appData', appData);
}

function loadUserProfile() {
  return loadFromMultiSource('data/user_profile.json')
    .then(function (profile) {
      appData.userProfile = profile;
      setCache('userProfile', profile);
      return profile;
    })
    .catch(function () {
      var cached = getCache('userProfile');
      if (cached) {
        appData.userProfile = cached;
        return cached;
      }
      var defaultProfile = {
        globalBaseHalfLife: 3.0,
        subjectModifiers: {},
        subjectAbility: {},
        tempBoostGain: 0.5,
        tempBoostBase: 10,
        halfLifeIncreaseRatio: 1.2,
        halfLifeDecreaseRatio: 0.75,
        xpBasePerMinute: 2.0,
        activityWeights: {},
        decayRateForXP: 0.00005,
        dailyXPLimit: 500,
        dailyXPLimitSoftness: 0.5
      };
      appData.userProfile = defaultProfile;
      return defaultProfile;
    });
}

function loadSkillTree() {
  return loadFromMultiSource('data/skill-tree.json')
    .then(function (tree) {
      appData.skillTree = tree;
      setCache('skillTree', tree);
      return tree;
    })
    .catch(function () {
      var cached = getCache('skillTree');
      appData.skillTree = cached || { subjects: {} };
      return appData.skillTree;
    });
}

function loadTextbooks() {
  return loadFromMultiSource('data/textbooks/textbooks-personal.json')
    .then(function (tb) {
      appData.textbooks = tb;
      return tb;
    })
    .catch(function () {
      appData.textbooks = null;
      return null;
    });
}

function loadCourses() {
  return loadFromMultiSource('data/courses/courses.json')
    .then(function (c) {
      appData.courses = c;
      return c;
    })
    .catch(function () {
      appData.courses = null;
      return null;
    });
}

function loadAchievements() {
  return loadFromMultiSource('data/achievements-data.json')
    .then(function (ach) {
      appData.achievements = ach;
      return ach;
    })
    .catch(function () {
      appData.achievements = [];
      return [];
    });
}

function loadPomodoroSessions() {
  var sessions = loadLocal('pomodoroSessions') || [];
  appData.pomodoroSessions = sessions;
  return sessions;
}

function savePomodoroSession(session) {
  appData.pomodoroSessions.push(session);
  saveLocal('pomodoroSessions', appData.pomodoroSessions);
}

function loadReadingRecords() {
  var records = loadLocal('readingRecords') || [];
  appData.readingRecords = records;
  return records;
}

function saveReadingRecord(record) {
  appData.readingRecords.push(record);
  saveLocal('readingRecords', appData.readingRecords);
}

function loadBookshelf() {
  var shelf = loadLocal('bookshelf') || [];
  appData.bookshelf = shelf;
  return shelf;
}

function saveBookshelf(shelf) {
  appData.bookshelf = shelf;
  saveLocal('bookshelf', shelf);
}

function exportAllData() {
  var blob = new Blob([JSON.stringify({
    appData: appData,
    exportedAt: toLocalISO(),
    version: DATA_VERSION
  }, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'learning-rpg-backup-' + getTodayKey() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('数据导出成功', 'success');
}

function refreshUI() {
  if (typeof renderAll === 'function') {
    renderAll();
  }
}