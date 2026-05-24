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

    const result = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      learnerName: '墨澜',
      schema: 'lts_study_record',
      schemaVersion: 1,
      records: Array.from(merged.values()).sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
      ),
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
      const local = {
        version: '2.0',
        lastUpdated: Storage.get('lts_sync_meta')?.lastUpdated || new Date(0).toISOString(),
        learnerName: '墨澜',
        schema: 'lts_study_record',
        schemaVersion: 1,
        records: localRecords,
      };

      // 3. 智能合并
      const merged = this.mergeUnified(local, remote);

      // 4. 写回两边
      Storage.set(StorageKeys.STUDY_RECORDS, merged.records);
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

  // ─── 启动时加载（智能合并）───
  // app 启动时调用：比较本地和远程，取更新的一方
  async startupLoad() {
    if (!this.isConfigured) return false;

    try {
      const remote = await this.downloadUnified();
      if (!remote || !remote.records) return false;

      const localRecords = Storage.get(StorageKeys.STUDY_RECORDS) || [];

      // 如果本地没有数据，直接用远程
      if (localRecords.length === 0) {
        Storage.set(StorageKeys.STUDY_RECORDS, remote.records);
        EventBus.emit('data:loaded', { source: 'github', count: remote.records.length });
        return true;
      }

      // 智能合并
      const local = {
        version: '2.0',
        lastUpdated: Storage.get('lts_sync_meta')?.lastUpdated || new Date(0).toISOString(),
        learnerName: '墨澜',
        schema: 'lts_study_record',
        schemaVersion: 1,
        records: localRecords,
      };

      const merged = this.mergeUnified(local, remote);
      Storage.set(StorageKeys.STUDY_RECORDS, merged.records);

      // 如果有新数据，上传回 GitHub
      if (merged.records.length > localRecords.length) {
        await this.uploadUnified(merged);
      }

      EventBus.emit('data:loaded', { source: 'merged', count: merged.records.length });
      return true;
    } catch (e) {
      console.error('Startup load failed:', e);
      return false;
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
