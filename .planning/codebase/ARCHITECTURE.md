# Architecture — LTS Program (Legacy)

**Analysis Date:** 2026-05-23
**Status:** Legacy codebase (moved to Legacy/ as part of restart)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    index.html (Entry Point)                   │
│  Launch Page → Main Page (5 tabs) → Modals/Panels           │
├──────────────────┬──────────────────┬───────────────────────┤
│   utils.js       │  algorithms.js   │    data.js            │
│  DOM helpers     │  Core engine     │  Data loading         │
│  Theme/Toast     │  XP/Temp/Review  │  Cache/Persist        │
├──────────────────┼──────────────────┼───────────────────────┤
│  persistence.js  │  recorder.js     │    app.js             │
│  Local-first     │  CRUD records    │  UI rendering         │
│  GitHub sync     │  Profile updates │  Event handling       │
└──────────────────┴──────────────────┴───────────────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│              localStorage + GitHub API                        │
│  Keys: lts-appData, lts-cache-appData, lts-theme, etc.     │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | JavaScript (ES5/ES6 mix) | Vanilla |
| CSS | Custom properties (MD3) | Vanilla |
| Charts | ECharts | 5.4.3 (CDN) |
| Storage | localStorage | Browser API |
| Remote Sync | GitHub Contents API | REST |
| PWA | Service Worker | v1.0 |
| Build | None | Direct browser |

---

## File Structure

```
Legacy/
├── index.html              # Entry point, loads 6 JS + 4 CSS
├── manifest.json           # PWA manifest
├── service-worker.js       # Cache-first SW
├── icon.svg                # App icon
├── js/
│   ├── utils.js            # DOM helpers, theme, toast, date utils
│   ├── algorithms.js       # Core: temp model, XP engine, review algo
│   ├── data.js             # Data loading, caching, persistence layer
│   ├── persistence.js      # localStorage-first strategy, GitHub sync
│   ├── recorder.js         # Learning record CRUD
│   ├── app.js              # UI rendering, routing, event handling (~1800 lines)
│   └── app-simple.js       # Simplified version (not used in index.html)
├── css/
│   ├── theme.css           # MD3 color system, typography, dark mode
│   ├── layout.css          # Responsive layout, nav, modals, pomodoro panel
│   ├── components.css      # Buttons, cards, inputs, progress bars
│   └── pages.css           # 5 page layouts (overview/skills/review/log/settings)
├── data-backup/            # JSON data files (achievements, skill-tree, etc.)
└── docs/                   # Documentation files
```

---

## Core Algorithms (algorithms.js)

### 1. Temperature Model (Ebbinghaus Forgetting Curve)

```
Temperature = peakTemp * 2^(-daysSinceLastStudy / halfLife)
```

- **Temperature range:** 0-100
- **6 levels:**
  - 炙热 (80+): Recently studied, high retention
  - 温热 (60-79): Good retention
  - 温暖 (40-59): Moderate retention
  - 正常 (20-39): Needs review
  - 微凉 (1-19): Forgetting
  - 冻结 (0): Completely forgotten

### 2. Half-Life Calculation

```
halfLife = baseHalfLife * subjectModifier * (1 + (accuracy - 70) / 100) * (1 + min(streak, 10) * 0.02)
```

- **Clamped:** 0.5 to 30 days
- **Factors:** Base half-life, subject difficulty, accuracy bonus, streak bonus

### 3. XP Engine (calcXPEngine2)

Complex multi-factor XP calculation:

```
Base XP = score * duration / 20  (clamped 1-500)

Final XP = Base * PE_coefficient * CE_coefficient * subjectDifficulty 
           * activityWeight * (1 + momentum) * totalXP_decay * dailyCap_factor
```

**Components:**
- **PE (Practice Efficiency):** Based on accuracy
- **CE (Consistency Efficiency):** Based on streak
- **Momentum:** Linear regression on last 10 scores, `tanh(slope/10) * 0.3`
- **Total XP Decay:** `1 / (1 + totalXP * 0.00005)` — prevents runaway XP
- **Daily Soft Cap:** `dailyXPLimit / (dailyXPLimit + todayXP * softness)`

### 4. Shadow Queue (Spaced Repetition)

Priority calculation for review scheduling:

```
urgency = (80 - temperature) * examWeight / 90
priority = urgency * subjectLevel * log(1 + daysSinceLast)
```

- **Higher priority** = more urgent to review
- **Factors:** Current temperature (lower = more urgent), exam weight, subject mastery level

### 5. Knapsack Recommendation

0/1 Knapsack DP for optimal review selection given time budget (default 60 minutes):

- **Items:** Knowledge points with estimated review time
- **Value:** Improvement potential = `(1 - mastery) * examWeight * (1 - recentInvestment)`
- **Constraint:** Total time ≤ budget

### 6. False Mastery Detection

Flags knowledge points that appear mastered but aren't:

```
if (avgAccuracy > 85 AND reviewRatio < 0.1 AND temperature < 60) → false mastery
```

---

## Data Structures

### appData (Global State)

```javascript
{
  version: "3.0.0",
  records: [],              // Learning records array
  profile: {                // User profile
    learnerName: "墨澜",
    totalXp: 0,
    totalStudyMinutes: 0,
    streakDays: 0
  },
  skillTree: null,          // Skill tree structure
  achievements: [],         // Achievement definitions
  pomodoroSessions: [],     // Pomodoro timer sessions
  readingRecords: [],       // Reading log
  bookshelf: [],            // Book tracking
  textbooks: null,          // Textbook data
  courses: null,            // Course data
  knowledgeStates: {},      // Temp/halfLife/peakTemp per knowledge point
  userProfile: null,        // Algorithm parameters
  dataSource: "pending"     // "local"|"cache"|"github"|"fallback"
}
```

### Learning Record

```javascript
{
  id: "uuid",
  timestamp: "2026-05-23T10:30:00+08:00",
  subject: "logos",           // Greek/Latin key
  knowledgePoints: ["point1", "point2"],
  duration: 30,               // minutes
  activityType: "practice",   // practice|exam|lecture|review|recitation|reflection|other
  score: 85,                  // accuracy percentage
  totalQuestions: 20,
  correctCount: 17,
  xp: 45,                    // calculated XP
  source: "web"              // web|pomodoro|import
}
```

### Knowledge State

```javascript
{
  "subject/knowledgePoint": {
    peakTemp: 100,
    lastStudy: "2026-05-23",
    halfLife: 3.5,
    repetitions: 5,
    accuracyHistory: [85, 90, 88],
    totalXp: 150
  }
}
```

### Subject Keys (Greek/Latin → Chinese)

| Key | Chinese | Icon |
|-----|---------|------|
| logos | 数学 | 📐 |
| mythos | 语文 | 📖 |
| lingua | 英语 | 🌐 |
| physis | 物理 | ⚡ |
| khemeia | 化学 | 🧪 |
| zoe | 生物 | 🧬 |
| politeia | 政治 | 🏛️ |
| historia | 历史 | 📜 |
| geographia | 地理 | 🌍 |

---

## Data Flow

### 1. Application Startup

```
index.html loads
    ↓
utils.js → algorithms.js → data.js → persistence.js → recorder.js → app.js
    ↓
app.js: initApp()
    ↓
quickLoadAppData() [persistence.js]
    ├─ localStorage hit → use local data → backgroundSyncAll()
    ├─ cache hit → use cached data → backgroundSyncAll()
    └─ fetch from GitHub/file → convertGitHubData() → persistAppData()
    ↓
loadUserProfile(), loadSkillTree(), loadAchievements() [data.js]
    ↓
buildKnowledgeStates() [algorithms.js]
    ↓
renderAll() [app.js]
```

### 2. Learning Record Creation

```
User fills form (app.js)
    ↓
createLearningRecord() [recorder.js]
    ├─ Generates UUID
    ├─ calcXPEngine2() [algorithms.js]
    └─ Returns record object
    ↓
commitRecord() [recorder.js]
    ├─ Push to appData.records
    ├─ Update profile totals (XP, minutes, streak)
    ├─ rebuildKnowledgeStates()
    ├─ updateUserProfile()
    ├─ persistAppData() [persistence.js]
    └─ checkAchievements() [app.js]
    ↓
refreshUI() → renderAll() [app.js]
```

### 3. Review Recommendation

```
User opens Review page
    ↓
calcShadowQueue() [algorithms.js]
    ├─ Iterates knowledgeStates
    ├─ Calculates urgency per knowledge point
    └─ Returns sorted priority queue
    ↓
knapsackRecommend() [algorithms.js]
    ├─ Takes shadow queue + time budget (60 min)
    ├─ 0/1 Knapsack DP
    └─ Returns optimal review set
    ↓
Display recommended reviews [app.js]
```

### 4. Background Sync

```
backgroundSyncAll() [persistence.js]
    ↓ (2 second delay)
loadFromMultiSource('data/data.json') [data.js]
    ├─ file:// → XHR local file
    ├─ GitHub raw (raw.githubusercontent.com)
    ├─ jsDelivr CDN
    └─ GitHub Pages
    ↓
mergeAppData(remote) [persistence.js]
    ├─ Deduplicate records by ID
    ├─ Keep local + new remote records
    └─ Recalculate totalXp
    ↓
saveLocal() + setCache() + refreshUI()
```

---

## Entry Points

### Main Entry

- **File:** `index.html`
- **Script load order:**
  1. `js/utils.js` — DOM helpers, theme, toast
  2. `js/algorithms.js` — Core algorithms
  3. `js/data.js` — Data layer
  4. `js/persistence.js` — Persistence strategy
  5. `js/recorder.js` — Record CRUD
  6. `js/app.js` — UI and initialization
  7. `echarts@5.4.3` (deferred) — Charts

### Initialization

- **Function:** `initApp()` in `app.js`
- **Trigger:** DOMContentLoaded or called directly
- **Sequence:**
  1. `quickLoadAppData()` — Fast local load
  2. `loadUserProfile()` — Algorithm parameters
  3. `loadSkillTree()` — Skill structure
  4. `loadAchievements()` — Achievement definitions
  5. `buildKnowledgeStates()` — Temperature model
  6. `renderAll()` — Initial UI render

### Navigation

- **Hash-based routing:** `#overview`, `#skills`, `#review`, `#log`, `#settings`
- **Function:** `setActivePage(pageName)` in `app.js`
- **Mobile:** Bottom nav with 5 tabs
- **Desktop:** Top pill navigation

---

## Key Abstractions

### 1. Temperature Model

- **Purpose:** Quantifies knowledge retention over time
- **Core:** `calcTemp(peakTemp, lastStudy, halfLife)`
- **Storage:** `knowledgeStates[key].peakTemp`, `.lastStudy`, `.halfLife`
- **Visualization:** 6-level color coding in skill tree

### 2. XP System

- **Purpose:** Gamification and progress tracking
- **Two formulas:**
  - `calcBaseXP(score, duration)` — Simple, used in some places
  - `calcXPEngine2(record, profile)` — Complex, used in recorder.js
- **Storage:** `appData.profile.totalXp`, per-record `.xp`

### 3. Shadow Queue

- **Purpose:** Prioritized spaced repetition scheduling
- **Algorithm:** `calcShadowQueue(knowledgeStates)`
- **Output:** Sorted array of `{key, priority, temperature, daysSince}`

### 4. Knowledge State

- **Purpose:** Tracks per-knowledge-point learning history
- **Built by:** `buildKnowledgeStates(records, skillTree)`
- **Structure:** Map of `subject/point` → `{peakTemp, lastStudy, halfLife, ...}`

---

## UI Architecture

### Page Structure

| Page | Tab | Container ID | Key Features |
|------|-----|--------------|--------------|
| Overview | 总览 | `#page-overview` | Hero card, subject grid, calendar heatmap |
| Skills | 技能树 | `#page-skills` | ECharts force graph, node detail panel |
| Review | 复习 | `#page-review` | Forgetting curve chart, shadow queue |
| Log | 日志 | `#page-log` | Paginated records, CRUD operations |
| Settings | 更多 | `#page-settings` | Data export, theme toggle, about |

### Rendering Pattern

- **No framework:** Vanilla JS with `innerHTML`
- **Pattern:** `renderAll()` calls page-specific renderers
- **Example:**
  ```javascript
  function renderOverview() {
    document.getElementById('page-overview').innerHTML = `
      <div class="overview-hero">...</div>
    `;
  }
  ```

### Component System

- **CSS classes:** MD3-inspired naming (`.btn-primary`, `.glass-card`, `.stat-card`)
- **No Web Components:** Pure CSS + HTML templates
- **Responsive:** 3 breakpoints (768px, 480px, 360px)

---

## External Dependencies

| Dependency | Source | Purpose |
|------------|--------|---------|
| ECharts 5.4.3 | jsDelivr CDN | Skill tree force graph, forgetting curve chart |
| GitHub API | api.github.com | Data sync (optional, requires token) |
| localStorage | Browser | Primary data storage |
| Service Worker | Browser | PWA offline support |

---

## Configuration

### User Profile Parameters

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `globalBaseHalfLife` | 3.0 | Base days before forgetting |
| `tempBoostGain` | 0.5 | Temperature boost per review |
| `halfLifeIncreaseRatio` | 1.2 | Half-life growth on good review |
| `halfLifeDecreaseRatio` | 0.75 | Half-life shrink on poor review |
| `xpBasePerMinute` | 2.0 | Base XP per minute studied |
| `decayRateForXP` | 0.00005 | Total XP decay rate |
| `dailyXPLimit` | 500 | Soft daily XP cap |
| `dailyXPLimitSoftness` | 0.5 | How soft the cap is |

### Activity Weights

| Activity | Weight | Multiplier |
|----------|--------|------------|
| exam | 1.5 | Highest |
| practice | 1.2 | Standard |
| recitation | 1.1 | Slightly above |
| review | 1.0 | Baseline |
| lecture | 0.8 | Passive learning |
| reflection | 0.7 | Low intensity |
| other | 0.5 | Minimum |

---

## Architectural Constraints

### 1. Global Mutable State

- **Problem:** All state is in global `appData` variable
- **Impact:** Any function can mutate state, no encapsulation
- **Files:** `js/data.js` (definition), `js/app.js` (heavy mutation)

### 2. No Module System

- **Problem:** Scripts loaded via `<script>` tags, no imports/exports
- **Impact:** Load order matters, global namespace pollution
- **Mitigation:** Careful script ordering in `index.html`

### 3. Mixed ES5/ES6

- **Problem:** `var` declarations mixed with arrow functions, template literals
- **Impact:** Inconsistent style, potential confusion
- **Example:** `data.js` uses `var`, `app.js` uses `const/let`

### 4. innerHTML Rendering

- **Problem:** XSS risk if user input not escaped
- **Mitigation:** `escapeHtml()` in `utils.js`, but not always used
- **Impact:** Security consideration for user-generated content

### 5. Dual XP Formulas

- **Problem:** `calcBaseXP()` and `calcXPEngine2()` both exist
- **Impact:** Inconsistent XP calculation across features
- **Solution:** Consolidate to `calcXPEngine2()` only

---

## Anti-Patterns Identified

### 1. God Object (app.js)

- **Issue:** `app.js` is ~1800 lines handling everything
- **Impact:** Hard to maintain, test, or refactor
- **Solution:** Split into page-specific modules

### 2. Callback Hell in Data Loading

- **Issue:** Nested `.then()` chains in `loadFromMultiSource()`
- **Impact:** Readability, error handling complexity
- **Solution:** Use async/await, proper error boundaries

### 3. Inconsistent Error Handling

- **Issue:** Some functions swallow errors silently
- **Impact:** Silent failures, debugging difficulty
- **Solution:** Centralized error logging, user-facing error messages

### 4. Magic Numbers

- **Issue:** Hardcoded values like `2000` (sync delay), `86400000` (cache TTL)
- **Impact:** Unclear intent, hard to configure
- **Solution:** Extract to named constants

### 5. Duplicate Data Loading

- **Issue:** `loadAppData()` and `quickLoadAppData()` do similar things
- **Impact:** Code duplication, maintenance burden
- **Solution:** Consolidate into single loader with options

---

## What Works

1. **Core algorithms** — Temperature model, half-life calculation, shadow queue
2. **localStorage persistence** — Fast, reliable local storage
3. **MD3 design system** — Consistent, responsive UI
4. **Multi-source data loading** — Graceful fallback chain
5. **PWA support** — Offline capability via service worker

---

## What's Broken/Missing

1. **No tests** — Zero test coverage
2. **No build system** — Manual file management
3. **No TypeScript** — No type safety
4. **Incomplete PWA** — Service worker doesn't cache CSS/JS
5. **No error boundaries** — Errors can crash the app
6. **GitHub sync requires token** — Manual setup needed

---

## Recommendations for Rebuild

1. **Modularize** — Split into ES modules or use bundler
2. **Add TypeScript** — Type safety for algorithms
3. **Component framework** — React/Vue/Svelte for UI
4. **Test coverage** — Unit tests for algorithms, integration tests for data flow
5. **State management** — Zustand/Redux/Pinia for appData
6. **Error handling** — Try-catch boundaries, user-facing errors
7. **Single XP formula** — Remove `calcBaseXP()`, use `calcXPEngine2()` only
8. **Configuration** — Extract constants, use environment variables

---

*Analysis complete — 2026-05-23*
