/* ================================================================
   persistence.js — localStorage 优先的持久化策略
   每次数据变更自动保存，启动时优先从本地加载，后台静默同步
   ================================================================ */

var PERSISTENCE_KEY = 'lts-appData';
var DATA_LOADED = false;
var GITHUB_REPO = 'MokelungAAA/learning-rpg';
var GITHUB_API_BASE = 'https://api.github.com/repos/' + GITHUB_REPO;

function _getGithubToken() {
  return localStorage.getItem('lts-gh-token') || '';
}

function quickLoadAppData() {
  var local = loadLocal('appData');
  if (local) {
    appData = local;
    appData.dataSource = 'local';
    DATA_LOADED = true;
    console.log('📦 从 localStorage 加载数据 (' + (appData.records||[]).length + ' 条记录)');
    backgroundSyncAll();
    return Promise.resolve(appData);
  }

  var cached = getCache('appData');
  if (cached) {
    appData = deepClone(cached);
    appData.dataSource = 'cache';
    DATA_LOADED = true;
    console.log('📦 从缓存加载数据 (' + (appData.records||[]).length + ' 条记录)');
    backgroundSyncAll();
    return Promise.resolve(appData);
  }

  return loadFromMultiSource('data/data.json')
    .then(function (data) {
      data = convertGitHubData(data);
      persistAppData(data);
      appData = data;
      appData.dataSource = 'github';
      DATA_LOADED = true;
      console.log('📦 从 GitHub/本地文件加载数据 (' + (appData.records||[]).length + ' 条记录)');
      return appData;
    })
    .catch(function () {
      appData = deepClone(FALLBACK_DATA);
      appData.dataSource = 'fallback';
      DATA_LOADED = true;
      console.log('📦 使用默认数据');
      return appData;
    });
}

function persistAppData(data) {
  saveLocal('appData', data || appData);
  setCache('appData', data || appData);
}

function backgroundSyncAll() {
  setTimeout(function () {
    loadFromMultiSource('data/data.json')
      .then(function (data) {
        data = convertGitHubData(data);
        var merged = mergeAppData(data);
        saveLocal('appData', merged);
        setCache('appData', merged);
        appData = merged;
        console.log('🔄 后台同步完成');
        try { refreshUI(); } catch (e) {}
      })
      .catch(function () {
        console.log('🔄 后台同步跳过（离线或无远程数据）');
      });
  }, 2000);
}

function mergeAppData(remote) {
  var remote = remote || {};
  var remoteRecords = remote.records || [];
  var localIds = {};
  for (var i = 0; i < (appData.records || []).length; i++) {
    localIds[appData.records[i].id] = true;
  }
  var newRecords = [];
  for (var j = 0; j < remoteRecords.length; j++) {
    if (!localIds[remoteRecords[j].id]) {
      newRecords.push(remoteRecords[j]);
    }
  }
  if (newRecords.length > 0) {
    console.log('🔗 合并 ' + newRecords.length + ' 条远程新记录');
  }
  var profile = remote.profile || appData.profile || {};
  if (!profile.totalXp) {
    var sum = 0;
    var allRecords = (appData.records || []).concat(newRecords);
    for (var k = 0; k < allRecords.length; k++) {
      sum += allRecords[k].xp || 0;
    }
    profile.totalXp = sum;
  }
  return {
    version: remote.version || appData.version || '3.0.0',
    records: (appData.records || []).concat(newRecords),
    profile: profile
  };
}

function syncDataToGitHub() {
  var token = _getGithubToken();
  if (!token) { console.log('📤 未配置 GitHub Token，跳过同步'); return Promise.resolve(); }
  var content = JSON.stringify(appData.records, null, 2);
  var payload = {
    message: 'data: auto-sync from app',
    content: btoa(unescape(encodeURIComponent(content)))
  };
  return fetch(GITHUB_API_BASE + '/contents/data/data.json', {
    method: 'GET',
    headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }
  }).then(function (r) { return r.json(); }).then(function (file) {
    payload.sha = file.sha;
    return fetch(GITHUB_API_BASE + '/contents/data/data.json', {
      method: 'PUT',
      headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }).then(function () { console.log('📤 数据已同步到 GitHub'); }).catch(function (e) { console.log('📤 GitHub 同步跳过:', e.message); });
}
