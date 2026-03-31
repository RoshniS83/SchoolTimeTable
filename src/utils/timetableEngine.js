/**
 * DCPEMS Timetable Engine v4.0
 * ─────────────────────────────────────────────────────────────────────────────
 * KEY FIX from v3: Free-slot bug was caused by class-by-class greedy where
 * late classes found all teacher slots taken. Fixed by PERIOD-FIRST scheduling:
 * we fill every class's P1 across all classes before moving to P2, so teacher
 * conflicts are resolved globally from the start.
 *
 * Algorithm: Period-first greedy → Tabu Search (Web Worker compatible)
 * Based on: Hooshmand et al. 2013 (arXiv:1309.3285)
 */

import { DAYS, WD_PERIODS, SAT_PERIODS, OPTIONAL_GROUPS } from '../data/schoolData.js';

// ── Period helpers ─────────────────────────────────────────────────────────────
export const nPeriods         = d  => d === 'Sat' ? SAT_PERIODS : WD_PERIODS;
export const BREAK_WD         = 4;
export const BREAK_SAT        = 3;
export const breakAfter       = d  => d === 'Sat' ? BREAK_SAT : BREAK_WD;
export const isZeroPeriodSlot = (day, pi) => day !== 'Sat' && pi === WD_PERIODS - 1;
const isMorning   = (d, pi) => pi < breakAfter(d);
const isAfternoon = (d, pi) => pi > breakAfter(d);
const isLastTwo   = (d, pi) => {
  const np = nPeriods(d);
  const lastNonZero = d === 'Sat' ? np - 1 : np - 2; // zero period doesn't count
  return pi >= lastNonZero - 1;
};

// ── Subject categories ────────────────────────────────────────────────────────
const CORE_SUBS      = new Set(['Maths','English','SST','Science','Physics','Chemistry','Biology','History','Geography','Accounts','BusinessStudies','Economics']);
const ACTIVITY_SUBS  = new Set(['PE','Art','Music','Library','Robotics','GK','Aptitude Reasoning','V.Ed']);
const ALLOW_DOUBLE   = new Set(['Maths','Science','Physics','Chemistry','Biology']);
const NO_DOUBLE_DAY  = new Set(['PE','Library','Art','Music','Robotics','GK','Aptitude Reasoning','V.Ed','Computer','Optional-PE','Optional-IT','Optional-Hindi']);
const SAT_NO_DOUBLE  = new Set(['Maths','Science','English','Computer','Physics','Chemistry','Biology']);

const stdNum   = cls => parseInt(cls);
const isHigher = cls => stdNum(cls) >= 7;
const isLower  = cls => stdNum(cls) <= 6;

// ── Colour palettes ───────────────────────────────────────────────────────────
export const SUBJECT_COLORS = {
  Maths:               { bg:'#dbeafe', border:'#3b82f6', text:'#1e40af' },
  English:             { bg:'#dcfce7', border:'#22c55e', text:'#166534' },
  Hindi:               { bg:'#fef9c3', border:'#eab308', text:'#854d0e' },
  Marathi:             { bg:'#ede9fe', border:'#8b5cf6', text:'#5b21b6' },
  Science:             { bg:'#ccfbf1', border:'#14b8a6', text:'#0f766e' },
  Physics:             { bg:'#dbeafe', border:'#3b82f6', text:'#1e40af' },
  Chemistry:           { bg:'#fce7f3', border:'#ec4899', text:'#9d174d' },
  Biology:             { bg:'#dcfce7', border:'#22c55e', text:'#166534' },
  SST:                 { bg:'#fef3c7', border:'#f59e0b', text:'#92400e' },
  History:             { bg:'#fef3c7', border:'#f59e0b', text:'#92400e' },
  Geography:           { bg:'#fef3c7', border:'#d97706', text:'#78350f' },
  Economics:           { bg:'#ede9fe', border:'#8b5cf6', text:'#5b21b6' },
  Accounts:            { bg:'#dbeafe', border:'#3b82f6', text:'#1e40af' },
  BusinessStudies:     { bg:'#dcfce7', border:'#22c55e', text:'#166534' },
  Computer:            { bg:'#e0f2fe', border:'#0ea5e9', text:'#0369a1' },
  IT:                  { bg:'#ede9fe', border:'#8b5cf6', text:'#5b21b6' },
  PE:                  { bg:'#d1fae5', border:'#10b981', text:'#064e3b' },
  Art:                 { bg:'#fce7f3', border:'#ec4899', text:'#9d174d' },
  Music:               { bg:'#ffedd5', border:'#f97316', text:'#9a3412' },
  Library:             { bg:'#fef9c3', border:'#eab308', text:'#854d0e' },
  Robotics:            { bg:'#d1fae5', border:'#10b981', text:'#064e3b' },
  GK:                  { bg:'#dcfce7', border:'#22c55e', text:'#166534' },
  'V.Ed':              { bg:'#ede9fe', border:'#8b5cf6', text:'#5b21b6' },
  'Aptitude Reasoning':{ bg:'#fef3c7', border:'#f59e0b', text:'#92400e' },
  EVS:                 { bg:'#d1fae5', border:'#10b981', text:'#064e3b' },
  Core:                { bg:'#dbeafe', border:'#3b82f6', text:'#1e40af' },
  'Optional-Hindi':    { bg:'#fef9c3', border:'#eab308', text:'#854d0e' },
  'Optional-IT':       { bg:'#ede9fe', border:'#8b5cf6', text:'#5b21b6' },
  'Optional-PE':       { bg:'#d1fae5', border:'#10b981', text:'#064e3b' },
  'Zero Period':       { bg:'#f1f5f9', border:'#94a3b8', text:'#475569' },
  Free:                { bg:'#f9fafb', border:'#d1d5db', text:'#9ca3af' },
};
export const CLASS_COLORS = {
  '1': { bg:'#fef3c7', border:'#f59e0b', text:'#92400e' },
  '2': { bg:'#fce7f3', border:'#ec4899', text:'#9d174d' },
  '3': { bg:'#dcfce7', border:'#22c55e', text:'#166534' },
  '4': { bg:'#dbeafe', border:'#3b82f6', text:'#1e40af' },
  '5': { bg:'#ede9fe', border:'#8b5cf6', text:'#5b21b6' },
  '6': { bg:'#ccfbf1', border:'#14b8a6', text:'#0f766e' },
  '7': { bg:'#ffedd5', border:'#f97316', text:'#9a3412' },
  '8': { bg:'#fef9c3', border:'#eab308', text:'#854d0e' },
  '9': { bg:'#f0fdf4', border:'#86efac', text:'#15803d' },
  '10':{ bg:'#eff6ff', border:'#93c5fd', text:'#1d4ed8' },
  '11':{ bg:'#fdf4ff', border:'#d8b4fe', text:'#7e22ce' },
  '12':{ bg:'#fff1f2', border:'#fda4af', text:'#be123c' },
};
export const getSubjectColor = sub => SUBJECT_COLORS[sub] || { bg:'#f3f4f6', border:'#9ca3af', text:'#374151' };
export const getClassColor   = cls => { const s = String(parseInt(cls)); return CLASS_COLORS[s] || { bg:'#f3f4f6', border:'#9ca3af', text:'#374151' }; };
export const getSubColor     = sub => getSubjectColor(sub).bg;
export const getSubBorder    = sub => getSubjectColor(sub).border;

// ── Constraint weights ────────────────────────────────────────────────────────
const W = {
  FREE_SLOT:              500,  // S3  – free slot in student timetable
  TEACHER_DAY_MIN:        200,  // S1  – teacher < 4 periods on a day
  TEACHER_SPREAD:         150,  // S2  – teacher all morning or all afternoon
  TEACHER_DAY_ZERO:       180,  // S18 – teacher 0 periods on a weekday
  CORE_IN_AFTERNOON:      120,  // S4  – core subject in afternoon
  CORE_LAST_TWO:          100,  // S5  – core in last 2 non-zero periods
  CORE_LAST_PERIOD:        90,  // S19 – Maths/Science in last non-zero period
  DOUBLE_COMPUTER:         80,  // S6  – 2+ Computer in same class-day
  ACTIVITY_MORNING_HIGH:   90,  // S7  – activity in morning for Std 7-10
  AVOID_DOUBLE_SUBJECT:    60,  // S9  – same subject twice in class-day (non-Maths/Sci)
  TEACHER_SAT_OVERLOAD:   180,  // S10 – all 5 Saturday periods + light weekday load
  SAT_DOUBLE_CORE:        130,  // S11 – 2× Maths/Sci/Eng/Computer on Saturday
  TEACHER_INTRADAY_GAP:   120,  // S13 – teacher gap > 1 free slot between occupied periods
  CONSECUTIVE_DAYS:        60,  // S14 – same subject on consecutive days
  CORE_LAST_FRIDAY:        80,  // S15 – core subject in last period on Friday
  SCIENCE_AFTER_PE:        40,  // S16 – Science/Physics immediately after PE
  LIBRARY_BAD_DAY:         50,  // S17 – Library on Monday or Saturday
  ACTIVITY_TEACHER_SPREAD:150,  // S12 – activity teacher not spread over days
  TEACHER_INTRADAY_CLUSTER:130, // S20 – 4+ morning then zero afternoon
};

// ── Cost function ─────────────────────────────────────────────────────────────
export function computeCost(timetable, allClassNames, allTeacherNames) {
  let cost = 0;
  const tdp = {}; // teacher -> day -> [periodIdx]
  allTeacherNames.forEach(t => { tdp[t] = {}; DAYS.forEach(d => { tdp[t][d] = []; }); });

  allClassNames.forEach(cls => {
    const high = isHigher(cls);
    DAYS.forEach(d => {
      const np  = nPeriods(d);
      const brk = breakAfter(d);
      const daySubs = [];

      for (let pi = 0; pi < np; pi++) {
        const slot  = timetable[cls]?.[d]?.[pi];
        const isZero = isZeroPeriodSlot(d, pi);

        if (!slot || slot.sub === 'Free') {
          // S3: free slot (zero period exempted)
          if (!isZero) cost += W.FREE_SLOT;
          continue;
        }
        const { sub, teacher } = slot;
        if (teacher && teacher !== '-') {
          teacher.split(',').forEach(x => {
            const indT = x.trim();
            if (tdp[indT]) tdp[indT][d].push(pi);
          });
        }
        if (isZero) continue;

        daySubs.push({ sub, pi });

        if (CORE_SUBS.has(sub)) {
          if (isAfternoon(d, pi))              cost += W.CORE_IN_AFTERNOON;   // S4
          if (isLastTwo(d, pi))                cost += W.CORE_LAST_TWO;       // S5
          if (d === 'Fri' && pi === np - 2)    cost += W.CORE_LAST_FRIDAY;    // S15
        }
        if (ALLOW_DOUBLE.has(sub) && !isZero) {
          const lastReal = d === 'Sat' ? np - 1 : np - 2;
          if (pi === lastReal)                 cost += W.CORE_LAST_PERIOD;    // S19
        }
        if (ACTIVITY_SUBS.has(sub) && high && isMorning(d, pi)) cost += W.ACTIVITY_MORNING_HIGH; // S7
        if (sub === 'Library' && (d === 'Mon' || d === 'Sat'))   cost += W.LIBRARY_BAD_DAY;       // S17
        if (pi > 0) {
          const prev = timetable[cls]?.[d]?.[pi - 1];
          if (prev?.sub === 'PE' && (sub === 'Science' || sub === 'Physics' || sub === 'Chemistry'))
            cost += W.SCIENCE_AFTER_PE; // S16
        }
      }

      // S6: double Computer
      const comp = daySubs.filter(x => x.sub === 'Computer').length;
      if (comp > 1) cost += W.DOUBLE_COMPUTER * (comp - 1);

      // H7 / S9+: same subject more than 2 times in a day — very high penalty
      const subCnt = {};
      daySubs.forEach(({ sub }) => { subCnt[sub] = (subCnt[sub]||0)+1; });
      Object.entries(subCnt).forEach(([sub, cnt]) => {
        if (cnt > 2) {
          // More than 2 is never acceptable — hard constraint S9+
          cost += 50000 * (cnt - 2);
        } else if (cnt === 2 && !ALLOW_DOUBLE.has(sub) && !ACTIVITY_SUBS.has(sub)) {
          // Exactly 2 for non-Maths/Sci: soft penalty
          cost += W.AVOID_DOUBLE_SUBJECT;
        }
      });

      // S11: Saturday double core
      if (d === 'Sat') {
        SAT_NO_DOUBLE.forEach(sub => {
          const cnt = daySubs.filter(x => x.sub === sub).length;
          if (cnt > 1) cost += W.SAT_DOUBLE_CORE * (cnt - 1);
        });
      }

      // S14: same subject as previous day
      const di = DAYS.indexOf(d);
      if (di > 0) {
        const prevSubs = new Set();
        const prev = DAYS[di - 1];
        for (let p2 = 0; p2 < nPeriods(prev); p2++) {
          const s = timetable[cls]?.[prev]?.[p2];
          if (s && s.sub !== 'Free') prevSubs.add(s.sub);
        }
        daySubs.forEach(({ sub }) => { if (prevSubs.has(sub)) cost += W.CONSECUTIVE_DAYS; });
      }
    });
  });

  // Teacher-level constraints
  allTeacherNames.forEach(t => {
    let totalWD = 0, satP = 0, daysOn = 0;
    DAYS.forEach(d => {
      const allPs = tdp[t][d];
      const ps  = [...new Set(allPs)].sort((a,b)=>a-b);
      const clashes = allPs.length - ps.length;
      if (clashes > 0) cost += 100000 * clashes; // H1 - Teacher cannot be in two places at once
      const cnt = ps.length;
      if (d !== 'Sat') { totalWD += cnt; if (cnt > 0) daysOn++; }
      else satP = cnt;

      if (cnt === 0) {
        if (d !== 'Sat' && totalWD > 2) cost += W.TEACHER_DAY_ZERO; // S18
        return;
      }
      const brk  = breakAfter(d);
      const morn = ps.filter(p => p < brk).length;
      const aftn = ps.filter(p => p > brk).length;

      if (cnt < 4)                         cost += W.TEACHER_DAY_MIN * (4 - cnt); // S1
      if (cnt >= 3 && morn > 0 && aftn===0) cost += W.TEACHER_SPREAD;             // S2
      if (cnt >= 3 && aftn > 0 && morn===0) cost += W.TEACHER_SPREAD;
      if (morn >= 4 && aftn === 0)          cost += W.TEACHER_INTRADAY_CLUSTER;   // S20

      let streak = 1;
      for (let i = 1; i < ps.length; i++) {
        const gap = ps[i] - ps[i-1] - 1;
        if (gap > 1) cost += W.TEACHER_INTRADAY_GAP * gap; // S13

        const prev = ps[i-1];
        const curr = ps[i];
        if (curr === prev + 1 && curr !== brk + 1) { // gap across break restores streak
          streak++;
          if (streak === 3) cost += 40;  // Soft discourage 3 in a row
          if (streak === 4) cost += 150; // Strongly discourage 4 in a row
          if (streak >= 5)  cost += 600; // Almost never 5 in a row
          if (d === 'Sat' && streak >= 3) cost += 100; // Even stricter on Sat
        } else {
          streak = 1;
        }
      }
    });
    const avgWD = totalWD / 5;
    if (satP >= SAT_PERIODS && avgWD < 3) cost += W.TEACHER_SAT_OVERLOAD; // S10
    if (daysOn < 4 && totalWD > 8)        cost += W.ACTIVITY_TEACHER_SPREAD; // S12
  });

  return cost;
}

// ── Deep clone ────────────────────────────────────────────────────────────────
function cloneTT(tt) {
  const out = {};
  for (const cls of Object.keys(tt)) {
    out[cls] = {};
    for (const d of Object.keys(tt[cls])) {
      out[cls][d] = tt[cls][d].map(s => s ? { ...s } : null);
    }
  }
  return out;
}

// ── Phase 1: Period-first greedy ───────────────────────────────────────────────
// CRITICAL DESIGN: We iterate period-by-period across ALL classes simultaneously.
// This ensures teacher conflicts are resolved globally — no class is disadvantaged
// by being scheduled late. Each period slot is filled for all classes before
// moving to the next period.
function buildInitial({ allClassNames, classTeachersMap, getSubjectPeriods, getTeacherForSubject }) {

  // Build subject info per class
  const classSubjects = {}; // cls -> { sub -> { teacher, periods, assigned } }
  const classPools    = {}; // cls -> [{sub, teacher}] remaining tokens
  const daySubCount   = {}; // cls -> day -> { sub: count }

  allClassNames.forEach(cls => {
    const sp = getSubjectPeriods(cls);
    classSubjects[cls] = {};
    Object.entries(sp).forEach(([sub, periods]) => {
      const teacher = getTeacherForSubject(cls, sub) || classTeachersMap[cls] || 'TBD';
      classSubjects[cls][sub] = { teacher, periods, assigned: 0 };
    });
    daySubCount[cls] = {};
    DAYS.forEach(d => { daySubCount[cls][d] = {}; });
  });

  // Global teacher usage: teacher -> day -> Set<pi>
  const teacherUsed = {};
  const markT  = (t, d, p) => { 
    if(!t||t==='-') return; 
    t.split(',').forEach(x => {
      const indT = x.trim();
      if(!teacherUsed[indT]) teacherUsed[indT]={}; 
      if(!teacherUsed[indT][d]) teacherUsed[indT][d]=new Set(); 
      teacherUsed[indT][d].add(p); 
    });
  };
  const freeT  = (t, d, p) => !t || t.split(',').every(x => !teacherUsed[x.trim()]?.[d]?.has(p));

  // Initialise result grid
  const result = {};
  allClassNames.forEach(cls => {
    result[cls] = {};
    DAYS.forEach(d => { result[cls][d] = Array(nPeriods(d)).fill(null); });
  });

  // ── Step 0: Pre-schedule Synchronized Optional Blocks for 11/12 ─────────────
  const syncClasses = ["11Comm", "11Sci", "12Comm", "12Sci"].filter(c => allClassNames.includes(c));
  if (syncClasses.length > 0) {
    const syncSlots = [
      { d: 'Mon', pi: 0 }, { d: 'Mon', pi: 6 },
      { d: 'Tue', pi: 2 },
      { d: 'Wed', pi: 3 }, { d: 'Wed', pi: 6 },
      { d: 'Thu', pi: 1 },
      { d: 'Fri', pi: 5 },
      { d: 'Sat', pi: 2 }
    ];
    syncSlots.forEach(slot => {
      syncClasses.forEach(c => {
        const sub = "IT/PE/Hindi";
        if (classSubjects[c] && classSubjects[c][sub] && result[c][slot.d][slot.pi] === null) {
          const teacher = classSubjects[c][sub].teacher;
          result[c][slot.d][slot.pi] = { sub, teacher, isZero: false };
          markT(teacher, slot.d, slot.pi);
          classSubjects[c][sub].assigned = (classSubjects[c][sub].assigned || 0) + 1;
          daySubCount[c][slot.d][sub] = (daySubCount[c][slot.d][sub] || 0) + 1;
        }
      });
    });
  }

  // ── Step 1: Place zero periods first (Mon–Fri P9) ───────────────────────────
  allClassNames.forEach(cls => {
    const ct  = classTeachersMap[cls] || 'TBD';

    DAYS.filter(d => d !== 'Sat').forEach(d => {
      const last = WD_PERIODS - 1;
      result[cls][d][last] = { sub: 'Zero Period', teacher: ct, isZero: true };
      markT(ct, d, last);
      // Zero periods are completely unlinked from subject quotas.
    });
  });

  // ── Step 2: Build pools ─────────────────────────────────────────────────────
  // Pool tokens = total periods for subject. Zero period slots are completely separate.
  allClassNames.forEach(cls => {
    const subs   = classSubjects[cls];
    classPools[cls] = [];
    Object.entries(subs).forEach(([sub, info]) => {
      const remaining = Math.max(0, info.periods - (info.assigned || 0));
      for (let i = 0; i < remaining; i++) classPools[cls].push({ sub, teacher: info.teacher });
    });
    // Shuffle pool
    classPools[cls] = classPools[cls].sort(() => Math.random() - 0.5);
  });

  // ── Step 3: Period-first fill ───────────────────────────────────────────────
  // For each day, for each period (skip zero slots), fill ALL classes at that period
  // before moving to next period. This is the key fix for the free-slot bug.
  DAYS.forEach(d => {
    const np  = nPeriods(d);
    const brk = breakAfter(d);

    for (let pi = 0; pi < np; pi++) {
      // Skip zero period slots
      if (isZeroPeriodSlot(d, pi)) continue;

      // Shuffle class order each period to avoid systematic bias
      const shuffledClasses = [...allClassNames].sort(() => Math.random() - 0.5);

      shuffledClasses.forEach(cls => {
        if (result[cls][d][pi] !== null) return; // already filled

        const pool    = classPools[cls];
        const subs    = classSubjects[cls];
        const high    = isHigher(cls);
        const dsc     = daySubCount[cls][d];

        // Build scored candidates from pool
        const seen = new Set();
        const candidates = [];

        for (const item of pool) {
          const key = `${item.sub}|${item.teacher}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const info = subs[item.sub];
          if (!info) continue;

          // Count assigned so far
          const assigned = info.assigned || 0;
          if (assigned >= info.periods) continue;

          // ── Hard constraints ─────────────────────────────────────────────
          if (pi === 0 && item.sub === 'PE') continue;                           // H5
          if (!freeT(item.teacher, d, pi)) continue;                             // H1
          if (item.sub === 'Computer' && (dsc['Computer']||0) >= 1) continue;   // H6
          if (NO_DOUBLE_DAY.has(item.sub) && (dsc[item.sub]||0) >= 1) continue; // activity: max 1/day
          // MAX 2 PERIODS OF SAME SUBJECT PER DAY for all other subjects
          // (Maths/Science may be double but never triple+)
          if (!NO_DOUBLE_DAY.has(item.sub) && (dsc[item.sub]||0) >= 2) continue; // H7: max 2/day

          // Max 2 consecutive same teacher in this class
          let consec = 0;
          let ci = pi - 1;
          while (ci >= 0 && result[cls][d][ci]?.teacher === item.teacher) { consec++; ci--; }
          if (consec >= 2) continue;

          // ── Soft constraint scoring ──────────────────────────────────────
          const remain = info.periods - assigned;
          const tDayLoad = teacherUsed[item.teacher]?.[d]?.size || 0;
          let score = remain * 12 - tDayLoad * 2;

          // Strong penalty for placing same subject a 2nd time today
          // (only allowed for Maths/Science, and only if no other option)
          const todayCount = dsc[item.sub] || 0;
          if (todayCount >= 1) {
            if (ALLOW_DOUBLE.has(item.sub)) score -= 40; // allowed but discouraged
            else score -= 200; // strongly discouraged for all other subjects
          }

          // Core morning preference
          if (CORE_SUBS.has(item.sub)) {
            if (isMorning(d, pi))   score += 30;
            if (isAfternoon(d, pi)) score -= 25;
            if (isLastTwo(d, pi))   score -= 20;
          }
          // Maths/Science: strongly prefer P1-P3
          if (item.sub === 'Maths' || item.sub === 'Science' || item.sub === 'Physics') {
            if (pi <= 2) score += 20;
          }
          // Activity afternoon for higher classes
          if (ACTIVITY_SUBS.has(item.sub)) {
            if (high && isAfternoon(d, pi)) score += 25;
            if (high && isMorning(d, pi))   score -= 20;
            if (!high)                       score += 5; // lower: anywhere fine
          }
          // Saturday: avoid double core
          if (d === 'Sat' && SAT_NO_DOUBLE.has(item.sub) && (dsc[item.sub]||0) >= 1) score -= 60;
          // Library mid-week
          if (item.sub === 'Library') {
            if (d === 'Tue' || d === 'Wed' || d === 'Thu') score += 15;
            if (d === 'Mon' || d === 'Sat')                score -= 20;
          }
          // Discourage PE → Science
          if (pi > 0 && result[cls][d][pi-1]?.sub === 'PE' &&
             (item.sub === 'Science' || item.sub === 'Physics' || item.sub === 'Chemistry'))
            score -= 20;

          candidates.push({ ...item, score });
        }

        candidates.sort((a, b) => b.score - a.score);

        let placed = false;
        for (const { sub, teacher } of candidates) {
          const info = subs[sub];
          info.assigned = (info.assigned || 0) + 1;
          dsc[sub]      = (dsc[sub] || 0) + 1;
          markT(teacher, d, pi);
          result[cls][d][pi] = { sub, teacher };
          const idx = pool.findIndex(x => x.sub === sub && x.teacher === teacher);
          if (idx !== -1) pool.splice(idx, 1);
          placed = true;
          break;
        }

        if (!placed) {
          // Relaxed fallback: drop hard constraints one by one until something fits
          // Level 1: drop consecutive-teacher check, keep everything else incl. max-2/day
          let fb = pool.find(x => {
            const info = subs[x.sub];
            if ((info?.assigned||0) >= (info?.periods||0)) return false;
            if (pi === 0 && x.sub === 'PE') return false;
            if (!freeT(x.teacher, d, pi)) return false;
            if (NO_DOUBLE_DAY.has(x.sub) && (dsc[x.sub]||0) >= 1) return false;
            if (x.sub === 'Computer' && (dsc['Computer']||0) >= 1) return false;
            if (!NO_DOUBLE_DAY.has(x.sub) && (dsc[x.sub]||0) >= 2) return false; // still cap at 2
            return true;
          });
          // Level 2: also drop NO_DOUBLE_DAY restriction, but still cap at 2
          if (!fb) {
            fb = pool.find(x => {
              const info = subs[x.sub];
              if ((info?.assigned||0) >= (info?.periods||0)) return false;
              if (pi === 0 && x.sub === 'PE') return false;
              if (!freeT(x.teacher, d, pi)) return false;
              if ((dsc[x.sub]||0) >= 2) return false; // hard max 2 for all subjects
              return true;
            });
          }
          // Level 3: ignore teacher conflict, still cap at 2
          if (!fb) {
            fb = pool.find(x => {
              const info = subs[x.sub];
              if ((info?.assigned||0) >= (info?.periods||0)) return false;
              if ((dsc[x.sub]||0) >= 2) return false; // still hard max 2
              return true;
            });
          }
          // Level 4: absolute last resort — ignore max-2 cap too (prefer filled over blank)
          if (!fb) {
            fb = pool.find(x => {
              const info = subs[x.sub];
              return (info?.assigned||0) < (info?.periods||0) && freeT(x.teacher, d, pi);
            });
          }

          if (fb) {
            const info = subs[fb.sub];
            info.assigned = (info.assigned || 0) + 1;
            dsc[fb.sub]   = (dsc[fb.sub] || 0) + 1;
            markT(fb.teacher, d, pi);
            result[cls][d][pi] = { sub: fb.sub, teacher: fb.teacher };
            const idx = pool.findIndex(x => x.sub === fb.sub && x.teacher === fb.teacher);
            if (idx !== -1) pool.splice(idx, 1);
          } else {
            // Truly nothing left: repeat an existing subject rather than leave blank
            // Find any subject with remaining budget OR whose count we can exceed
            const anySub = Object.entries(classSubjects[cls])
              .sort((a,b) => (b[1].periods - (b[1].assigned||0)) - (a[1].periods - (a[1].assigned||0)))[0];
            if (anySub && freeT(anySub[1].teacher, d, pi)) {
              result[cls][d][pi] = { sub: anySub[0], teacher: anySub[1].teacher };
              markT(anySub[1].teacher, d, pi);
            } else {
              // Absolute last resort — use class teacher
              const ct = classTeachersMap[cls] || 'TBD';
              result[cls][d][pi] = { sub: 'Free', teacher: ct };
            }
          }
        }
      });
    }
  });

  return result;
}

// ── Phase 2: Tabu Search (swap-based) ────────────────────────────────────────
function tabuOptimize(initialTT, { allClassNames, allTeacherNames }, onProgress) {
  const ITERATIONS     = 500;   // reasonable for browser main-thread
  const INTRA_ACTIVATE = 25;
  const DIV_ACTIVATE   = 15;

  let current  = cloneTT(initialTT);
  let best     = cloneTT(initialTT);
  let bestCost = computeCost(best, allClassNames, allTeacherNames);
  let curCost  = bestCost;

  const tabuList = new Map(); // moveKey -> remaining tenure
  const freq     = new Map(); // cls|d|pi|sub -> count
  const fKey = (cls,d,pi,sub) => `${cls}|${d}|${pi}|${sub}`;
  const incF = (cls,d,pi,sub) => freq.set(fKey(cls,d,pi,sub),(freq.get(fKey(cls,d,pi,sub))||0)+1);

  let noImprove = 0;

  const tabuTenure = () => {
    const n = Math.sqrt(allClassNames.length * 8);
    return Math.max(3, Math.floor(0.25*n + Math.random()*1.5*n));
  };

  const tickTabu = () => {
    for (const [k,v] of tabuList) {
      if (v <= 1) tabuList.delete(k); else tabuList.set(k, v-1);
    }
  };

  // Generate moves: swap two slots within the same class across different days
  const getMoves = () => {
    const moves = [];
    allClassNames.forEach(cls => {
      DAYS.forEach((d1, d1Idx) => {
        const np1 = nPeriods(d1);
        for (let pi1 = 0; pi1 < np1; pi1++) {
          if (isZeroPeriodSlot(d1, pi1)) continue;
          const s1 = current[cls][d1][pi1];
          if (!s1) continue;
          // Lock synchronized optional blocks — never swap IT/PE/Hindi slots.
          // The 4 classes (11Comm, 11Sci, 12Comm, 12Sci) share pre-scheduled
          // sync slots; allowing independent swaps desynchronizes them.
          if (s1.sub === 'IT/PE/Hindi') continue;
          
          DAYS.forEach((d2, d2Idx) => {
            if (d2Idx < d1Idx) return;
            const np2 = nPeriods(d2);
            for (let pi2 = 0; pi2 < np2; pi2++) {
              if (d1 === d2 && pi1 >= pi2) continue; // avoid duplicate pairs
              if (isZeroPeriodSlot(d2, pi2)) continue;
              const s2 = current[cls][d2][pi2];
              if (!s2) continue;
              // Also skip the target slot if it is a synchronized optional block
              if (s2.sub === 'IT/PE/Hindi') continue;
              
              if (s1.sub === s2.sub && s1.teacher === s2.teacher) continue;
              moves.push({ cls, d1, pi1, d2, pi2 });
            }
          });
        }
      });
    });
    return moves.sort(() => Math.random()-0.5).slice(0, 400);
  };

  const applySwap = (tt, { cls, d1, pi1, d2, pi2 }) => {
    const tmp = tt[cls][d1][pi1];
    tt[cls][d1][pi1] = tt[cls][d2][pi2];
    tt[cls][d2][pi2] = tmp;
  };

  const mKey = ({ cls,d1,pi1,d2,pi2 }) => `${cls}|${d1}|${pi1}|${d2}|${pi2}`;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    tickTabu();
    const useDiv   = noImprove > 0 && noImprove % DIV_ACTIVATE   === 0;

    const moves = getMoves();
    if (!moves.length) { noImprove++; continue; }

    let bMove = null, bDelta = Infinity, bTrial = null, bCost = Infinity;

    for (const move of moves) {
      const mk = mKey(move);
      const isTabu = tabuList.has(mk);
      const trial  = cloneTT(current);
      applySwap(trial, move);
      const nc = computeCost(trial, allClassNames, allTeacherNames);
      let delta = nc - curCost;
      if (useDiv) {
        const { cls,d2,pi2 } = move;
        const s = trial[cls][d2][pi2];
        if (s?.sub) delta += (freq.get(fKey(cls,d2,pi2,s.sub))||0) * Math.abs(curCost) * 0.02;
      }
      const aspiration = nc < bestCost;
      if (isTabu && !aspiration) continue;
      if (delta < bDelta) { bDelta=delta; bMove=move; bTrial=trial; bCost=nc; }
    }

    if (!bMove) { noImprove++; continue; }

    current = bTrial;
    curCost = bCost;
    tabuList.set(mKey(bMove), tabuTenure());
    const { cls,d2,pi2 } = bMove;
    const ms = current[cls][d2][pi2];
    if (ms?.sub) incF(cls,d2,pi2,ms.sub);

    if (curCost < bestCost) {
      best = cloneTT(current);
      bestCost = curCost;
      noImprove = 0;
      freq.clear();
    } else {
      noImprove++;
    }

    if (onProgress && iter % 20 === 0) onProgress(Math.round((iter/ITERATIONS)*100), bestCost, iter);
  }

  onProgress?.(100, bestCost, ITERATIONS);
  return best;
}

// ── Public API ────────────────────────────────────────────────────────────────
export function generateTimetable(params, onProgress) {
  onProgress?.(0, null, 0);
  const initial = buildInitial(params);
  const initCost = computeCost(initial, params.allClassNames, params.allTeacherNames);
  onProgress?.(20, initCost, 0);
  const optimised = tabuOptimize(initial, params, (pct, cost, iter) => {
    onProgress?.(20 + Math.round(pct * 0.80), cost, iter);
  });
  return optimised;
}

// Helper: resolve a teacher's specific subject within the optional group
// e.g. Varsha T -> 'IT', Mamta J -> 'Hindi', New PE Teacher -> 'PE'
function resolveOptionalSub(tname) {
  for (const groups of Object.values(OPTIONAL_GROUPS)) {
    const match = groups.find(g => g.teacher === tname);
    if (match) return match.sub.replace('Optional-', ''); // 'Optional-IT' -> 'IT'
  }
  return 'IT/PE/Hindi'; // fallback
}

// Order the 4 optional classes for round-robin assignment
const OPT_CLASSES = ['11Comm', '11Sci', '12Comm', '12Sci'];

// Scan the timetable chronologically for IT/PE/Hindi slots and return a map
// of "day|pi" -> assigned class, cycling through OPT_CLASSES.
// This is computed from the raw timetable (not per-teacher) so all 3 optional
// teachers see the SAME class label at each period.
function buildOptionalAssignments(timetable, allClassNames) {
  const slots = [];
  DAYS.forEach(d => {
    for (let pi = 0; pi < nPeriods(d); pi++) {
      const isOpt = OPT_CLASSES.some(cls =>
        allClassNames.includes(cls) && timetable[cls]?.[d]?.[pi]?.sub === 'IT/PE/Hindi'
      );
      if (isOpt) slots.push(`${d}|${pi}`);
    }
  });
  const map = {};
  slots.forEach((key, i) => { map[key] = OPT_CLASSES[i % OPT_CLASSES.length]; });
  return map;
}

export function getTeacherTimetable(timetable, tname, allClassNames) {
  if (!timetable) return null;
  // Build consistent class assignment for optional slots
  const optMap = buildOptionalAssignments(timetable, allClassNames);
  const tt = {};
  DAYS.forEach(d => {
    tt[d] = Array.from({ length: nPeriods(d) }, () => []);
    for (let pi = 0; pi < nPeriods(d); pi++) {
      let hasOptional = false;
      allClassNames.forEach(cls => {
        const s = timetable[cls]?.[d]?.[pi];
        if (s?.teacher && s.teacher.split(',').map(x=>x.trim()).includes(tname)) {
          if (s.sub === 'IT/PE/Hindi') {
            hasOptional = true;
          } else {
            tt[d][pi].push({ cls, sub: s.sub, isZero: s.isZero });
          }
        }
      });
      if (hasOptional) {
        // Show one specific class per slot (round-robin), consistent across all 3 teachers
        const assignedCls = optMap[`${d}|${pi}`] || OPT_CLASSES[0];
        const optSub = resolveOptionalSub(tname);
        tt[d][pi].push({ cls: assignedCls, sub: optSub, isZero: false });
      }
    }
  });
  return tt;
}

export function getFreeTeachersAtSlot(timetable, allTeacherNames, absentTeachers, allClassNames, day, period) {
  if (!timetable) return [];
  const busy = new Set();
  allClassNames.forEach(cls => {
    const s = timetable[cls]?.[day]?.[period];
    if (s?.teacher && s.teacher !== '-') {
      s.teacher.split(',').forEach(x => busy.add(x.trim()));
    }
  });
  return allTeacherNames.filter(t => !busy.has(t) && !absentTeachers.includes(t));
}

export function getSubstituteRanking(timetable, allTeacherNames, teacherSubjectsArray, absentTeacher, allClassNames, day, period) {
  if (!timetable) return [];
  let neededSub = null;
  allClassNames.forEach(cls => {
    const s = timetable[cls]?.[day]?.[period];
    if (s?.teacher && s.teacher.split(',').map(x=>x.trim()).includes(absentTeacher)) {
      neededSub = s.sub;
    }
  });
  const free = getFreeTeachersAtSlot(timetable, allTeacherNames, [absentTeacher], allClassNames, day, period);
  const cnt = {};
  allTeacherNames.forEach(t => { cnt[t] = 0; });
  DAYS.forEach(d => {
    for (let p = 0; p < nPeriods(d); p++) {
      allClassNames.forEach(cls => {
        const s = timetable[cls]?.[d]?.[p];
        if (s?.teacher && s.teacher !== '-') {
          s.teacher.split(',').forEach(x => {
            const t = x.trim();
            cnt[t] = (cnt[t]||0)+1;
          });
        }
      });
    }
  });
  const experts = new Set(teacherSubjectsArray.filter(x => x.s === neededSub).map(x => x.t));
  return free
    .map(t => ({ name:t, sameSubject:experts.has(t), totalPeriods:cnt[t]||0 }))
    .sort((a,b) => {
      if (a.sameSubject && !b.sameSubject) return -1;
      if (!a.sameSubject && b.sameSubject) return 1;
      return a.totalPeriods - b.totalPeriods;
    });
}

export function buildMasterTimetable(timetable, allTeacherNames, allClassNames) {
  if (!timetable) return [];
  // Single consistent optional-slot assignment shared across all teacher rows
  const optMap = buildOptionalAssignments(timetable, allClassNames);
  return allTeacherNames.map(teacher => {
    const days = {};
    let total = 0;
    DAYS.forEach(d => {
      days[d] = [];
      for (let p = 0; p < nPeriods(d); p++) {
        let classes = [];
        let sub = null;
        let isZero = false;
        let hasOptional = false;
        allClassNames.forEach(cls => {
          const s = timetable[cls]?.[d]?.[p];
          if (s?.teacher && s.teacher.split(',').map(x=>x.trim()).includes(teacher)) {
            if (s.sub === 'IT/PE/Hindi') {
              hasOptional = true;
            } else {
              classes.push(cls);
              sub = s.sub;
              isZero = s.isZero;
            }
          }
        });
        if (hasOptional) {
          const assignedCls = optMap[`${d}|${p}`] || OPT_CLASSES[0];
          days[d].push({ cls: assignedCls, sub: resolveOptionalSub(teacher), p, isZero: false });
          total++;
        } else if (classes.length > 0) {
          days[d].push({ cls: classes.join(', '), sub, p, isZero });
          total++;
        } else {
          days[d].push(null);
        }
      }
    });
    return { name:teacher, days, total };
  });
}
