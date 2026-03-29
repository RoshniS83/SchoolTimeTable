import React, { useState } from 'react';

// ── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  card: {
    background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
    padding: '16px 20px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  input: {
    padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb',
    fontSize: 13, background: '#fff', fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  select: {
    padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb',
    fontSize: 13, background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
  },
  btn: (variant = 'default') => {
    const variants = {
      default: { background: '#fff', color: '#374151', border: '1px solid #e5e7eb' },
      primary: { background: '#2563eb', color: '#fff', border: '1px solid #2563eb' },
      danger:  { background: '#fff', color: '#ef4444', border: '1px solid #fecaca' },
      success: { background: '#f0fdf4', color: '#166534', border: '1px solid #86efac' },
      warning: { background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d' },
    };
    return {
      padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
      cursor: 'pointer', fontFamily: 'inherit', ...(variants[variant] || variants.default),
    };
  },
  tag: (color = '#dbeafe', textColor = '#1d4ed8', border = '#93c5fd') => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 11, padding: '3px 8px', borderRadius: 20,
    background: color, color: textColor, border: `1px solid ${border}`,
    whiteSpace: 'nowrap',
  }),
  label: { fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, display: 'block' },
  sectionTitle: { fontWeight: 700, fontSize: 16, marginBottom: 4 },
  subTitle: { fontSize: 12, color: '#9ca3af', marginBottom: 16 },
  divider: { borderTop: '1px solid #f3f4f6', margin: '14px 0' },
};

// ── Small helpers ─────────────────────────────────────────────────────────────
function Badge({ children, color, textColor, border, onRemove }) {
  return (
    <span style={S.tag(color, textColor, border)}>
      {children}
      {onRemove && (
        <button onClick={onRemove} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'inherit', padding: 0, lineHeight: 1, fontSize: 13, marginLeft: 2,
        }}>×</button>
      )}
    </span>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}>Confirm</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={S.btn('default')} onClick={onCancel}>Cancel</button>
          <button style={S.btn('danger')} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Teacher Editor Modal ──────────────────────────────────────────────────────
function TeacherModal({ teacher, allClassNames, classTeachersMap, onSave, onClose }) {
  const [name, setName] = useState(teacher?.name || '');
  const [assignments, setAssignments] = useState(
    teacher?.assignments ? JSON.parse(JSON.stringify(teacher.assignments)) : []
  );
  const [newSubject, setNewSubject] = useState('');
  const [newClasses, setNewClasses] = useState('');
  const [error, setError] = useState('');

  const addAssignment = () => {
    if (!newSubject.trim()) { setError('Subject required'); return; }
    const cls = newClasses.split(',').map(s => s.trim()).filter(Boolean);
    if (cls.length === 0) { setError('At least one class required'); return; }
    const invalid = cls.filter(c => !allClassNames.includes(c));
    if (invalid.length > 0) { setError(`Unknown classes: ${invalid.join(', ')}`); return; }
    const idx = assignments.findIndex(a => a.subject === newSubject.trim());
    if (idx >= 0) {
      const updated = [...assignments];
      const merged = [...new Set([...updated[idx].classes, ...cls])];
      updated[idx] = { ...updated[idx], classes: merged };
      setAssignments(updated);
    } else {
      setAssignments([...assignments, { subject: newSubject.trim(), classes: cls }]);
    }
    setNewSubject('');
    setNewClasses('');
    setError('');
  };

  const removeClass = (subIdx, cls) => {
    const updated = [...assignments];
    updated[subIdx] = { ...updated[subIdx], classes: updated[subIdx].classes.filter(c => c !== cls) };
    if (updated[subIdx].classes.length === 0) updated.splice(subIdx, 1);
    setAssignments(updated);
  };

  const removeAssignment = (subIdx) => {
    setAssignments(assignments.filter((_, i) => i !== subIdx));
  };

  const handleSave = () => {
    if (!name.trim()) { setError('Name required'); return; }
    onSave({ name: name.trim(), assignments });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 28,
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>
          {teacher ? 'Edit Teacher' : 'Add Teacher'}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Full Name</label>
          <input
            style={{ ...S.input, width: '100%' }}
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            placeholder="e.g. Priya Sharma"
            autoFocus
          />
        </div>

        <div style={S.divider} />
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Subject Assignments</div>

        {assignments.map((a, i) => (
          <div key={i} style={{
            background: '#f8fafc', borderRadius: 8, padding: '10px 12px',
            marginBottom: 8, border: '1px solid #e5e7eb',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{a.subject}</span>
              <button style={{ ...S.btn('danger'), padding: '3px 8px', fontSize: 11 }} onClick={() => removeAssignment(i)}>
                Remove subject
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {a.classes.map(cls => (
                <Badge key={cls} color="#dbeafe" textColor="#1d4ed8" border="#93c5fd"
                  onRemove={() => removeClass(i, cls)}>
                  {cls}
                </Badge>
              ))}
            </div>
          </div>
        ))}

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8,
          alignItems: 'end', marginTop: 10,
        }}>
          <div>
            <label style={S.label}>Subject</label>
            <input style={{ ...S.input, width: '100%' }} value={newSubject}
              onChange={e => { setNewSubject(e.target.value); setError(''); }}
              placeholder="e.g. Maths" />
          </div>
          <div>
            <label style={S.label}>Classes (comma separated)</label>
            <input style={{ ...S.input, width: '100%' }} value={newClasses}
              onChange={e => { setNewClasses(e.target.value); setError(''); }}
              placeholder="e.g. 5A,6B,7C" />
          </div>
          <button style={S.btn('primary')} onClick={addAssignment}>+ Add</button>
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>
          Valid classes: {allClassNames.join(', ')}
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button style={S.btn('default')} onClick={onClose}>Cancel</button>
          <button style={S.btn('primary')} onClick={handleSave}>Save Teacher</button>
        </div>
      </div>
    </div>
  );
}

// ── Class Editor Modal ────────────────────────────────────────────────────────
function ClassModal({ cls: clsObj, allTeacherNames, onSave, onClose, isNew }) {
  const [clsName, setClsName] = useState(clsObj?.cls || '');
  const [classTeacher, setClassTeacher] = useState(clsObj?.classTeacher || '');
  const [subjectPeriods, setSubjectPeriods] = useState(
    clsObj?.subjectPeriods ? { ...clsObj.subjectPeriods } : {}
  );
  const [newSub, setNewSub] = useState('');
  const [newPeriods, setNewPeriods] = useState('');
  const [error, setError] = useState('');

  const updatePeriods = (sub, val) => {
    const n = Math.max(0, parseInt(val) || 0);
    setSubjectPeriods(prev => ({ ...prev, [sub]: n }));
  };

  const addSubject = () => {
    if (!newSub.trim()) { setError('Subject name required'); return; }
    const n = parseInt(newPeriods);
    if (isNaN(n) || n < 1) { setError('Periods must be ≥ 1'); return; }
    setSubjectPeriods(prev => ({ ...prev, [newSub.trim()]: n }));
    setNewSub('');
    setNewPeriods('');
    setError('');
  };

  const removeSubject = (sub) => {
    const next = { ...subjectPeriods };
    delete next[sub];
    setSubjectPeriods(next);
  };

  const handleSave = () => {
    if (!clsName.trim()) { setError('Class name required'); return; }
    onSave({ cls: clsName.trim(), classTeacher, subjectPeriods });
  };

  const totalPeriods = Object.values(subjectPeriods).reduce((a, b) => a + b, 0);
  const weekTotal = 5 * 8 + 1 * 4; // rough expected total

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 28,
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>
          {isNew ? 'Add Class' : `Edit Class: ${clsObj?.cls}`}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={S.label}>Class Name</label>
            <input style={{ ...S.input, width: '100%' }} value={clsName}
              onChange={e => { setClsName(e.target.value); setError(''); }}
              placeholder="e.g. 6D" disabled={!isNew} />
          </div>
          <div>
            <label style={S.label}>Class Teacher</label>
            <select style={{ ...S.select, width: '100%' }} value={classTeacher}
              onChange={e => setClassTeacher(e.target.value)}>
              <option value="">— None —</option>
              {allTeacherNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div style={S.divider} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Subject Periods</div>
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 20,
            background: totalPeriods > weekTotal ? '#fef2f2' : '#f0fdf4',
            color: totalPeriods > weekTotal ? '#ef4444' : '#166534',
            border: `1px solid ${totalPeriods > weekTotal ? '#fecaca' : '#86efac'}`,
          }}>
            Total: {totalPeriods} periods/week
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {Object.entries(subjectPeriods).map(([sub, n]) => (
            <div key={sub} style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 36px',
              gap: 8, alignItems: 'center',
              background: '#f8fafc', padding: '7px 10px', borderRadius: 7,
              border: '1px solid #e5e7eb',
            }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{sub}</span>
              <input
                type="number" min="0" max="20"
                style={{ ...S.input, textAlign: 'center', padding: '5px 8px' }}
                value={n}
                onChange={e => updatePeriods(sub, e.target.value)}
              />
              <button
                onClick={() => removeSubject(sub)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16 }}
              >×</button>
            </div>
          ))}
        </div>

        {/* Add new subject */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: 8, alignItems: 'end' }}>
          <div>
            <label style={S.label}>New Subject</label>
            <input style={{ ...S.input, width: '100%' }} value={newSub}
              onChange={e => { setNewSub(e.target.value); setError(''); }}
              placeholder="e.g. Drawing" />
          </div>
          <div>
            <label style={S.label}>Periods/wk</label>
            <input type="number" min="1" max="20"
              style={{ ...S.input, width: '100%' }} value={newPeriods}
              onChange={e => { setNewPeriods(e.target.value); setError(''); }}
              placeholder="e.g. 2" />
          </div>
          <button style={S.btn('primary')} onClick={addSubject}>+ Add</button>
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button style={S.btn('default')} onClick={onClose}>Cancel</button>
          <button style={S.btn('primary')} onClick={handleSave}>Save Class</button>
        </div>
      </div>
    </div>
  );
}

// ── Main DataManager Component ────────────────────────────────────────────────
export default function DataManager({ schoolData, onDataChanged }) {
  const {
    teachers, classes, allTeacherNames, allClassNames,
    classTeachersMap, teacherSubjectsArray,
    addTeacher, deleteTeacher, renameTeacher,
    setClassTeacher, upsertAssignment, deleteAssignment,
    addClass, deleteClass,
    updateSubjectPeriods, addSubjectToClass, removeSubjectFromClass,
    resetToDefaults,
  } = schoolData;

  const [tab, setTab] = useState('teachers'); // 'teachers' | 'classes'
  const [searchT, setSearchT] = useState('');
  const [searchC, setSearchC] = useState('');
  const [teacherModal, setTeacherModal] = useState(null); // null | 'new' | teacherName
  const [classModal, setClassModal] = useState(null);     // null | 'new' | cls
  const [confirm, setConfirm] = useState(null);          // { message, onConfirm }
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // ── Teacher handlers ──────────────────────────────────────────────────────
  const handleSaveTeacher = (data) => {
    const isNew = teacherModal === 'new';
    const oldName = isNew ? null : teacherModal;

    if (isNew) {
      if (!addTeacher(data.name)) { return; }
    } else if (oldName !== data.name) {
      renameTeacher(oldName, data.name);
    }

    // Sync assignments
    const targetName = data.name;
    const existingAssignments = teachers[oldName || data.name]?.assignments || [];
    const existingSubs = new Set(existingAssignments.map(a => a.subject));
    const newSubs = new Set(data.assignments.map(a => a.subject));

    // Delete removed
    existingSubs.forEach(s => {
      if (!newSubs.has(s)) deleteAssignment(targetName, s);
    });
    // Upsert all
    data.assignments.forEach(a => {
      upsertAssignment(targetName, a.subject, a.classes);
    });

    setTeacherModal(null);
    showToast(`Teacher "${data.name}" saved`);
    onDataChanged?.();
  };

  const handleDeleteTeacher = (name) => {
    setConfirm({
      message: `Delete teacher "${name}"? This will remove all their assignments.`,
      onConfirm: () => {
        deleteTeacher(name);
        setConfirm(null);
        showToast(`"${name}" deleted`);
        onDataChanged?.();
      },
    });
  };

  // ── Class handlers ────────────────────────────────────────────────────────
  const handleSaveClass = (data) => {
    const isNew = classModal === 'new';
    if (isNew) {
      if (!addClass(data.cls, data.classTeacher, data.subjectPeriods)) return;
    } else {
      setClassTeacher(data.cls, data.classTeacher);
      updateSubjectPeriods(data.cls, data.subjectPeriods);
    }
    setClassModal(null);
    showToast(`Class "${data.cls}" saved`);
    onDataChanged?.();
  };

  const handleDeleteClass = (cls) => {
    setConfirm({
      message: `Delete class "${cls}"? This is permanent.`,
      onConfirm: () => {
        deleteClass(cls);
        setConfirm(null);
        showToast(`"${cls}" deleted`);
        onDataChanged?.();
      },
    });
  };

  const handleResetDefaults = () => {
    setConfirm({
      message: 'Reset ALL data to defaults? This will overwrite all your edits.',
      onConfirm: () => {
        resetToDefaults();
        setConfirm(null);
        showToast('Data reset to defaults');
        onDataChanged?.();
      },
    });
  };

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredTeachers = allTeacherNames.filter(t =>
    t.toLowerCase().includes(searchT.toLowerCase())
  );
  const filteredClasses = allClassNames.filter(c =>
    c.toLowerCase().includes(searchC.toLowerCase())
  );

  // ── Tab bar ───────────────────────────────────────────────────────────────
  const tabStyle = (active) => ({
    padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
    fontWeight: active ? 600 : 400, fontFamily: 'inherit',
    background: active ? '#2563eb' : '#f1f5f9',
    color: active ? '#fff' : '#374151',
    border: 'none',
  });

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 2000,
          background: '#1e293b', color: '#f8fafc', borderRadius: 8,
          padding: '10px 18px', fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.2s ease',
        }}>{toast}</div>
      )}

      {/* Confirm modal */}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

      {/* Teacher modal */}
      {teacherModal && (
        <TeacherModal
          teacher={teacherModal === 'new' ? null : { ...teachers[teacherModal] }}
          allClassNames={allClassNames}
          classTeachersMap={classTeachersMap}
          onSave={handleSaveTeacher}
          onClose={() => setTeacherModal(null)}
        />
      )}

      {/* Class modal */}
      {classModal && (
        <ClassModal
          cls={classModal === 'new' ? null : classes[classModal]}
          allTeacherNames={allTeacherNames}
          onSave={handleSaveClass}
          onClose={() => setClassModal(null)}
          isNew={classModal === 'new'}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={S.sectionTitle}>Data Management</div>
          <div style={S.subTitle}>Edit teachers, subjects, classes and assignments. Changes apply on next timetable generation.</div>
        </div>
        <button style={S.btn('warning')} onClick={handleResetDefaults}>↺ Reset to Defaults</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button style={tabStyle(tab === 'teachers')} onClick={() => setTab('teachers')}>
          👤 Teachers ({allTeacherNames.length})
        </button>
        <button style={tabStyle(tab === 'classes')} onClick={() => setTab('classes')}>
          🏫 Classes ({allClassNames.length})
        </button>
      </div>

      {/* ── TEACHERS TAB ── */}
      {tab === 'teachers' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input
              style={{ ...S.input, maxWidth: 260 }}
              placeholder="Search teacher…"
              value={searchT}
              onChange={e => setSearchT(e.target.value)}
            />
            <button style={S.btn('primary')} onClick={() => setTeacherModal('new')}>
              + Add Teacher
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {filteredTeachers.map(name => {
              const t = teachers[name];
              const ctClasses = Object.entries(classTeachersMap)
                .filter(([, v]) => v === name).map(([k]) => k);
              const subs = (t?.assignments || []).map(a => a.subject);
              const totalClasses = (t?.assignments || []).reduce((acc, a) => acc + a.classes.length, 0);

              return (
                <div key={name} style={{ ...S.card, marginBottom: 0, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: '#dbeafe', color: '#1d4ed8', fontWeight: 700, fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
                      {ctClasses.length > 0 && (
                        <div style={{ fontSize: 11, color: '#2563eb', marginTop: 2 }}>
                          CT: {ctClasses.join(', ')}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                        {subs.length} subjects · {totalClasses} class assignments
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {subs.slice(0, 4).map(s => (
                          <Badge key={s} color="#f1f5f9" textColor="#374151" border="#e5e7eb">{s}</Badge>
                        ))}
                        {subs.length > 4 && <Badge color="#f1f5f9" textColor="#9ca3af" border="#e5e7eb">+{subs.length - 4}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
                    <button style={{ ...S.btn('default'), flex: 1, textAlign: 'center' }}
                      onClick={() => setTeacherModal(name)}>
                      ✏️ Edit
                    </button>
                    <button style={{ ...S.btn('danger'), flex: 1, textAlign: 'center' }}
                      onClick={() => handleDeleteTeacher(name)}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CLASSES TAB ── */}
      {tab === 'classes' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input
              style={{ ...S.input, maxWidth: 260 }}
              placeholder="Search class…"
              value={searchC}
              onChange={e => setSearchC(e.target.value)}
            />
            <button style={S.btn('primary')} onClick={() => setClassModal('new')}>
              + Add Class
            </button>
          </div>

          {/* Group by standard */}
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => {
            const divs = filteredClasses.filter(c => {
              const num = parseInt(c);
              return num === g;
            });
            if (!divs.length) return null;
            return (
              <div key={g} style={S.card}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Std {g}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                  {divs.map(cls => {
                    const c = classes[cls];
                    const sp = c?.subjectPeriods || {};
                    const total = Object.values(sp).reduce((a, b) => a + b, 0);
                    const subCount = Object.keys(sp).length;
                    return (
                      <div key={cls} style={{
                        background: '#f8fafc', borderRadius: 8, padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{cls}</div>
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                              CT: {c?.classTeacher || '—'}
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                              {subCount} subjects · {total} periods/wk
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 7, marginBottom: 8 }}>
                          {Object.entries(sp).slice(0, 6).map(([sub, n]) => (
                            <span key={sub} style={{
                              fontSize: 10, padding: '2px 6px', borderRadius: 8,
                              background: '#fff', border: '1px solid #e5e7eb', color: '#374151',
                            }}>{sub}: {n}</span>
                          ))}
                          {Object.keys(sp).length > 6 && (
                            <span style={{ fontSize: 10, color: '#9ca3af' }}>+{Object.keys(sp).length - 6} more</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ ...S.btn('default'), flex: 1, fontSize: 11, padding: '5px 8px' }}
                            onClick={() => setClassModal(cls)}>
                            ✏️ Edit
                          </button>
                          <button style={{ ...S.btn('danger'), flex: 1, fontSize: 11, padding: '5px 8px' }}
                            onClick={() => handleDeleteClass(cls)}>
                            🗑 Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
