// about.js — 关于页（版本信息+致谢+历史）
const VERSION_HISTORY = [
  { version: 'v0.20', date: '2026-05-23', desc: '设置页完善 + 关于页' },
  { version: 'v0.18', date: '2026-05-23', desc: '阅读记录系统 — 书架+列表+图表+录入' },
  { version: 'v0.17', date: '2026-05-23', desc: '番茄钟系统 — 配置+计时+评分+追踪+历史' },
  { version: 'v0.16', date: '2026-05-23', desc: '日志管理 — 列表+筛选+搜索+编辑+删除' },
  { version: 'v0.15', date: '2026-05-23', desc: '数据录入 — 搜索+时间推断+全链路联动' },
  { version: 'v0.14', date: '2026-05-23', desc: '复习中心完成 + 数据录入弹窗' },
  { version: 'v0.13', date: '2026-05-23', desc: '复习中心 — 遗忘曲线+阴影队列+智能推荐' },
  { version: 'v0.12', date: '2026-05-23', desc: '技能树系统 — 力导向图+雷达图+薄弱点识别' },
  { version: 'v0.11', date: '2026-05-23', desc: '概览页渲染 — 首页布局+数据Tab' },
  { version: 'v0.05', date: '2026-05-23', desc: '深色模式切换 + 首页状态栏' },
  { version: 'v0.04', date: '2026-05-23', desc: '版本号修复' },
  { version: 'v0.03', date: '2026-05-23', desc: 'DataEngine 动态导入容错' },
  { version: 'v0.02', date: '2026-05-23', desc: '组件库 + 数据引擎' },
  { version: 'v0.01', date: '2026-05-23', desc: '重写基础架构 — 模块化文件结构' },
];

export function render() {
  const historyRows = VERSION_HISTORY.map(v =>
    `<tr><td class="about-ver">${v.version}</td><td class="about-date">${v.date}</td><td>${v.desc}</td></tr>`
  ).join('');

  return `<div class="page-enter">
    <div class="about-page">
      <a href="#/settings" class="about-back">← 返回设置</a>
      <div class="about-hero">
        <div class="about-logo">LTS</div>
        <div class="about-title">学习RPG · 认知操作系统</div>
        <div class="about-version">v0.20</div>
        <div class="about-credit">Created by 墨澜 × Miku</div>
      </div>
      <div class="about-section">
        <div class="about-section-title">技术栈</div>
        <div class="about-tags">
          <span class="about-tag">HTML5</span>
          <span class="about-tag">CSS3</span>
          <span class="about-tag">Vanilla JS</span>
          <span class="about-tag">ECharts 5.4.3</span>
          <span class="about-tag">localStorage</span>
        </div>
      </div>
      <div class="about-section">
        <div class="about-section-title">致谢</div>
        <div class="about-credits">
          <div class="about-credit-item"><span class="about-credit-name">ECharts</span><span class="about-credit-desc">数据可视化图表库</span></div>
          <div class="about-credit-item"><span class="about-credit-name">Material Design 3</span><span class="about-credit-desc">设计语言参考</span></div>
          <div class="about-credit-item"><span class="about-credit-name">Legado 3.0</span><span class="about-credit-desc">UI 风格参考</span></div>
        </div>
      </div>
      <div class="about-section">
        <div class="about-section-title about-history-toggle" id="history-toggle">
          版本历史 <span class="about-toggle-icon">▾</span>
        </div>
        <div class="about-history" id="about-history" style="display:none">
          <table class="about-table">${historyRows}</table>
        </div>
      </div>
      <div class="about-footer">学习本身就是游戏，系统只是让你看见自己的成长。</div>
    </div>
  </div>`;
}

export function afterRender() {
  const toggle = document.getElementById('history-toggle');
  const history = document.getElementById('about-history');
  const onToggle = () => {
    const shown = history.style.display !== 'none';
    history.style.display = shown ? 'none' : 'block';
    toggle.querySelector('.about-toggle-icon').textContent = shown ? '▾' : '▴';
  };
  if (toggle) toggle.addEventListener('click', onToggle);
  return () => { if (toggle) toggle.removeEventListener('click', onToggle); };
}
