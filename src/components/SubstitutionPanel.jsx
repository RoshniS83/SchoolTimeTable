import React, { useState } from 'react';
import { DAYS, WD_PERIODS, SAT_PERIODS } from '../data/schoolData.js';
import { getSubstituteRanking } from '../utils/timetableEngine.js';

const nP = d => d === "Sat" ? SAT_PERIODS : WD_PERIODS;

export default function SubstitutionPanel({ timetable, allTeacherNames, teacherSubjectsArray, allClassNames }) {
  const [absentTeacher, setAbsentTeacher] = useState('');
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [selectedPeriod, setSelectedPeriod] = useState(0);
  const [suggestions, setSuggestions] = useState(null);

  const affectedClasses = () => {
    if (!timetable || !absentTeacher) return [];
    const result = [];
    allClassNames.forEach(cls => {
      const slot = timetable[cls]?.[selectedDay]?.[selectedPeriod];
      if (slot?.teacher === absentTeacher) result.push({ cls, sub: slot.sub });
    });
    return result;
  };

  const handleFind = () => {
    const ranked = getSubstituteRanking(
      timetable, allTeacherNames, teacherSubjectsArray,
      absentTeacher, allClassNames, selectedDay, selectedPeriod
    );
    setSuggestions(ranked.slice(0, 8));
  };

  const affected = affectedClasses();

  const s = {
    select: {
      padding: '8px 10px', borderRadius: 7, border: '1px solid #e5e7eb',
      fontSize: 13, background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
    },
    label: { fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4, display: 'block' },
    card: { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '12px 16px', marginBottom: 10 },
  };

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Substitution Finder</div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
        Find available substitute teachers ranked by subject expertise and workload.
      </div>

      <div style={{ ...s.card, background: '#fffbeb', border: '1px solid #fcd34d' }}>
        <div style={{ fontSize: 12, color: '#92400e' }}>
          🔔 Rule-based matching: same subject experts shown first, then by workload.
          <span style={{ color: '#78350f', marginLeft: 6 }}>AI-powered suggestions coming soon!</span>
        </div>
      </div>

      <div style={s.card}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          <div>
            <label style={s.label}>Absent Teacher</label>
            <select style={s.select} value={absentTeacher}
              onChange={e => { setAbsentTeacher(e.target.value); setSuggestions(null); }}>
              <option value="">— Select —</option>
              {allTeacherNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Day</label>
            <select style={s.select} value={selectedDay}
              onChange={e => { setSelectedDay(e.target.value); setSuggestions(null); }}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Period</label>
            <select style={s.select} value={selectedPeriod}
              onChange={e => { setSelectedPeriod(Number(e.target.value)); setSuggestions(null); }}>
              {Array.from({ length: nP(selectedDay) }).map((_, i) => (
                <option key={i} value={i}>
                  {i === nP(selectedDay) - 1 ? 'Zero Period' : `P${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {absentTeacher && affected.length > 0 && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 7, border: '1px solid #fecaca' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>Affected: </span>
            {affected.map(({ cls, sub }) => (
              <span key={cls} style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 10,
                background: '#fee2e2', color: '#991b1b', marginLeft: 4,
              }}>{cls} – {sub}</span>
            ))}
          </div>
        )}

        {absentTeacher && (
          <button
            onClick={handleFind}
            style={{
              marginTop: 14, padding: '8px 20px', borderRadius: 7, border: 'none',
              background: '#2563eb', color: '#fff', fontWeight: 500, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Find Substitutes
          </button>
        )}
      </div>

      {suggestions && (
        <div style={s.card}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>
            Suggested Substitutes
            <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11, marginLeft: 8 }}>
              sorted: same subject → fewer periods
            </span>
          </div>
          {suggestions.length === 0 ? (
            <div style={{ color: '#ef4444', fontSize: 13 }}>No free teachers available at this slot.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.map((s, i) => (
                <div key={s.name} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  background: i === 0 ? '#f0fdf4' : '#f9fafb',
                  border: `1px solid ${i === 0 ? '#86efac' : '#e5e7eb'}`,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: i === 0 ? '#22c55e' : '#e5e7eb',
                    color: i === 0 ? '#fff' : '#6b7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</span>
                    {s.sameSubject && (
                      <span style={{
                        marginLeft: 8, fontSize: 10, padding: '2px 8px', borderRadius: 10,
                        background: '#dcfce7', color: '#166534', fontWeight: 600,
                      }}>Same Subject ✓</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.totalPeriods} periods/wk</div>
                  {i === 0 && <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>⭐ Best Match</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
