// toast.js — Toast 提示组件
class Toast {
  static icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

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

  static success(msg) { Toast.show(msg, 'success'); }
  static error(msg) { Toast.show(msg, 'error', 3000); }
  static warning(msg) { Toast.show(msg, 'warning'); }
  static info(msg) { Toast.show(msg, 'info'); }
}

export default Toast;
