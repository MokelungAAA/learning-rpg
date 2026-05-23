// settings.js — 设置页（5区块：外观/同步/番茄钟/个人信息/关于）
import Theme from '../theme.js';
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys, POMODORO_PRESETS } from '../config.js';
import EventBus from '../event-bus.js';
import Toast from '../components/toast.js';

const FONT_SIZES = [
  { key: 'small', label: '小', scale: 0.875 },
  { key: 'normal', label: '标准', scale: 1 },
  { key: 'large', label: '大', scale: 1.125 },
];

function getSettings() {
  return Store.get(StorageKeys.SETTINGS) || {};
}

function saveSettings(patch) {
  const current = getSettings();
  Store.set(StorageKeys.SETTINGS, { ...current, ...patch });
}

// 16.1 外观区块
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

// 16.1 同步区块
function renderSync() {
  const meta = Store.get(StorageKeys.SYNC_META) || {};
  const connected = !!meta.lastSync;
  const statusText = connected ? `上次同步: ${new Date(meta.lastSync).toLocaleString('zh-CN')}` : '未配置';
  return `<div class="settings-section">
    <h3>☁️ 数据同步</h3>
    <div class="settings-row"><span class="settings-label">状态</span><span class="settings-value">${statusText}</span></div>
    <div class="settings-row"><span class="settings-label">GitHub Token</span><button class="settings-btn" id="sync-config-btn">配置</button></div>
    <div class="settings-row"><button class="settings-btn settings-btn-primary" id="sync-now-btn">立即同步</button></div>
  </div>`;
}

// 16.1 番茄钟区块
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

// 16.1 个人信息区块
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

// 16.1 关于区块
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
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v0.20 · 设置页完善</p>
  </div>`;
}

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

  // 个人信息保存（debounce）
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

  // 同步按钮
  const syncBtn = document.getElementById('sync-now-btn');
  if (syncBtn) syncBtn.addEventListener('click', () => Toast.show('同步功能开发中', 'info'));

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
    if (syncBtn) syncBtn.removeEventListener('click', () => {});
  };
}
