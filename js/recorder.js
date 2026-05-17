/* ================================================================
   recorder.js — 学习记录引擎
   使用 calcXPEngine2 完整加权公式
   自动触发知识状态构建、用户画像更新、成就检查、持久化
   ================================================================ */

function createLearningRecord(opts) {
  opts = opts || {};
  var duration = opts.duration || 0;
  var score = opts.score || 50;
  if (!opts.subject) return null;
  if (duration <= 0) return null;

  var practiceDuration = opts.practiceDuration || Math.round(duration * 0.8);
  var reviewDuration = opts.reviewDuration || (duration - practiceDuration);

  var record = {
    id: uuid(),
    timestamp: toLocalISO(),
    subject: opts.subject,
    knowledgePoints: opts.knowledgePoints || [],
    activityType: opts.activityType || 'practice',
    score: score,
    duration: duration,
    practiceDuration: practiceDuration,
    reviewDuration: reviewDuration,
    totalQuestions: opts.totalQuestions || 0,
    correctCount: opts.correctCount || 0,
    source: opts.source || 'web',
    notes: opts.notes || ''
  };

  record.xp = calcXPEngine2(record, appData.userProfile);

  return record;
}

function commitRecord(record) {
  if (!record) return 0;

  appData.records.push(record);

  if (appData.profile) {
    appData.profile.totalXp = (appData.profile.totalXp || 0) + (record.xp || 0);
    appData.profile.totalStudyMinutes = (appData.profile.totalStudyMinutes || 0) + (record.duration || 0);
  }

  buildKnowledgeStates(appData.records, appData.skillTree);
  updateUserProfile();
  persistAppData();
  checkAchievements();

  return record.xp || 0;
}

function removeRecordById(id) {
  var idx = -1;
  for (var i = 0; i < appData.records.length; i++) {
    if (appData.records[i].id === id) { idx = i; break; }
  }
  if (idx < 0) return false;
  var r = appData.records[idx];
  if (appData.profile) {
    appData.profile.totalXp = Math.max(0, (appData.profile.totalXp || 0) - (r.xp || 0));
  }
  appData.records.splice(idx, 1);
  buildKnowledgeStates(appData.records, appData.skillTree);
  updateUserProfile();
  persistAppData();
  return true;
}

function updateRecordById(id, patch) {
  var r = null;
  for (var i = 0; i < appData.records.length; i++) {
    if (appData.records[i].id === id) { r = appData.records[i]; break; }
  }
  if (!r) return false;

  var oldXp = r.xp || 0;

  if (patch.subject !== undefined) r.subject = patch.subject;
  if (patch.score !== undefined) r.score = patch.score;
  if (patch.duration !== undefined) r.duration = patch.duration;
  if (patch.practiceDuration !== undefined) r.practiceDuration = patch.practiceDuration;
  if (patch.reviewDuration !== undefined) r.reviewDuration = patch.reviewDuration;
  if (patch.activityType !== undefined) r.activityType = patch.activityType;
  if (patch.knowledgePoints !== undefined) r.knowledgePoints = patch.knowledgePoints;
  if (patch.notes !== undefined) r.notes = patch.notes;

  r.xp = calcXPEngine2(r, appData.userProfile);

  if (appData.profile) {
    appData.profile.totalXp = (appData.profile.totalXp || 0) - oldXp + (r.xp || 0);
  }

  buildKnowledgeStates(appData.records, appData.skillTree);
  updateUserProfile();
  persistAppData();

  return true;
}
