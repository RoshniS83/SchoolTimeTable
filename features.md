# DCPEMS Timetable Constraints

All constraints implemented in the timetable engine (`src/utils/timetableEngine.js`).

---

## Hard Constraints
These are **never violated**. The greedy phase enforces them during slot placement.

| ID | Constraint | Enforced In |
|----|-----------|-------------|
| H1 | No teacher assigned to two classes at the same period | Greedy + global `teacherUsed` tracker |
| H2 | No two lessons in the same class at the same period | Greedy (single slot fill) |
| H3 | Zero period exists only on Mon–Fri, always P9 (index 8), always assigned to class teacher | Pre-placed before greedy fill |
| H4 | Saturday has NO zero period — P5 (index 4) is a normal teaching period | `isZeroPeriodSlot()` returns false for Sat |
| H5 | No PE as first period (P1) on any day | Greedy filter |
| H6 | No two Computer periods in the same class on the same day | Greedy + `daySubCount` tracker |
| H7 | No subject may appear more than 2 times in a class on the same day (Maths/Science may be placed twice if needed, all others hard-capped at 2, never 3+) | Greedy hard filter + 4-level fallback chain |

---

## Soft Constraints
These are **penalised** in the cost function and minimised by Tabu Search.
Higher weight = more important = Tabu Search tries harder to eliminate violations.

### Student Timetable Constraints

| ID | Constraint | Weight | Notes |
|----|-----------|--------|-------|
| S3 | No free/empty period in any student's class timetable (Mon–Sat) | **500** | Highest priority. Zero period (P9 Mon–Fri) is exempt |
| S4 | Core subjects (Maths, English, Science, SST, Physics, Chemistry, Biology, History, Geography) should be in the morning (before break) | 120 | Morning = P1–P4 on Mon–Fri, P1–P3 on Sat |
| S5 | Core subjects should not be in the last 2 periods | 100 | |
| S6 | No double Computer periods in a day for any class | 80 | Also a hard constraint in greedy |
| S7 | Activity subjects (PE, Art, Music, Library, Robotics, GK, Aptitude Reasoning, V.Ed) should be in afternoon for Std 7–10 | 90 | Lower classes (Std 1–6) can have activities in morning |
| S9 | Avoid same subject appearing twice in a day for a class (except Maths/Science which may be double) | 60 | |
| S11 | On Saturday, no two periods of Maths, Science, English, or Computer for same class | 130 | Saturday should not be overloaded with heavy subjects |
| S14 | Avoid same subject on consecutive days | 60 | Spaced repetition is better for learning |
| S15 | Core subjects should not be the last period on Friday | 80 | Students are mentally checked out on Friday afternoon |
| S16 | Science/Physics/Chemistry should not be scheduled immediately after PE | 40 | Students need to focus after physical activity |
| S17 | Library should not be scheduled on Monday or Saturday | 50 | Preferred mid-week: Tue, Wed, or Thu |
| S19 | Maths/Science should not be in the last non-zero period of any day | 90 | |

### Teacher Timetable Constraints

| ID | Constraint | Weight | Notes |
|----|-----------|--------|-------|
| S1 | Every teacher should have at least 4 periods on each working day | 200 | Applies to all days including Saturday |
| S2 | Teacher periods should not all be clustered in morning or all in afternoon (≥3 periods/day) | 150 | Uniform distribution preferred |
| S10 | A teacher should not have all 5 Saturday periods while having light weekday load (avg < 3/day) | 180 | Don't overload Saturday and free other days |
| S12 | Activity teachers (PE, Art, Music, Library) must be spread over all days | 150 | These teachers also need uniform distribution |
| S13 | Teacher intraday gap should not exceed 1 free slot between two occupied periods | 120 | Avoid a teacher sitting idle for 2+ periods between classes |
| S18 | Teacher should not have 0 periods on any working weekday | 180 | Every teacher must have at least one period each day |
| S20 | Teacher should not have 4+ periods all in morning with nothing in afternoon | 130 | Spread through the day |

### Algorithm-added Constraints (from research)

| ID | Constraint | Weight | Source |
|----|-----------|--------|--------|
| S8 | Lower classes (Std 1–6) can have activity subjects in morning — no penalty | 0 | Pedagogical preference |

---

## Period Structure Reference

```
Mon–Fri:
  P1 P2 P3 P4 | BREAK | P5 P6 P7 P8 | Zero(P9)
  Morning (0-3)         Afternoon (5-8)  Break at index 4

Saturday:
  P1 P2 P3 | BREAK | P4 P5
  Morning (0-2)    Afternoon (4)  Break at index 3
  No zero period. P5 is a normal teaching period.
```

---

## Subject Category Reference

| Category | Subjects |
|----------|---------|
| Core | Maths, English, SST, Science, Physics, Chemistry, Biology, History, Geography, Accounts, BusinessStudies, Economics |
| Activity | PE, Art, Music, Library, Robotics, GK, Aptitude Reasoning, V.Ed |
| Allow Double (consecutive OK) | Maths, Science, Physics, Chemistry, Biology |
| No Double in Day | PE, Library, Art, Music, Robotics, GK, Aptitude Reasoning, V.Ed, Computer, Optional-PE, Optional-IT, Optional-Hindi |
| Saturday No Double | Maths, Science, English, Computer, Physics, Chemistry, Biology |

---

## Optional Subject Groups (Std 11 & 12)

For classes 11Comm, 11Sci, 12Comm, 12Sci the `Hindi/IT/PE` slot is modelled as **3 parallel groups** scheduled at the same period:
- **Optional-Hindi** → Mamta J
- **Optional-IT** → Varsha T  
- **Optional-PE** → New PE Teacher

All three teachers appear in their personal timetables showing these slots.
