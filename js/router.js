// router.js — Hash-based router with :id param support
class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.history = [];
    this.container = null;
  }

  init(container) {
    this.container = container;
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  register(pattern, handler) {
    this.routes.set(pattern, handler);
  }

  navigate(hash) {
    window.location.hash = hash;
  }

  back() {
    if (this.history.length > 1) {
      this.history.pop();
      window.location.hash = this.history[this.history.length - 1];
    } else {
      window.location.hash = '#/';
    }
  }

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

  matchPattern(pattern, hash) {
    const patternParts = pattern.split('/');
    const hashParts = hash.split('/');

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

  animateTransition(callback) {
    if (!this.container) {
      callback();
      return;
    }
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateY(10px)';

    setTimeout(() => {
      callback();
      this.container.style.opacity = '1';
      this.container.style.transform = 'translateY(0)';
    }, 150);
  }
}

export default new Router();
