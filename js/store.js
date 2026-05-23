// store.js — localStorage 封装 + 内存缓存
// 单例模式，避免重复读 localStorage
// 注意：set() 会触发 'data:changed' 事件
import EventBus from './event-bus.js';

class Store {
  constructor() {
    this.cache = new Map();
  }

  // 读取：缓存优先，miss 时从 localStorage JSON.parse
  // 返回 null 表示不存在或解析失败
  get(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    try {
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : null;
      this.cache.set(key, data);
      return data;
    } catch (e) {
      console.error(`Storage read error: ${key}`, e);
      return null;
    }
  }

  // 写入：同时更新缓存和 localStorage
  // 自动 JSON.stringify，会触发 data:changed 事件
  set(key, value) {
    try {
      this.cache.set(key, value);
      localStorage.setItem(key, JSON.stringify(value));
      EventBus.emit('data:changed', { key, value });
    } catch (e) {
      console.error(`Storage write error: ${key}`, e);
    }
  }

  // 删除：同时清理缓存和 localStorage
  remove(key) {
    this.cache.delete(key);
    localStorage.removeItem(key);
  }

  // 检查 key 是否存在（缓存或 localStorage）
  has(key) {
    if (this.cache.has(key)) return true;
    return localStorage.getItem(key) !== null;
  }

  // 按前缀扫描 localStorage，返回 { key: value } 对象
  getAll(prefix = '') {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        result[key] = this.get(key);
      }
    }
    return result;
  }

  // 清空全部数据（缓存 + localStorage），慎用
  clear() {
    this.cache.clear();
    localStorage.clear();
  }
}

export default new Store();
