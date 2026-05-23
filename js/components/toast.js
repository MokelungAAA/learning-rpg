// toast.js — Toast提示组件
// 全静态方法，无需实例化；自动移除DOM，无需手动清理
class Toast {
  static icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  // 创建toast DOM，CSS动画入场，duration后自动移除
  // @param {string} message - 显示文本
  // @param {string} type - info/success/warning/error
  // @param {number} duration - 显示时长(ms)，默认2000
  static show(message, type = 'info', duration = 2000) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type} glass`;
    toast.innerHTML = `
      <span class="toast__icon">${Toast.icons[type]}</span>
      <span class="toast__message">${message}</span>
    `;

    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--show'));

    setTimeout(() => {
      toast.classList.remove('toast--show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // 便捷方法，error默认3秒其余2秒
  static success(msg) { Toast.show(msg, 'success'); }
  static error(msg) { Toast.show(msg, 'error', 3000); }
  static warning(msg) { Toast.show(msg, 'warning'); }
  static info(msg) { Toast.show(msg, 'info'); }
}

export default Toast;
