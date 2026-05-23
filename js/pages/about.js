// about.js — 关于页（版本信息+致谢+历史）
const VERSION_HISTORY = [
  { version: 'v0.60', date: '2026-05-23', desc: '最终打磨 — 版本号统一+集成测试+版本历史修复' },
  { version: 'v0.59', date: '2026-05-23', desc: '响应式增强 — 桌面侧边栏+平板双列+多断点适配' },
  { version: 'v0.58', date: '2026-05-23', desc: '新增图表 — 得分率趋势+输入输出比例+导航栏L型布局' },
  { version: 'v0.57', date: '2026-05-23', desc: '导航栏重构 — 4Tab+番茄钟独立入口+分隔线' },
  { version: 'v0.56', date: '2026-05-23', desc: 'CSS变量统一 — 缺失变量补全+深色模式对齐+搜索成就过滤' },
  { version: 'v0.55', date: '2026-05-23', desc: 'PWA支持 — manifest+service-worker+离线缓存' },
  { version: 'v0.54', date: '2026-05-23', desc: '搜索历史增强 — 5条历史+点击结果保存+清除按钮' },
  { version: 'v0.53', date: '2026-05-23', desc: '番茄钟音效+振动+通知 — Web Audio API音效+系统通知' },
  { version: 'v0.52', date: '2026-05-23', desc: '微交互动画 — 卡片hover+按钮反馈+进度条过渡+数字滚动' },
  { version: 'v0.51', date: '2026-05-23', desc: '学科详情页 — 独立路由+概览+教材/复习/日志/图表折叠卡片' },
  { version: 'v0.50', date: '2026-05-23', desc: '最终打磨 — 版本号统一+集成测试+路由修复' },
  { version: 'v0.49', date: '2026-05-23', desc: 'CSS架构优化 — data-tab.css从home.css分离' },
  { version: 'v0.48', date: '2026-05-23', desc: 'ECharts图表加载指示器 — 异步加载时显示spinner' },
  { version: 'v0.47', date: '2026-05-23', desc: '搜索结果深度链接 — 记录/教材/知识点跳转带筛选' },
  { version: 'v0.46', date: '2026-05-23', desc: '热力图点击交互 — 点击日期查看当日学习详情' },
  { version: 'v0.45', date: '2026-05-23', desc: '成就浏览页 — 全部成就列表+解锁状态+稀有度' },
  { version: 'v0.44', date: '2026-05-23', desc: '日志编辑弹窗扩展 — 学科/教材/知识点/类型可编辑' },
  { version: 'v0.43', date: '2026-05-23', desc: '阅读记录编辑/删除' },
  { version: 'v0.42', date: '2026-05-23', desc: '同步配置UI + 复习记录追踪' },
  { version: 'v0.41', date: '2026-05-23', desc: '成就系统修复 + 学科跳转 + 番茄钟widget + 版本号修正' },
  { version: 'v0.22', date: '2026-05-23', desc: '搜索系统 + 数据导入导出 + 番茄钟修复' },
  { version: 'v0.21', date: '2026-05-23', desc: '子页面返回按钮' },
  { version: 'v0.20', date: '2026-05-23', desc: '设置页完善 + 关于页' },
  { version: 'v0.19', date: '2026-05-23', desc: '版本号统一更新为新方案' },
  { version: 'v0.11', date: '2026-05-23', desc: '阅读记录系统 — 书架+列表+图表+录入' },
  { version: 'v0.10', date: '2026-05-23', desc: '番茄钟系统 — 配置+计时+评分+追踪+历史' },
  { version: 'v0.9', date: '2026-05-23', desc: '日志管理 — 列表+筛选+搜索+编辑+删除' },
  { version: 'v0.8', date: '2026-05-23', desc: '数据录入 — 搜索+时间推断+全链路联动' },
  { version: 'v0.7', date: '2026-05-23', desc: '复习中心完成 + 数据录入弹窗' },
  { version: 'v0.6', date: '2026-05-23', desc: '复习中心 — 遗忘曲线+阴影队列+智能推荐' },
  { version: 'v0.5', date: '2026-05-23', desc: '技能树系统 — 力导向图+雷达图+薄弱点识别' },
  { version: 'v0.4', date: '2026-05-23', desc: '概览页渲染 — 首页布局+数据Tab' },
  { version: 'v0.3', date: '2026-05-23', desc: '深色模式切换 + 首页状态栏' },
  { version: 'v0.2', date: '2026-05-23', desc: '组件库 + 数据引擎' },
  { version: 'v0.1', date: '2026-05-23', desc: '重写基础架构 — 模块化文件结构' },
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
        <div class="about-version">v0.60</div>
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
