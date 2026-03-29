/**
 * timetableWorker.js
 * Runs inside a Web Worker so the main thread stays responsive during
 * the Tabu Search optimisation (which can take several seconds).
 *
 * Messages IN  (from main thread):
 *   { type: 'generate', payload: { serialisedParams } }
 *
 * Messages OUT (to main thread):
 *   { type: 'progress', percent, cost, iter }
 *   { type: 'done',     timetable }
 *   { type: 'error',    message }
 */

// We import the engine directly. Vite handles this automatically for workers.
import { generateTimetable } from './timetableEngine.js';

self.onmessage = (e) => {
  const { type, payload } = e.data;
  if (type !== 'generate') return;

  try {
    const {
      allClassNames,
      classTeachersMap,
      subjectPeriodsMap,   // plain object: cls -> {sub: periods}
      teacherForSubjectMap, // plain object: cls -> {sub: teacherName}
      allTeacherNames,
    } = payload;

    // Reconstruct functions from serialised maps
    const getSubjectPeriods    = (cls) => subjectPeriodsMap[cls]   || {};
    const getTeacherForSubject = (cls, sub) => teacherForSubjectMap[cls]?.[sub] || null;

    const timetable = generateTimetable(
      { allClassNames, classTeachersMap, getSubjectPeriods, getTeacherForSubject, allTeacherNames },
      (percent, cost, iter) => {
        self.postMessage({ type: 'progress', percent, cost, iter });
      }
    );

    self.postMessage({ type: 'done', timetable });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
