# DCPEMS Algorithm & Technical Documentation

---

## Algorithm Overview

The timetable is generated in two phases, following the approach from:

> Hooshmand, Behshameh, Hamidi (2013). *"A Tabu Search Algorithm with Efficient Diversification Strategy for High School Timetabling Problem."* IJCSIT Vol 5 No 4. arXiv:1309.3285

---

## Phase 1 — Period-first Greedy Initialisation

### Why "period-first"?
Previous implementations used *class-by-class* greedy — fill all periods for class 1A, then 1B, etc. This caused a critical bug: by the time later classes were being scheduled, many teacher slots were already taken by earlier classes, leaving slots unfillable (showing as "Free").

The fix is **period-first scheduling**:
1. Fill P1 for all classes simultaneously
2. Then fill P2 for all classes
3. Then P3, and so on

This ensures every class competes equally for teacher availability at each period.

### Slot Scoring Function
For each candidate `(subject, teacher)` token at a given slot:

```
score = remaining_periods × 12  - teacher_day_load × 2
      + morning_bonus (core subjects: +30 if morning, -25 if afternoon)
      + position_bonus (Maths/Science P1-P3: +20)
      + activity_bonus (activity subjects afternoon for Std 7-10: +25)
      + library_bonus  (Tue/Wed/Thu: +15, Mon/Sat: -20)
      - saturday_double_penalty (if same core subject already placed today: -60)
      - pe_science_penalty (if previous slot was PE and this is Science: -20)
      - same_subject_today penalty:
          subject already placed once today + ALLOW_DOUBLE:   -40
          subject already placed once today + other subject: -200  ← strong deterrent
```

Candidates are sorted descending by score. The top-scoring candidate that passes all hard constraints is placed.

### Hard Constraint: Max 2 Periods of Same Subject per Day (H7)
Added as a hard filter in the greedy candidate check:
- Activity subjects (`NO_DOUBLE_DAY`): **max 1** per day (unchanged)
- Computer: **max 1** per day (unchanged)  
- All other subjects including Maths: **hard cap at 2** per day — candidate is rejected if `daySubCount[sub] >= 2`
- The scoring function adds a **-200 penalty** when a subject already appears once that day (so it's only placed a 2nd time if nothing else fits)

### Fallback Chain
If no scored candidate fits, the engine tries four progressively relaxed fallbacks:
1. Drop consecutive-teacher check (keep max-2/day)
2. Also drop no-double-activity restriction (keep max-2/day)
3. Also drop teacher conflict check (keep max-2/day)
4. **Last resort only**: ignore max-2 cap — prefer filled over blank slot

If all fallbacks fail, the class teacher is assigned to that slot rather than leaving it blank.

---

## Phase 2 — Tabu Search Optimisation

### Parameters

| Parameter | Value | Reason |
|-----------|-------|--------|
| Iterations | 500 | Balanced quality vs browser performance |
| Candidate moves/iter | 300 | Random sample of neighbourhood |
| Tabu tenure | random [0.25√n, 1.75√n] | Paper recommendation (n = √(classes×8)) |
| Intra-move activation | every 25 non-improving iters | Escape local optima |
| Diversification activation | every 15 non-improving iters | Explore new search regions |

### Move Types

**Out-In swap** (default):
- Take a Free slot in one day
- Swap it with a non-Free slot from another day in the same class
- Primarily reduces S3 (free slots) violations

**Intra swap** (activated after 25 non-improving iterations):
- Swap two non-Free slots across different days in the same class
- Improves soft constraint violations without changing feasibility

### Tabu List
Stores recently tried move keys as `cls|d1|pi1|d2|pi2 → remaining_tenure`.
A move is forbidden if it appears in the tabu list, unless:
- **Aspiration criterion**: the move would produce a new global best solution (overrides tabu)

### Frequency-based Diversification
A frequency matrix tracks how many times each `(class, day, period, subject)` combination has been visited. When activated, a penalty is added:

```
diversification_penalty = frequency_count × |current_cost| × 0.02
```

This penalises frequently visited configurations, forcing the search into unexplored regions of the solution space.

When a new best solution is found, the frequency matrix is cleared (per paper §3.3.5).

---

## Web Worker Architecture

The Tabu Search runs in a **Web Worker** (`src/utils/timetableWorker.js`) to keep the browser UI responsive during generation.

```
Main Thread                    Web Worker
──────────────────             ──────────────────────────────
handleGenerate()       →       receive 'generate' message
  serialise data               buildInitial()   (greedy)
  new Worker(...)              tabuOptimize()   (tabu search)
                      ←        postMessage('progress', %)
  setGenProgress(%)            ... 500 iterations ...
                      ←        postMessage('done', timetable)
  setTimetable(tt)
  setSection('classwise')
```

Data crossing the worker boundary (functions can't be serialised):
- `getSubjectPeriods` → serialised as `subjectPeriodsMap: {cls → {sub → n}}`
- `getTeacherForSubject` → serialised as `teacherForSubjectMap: {cls → {sub → teacherName}}`

---

## Data Model

### Timetable Structure
```js
timetable: {
  [cls: string]: {           // e.g. "7A"
    [day: string]: {         // e.g. "Mon"
      [pi: number]: {        // period index 0-8
        sub: string,         // subject name
        teacher: string,     // teacher name
        isZero?: boolean     // true for P9 Mon-Fri
      } | null
    }
  }
}
```

### Zero Period Rules
- **Mon–Fri P9** (index 8): always `isZero: true`, always class teacher, no subject counted in pool
- **Saturday P5** (index 4): normal teaching period, no zero period

---

## Files Modified / Added

| File | Purpose |
|------|---------|
| `src/utils/timetableEngine.js` | Core algorithm: greedy + tabu search + cost function |
| `src/utils/timetableWorker.js` | Web Worker wrapper to run engine off main thread |
| `src/hooks/useSchoolData.js` | Editable school data (teachers, classes, subjects) persisted in localStorage |
| `src/data/schoolData.js` | Default school data: all teachers, subjects, period counts, colours |
| `src/App.jsx` | Main UI: all views, progress overlay, Web Worker integration |
| `src/components/DataManager.jsx` | Full CRUD for teachers, subjects, class assignments |
| `src/components/SubstitutionPanel.jsx` | Substitute teacher finder with subject-match ranking |
| `src/components/LoginScreen.jsx` | Role-based login (Admin PIN / Teacher name) |
| `src/hooks/useAuth.jsx` | Auth context (session-scoped) |
| `src/hooks/useLocalStorage.js` | Generic localStorage hook with JSON serialisation |
