// bottom-sheet.js — 底部面板组件
// 支持触摸/鼠标拖拽关闭，backdrop点击关闭
// 注意：close()有300ms动画延迟才真正移除DOM
class BottomSheet {
  constructor() {
    this.element = null;
    this.isOpen = false;
  }

  // 打开面板，已打开则先关闭再重建
  // @param {string} content - 内容HTML
  // @param {Object} options - { onOpen: (sheet) => {} }
  open(content, options = {}) {
    if (this.isOpen) this.close();

    this.element = document.createElement('div');
    this.element.className = 'bottom-sheet';
    this.element.innerHTML = `
      <div class="bottom-sheet__backdrop"></div>
      <div class="bottom-sheet__content glass">
        <div class="bottom-sheet__handle"></div>
        <div class="bottom-sheet__body">${content}</div>
      </div>
    `;

    document.body.appendChild(this.element);

    this.element.querySelector('.bottom-sheet__backdrop')
      .addEventListener('click', () => this.close());

    this.initDrag();

    requestAnimationFrame(() => {
      this.element.classList.add('bottom-sheet--open');
    });

    this.isOpen = true;

    if (options.onOpen) options.onOpen(this);
  }

  // 关闭面板，先移除动画类，300ms后移除DOM
  close() {
    if (!this.isOpen || !this.element) return;

    this.element.classList.remove('bottom-sheet--open');
    const el = this.element;

    setTimeout(() => {
      el.remove();
    }, 300);

    this.element = null;
    this.isOpen = false;
  }

  // 初始化拖拽关闭：handle区域向下拖>100px则关闭
  // 同时绑定touch和mouse事件，注意mousemove/mouseup绑在document上
  initDrag() {
    const handle = this.element.querySelector('.bottom-sheet__handle');
    const content = this.element.querySelector('.bottom-sheet__content');
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const onStart = (y) => {
      startY = y;
      isDragging = true;
      content.style.transition = 'none';
    };

    const onMove = (y) => {
      if (!isDragging) return;
      currentY = y;
      const diff = currentY - startY;
      if (diff > 0) {
        content.style.transform = `translateY(${diff}px)`;
      }
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      content.style.transition = '';
      const diff = currentY - startY;
      if (diff > 100) {
        this.close();
      } else {
        content.style.transform = '';
      }
    };

    handle.addEventListener('touchstart', (e) => onStart(e.touches[0].clientY));
    handle.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e.touches[0].clientY); });
    handle.addEventListener('touchend', onEnd);

    handle.addEventListener('mousedown', (e) => onStart(e.clientY));
    document.addEventListener('mousemove', (e) => onMove(e.clientY));
    document.addEventListener('mouseup', onEnd);
  }
}

export default BottomSheet;
