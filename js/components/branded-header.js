// branded-header.js — 品牌头部栏（§4.2/§6.3）
// 桌面端显示：logo + 系统名 + 版本号 + 快捷操作
// 移动端隐藏（状态栏已有功能）
import EventBus from '../event-bus.js';

class BrandedHeader {
  constructor() {
    this.el = null;
  }

  render(container) {
    this.el = document.createElement('header');
    this.el.className = 'branded-header';
    this.el.innerHTML = `
      <div class="branded-header-left">
        <span class="branded-header-logo">🎮</span>
        <span class="branded-header-name">学习RPG</span>
        <span class="branded-header-ver">v0.121</span>
      </div>
      <div class="branded-header-right" id="branded-header-right"></div>
    `;
    container.insertBefore(this.el, container.firstChild);
  }
}

export default new BrandedHeader();
