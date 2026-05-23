// data-io.js — 数据导入导出页
import Store from '../store.js';
import { STORAGE_KEYS as StorageKeys } from '../config.js';
import EventBus from '../event-bus.js';
import Toast from '../components/toast.js';

const KEYS = [
  StorageKeys.USER_PROFILE, StorageKeys.STUDY_RECORDS,
  StorageKeys.POMODORO_SESSIONS, StorageKeys.READING_RECORDS,
  StorageKeys.KNOWLEDGE_STATE, StorageKeys.ACHIEVEMENTS,
  StorageKeys.SETTINGS, StorageKeys.SYNC_META,
];

function exportJSON() {
  const data = { version: '1.0', exportTime: new Date().toISOString() };
  for (const key of KEYS) {
    const val = Store.get(key);
    if (val) data[key] = val;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lts-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  Toast.show('JSON 导出成功', 'success');
}

function exportCSV() {
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  if (records.length === 0) { Toast.show('暂无学习记录', 'info'); return; }
  const headers = ['id', 'timestamp', 'subject', 'textbook', 'knowledgePoints', 'score', 'duration', 'activityType', 'notes', 'xp'];
  const csvRows = [headers.join(',')];
  for (const r of records) {
    csvRows.push(headers.map(h => {
      let val = r[h];
      if (Array.isArray(val)) val = val.join(';');
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) val = `"${val.replace(/"/g, '""')}"`;
      return val ?? '';
    }).join(','));
  }
  const blob = new Blob(['﻿' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lts-records-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  Toast.show('CSV 导出成功', 'success');
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.version) { Toast.show('无效的备份文件', 'error'); return; }
      let imported = 0;
      for (const key of KEYS) {
        if (data[key]) {
          const existing = Store.get(key);
          if (Array.isArray(data[key]) && Array.isArray(existing)) {
            // 合并数组，去重
            const merged = [...existing];
            for (const item of data[key]) {
              if (!merged.some(e => e.id === item.id)) merged.push(item);
            }
            Store.set(key, merged);
          } else {
            Store.set(key, data[key]);
          }
          imported++;
        }
      }
      Toast.show(`导入成功 · ${imported} 个数据块`, 'success');
      EventBus.emit('data:imported');
    } catch { Toast.show('文件解析失败', 'error'); }
  };
  reader.readAsText(file);
}

export function render() {
  const records = Store.get(StorageKeys.STUDY_RECORDS) || [];
  const pomodoros = Store.get(StorageKeys.POMODORO_SESSIONS) || [];
  const readings = Store.get(StorageKeys.READING_RECORDS) || [];

  return `<div class="page-enter">
    <a href="#/data" class="page-back">← 返回数据</a>
    <div class="data-io-header">📦 数据管理</div>
    <div class="data-io-stats">
      <div class="data-io-stat"><div class="data-io-stat-value">${records.length}</div><div class="data-io-stat-label">学习记录</div></div>
      <div class="data-io-stat"><div class="data-io-stat-value">${pomodoros.length}</div><div class="data-io-stat-label">番茄钟</div></div>
      <div class="data-io-stat"><div class="data-io-stat-value">${readings.length}</div><div class="data-io-stat-label">阅读记录</div></div>
    </div>
    <div class="data-io-section">
      <h3>导出</h3>
      <div class="data-io-actions">
        <button class="data-io-btn" id="export-json">📄 导出 JSON（全量备份）</button>
        <button class="data-io-btn" id="export-csv">📊 导出 CSV（学习记录）</button>
      </div>
    </div>
    <div class="data-io-section">
      <h3>导入</h3>
      <div class="data-io-actions">
        <label class="data-io-btn data-io-upload" id="import-label">
          📥 导入 JSON 备份
          <input type="file" id="import-file" accept=".json" style="display:none">
        </label>
      </div>
      <p class="data-io-note">导入会与现有数据合并，相同 ID 的记录不会重复</p>
    </div>
    <p style="color:var(--color-text-3);margin-top:var(--sp-3);font-size:var(--fs-xs)">v1.5 · 数据导入导出</p>
  </div>`;
}

export function afterRender() {
  const exportJsonBtn = document.getElementById('export-json');
  const exportCsvBtn = document.getElementById('export-csv');
  const importInput = document.getElementById('import-file');

  if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJSON);
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportCSV);
  if (importInput) importInput.addEventListener('change', (e) => { if (e.target.files[0]) importJSON(e.target.files[0]); });

  return () => {
    if (exportJsonBtn) exportJsonBtn.removeEventListener('click', exportJSON);
    if (exportCsvBtn) exportCsvBtn.removeEventListener('click', exportCSV);
  };
}
