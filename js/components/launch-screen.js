// launch-screen.js — 启动页（§4.2）粒子网络+时间主题
// 日出(5-12): 暖色粒子+金色光晕 / 晴空(12-17): 蓝白粒子+天蓝光晕 / 星空(17-5): 紫蓝粒子+深紫光晕
// 点击任意处或 3s 自动进入
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';
import { calcLevelProgress, getLevelTitle } from '../utils/level.js';

// 时间主题配置
const THEMES = {
  sunrise: {
    bg: '#1a1020',
    particles: [[255, 180, 80], [255, 140, 50], [255, 210, 100]],
    glow: 'rgba(255, 160, 50, 0.15)',
    accent: '#FFB84D',
    ring: 'rgba(255, 180, 80, 0.3)',
    ringInner: 'rgba(255, 180, 80, 0.1)',
  },
  sunshine: {
    bg: '#0a1525',
    particles: [[100, 180, 255], [150, 210, 255], [200, 230, 255]],
    glow: 'rgba(80, 160, 240, 0.15)',
    accent: '#6CB4FF',
    ring: 'rgba(100, 180, 255, 0.3)',
    ringInner: 'rgba(100, 180, 255, 0.1)',
  },
  starry: {
    bg: '#0a0a1a',
    particles: [[208, 188, 255], [160, 140, 220], [130, 110, 200]],
    glow: 'rgba(103, 80, 164, 0.15)',
    accent: '#D0BCFF',
    ring: 'rgba(208, 188, 255, 0.3)',
    ringInner: 'rgba(208, 188, 255, 0.1)',
  },
};

function getTimeTheme() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'sunrise';
  if (h >= 12 && h < 17) return 'sunshine';
  return 'starry';
}

// 粒子网络动画引擎
class ParticleNetwork {
  constructor(canvas, theme) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = THEMES[theme] || THEMES.starry;
    this.particles = [];
    this.animId = null;
    this.running = true;
    this.resize();
    this.initParticles();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.scale(dpr, dpr);
  }

  initParticles() {
    const count = Math.min(80, Math.floor((this.w * this.h) / 8000));
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const color = this.theme.particles[Math.floor(Math.random() * this.theme.particles.length)];
      this.particles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1 + Math.random() * 2.5,
        opacity: 0.4 + Math.random() * 0.5,
        color,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  draw() {
    if (!this.running) return;
    const { ctx, w, h, particles } = this;
    const t = Date.now() / 1000;
    ctx.clearRect(0, 0, w, h);

    // 连线（距离<120的粒子之间）
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const alpha = (1 - dist / 120) * 0.2;
          const [r, g, b] = particles[i].color;
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // 粒子（带发光效果）
    for (const p of particles) {
      const pulse = 0.7 + 0.3 * Math.sin(t * 1.2 + p.phase);
      const alpha = p.opacity * pulse;

      // 外层发光
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      grad.addColorStop(0, `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${alpha * 0.6})`);
      grad.addColorStop(1, `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fill();

      // 内层实心
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${alpha})`;
      ctx.fill();
    }
  }

  update() {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > this.w) p.vx *= -1;
      if (p.y < 0 || p.y > this.h) p.vy *= -1;
    }
  }

  start() {
    const loop = () => {
      if (!this.running) return;
      this.update();
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}

export function showLaunchScreen() {
  return new Promise((resolve) => {
    const profile = Store.get(StorageKeys.USER_PROFILE) || {};
    const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
    const totalXP = records.reduce((s, r) => s + (r.xp || 0), 0);
    const { level } = calcLevelProgress(totalXP);
    const title = getLevelTitle(level);
    const streak = (() => {
      const days = new Set();
      for (const r of records) {
        if (r.timestamp) days.add(new Date(r.timestamp).toISOString().slice(0, 10));
      }
      let s = 0;
      const d = new Date();
      while (true) {
        if (days.has(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1); }
        else break;
      }
      return s;
    })();

    const themeKey = getTimeTheme();
    const theme = THEMES[themeKey];

    const overlay = document.createElement('div');
    overlay.className = `launch-overlay launch-theme-${themeKey}`;
    overlay.innerHTML = `
      <canvas class="launch-canvas" id="launch-canvas"></canvas>
      <div class="launch-glow" style="background:radial-gradient(circle, ${theme.glow} 0%, transparent 70%)"></div>
      <div class="launch-content">
        <div class="launch-logo-ring" style="border-color:${theme.ring}">
          <div class="launch-logo-text" style="color:${theme.accent}">LTS</div>
        </div>
        <div class="launch-title">学习RPG</div>
        <div class="launch-subtitle" style="color:${theme.accent}99">认知操作系统</div>
        <div class="launch-info">
          <span class="launch-info-item">Lv${level} ${title.cn}</span>
          <span class="launch-info-divider">·</span>
          <span class="launch-info-item">${totalXP.toLocaleString()} XP</span>
          ${streak > 0 ? `<span class="launch-info-divider">·</span><span class="launch-info-item">🔥 ${streak}天</span>` : ''}
        </div>
        <div class="launch-hint">点击进入</div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 初始化粒子网络（传入时间主题）
    const canvas = document.getElementById('launch-canvas');
    let network = null;
    if (canvas) {
      network = new ParticleNetwork(canvas, themeKey);
      network.start();
    }

    const dismiss = () => {
      if (network) network.stop();
      overlay.classList.add('launch-fade-out');
      setTimeout(() => { overlay.remove(); resolve(); }, 600);
    };

    overlay.addEventListener('click', dismiss);
    setTimeout(dismiss, 3000);
  });
}
