// event-bus.js — Simple pub/sub
class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, fn) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    const set = this._listeners.get(event);
    if (set) set.delete(fn);
  }

  emit(event, data) {
    const set = this._listeners.get(event);
    if (set) set.forEach(fn => fn(data));
  }
}

export default new EventBus();
