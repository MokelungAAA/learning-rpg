// data-engine.js — 数据引擎：UI 先用本地缓存渲染，
// 后台静默拉取远端数据，有变更时通知 UI 刷新
import Storage from './store.js';
import EventBus from './event-bus.js';
import SyncEngine from './sync-engine.js';

class DataEngine {
  constructor() {
    this.loading = new Map(); // 防止同一 key 重复请求
  }

  // 读数据：立即返回本地缓存，后台异步同步远端
  // 远端数据不同时触发 'data:updated' 事件
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

  // 写数据：同步写本地，异步上传远端（静默失败）
  async setData(key, data) {
    Storage.set(key, data);
    EventBus.emit('data:changed', { key, data });

    if (SyncEngine.isConfigured) {
      SyncEngine.upload(key, data).catch(() => {});
    }
  }

  // 初始化：为缺失的 key 填充默认值
  // defaultsMap: { key: defaultValue } 格式
  async init(defaultsMap) {
    for (const [key, defaultValue] of Object.entries(defaultsMap)) {
      if (!Storage.get(key)) {
        Storage.set(key, defaultValue);
      }
    }
  }
}

export default new DataEngine();
