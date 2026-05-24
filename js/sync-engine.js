// sync-engine.js — GitHub Contents API 同步引擎
// 单例模式，通过 Personal Access Token 认证
// 数据以 JSON 文件存储在仓库的 data/ 目录下
// v0.129: 支持全量数据同步（12 种 localStorage key 统一存取）
import Storage from './store.js';
import EventBus from './event-bus.js';
import { STORAGE_KEYS as StorageKeys } from './config.js';

const UNIFIED_FILE = 'data/lts_study_records.json';

class SyncEngine {
  constructor() {
    this.token = null;
    this.owner = null;
    this.repo = null;
    this.isSyncing = false;
  }

  configure(token, owner, repo) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
  }

  get isConfigured() {
    return !!(this.token && this.owner && this.repo);
  }

  // ─── GitHub API 基础操作 ───

  async uploadFile(path, data, message) {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const sha = await this.getFileSha(path);

    const response = await fetch(
      `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, content, sha }),
      }
    );

    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
    return response.json();
  }

  async downloadFile(path) {
    const response = await fetch(
      `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`,
      { headers: { 'Authorization': `token ${this.token}` } }
    );

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

    const json = await response.json();
    const decoded = decodeURIComponent(escape(atob(json.content)));
    return JSON.parse(decoded);
  }

  async getFileSha(path) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`,
        { headers: { 'Authorization': `token ${this.token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        return data.sha;
      }
    } catch { /* 文件不存在 */ }
    return undefined;
  }

  // ─── 统一数据文件同步 ───

  async downloadUnified() {
    return this.downloadFile(UNIFIED_FILE);
  }

  async uploadUnified(data) {
    return this.uploadFile(UNIFIED_FILE, data, 'Update study records via LTS');
  }

  // 从 localStorage 读取全量本地数据
  _readAllLocal() {
    return {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      learnerName: '墨澜',
      schema: 'lts_study_record',
      schemaVersion: 1,
      records: Storage.get(StorageKeys.STUDY_RECORDS) || [],
      readingRecords: Storage.get(StorageKeys.READING_RECORDS) || [],
      pomodoroSessions: Storage.get(StorageKeys.POMODORO_SESSIONS) || [],
      knowledgeState: Storage.get(StorageKeys.KNOWLEDGE_STATE) || {},
      achievements: Storage.get(StorageKeys.ACHIEVEMENTS) || [],
      examScores: Storage.get(StorageKeys.EXAM_SCORES) || {},
      settings: Storage.get(StorageKeys.SETTINGS) || {},
      userProfile: Storage.get(StorageKeys.USER_PROFILE) || {},
      recitationState: Storage.get(StorageKeys.RECITATION_STATE) || {},
      chartPreferences: Storage.get(StorageKeys.CHART_PREFS) || {},
      lastSync: Date.now(),
    };
  }

  // 将合并结果写回 localStorage
  _writeAllLocal(merged) {
    Storage.set(StorageKeys.STUDY_RECORDS, merged.records);
    if (merged.readingRecords) Storage.set(StorageKeys.READING_RECORDS, merged.readingRecords);
    if (merged.pomodoroSessions) Storage.set(StorageKeys.POMODORO_SESSIONS, merged.pomodoroSessions);
    if (merged.knowledgeState) Storage.set(StorageKeys.KNOWLEDGE_STATE, merged.knowledgeState);
    if (merged.achievements) Storage.set(StorageKeys.ACHIEVEMENTS, merged.achievements);
    if (merged.examScores) Storage.set(StorageKeys.EXAM_SCORES, merged.examScores);
    if (merged.settings) Storage.set(StorageKeys.SETTINGS, merged.settings);
    if (merged.userProfile) Storage.set(StorageKeys.USER_PROFILE, merged.userProfile);
    if (merged.recitationState) Storage.set(StorageKeys.RECITATION_STATE, merged.recitationState);
    if (merged.chartPreferences) Storage.set(StorageKeys.CHART_PREFS, merged.chartPreferences);
    Storage.set(StorageKeys.SYNC_META, {
      lastSync: Date.now(),
      lastUpdated: merged.lastUpdated,
      status: 'success'
    });
  }

  // 智能合并策略：
  //   数组（records/readingRecords/pomodoroSessions/achievements）→ 按 id 去重，本地优先
  //   对象（settings/userProfile/knowledgeState/examScores 等）→ 合并，本地字段覆盖远程
  //   这样保证：两台设备各加的记录都能保留，设置以最后修改的设备为准
  mergeUnified(local, remote) {
    if (!local && !remote) return null;
    if (!local || !local.records) return remote;
    if (!remote || !remote.records) return local;

    return {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      learnerName: '墨澜',
      schema: 'lts_study_record',
      schemaVersion: 1,
      records: this._mergeArraysById(local.records, remote.records, 'id'),
      readingRecords: this._mergeArraysById(
        local.readingRecords || [],
        remote.readingRecords || [],
        'recordID'
      ),
      pomodoroSessions: this._mergeArraysById(
        local.pomodoroSessions || [],
        remote.pomodoroSessions || [],
        'id'
      ),
      knowledgeState: this._mergeObjects(local.knowledgeState || {}, remote.knowledgeState || {}),
      achievements: this._mergeArraysById(local.achievements || [], remote.achievements || [], 'id'),
      examScores: this._mergeObjects(local.examScores || {}, remote.examScores || {}),
      settings: this._mergeObjects(local.settings || {}, remote.settings || {}),
      userProfile: this._mergeObjects(local.userProfile || {}, remote.userProfile || {}),
      recitationState: this._mergeObjects(local.recitationState || {}, remote.recitationState || {}),
      chartPreferences: this._mergeObjects(local.chartPreferences || {}, remote.chartPreferences || {}),
    };
  }

  // 数组合并：按 id 去重，本地优先（两台设备各加的记录都会保留）
  _mergeArraysById(localArr, remoteArr, idKey) {
    const merged = new Map();
    for (const r of remoteArr) {
      const key = r[idKey] || r.id;
      if (key) merged.set(key, r);
    }
    for (const r of localArr) {
      const key = r[idKey] || r.id;
      if (key) merged.set(key, r);
    }
    return Array.from(merged.values());
  }

  // 对象合并：远程打底，本地覆盖（本地字段优先）
  _mergeObjects(localObj, remoteObj) {
    return { ...remoteObj, ...localObj };
  }

  // ─── 全量同步（智能合并模式）───

  async fullSync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const remote = await this.downloadUnified();
      const local = this._readAllLocal();
      const merged = this.mergeUnified(local, remote);

      this._writeAllLocal(merged);
      await this.uploadUnified(merged);

      EventBus.emit('sync:complete', { status: 'success', count: merged.records.length });
    } catch (e) {
      Storage.set(StorageKeys.SYNC_META, { lastSync: Date.now(), status: 'error', error: e.message });
      EventBus.emit('sync:error', { error: e });
    } finally {
      this.isSyncing = false;
    }
  }

  // ─── 启动时加载（智能合并 + 自动重算 XP）───
  // preferCloud: true 时（内嵌数据刚加载），直接用云端数据覆盖本地
  async startupLoad(preferCloud) {
    if (!this.isConfigured) return false;

    try {
      const remote = await this.downloadUnified();
      if (!remote || !remote.records) return false;

      const localRecords = Storage.get(StorageKeys.STUDY_RECORDS) || [];
      const localReadings = Storage.get(StorageKeys.READING_RECORDS) || [];

      let merged;
      if (localRecords.length === 0 || preferCloud) {
        // 本地无数据或刚加载内嵌旧数据 → 直接用云端（含全部 key），再合并其他 key
        if (preferCloud) {
          const local = this._readAllLocal();
          merged = this.mergeUnified(local, remote);
          // 但 records 和 readingRecords 直接用云端（内嵌是旧快照）
          merged.records = remote.records;
          merged.readingRecords = remote.readingRecords || [];
        } else {
          merged = remote;
        }
      } else {
        // 本地有真实数据 → 智能合并
        const local = this._readAllLocal();
        merged = this.mergeUnified(local, remote);
      }

      // XP 重算（同步执行，不产生竞态）
      const affected = await this.recalcAllXP(merged.records);
      if (affected > 0) {
        EventBus.emit('data:xp-recalculated', { affected });
      }

      this._writeAllLocal(merged);
      EventBus.emit('data:loaded', { source: 'merged', count: merged.records.length });
      return true;
    } catch (e) {
      console.error('Startup load failed:', e);
      return false;
    }
  }

  // ─── 批量重算 XP（跳过已有合理 XP 的记录）───
  async recalcAllXP(records) {
    try {
      const { calcXP } = await import('./utils/level.js');
      const profile = Storage.get(StorageKeys.USER_PROFILE) || {};
      const today = new Date().toISOString().slice(0, 10);
      const todayRecords = records.filter(r => r.timestamp?.slice(0, 10) === today);
      const todayXP = todayRecords.reduce((s, r) => s + (r.xp || 0), 0);

      let affected = 0;
      let totalXP = 0;
      const subjectScores = {};

      for (const rec of records) {
        if (rec.xp > 1) {
          totalXP += rec.xp;
          if (rec.score > 0) {
            if (!subjectScores[rec.subject]) subjectScores[rec.subject] = [];
            subjectScores[rec.subject].push(rec.score);
          }
          continue;
        }

        if (!subjectScores[rec.subject]) subjectScores[rec.subject] = [];
        const last10 = subjectScores[rec.subject].slice(-10);

        profile._runtimeTotalXP = totalXP;
        const xp = calcXP(rec, profile, todayXP, last10, null);
        rec.xp = xp;
        totalXP += xp;
        affected++;

        if (rec.score > 0) subjectScores[rec.subject].push(rec.score);
      }

      return affected;
    } catch (e) {
      console.error('XP recalc failed:', e);
      return 0;
    }
  }
}

export default new SyncEngine();
