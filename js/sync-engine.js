// sync-engine.js — GitHub Contents API 同步引擎
// 单例模式，通过 Personal Access Token 认证
// 数据以 JSON 文件存储在仓库的 data/ 目录下
// v0.121: 支持统一数据文件 data/lts_study_records.json 的双向同步
import Storage from './store.js';
import EventBus from './event-bus.js';
import { STORAGE_KEYS as StorageKeys } from './config.js';

// 统一数据文件路径
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

  // 从 GitHub 下载统一数据文件
  async downloadUnified() {
    return this.downloadFile(UNIFIED_FILE);
  }

  // 上传统一数据文件到 GitHub
  async uploadUnified(data) {
    return this.uploadFile(UNIFIED_FILE, data, 'Update study records via LTS');
  }

  // 智能合并：本地 vs 远程
  // 策略：按 record.id 去重，本地记录优先（用户最近操作的）
  mergeUnified(local, remote) {
    // 如果一边没有数据，直接用另一边
    if (!local || !local.records) return remote;
    if (!remote || !remote.records) return local;

    const localRecords = local.records;
    const remoteRecords = remote.records;

    // 按 id 建立 map，本地优先
    const merged = new Map();
    for (const r of remoteRecords) merged.set(r.id, r);
    for (const r of localRecords) merged.set(r.id, r);  // 本地覆盖远程

    // 合并阅读记录（按 recordID 去重，本地优先）
    const localReadings = local.readingRecords || [];
    const remoteReadings = remote.readingRecords || [];
    const mergedReadings = new Map();
    for (const r of remoteReadings) mergedReadings.set(r.recordID, r);
    for (const r of localReadings) mergedReadings.set(r.recordID, r);

    const result = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      learnerName: '墨澜',
      schema: 'lts_study_record',
      schemaVersion: 1,
      records: Array.from(merged.values()).sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
      ),
      readingRecords: Array.from(mergedReadings.values()),
    };

    return result;
  }

  // ─── 全量同步（智能合并模式）───

  async fullSync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. 从 GitHub 下载远程数据
      const remote = await this.downloadUnified();

      // 2. 从 localStorage 获取本地数据
      const localRecords = Storage.get(StorageKeys.STUDY_RECORDS) || [];
      const localReadings = Storage.get(StorageKeys.READING_RECORDS) || [];
      const local = {
        version: '2.0',
        lastUpdated: Storage.get('lts_sync_meta')?.lastUpdated || new Date(0).toISOString(),
        learnerName: '墨澜',
        schema: 'lts_study_record',
        schemaVersion: 1,
        records: localRecords,
        readingRecords: localReadings,
      };

      // 3. 智能合并
      const merged = this.mergeUnified(local, remote);

      // 4. 写回两边
      Storage.set(StorageKeys.STUDY_RECORDS, merged.records);
      if (merged.readingRecords) Storage.set(StorageKeys.READING_RECORDS, merged.readingRecords);
      Storage.set('lts_sync_meta', { lastSync: Date.now(), lastUpdated: merged.lastUpdated, status: 'success' });
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
  async startupLoad() {
    if (!this.isConfigured) return false;

    try {
      const remote = await this.downloadUnified();
      if (!remote || !remote.records) return false;

      const localRecords = Storage.get(StorageKeys.STUDY_RECORDS) || [];
      const localReadings = Storage.get(StorageKeys.READING_RECORDS) || [];

      let records, readingRecords;
      if (localRecords.length === 0) {
        records = remote.records;
        readingRecords = remote.readingRecords || localReadings;
      } else {
        const local = {
          version: '2.0',
          lastUpdated: Storage.get('lts_sync_meta')?.lastUpdated || new Date(0).toISOString(),
          learnerName: '墨澜',
          schema: 'lts_study_record',
          schemaVersion: 1,
          records: localRecords,
          readingRecords: localReadings,
        };
        const merged = this.mergeUnified(local, remote);
        records = merged.records;
        readingRecords = merged.readingRecords;
      }

      // 自动重算 XP（异步，不阻塞渲染）
      this.recalcAllXP(records).then(affected => {
        if (affected > 0) {
          Storage.set(StorageKeys.STUDY_RECORDS, records);
          this.uploadUnified({
            version: '2.0', lastUpdated: new Date().toISOString(),
            learnerName: '墨澜', schema: 'lts_study_record', schemaVersion: 1, records,
          }).catch(() => {});
          EventBus.emit('data:xp-recalculated', { affected });
        }
      });

      Storage.set(StorageKeys.STUDY_RECORDS, records);
      if (readingRecords) Storage.set(StorageKeys.READING_RECORDS, readingRecords);
      EventBus.emit('data:loaded', { source: 'merged', count: records.length });
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
        // 只重算 xp=0 或 xp=1（最低值，可能未计算）的记录
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

  // ─── 旧版兼容：逐 key 同步 ───

  async upload(key, data) {
    const path = `data/${key}.json`;
    return this.uploadFile(path, data, `Update ${key} via LTS`);
  }

  async download(key) {
    const path = `data/${key}.json`;
    return this.downloadFile(path);
  }
}

export default new SyncEngine();
