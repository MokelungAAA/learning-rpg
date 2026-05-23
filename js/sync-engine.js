// sync-engine.js — GitHub Contents API 同步引擎
import Storage from './store.js';
import EventBus from './event-bus.js';
import { STORAGE_KEYS as StorageKeys } from './config.js';

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
