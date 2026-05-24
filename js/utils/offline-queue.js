// offline-queue.js — §13.3 离线数据队列
// 离线时保存记录到队列，恢复网络后批量同步
// 存储 key: lts_offline_queue

const QUEUE_KEY = 'lts_offline_queue';

// 获取队列中的待同步记录
export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch { return []; }
}

// 添加记录到离线队列
export function enqueue(record) {
  const queue = getQueue();
  queue.push({ ...record, _queuedAt: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// 清空队列（同步成功后调用）
export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

// 获取队列长度
export function queueSize() {
  return getQueue().length;
}

// 检查是否在线
export function isOnline() {
  return navigator.onLine;
}
