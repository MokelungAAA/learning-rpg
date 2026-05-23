// event-bus.js — 发布/订阅事件总线
// 单例模式，全局共用，所有模块通过它解耦通信
class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  // 订阅事件，返回取消订阅的函数
  // fn(data) 接收 emit 传递的数据
  on(event, fn) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  // 取消订阅，fn 必须是同一个函数引用
  off(event, fn) {
    const set = this._listeners.get(event);
    if (set) set.delete(fn);
  }

  // 触发事件，同步调用所有监听器
  emit(event, data) {
    const set = this._listeners.get(event);
    if (set) set.forEach(fn => fn(data));
  }
}

export default new EventBus();
