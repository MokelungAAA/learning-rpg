// settings.js — 设置页（5区块：外观/同步/番茄钟/个人信息/关于）
// 读取: SETTINGS, USER_PROFILE, SYNC_META, lts_sync_config
// 写入: SETTINGS, USER_PROFILE, lts_sync_config
import Theme from '../theme.js';
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys, POMODORO_PRESETS } from '../config.js';
import EventBus from '../event-bus.js';
import Toast from '../components/toast.js';
import SyncEngine from '../sync-engine.js';

const FONT_SIZES = [
  { key: 'small', label: '小', scale: 0.875 },
  { key: 'normal', label: '标准', scale: 1 },
  { key: 'large', label: '大', scale: 1.125 },
];

// 获取设置对象，不存在时返回空对象
function getSettings() {
  return Store.get(StorageKeys.SETTINGS) || {};
}

// 合并写入设置（patch 覆盖 current 同名字段）
function saveSettings(patch) {
  const current = getSettings();
  Store.set(StorageKeys.SETTINGS, { ...current, ...patch });
}

// 外观区块：主题切换（浅色/深色/跟随系统）+ 字号
function renderAppearance() {
  const mode = Theme.getTheme();
  const fontSize = getSettings().fontSize || 'normal';
  const themePills = [
    { key: 'light', label: '浅色' },
    { key: 'dark', label: '深色' },
    { key: 'system', label: '跟随系统' },
  ].map(t => `<button class="pill${mode === t.key ? ' active' : ''}" data-theme="${t.key}">${t.label}</button>`).join('');
  const fontPills = FONT_SIZES.map(f =>
    `<button class="pill font-pill${fontSize === f.key ? ' active' : ''}" data-font="${f.key}">${f.label}</button>`
  ).join('');
  return `<div class="settings-section">
    <h3>🎨 外观</h3>
    <div class="settings-row"><span class="settings-label">主题</span><div class="pill-group theme-pills">${themePills}</div></div>
    <div class="settings-row"><span class="settings-label">字号</span><div class="pill-group font-pills">${fontPills}</div></div>
  </div>`;
}

// 同步区块：GitHub Token 配置 + 立即同步按钮
// 坑: 同步配置存 lts_sync_config（非 SETTINGS 内）
function renderSync() {
  const meta = Store.get(StorageKeys.SYNC_META) || {};
  const syncCfg = Store.get('lts_sync_config') || {};
  const configured = !!(syncCfg.token && syncCfg.owner && syncCfg.repo);
  const statusText = configured
    ? (meta.lastSync ? `上次同步: ${new Date(meta.lastSync).toLocaleString('zh-CN')}` : '已配置，未同步')
    : '未配置';
  return `<div class="settings-section">
    <h3>☁️ 数据同步</h3>
    <div class="settings-row"><span class="settings-label">状态</span><span class="settings-value">${statusText}</span></div>
    <div class="settings-row"><span class="settings-label">仓库</span><span class="settings-value">${configured ? syncCfg.owner + '/' + syncCfg.repo : '—'}</span></div>
    <div class="settings-row"><span class="settings-label">GitHub Token</span><button class="settings-btn" id="sync-config-btn">配置</button></div>
    <div class="settings-row"><button class="settings-btn settings-btn-primary" id="sync-now-btn"${configured ? '' : ' disabled'}>立即同步</button></div>
  </div>
  <div class="sync-config-modal" id="sync-config-modal" style="display:none">
    <div class="sync-modal-backdrop" id="sync-modal-backdrop"></div>
    <div class="sync-modal-content">
      <div class="sync-modal-header">☁️ 同步配置</div>
      <div class="sync-modal-row"><label>GitHub Token</label><input type="password" id="sync-token" class="settings-input" placeholder="ghp_xxxx" value="${syncCfg.token || ''}"></div>
      <div class="sync-modal-row"><label>仓库所有者</label><input type="text" id="sync-owner" class="settings-input" placeholder="用户名" value="${syncCfg.owner || ''}"></div>
      <div class="sync-modal-row"><label>仓库名</label><input type="text" id="sync-repo" class="settings-input" placeholder="lts-data" value="${syncCfg.repo || ''}"></div>
      <div class="sync-modal-actions">
        <button class="settings-btn" id="sync-modal-cancel">取消</button>
        <button class="settings-btn settings-btn-primary" id="sync-modal-save">保存</button>
      </div>
    </div>
  </div>`;
}

// 番茄钟区块：默认预设 + 提示音/振动开关
function renderPomodoroSettings() {
  const settings = getSettings();
  const currentPreset = settings.pomodoroPreset || 'classic';
  const sound = settings.pomodoroSound !== false;
  const vibration = settings.pomodoroVibration !== false;
  const presetOpts = POMODORO_PRESETS.map(p =>
    `<option value="${p.id}"${currentPreset === p.id ? ' selected' : ''}>${p.name} (${p.work}分)</option>`
  ).join('');
  return `<div class="settings-section">
    <h3>🍅 番茄钟</h3>
    <div class="settings-row"><span class="settings-label">默认方案</span><select id="pomo-preset" class="settings-select">${presetOpts}</select></div>
    <div class="settings-row"><span class="settings-label">提示音</span><button class="pill toggle-pill${sound ? ' active' : ''}" id="pomo-sound">${sound ? '开' : '关'}</button></div>
    <div class="settings-row"><span class="settings-label">振动</span><button class="pill toggle-pill${vibration ? ' active' : ''}" id="pomo-vibration">${vibration ? '开' : '关'}</button></div>
  </div>`;
}

// 个人信息区块：昵称 + 年级选择
function renderProfile() {
  const profile = Store.get(StorageKeys.USER_PROFILE) || {};
  const nickname = profile.nickname || '墨澜';
  const grade = profile.grade || '高一';
  return `<div class="settings-section">
    <h3>👤 个人信息</h3>
    <div class="settings-row"><span class="settings-label">昵称</span><input type="text" id="profile-nickname" class="settings-input" value="${nickname}" maxlength="20"></div>
    <div class="settings-row"><span class="settings-label">年级</span><select id="profile-grade" class="settings-select">
      <option${grade === '高一' ? ' selected' : ''}>高一</option>
      <option${grade === '高二' ? ' selected' : ''}>高二</option>
      <option${grade === '高三' ? ' selected' : ''}>高三</option>
    </select></div>
  </div>`;
}

// 关于区块：跳转 #/about 的导航链接
function renderAboutLink() {
  return `<div class="settings-section settings-about-link">
    <a href="#/about" class="settings-nav-link"><span>ℹ️ 关于</span><span class="settings-arrow">→</span></a>
  </div>`;
}

export function render() {
  return `<div class="page-enter">
    <div class="settings-header">⚙️ 设置</div>
    ${renderAppearance()}
    ${renderSync()}
    ${renderPomodoroSettings()}
    ${renderProfile()}
    ${renderAboutLink()}
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.64 · 成就持久化</p>
  </div>`;
}

// afterRender: 所有设置项事件绑定 + 同步弹窗 + 字号恢复
// 坑: onToggle 是工厂函数，清理时需重新调用才能拿到同一引用
export function afterRender() {
  // 主题切换
  const themePills = document.querySelectorAll('.theme-pills .pill');
  const onTheme = (e) => {
    const btn = e.currentTarget;
    Theme.setTheme(btn.dataset.theme);
    themePills.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
  };
  themePills.forEach(p => p.addEventListener('click', onTheme));

  // 字号切换
  const fontPills = document.querySelectorAll('.font-pills .font-pill');
  const onFont = (e) => {
    const key = e.currentTarget.dataset.font;
    const size = FONT_SIZES.find(f => f.key === key);
    if (size) document.documentElement.style.fontSize = `${size.scale * 16}px`;
    saveSettings({ fontSize: key });
    fontPills.forEach(p => p.classList.remove('active'));
    e.currentTarget.classList.add('active');
  };
  fontPills.forEach(p => p.addEventListener('click', onFont));

  // 番茄钟预设
  const presetSelect = document.getElementById('pomo-preset');
  const onPreset = () => saveSettings({ pomodoroPreset: presetSelect.value });
  if (presetSelect) presetSelect.addEventListener('change', onPreset);

  // 提示音/振动切换
  const soundBtn = document.getElementById('pomo-sound');
  const vibBtn = document.getElementById('pomo-vibration');
  const onToggle = (key, btn) => () => {
    const current = btn.classList.contains('active');
    saveSettings({ [key]: !current });
    btn.classList.toggle('active');
    btn.textContent = !current ? '开' : '关';
  };
  if (soundBtn) soundBtn.addEventListener('click', onToggle('pomodoroSound', soundBtn));
  if (vibBtn) vibBtn.addEventListener('click', onToggle('pomodoroVibration', vibBtn));

  // 个人信息保存（500ms debounce，避免每次按键写 Store）
  const nicknameInput = document.getElementById('profile-nickname');
  const gradeSelect = document.getElementById('profile-grade');
  let profileTimer = null;
  const saveProfile = () => {
    clearTimeout(profileTimer);
    profileTimer = setTimeout(() => {
      const profile = Store.get(StorageKeys.USER_PROFILE) || {};
      profile.nickname = nicknameInput.value || '墨澜';
      profile.grade = gradeSelect.value;
      Store.set(StorageKeys.USER_PROFILE, profile);
    }, 500);
  };
  if (nicknameInput) nicknameInput.addEventListener('input', saveProfile);
  if (gradeSelect) gradeSelect.addEventListener('change', saveProfile);

  // 同步配置弹窗
  const syncConfigBtn = document.getElementById('sync-config-btn');
  const syncModal = document.getElementById('sync-config-modal');
  const syncBackdrop = document.getElementById('sync-modal-backdrop');
  const syncCancel = document.getElementById('sync-modal-cancel');
  const syncSave = document.getElementById('sync-modal-save');
  const syncNowBtn = document.getElementById('sync-now-btn');

  const openSyncModal = () => { if (syncModal) syncModal.style.display = 'flex'; };
  const closeSyncModal = () => { if (syncModal) syncModal.style.display = 'none'; };
  const saveSyncConfig = () => {
    const token = document.getElementById('sync-token')?.value?.trim();
    const owner = document.getElementById('sync-owner')?.value?.trim();
    const repo = document.getElementById('sync-repo')?.value?.trim();
    if (!token || !owner || !repo) { Toast.show('请填写完整配置', 'warn'); return; }
    Store.set('lts_sync_config', { token, owner, repo });
    SyncEngine.configure(token, owner, repo);
    Toast.show('同步配置已保存', 'success');
    closeSyncModal();
    window.location.reload();
  };
  const doSync = async () => {
    const cfg = Store.get('lts_sync_config') || {};
    if (!cfg.token || !cfg.owner || !cfg.repo) { Toast.show('请先配置同步', 'warn'); return; }
    SyncEngine.configure(cfg.token, cfg.owner, cfg.repo);
    Toast.show('开始同步...', 'info');
    try {
      await SyncEngine.fullSync();
      Toast.show('同步完成', 'success');
      window.location.reload();
    } catch (e) {
      Toast.show('同步失败: ' + e.message, 'error');
    }
  };

  if (syncConfigBtn) syncConfigBtn.addEventListener('click', openSyncModal);
  if (syncBackdrop) syncBackdrop.addEventListener('click', closeSyncModal);
  if (syncCancel) syncCancel.addEventListener('click', closeSyncModal);
  if (syncSave) syncSave.addEventListener('click', saveSyncConfig);
  if (syncNowBtn) syncNowBtn.addEventListener('click', doSync);

  // 恢复已保存的同步配置到引擎（页面加载时执行一次）
  const savedCfg = Store.get('lts_sync_config') || {};
  if (savedCfg.token) SyncEngine.configure(savedCfg.token, savedCfg.owner, savedCfg.repo);

  // 应用已保存的字号
  const savedSize = (getSettings().fontSize || 'normal');
  const sizeObj = FONT_SIZES.find(f => f.key === savedSize);
  if (sizeObj && savedSize !== 'normal') document.documentElement.style.fontSize = `${sizeObj.scale * 16}px`;

  return () => {
    themePills.forEach(p => p.removeEventListener('click', onTheme));
    fontPills.forEach(p => p.removeEventListener('click', onFont));
    if (presetSelect) presetSelect.removeEventListener('change', onPreset);
    if (soundBtn) soundBtn.removeEventListener('click', onToggle('pomodoroSound', soundBtn));
    if (vibBtn) vibBtn.removeEventListener('click', onToggle('pomodoroVibration', vibBtn));
    if (nicknameInput) nicknameInput.removeEventListener('input', saveProfile);
    if (gradeSelect) gradeSelect.removeEventListener('change', saveProfile);
    if (syncConfigBtn) syncConfigBtn.removeEventListener('click', openSyncModal);
    if (syncBackdrop) syncBackdrop.removeEventListener('click', closeSyncModal);
    if (syncCancel) syncCancel.removeEventListener('click', closeSyncModal);
    if (syncSave) syncSave.removeEventListener('click', saveSyncConfig);
    if (syncNowBtn) syncNowBtn.removeEventListener('click', doSync);
  };
}
