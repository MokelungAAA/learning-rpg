/* ================================================================
   algorithms.js — 核心算法引擎
   温度模型 / 半衰期 / XP引擎 / 技能聚合 / 复习推荐
   ================================================================ */

function calcTemp(peakTemp, lastStudy, halfLife) {
  if (!peakTemp || peakTemp <= 0) return 0;
  if (!halfLife || halfLife <= 0) halfLife = 3.0;
  var now = Date.now();
  var lastTime = typeof lastStudy === 'string' ? new Date(lastStudy).getTime() : (lastStudy || now);
  var daysSince = Math.max(0, (now - lastTime) / 86400000);
  var temp = peakTemp * Math.pow(2, -daysSince / halfLife);
  return clamp(Math.round(temp), 0, 100);
}

function getTempLevel(temp) {
  var levels = [
    { name: '炙热', icon: '🔥', color: '#FF4500', cssVar: '--temp-searing', min: 80 },
    { name: '温热', icon: '🟠', color: '#FF8C00', cssVar: '--temp-hot', min: 60 },
    { name: '温暖', icon: '🟡', color: '#FFD700', cssVar: '--temp-warm', min: 40 },
    { name: '正常', icon: '🟢', color: '#62A0EA', cssVar: '--temp-normal', min: 20 },
    { name: '微凉', icon: '🔵', color: '#1A5FB4', cssVar: '--temp-cool', min: 1 },
    { name: '冻结', icon: '⚫', color: '#6B7280', cssVar: '--temp-frozen', min: 0 }
  ];
  for (var i = 0; i < levels.length; i++) {
    if (temp >= levels[i].min) return levels[i];
  }
  return levels[levels.length - 1];
}

function calcHalfLife(baseHalfLife, subjectModifier, accuracy, streak) {
  baseHalfLife = baseHalfLife || 3.0;
  subjectModifier = subjectModifier || 1.0;
  accuracy = accuracy || 70;
  streak = streak || 0;
  var fAccuracy = 1 + (accuracy - 70) / 100;
  var fStreak = 1 + Math.min(streak, 10) * 0.02;
  var halfLife = baseHalfLife * subjectModifier * fAccuracy * fStreak;
  return clamp(Math.round(halfLife * 100) / 100, 0.5, 30);
}

function calcSubjectLevel(subjectKey) {
  var records = (appData.records || []).filter(function (r) {
    return r.subject === subjectKey || r.subject === (SUBJECT_NAMES[subjectKey] || subjectKey);
  });
  if (records.length === 0) return { score: 0, title: getLevelTitle(0), progress: 0 };

  var avgAccuracy = records.reduce(function (s, r) { return s + (r.score || 0); }, 0) / records.length;
  var knowledgeBreadth = Math.min(1, records.length / 20);
  var knowledgeDepth = avgAccuracy / 100;
  var efficiency = Math.min(1, records.filter(function (r) { return (r.score || 0) >= 70; }).length / Math.max(1, records.length));
  var score = Math.round((Math.pow(knowledgeBreadth, 0.3) * Math.pow(knowledgeDepth, 0.4) * Math.pow(efficiency, 0.3)) * 100);
  score = clamp(score, 0, 100);
  return { score: score, title: getLevelTitle(score), progress: score };
}

function getLevelTitle(score) {
  var titles = [
    { name: '見習い', cn: '见习', color: '#9CA3AF', min: 0 },
    { name: '初心者', cn: '初心者', color: '#6B7280', min: 10 },
    { name: '学徒', cn: '学徒', color: '#3B82F6', min: 20 },
    { name: '熟練者', cn: '熟练者', color: '#10B981', min: 40 },
    { name: '達人', cn: '达人', color: '#F59E0B', min: 60 },
    { name: '名人', cn: '名人', color: '#EF4444', min: 80 },
    { name: '伝説', cn: '传说', color: '#8B5CF6', min: 95 }
  ];
  for (var i = titles.length - 1; i >= 0; i--) {
    if (score >= titles[i].min) return titles[i];
  }
  return titles[0];
}

function calcBaseXP(score, duration) {
  if (!duration || duration <= 0) return 1;
  if (!score || score <= 0) score = 50;
  var xp = Math.round(score * duration / 20);
  return clamp(xp, 1, 500);
}

function calcXPEngine2(record, profile) {
  profile = profile || appData.userProfile || {};
  var duration = record.duration || 0;
  var score = record.score || 50;
  if (duration <= 0) return 1;

  var practiceDuration = record.practiceDuration || duration * 0.8;
  var reviewDuration = record.reviewDuration || duration * 0.2;
  var xpBasePerMinute = profile.xpBasePerMinute || 2.0;
  var practiceBase = practiceDuration * xpBasePerMinute;
  var reviewBase = reviewDuration * xpBasePerMinute;
  var accuracy = score / 100;
  var PE = accuracy;
  var CE = Math.min(1, accuracy * 1.2);
  var rawXP = practiceBase * PE + reviewBase * CE * 1.3;

  var subjectModifiers = profile.subjectModifiers || {};
  var subjectModifier = subjectModifiers[record.subject] || 1.0;
  var subjectDifficulty = Math.sqrt(1 / Math.max(0.5, subjectModifier));
  var E = PE * 0.8 + CE * 0.2 * 1.3;
  var activityWeights = profile.activityWeights || {};
  var activityWeight = activityWeights[record.activityType] || 1.0;
  var momentum = calcMomentum();
  var qual = E * subjectDifficulty * (1 + momentum) * activityWeight;

  var totalXP = (appData.profile && appData.profile.totalXp) || 0;
  var decayRate = profile.decayRateForXP || 0.00005;
  var decay = 1 / (1 + totalXP * decayRate);

  var todayXP = calcTodayXp();
  var dailyLimit = profile.dailyXPLimit || 500;
  var softness = profile.dailyXPLimitSoftness || 0.5;
  var softCap = todayXP >= dailyLimit
    ? 1 - (1 - softness) * (todayXP - dailyLimit) / dailyLimit
    : 1;
  softCap = Math.max(0.1, softCap);

  var xp = Math.round(rawXP * qual * decay * softCap);
  return clamp(xp, 1, 500);
}

function calcMomentum() {
  var records = (appData.records || []).slice(-10);
  if (records.length < 3) return 0;
  var scores = records.map(function (r) { return r.score || 50; });
  var n = scores.length;
  var sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (var i = 0; i < n; i++) {
    sumX += i;
    sumY += scores[i];
    sumXY += i * scores[i];
    sumX2 += i * i;
  }
  var denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;
  var slope = (n * sumXY - sumX * sumY) / denominator;
  return clamp(Math.tanh(slope / 10) * 0.3, -0.3, 0.3);
}

function calcShadowQueue(knowledgeStates) {
  var queue = [];
  var now = Date.now();
  for (var key in knowledgeStates) {
    if (!knowledgeStates.hasOwnProperty(key)) continue;
    var ks = knowledgeStates[key];
    var temp = calcTemp(ks.peakTemp, ks.lastStudy, ks.halfLife);
    var daysSinceLast = ks.lastStudy ? Math.max(0, (now - new Date(ks.lastStudy).getTime()) / 86400000) : 999;
    var examWeight = ks.examWeight || 0.15;
    var urgency = (80 - temp) * examWeight / Math.max(1, 90);
    var subjectLevel = 1;
    var priority = urgency * subjectLevel * Math.log(1 + daysSinceLast);
    queue.push({
      key: key,
      name: ks.name || key,
      temp: temp,
      urgency: urgency,
      priority: priority,
      daysSinceLast: Math.round(daysSinceLast),
      halfLife: ks.halfLife,
      examWeight: examWeight
    });
  }
  queue.sort(function (a, b) { return b.priority - a.priority; });
  return queue;
}

function knapsackRecommend(items, timeBudget) {
  if (!items || items.length === 0 || timeBudget <= 0) return { items: [], totalBenefit: 0, totalCost: 0 };
  var n = items.length;
  var dp = [];
  for (var i = 0; i <= n; i++) {
    dp[i] = [];
    for (var t = 0; t <= timeBudget; t++) {
      dp[i][t] = 0;
    }
  }
  for (var i = 1; i <= n; i++) {
    var item = items[i - 1];
    var cost = Math.ceil(item.cost || 5);
    var benefit = item.benefit || 10;
    for (var t = 0; t <= timeBudget; t++) {
      if (cost > t) {
        dp[i][t] = dp[i - 1][t];
      } else {
        dp[i][t] = Math.max(dp[i - 1][t], dp[i - 1][t - cost] + benefit);
      }
    }
  }
  var selected = [];
  var t = timeBudget;
  for (var i = n; i > 0; i--) {
    if (dp[i][t] !== dp[i - 1][t]) {
      var item = items[i - 1];
      selected.push(item);
      t -= Math.ceil(item.cost || 5);
    }
  }
  selected.reverse();
  var totalCost = selected.reduce(function (s, item) { return s + Math.ceil(item.cost || 5); }, 0);
  return { items: selected, totalBenefit: dp[n][timeBudget], totalCost: totalCost };
}

function calcImprovementPotential(skills) {
  if (!skills || skills.length === 0) return [];
  var results = skills.map(function (s) {
    var mastery = s.mastery || 0;
    var examWeight = s.examWeight || 0.15;
    var recentInvestment = s.recentInvestment || 0;
    var potential = (1 - mastery) * examWeight * (1 - recentInvestment);
    return {
      name: s.name,
      mastery: mastery,
      examWeight: examWeight,
      potential: potential,
      recentInvestment: recentInvestment
    };
  });
  results.sort(function (a, b) { return b.potential - a.potential; });
  return results.slice(0, 5);
}

function detectFalseMastery(skill) {
  if (!skill || !skill.recentScores || skill.recentScores.length < 3) return null;
  var recent3 = skill.recentScores.slice(-3);
  var avgAccuracy = recent3.reduce(function (s, v) { return s + v; }, 0) / 3;
  var reviewRatio = skill.reviewRatio || 0.2;
  var temp = skill.temp || 0;
  if (avgAccuracy > 85 && reviewRatio < 0.1 && temp < 60) {
    return {
      name: skill.name,
      accuracy: Math.round(avgAccuracy),
      reviewRatio: Math.round(reviewRatio * 100),
      temp: temp,
      warning: '⚠️ 假性熟练 — 建议深度检测'
    };
  }
  return null;
}

function updateUserProfile() {
  var profile = appData.userProfile;
  if (!profile) return;
  var records = appData.records || [];
  if (records.length < 5) return;

  var subjectRecords = {};
  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    var subj = r.subject;
    if (!subj) continue;
    if (!subjectRecords[subj]) subjectRecords[subj] = [];
    subjectRecords[subj].push(r);
  }

  for (var subj in subjectRecords) {
    if (!subjectRecords.hasOwnProperty(subj)) continue;
    var srs = subjectRecords[subj];
    var avgAccuracy = srs.reduce(function (s, r) { return s + (r.score || 0); }, 0) / srs.length;
    profile.subjectAbility = profile.subjectAbility || {};
    profile.subjectAbility[subj] = Math.round(avgAccuracy * 0.5 + (srs.length * 5) * 0.5);
  }

  saveLocal('userProfile', profile);
}

function buildKnowledgeStates(records, skillTree) {
  var states = {};
  if (!records) return states;
  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    var kps = r.knowledgePoints || [];
    for (var j = 0; j < kps.length; j++) {
      var kp = kps[j];
      if (!states[kp]) {
        states[kp] = {
          name: kp,
          subject: r.subject,
          peakTemp: 80,
          lastStudy: r.timestamp,
          halfLife: 3.0,
          repetitions: 0,
          accuracyHistory: [],
          totalXp: 0
        };
      }
      var ks = states[kp];
      ks.repetitions++;
      ks.accuracyHistory.push(r.score || 0);
      ks.totalXp += r.xp || 0;
      if (r.timestamp > (ks.lastStudy || '')) {
        ks.lastStudy = r.timestamp;
      }
    }
  }
  appData.knowledgeStates = states;
  return states;
}

function aggregateSkillMastery(knowledgeStates, skill) {
  if (!skill || !skill.knowledgePoints) return 0;
  var kps = skill.knowledgePoints;
  var totalTemp = 0;
  var totalAccuracy = 0;
  var mastered = 0;
  var count = 0;
  for (var i = 0; i < kps.length; i++) {
    var ks = knowledgeStates[kps[i]];
    if (!ks) continue;
    count++;
    var temp = calcTemp(ks.peakTemp, ks.lastStudy, ks.halfLife);
    totalTemp += temp;
    var avgAcc = ks.accuracyHistory.length > 0
      ? ks.accuracyHistory.reduce(function (s, v) { return s + v; }, 0) / ks.accuracyHistory.length
      : 0;
    totalAccuracy += avgAcc;
    if (temp >= 60) mastered++;
  }
  if (count === 0) return 0;
  var avgTemp = totalTemp / count;
  var avgAcc = totalAccuracy / count;
  var coverage = mastered / kps.length;
  return clamp(Math.round((avgTemp * 0.5 + avgAcc * 0.3 + coverage * 100 * 0.2)), 0, 100);
}

function aggregateSubjectAbility(skillMasteries, subjectSkills) {
  if (!subjectSkills || Object.keys(subjectSkills).length === 0) return 0;
  var totalWeighted = 0;
  var totalWeight = 0;
  for (var skillId in subjectSkills) {
    if (!subjectSkills.hasOwnProperty(skillId)) continue;
    var skill = subjectSkills[skillId];
    var mastery = skillMasteries[skillId] || 0;
    var weight = skill.examWeight || 0.15;
    totalWeighted += mastery * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return 0;
  return Math.round(totalWeighted / totalWeight);
}

function detectTalents(skillMasteries, subjectAbility, subjectSkills) {
  if (!subjectSkills) return [];
  var talents = [];
  var avgMastery = 0;
  var count = 0;
  for (var id in skillMasteries) {
    if (!skillMasteries.hasOwnProperty(id)) continue;
    avgMastery += skillMasteries[id];
    count++;
  }
  if (count === 0) return [];
  avgMastery /= count;

  for (var skillId in subjectSkills) {
    if (!subjectSkills.hasOwnProperty(skillId)) continue;
    var mastery = skillMasteries[skillId] || 0;
    var skill = subjectSkills[skillId];
    if (mastery > avgMastery + 15) {
      talents.push({
        id: skillId,
        name: skill.name,
        mastery: mastery,
        bonus: 1.1
      });
    }
  }
  return talents;
}