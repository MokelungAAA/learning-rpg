// sync-engine.js — GitHub Contents API 同步引擎
// 单例模式，通过 Personal Access Token 认证
// 数据以 JSON 文件存储在仓库的 data/ 目录下
import Storage from './store.js';
import EventBus from './event-bus.js';
import { STORAGE_KEYS as StorageKeys } from './config.js';

class SyncEngine {
  constructor() {
    this.token = null;  // GitHub PAT
    this.owner = null;  // 仓库所有者
    this.repo = null;   // 仓库名
    this.isSyncing = false; // 防止并发同步
  }

  // 配置 GitHub 认证信息，三者缺一不可
  configure(token, owner, repo) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
  }

  // 检查是否已配置（token + owner + repo 都存在）
  get isConfigured() {
    return !!(this.token && this.owner && this.repo);
  }

  // 上传数据到 GitHub：PUT data/{key}.json
  // 需要先获取文件 SHA（用于更新已有文件）
  async upload(key, data) {
    const path = `data/${key}.json`;
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
        body: JSON.stringify({
          message: `Update ${key} via LTS`,
          content,
          sha,
        }),
      }
    );

    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
    return response.json();
  }

  // 从 GitHub 下载数据，404 返回 null
  async download(key) {
    const path = `data/${key}.json`;
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

  // 获取文件 SHA（用于 GitHub API 的更新操作）
  // 文件不存在时返回 undefined
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

  // 全量双向同步：遍历所有 STORAGE_KEYS
  // 策略：remote 为空→上传，local 为空→下载，都有→合并
  async fullSync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const keys = Object.values(StorageKeys);
      for (const key of keys) {
        const local = Storage.get(key);
        const remote = await this.download(key);

        if (!remote) {
          if (local) await this.upload(key, local);
        } else if (!local) {
          Storage.set(key, remote);
        } else {
          const merged = this.mergeData(key, local, remote);
          Storage.set(key, merged);
          await this.upload(key, merged);
        }
      }

      Storage.set(StorageKeys.SYNC_META, { lastSync: Date.now(), status: 'success' });
      EventBus.emit('sync:complete', { status: 'success' });
    } catch (e) {
      Storage.set(StorageKeys.SYNC_META, { lastSync: Date.now(), status: 'error', error: e.message });
      EventBus.emit('sync:error', { error: e });
    } finally {
      this.isSyncing = false;
    }
  }

  // 合并策略：数组按 id 去重（local 优先），
  // 对象按 updatedAt 取新值
  mergeData(key, local, remote) {
    if (Array.isArray(local) && Array.isArray(remote)) {
      const map = new Map();
      remote.forEach(item => map.set(item.id, item));
      local.forEach(item => map.set(item.id, item));
      return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
    }
    return (local.updatedAt > remote.updatedAt) ? local : remote;
  }
}

export default new SyncEngine();
