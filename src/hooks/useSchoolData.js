import { useCallback } from 'react';
import { useSupabase } from './useSupabase.js';
import {
  ALL_CLASSES as DEFAULT_CLASSES,
  CLASS_TEACHERS as DEFAULT_CLASS_TEACHERS,
  TEACHER_SUBJECTS as DEFAULT_TEACHER_SUBJECTS,
  getSubjectPeriods as defaultGetSubjectPeriods,
} from '../data/schoolData.js';

// ── Default subject-period rules ────────────────────────────────────────────
const DEFAULT_SUBJECT_PERIODS = (() => {
  const map = {};
  DEFAULT_CLASSES.forEach(cls => {
    map[cls] = defaultGetSubjectPeriods(cls);
  });
  return map;
})();

// ── Build initial state from static defaults ─────────────────────────────────
function buildInitialTeachers() {
  const map = {}; // name -> { name, isClassTeacher, ctClasses: [], assignments: [{cls, subject, periods}] }
  DEFAULT_TEACHER_SUBJECTS.forEach(({ t, s, c }) => {
    if (!map[t]) map[t] = { name: t, assignments: [] };
    map[t].assignments.push({ subject: s, classes: [...c] });
  });
  Object.entries(DEFAULT_CLASS_TEACHERS).forEach(([cls, name]) => {
    if (!map[name]) map[name] = { name, assignments: [] };
    map[name].isClassTeacher = true;
    if (!map[name].ctClasses) map[name].ctClasses = [];
    if (!map[name].ctClasses.includes(cls)) map[name].ctClasses.push(cls);
  });
  return map;
}

function buildInitialClasses() {
  // cls -> { cls, classTeacher, subjectPeriods: {sub: n} }
  const map = {};
  DEFAULT_CLASSES.forEach(cls => {
    map[cls] = {
      cls,
      classTeacher: DEFAULT_CLASS_TEACHERS[cls] || '',
      subjectPeriods: { ...defaultGetSubjectPeriods(cls) },
    };
  });
  return map;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useSchoolData() {
  const [teachers, setTeachersRaw] = useSupabase('dcpems_teachers', buildInitialTeachers());
  const [classes, setClassesRaw] = useSupabase('dcpems_classes', buildInitialClasses());

  const setTeachers = useCallback((updater) => {
    setTeachersRaw(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, [setTeachersRaw]);

  const setClasses = useCallback((updater) => {
    setClassesRaw(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, [setClassesRaw]);

  // ── Teacher CRUD ────────────────────────────────────────────────────────────

  const addTeacher = useCallback((name) => {
    if (!name.trim()) return false;
    setTeachers(prev => {
      if (prev[name]) return prev;
      return { ...prev, [name]: { name, assignments: [], ctClasses: [] } };
    });
    return true;
  }, [setTeachers]);

  const deleteTeacher = useCallback((name) => {
    setTeachers(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    // Remove from class teacher assignments
    setClasses(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(cls => {
        if (next[cls].classTeacher === name) {
          next[cls] = { ...next[cls], classTeacher: '' };
        }
      });
      return next;
    });
  }, [setTeachers, setClasses]);

  const renameTeacher = useCallback((oldName, newName) => {
    if (!newName.trim() || oldName === newName) return;
    setTeachers(prev => {
      if (prev[newName]) return prev; // already exists
      const entry = { ...prev[oldName], name: newName };
      const next = { ...prev, [newName]: entry };
      delete next[oldName];
      return next;
    });
    setClasses(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(cls => {
        if (next[cls].classTeacher === oldName) {
          next[cls] = { ...next[cls], classTeacher: newName };
        }
      });
      return next;
    });
  }, [setTeachers, setClasses]);

  // Set class teacher for a class
  const setClassTeacher = useCallback((cls, teacherName) => {
    setClasses(prev => ({
      ...prev,
      [cls]: { ...prev[cls], classTeacher: teacherName },
    }));
    // Update teacher's ctClasses
    setTeachers(prev => {
      const next = { ...prev };
      // Remove from old CT
      Object.keys(next).forEach(t => {
        if (next[t].ctClasses?.includes(cls) && t !== teacherName) {
          next[t] = { ...next[t], ctClasses: next[t].ctClasses.filter(c => c !== cls) };
        }
      });
      // Add to new CT
      if (teacherName && next[teacherName]) {
        const ctClasses = next[teacherName].ctClasses || [];
        if (!ctClasses.includes(cls)) {
          next[teacherName] = { ...next[teacherName], ctClasses: [...ctClasses, cls] };
        }
      }
      return next;
    });
  }, [setClasses, setTeachers]);

  // Add/update an assignment: teacher teaches subject to a set of classes
  const upsertAssignment = useCallback((teacherName, subject, classesList) => {
    setTeachers(prev => {
      const t = { ...prev[teacherName] };
      const assignments = [...(t.assignments || [])];
      const idx = assignments.findIndex(a => a.subject === subject);
      if (idx >= 0) {
        assignments[idx] = { ...assignments[idx], classes: classesList };
      } else {
        assignments.push({ subject, classes: classesList });
      }
      return { ...prev, [teacherName]: { ...t, assignments } };
    });
  }, [setTeachers]);

  const deleteAssignment = useCallback((teacherName, subject) => {
    setTeachers(prev => {
      const t = { ...prev[teacherName] };
      return {
        ...prev,
        [teacherName]: {
          ...t,
          assignments: (t.assignments || []).filter(a => a.subject !== subject),
        },
      };
    });
  }, [setTeachers]);

  // ── Class CRUD ──────────────────────────────────────────────────────────────

  const addClass = useCallback((cls, classTeacher = '', subjectPeriods = {}) => {
    if (!cls.trim()) return false;
    setClasses(prev => {
      if (prev[cls]) return prev;
      return { ...prev, [cls]: { cls, classTeacher, subjectPeriods } };
    });
    return true;
  }, [setClasses]);

  const deleteClass = useCallback((cls) => {
    setClasses(prev => {
      const next = { ...prev };
      delete next[cls];
      return next;
    });
  }, [setClasses]);

  const updateSubjectPeriods = useCallback((cls, subjectPeriods) => {
    setClasses(prev => ({
      ...prev,
      [cls]: { ...prev[cls], subjectPeriods },
    }));
  }, [setClasses]);

  const updateOneSubjectPeriod = useCallback((cls, subject, periods) => {
    setClasses(prev => ({
      ...prev,
      [cls]: {
        ...prev[cls],
        subjectPeriods: { ...prev[cls].subjectPeriods, [subject]: Number(periods) },
      },
    }));
  }, [setClasses]);

  const addSubjectToClass = useCallback((cls, subject, periods) => {
    setClasses(prev => ({
      ...prev,
      [cls]: {
        ...prev[cls],
        subjectPeriods: { ...prev[cls].subjectPeriods, [subject]: Number(periods) },
      },
    }));
  }, [setClasses]);

  const removeSubjectFromClass = useCallback((cls, subject) => {
    setClasses(prev => {
      const sp = { ...prev[cls].subjectPeriods };
      delete sp[subject];
      return { ...prev, [cls]: { ...prev[cls], subjectPeriods: sp } };
    });
  }, [setClasses]);

  // ── Reset to defaults ───────────────────────────────────────────────────────
  const resetToDefaults = useCallback(() => {
    const t = buildInitialTeachers();
    const c = buildInitialClasses();
    setTeachersRaw(t);
    setClassesRaw(c);
  }, [setTeachersRaw, setClassesRaw]);

  // ── Derived helpers ─────────────────────────────────────────────────────────
  const allTeacherNames = Object.keys(teachers).sort();
  const allClassNames = Object.keys(classes).sort((a, b) => {
    const na = parseInt(a), nb = parseInt(b);
    if (na !== nb) return na - nb;
    return a.localeCompare(b);
  });

  // Build CLASS_TEACHERS map for engine
  const classTeachersMap = Object.fromEntries(
    Object.values(classes).map(c => [c.cls, c.classTeacher])
  );

  // Build TEACHER_SUBJECTS array for engine
  const teacherSubjectsArray = [];
  Object.values(teachers).forEach(t => {
    (t.assignments || []).forEach(a => {
      if (a.classes && a.classes.length > 0) {
        teacherSubjectsArray.push({ t: t.name, s: a.subject, c: a.classes });
      }
    });
  });

  // getSubjectPeriods from editable data
  const getSubjectPeriods = useCallback((cls) => {
    return classes[cls]?.subjectPeriods || {};
  }, [classes]);

  // getTeacherForSubject from editable data
  const getTeacherForSubject = useCallback((cls, sub) => {
    const match = teacherSubjectsArray.find(x => x.s === sub && x.c.includes(cls));
    return match ? match.t : (classTeachersMap[cls] || null);
  }, [teacherSubjectsArray, classTeachersMap]);

  return {
    teachers, classes,
    allTeacherNames, allClassNames,
    classTeachersMap, teacherSubjectsArray,
    getSubjectPeriods, getTeacherForSubject,
    // Teacher ops
    addTeacher, deleteTeacher, renameTeacher,
    setClassTeacher,
    upsertAssignment, deleteAssignment,
    // Class ops
    addClass, deleteClass,
    updateSubjectPeriods, updateOneSubjectPeriod,
    addSubjectToClass, removeSubjectFromClass,
    resetToDefaults,
  };
}
