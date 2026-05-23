// data-engine.js — 数据加载引擎（UI 先渲染，数据后台加载）
import Storage from './store.js';
import EventBus from './event-bus.js';
import SyncEngine from './sync-engine.js';

class DataEngine {
  constructor() {
    this.loading = new Map();
  }

  async getData(key) {
    const cached = Storage.get(key);

    if (SyncEngine.isConfigured && !this.loading.has(key)) {
      this.loading.set(key, true);
      SyncEngine.download(key).then(remote => {
        if (remote && JSON.stringify(remote) !== JSON.stringify(cached)) {
          Storage.set(key, remote);
          EventBus.emit('data:updated', { key, data: remote });
        }
      }).catch(() => {
        // 静默失败，使用本地缓存
      }).finally(() => {
        this.loading.delete(key);
      });
    }

    return cached;
  }

  async setData(key, data) {
    Storage.set(key, data);
    EventBus.emit('data:changed', { key, data });

    if (SyncEngine.isConfigured) {
      SyncEngine.upload(key, data).catch(() => {});
    }
  }

  async init(defaultsMap) {
    for (const [key, defaultValue] of Object.entries(defaultsMap)) {
      if (!Storage.get(key)) {
        Storage.set(key, defaultValue);
      }
    }
  }
}

export default new DataEngine();
