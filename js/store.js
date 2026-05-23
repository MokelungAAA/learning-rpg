// store.js — Memory cache + localStorage
import EventBus from './event-bus.js';

class Store {
  constructor() {
    this.cache = new Map();
  }

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

  set(key, value) {
    try {
      this.cache.set(key, value);
      localStorage.setItem(key, JSON.stringify(value));
      EventBus.emit('data:changed', { key, value });
    } catch (e) {
      console.error(`Storage write error: ${key}`, e);
    }
  }

  remove(key) {
    this.cache.delete(key);
    localStorage.removeItem(key);
  }
}

export default new Store();
