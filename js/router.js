// router.js — Hash 路由器，支持 :id 动态参数
// 单例模式，全局共用一个实例
class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.history = [];
    this.container = null;
  }

  // 初始化：绑定 hashchange 和 load 事件
  // container: 页面内容的 DOM 容器元素
  init(container) {
    this.container = container;
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  // 注册路由：pattern 如 '#/subject/:id'，handler(params)
  register(pattern, handler) {
    this.routes.set(pattern, handler);
  }

  // 程序化跳转，hash 必须带 # 前缀
  navigate(hash) {
    window.location.hash = hash;
  }

  // 返回上一页，历史为空时回首页
  back() {
    if (this.history.length > 1) {
      this.history.pop();
      window.location.hash = this.history[this.history.length - 1];
    } else {
      window.location.hash = '#/';
    }
  }

  // 匹配当前 hash → 执行 handler → 无匹配则回首页
  handleRoute() {
    const hash = window.location.hash || '#/';

    for (const [pattern, handler] of this.routes) {
      const match = this.matchPattern(pattern, hash);
      if (match) {
        this.animateTransition(() => {
          handler(match.params);
          this.currentRoute = hash;
          this.history.push(hash);
        });
        return;
      }
    }

    // 404 → home
    this.navigate('#/');
  }

  // 模式匹配：支持 :id 参数提取，忽略 ?query 部分
  matchPattern(pattern, hash) {
    const patternParts = pattern.split('/');
    const cleanHash = hash.split('?')[0];
    const hashParts = cleanHash.split('/');

    if (patternParts.length !== hashParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = hashParts[i];
      } else if (patternParts[i] !== hashParts[i]) {
        return null;
      }
    }
    return { params };
  }

  // §6.5: 页面过渡动画 — opacity 0→1 + translateY(8px), 0.25s ease
  animateTransition(callback) {
    if (!this.container) {
      callback();
      return;
    }
    this.container.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateY(8px)';

    setTimeout(() => {
      callback();
      this.container.style.opacity = '1';
      this.container.style.transform = 'translateY(0)';
    }, 250);
  }
}

export default new Router();
