import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  DAYS, WD_PERIODS, SAT_PERIODS, BREAK_WD, BREAK_SAT,
  getSubColor, getSubBorder, subDisplayLabel, getClassColor
} from './data/schoolData.js';
import {
  getTeacherTimetable, getFreeTeachersAtSlot,
  buildMasterTimetable, nPeriods, isZeroPeriodSlot, breakAfter,
  SUBJECT_COLORS,
} from './utils/timetableEngine.js';

// Re-export sets needed for quality checks in dashboard
const ACTIVITY_SUBS = new Set(['PE','Art','Music','Library','Robotics','GK','Aptitude Reasoning','V.Ed']);
const isHigher = cls => parseInt(cls) >= 7;
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useSchoolData } from './hooks/useSchoolData.js';
import { useAuth, AuthProvider } from './hooks/useAuth.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import DataManager from './components/DataManager.jsx';
import SubstitutionPanel from './components/SubstitutionPanel.jsx';
import { exportTeacherMasterToExcel, exportClassMasterToExcel } from './utils/excelExport.js';

const brk = d => d === "Sat" ? BREAK_SAT : BREAK_WD;

// ── Design tokens ──────────────────────────────────────────────────────────────
const S = {
  app:     { display:'flex', height:'100vh', fontFamily:'var(--font-sans)', overflow:'hidden' },
  sidebar: { width:225, background:'#1e293b', color:'#e2e8f0', display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' },
  sideHeader: { padding:'20px 18px 14px', borderBottom:'1px solid #334155' },
  sideTitle:  { fontSize:16, fontWeight:700, color:'#f8fafc' },
  sideSub:    { fontSize:11, color:'#64748b', marginTop:2 },
  sideItem: (a) => ({
    display:'flex', alignItems:'center', gap:10, padding:'9px 18px',
    cursor:'pointer', fontSize:13,
    color: a ? '#93c5fd' : '#94a3b8',
    background: a ? 'rgba(59,130,246,0.15)' : 'transparent',
    borderLeft: `3px solid ${a ? '#3b82f6' : 'transparent'}`,
    transition:'all 0.12s',
  }),
  sideGroup: { padding:'16px 18px 5px', fontSize:10, fontWeight:700, color:'#475569', letterSpacing:1, textTransform:'uppercase' },
  main:  { flex:1, overflow:'auto', padding:'20px 24px' },
  card:  { background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:'16px 20px', marginBottom:14, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  btn:   (v) => ({ padding:'7px 14px', borderRadius:7, border: v?'none':'1px solid #e5e7eb', background: v?'#2563eb':'#fff', color: v?'#fff':'#374151', cursor:'pointer', fontSize:12, fontWeight:500, fontFamily:'inherit' }),
  select:{ padding:'7px 10px', borderRadius:7, border:'1px solid #e5e7eb', fontSize:13, background:'#fff', cursor:'pointer', fontFamily:'inherit' },
  input: { padding:'7px 10px', borderRadius:7, border:'1px solid #e5e7eb', fontSize:13, background:'#fff', fontFamily:'inherit', width:'100%', boxSizing:'border-box' },
  th:    { padding:'6px 8px', background:'#f8fafc', border:'1px solid #e5e7eb', fontWeight:600, fontSize:11, color:'#374151', whiteSpace:'nowrap', textAlign:'center' },
  td:    { padding:3, border:'1px solid #e5e7eb', verticalAlign:'top' },
  tdMin: { minWidth:80 },
  breakRow: { padding:'4px 0', border:'1px solid #e5e7eb', background:'#f8fafc', textAlign:'center', fontSize:10, color:'#9ca3af', letterSpacing:2 },
  cell: (sub, isZero) => ({
    background: isZero ? '#f8fafc' : `linear-gradient(135deg, ${getSubColor(sub)} 0%, rgba(255,255,255,0.5) 150%)`,
    borderLeft: `3px solid ${isZero ? '#94a3b8' : getSubBorder(sub)}`,
    borderRadius: 5, padding: '4px 6px', minHeight: 38,
    boxShadow: isZero ? 'none' : 'inset 1px 1px 2px rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.03)',
  }),
};

// ── Slot cell ─────────────────────────────────────────────────────────────────
function SlotCell({ slot }) {
  if (!slot || slot.sub === 'Free') {
    return <div style={{ padding:'4px 6px', color:'#d1d5db', fontSize:11, textAlign:'center' }}>—</div>;
  }
  if (slot.sub === 'IT/PE/Hindi') {
    return (
      <div className={slot.isZero ? "" : "cell-gradient"} style={{ ...S.cell(slot.sub, slot.isZero), padding: '2px 4px', display:'flex', flexDirection:'column', gap: 2 }}>
        <div style={{ fontSize:10, fontWeight:600, color:'#374151', lineHeight:1 }}>Hindi <span style={{fontWeight:400, color:'#6b7280', fontSize:9}}>(Mamta J)</span></div>
        <div style={{ fontSize:10, fontWeight:600, color:'#374151', lineHeight:1 }}>IT <span style={{fontWeight:400, color:'#6b7280', fontSize:9}}>(Varsha T)</span></div>
        <div style={{ fontSize:10, fontWeight:600, color:'#374151', lineHeight:1 }}>PE <span style={{fontWeight:400, color:'#6b7280', fontSize:9}}>(New PE)</span></div>
      </div>
    );
  }
  return (
    <div className={slot.isZero ? "" : "cell-gradient"} style={S.cell(slot.sub, slot.isZero)}>
      <div style={{ fontWeight:600, fontSize:11 }}>{subDisplayLabel(slot.cls || slot.sub)}</div>
      <div style={{ fontSize:10, color:'#6b7280', marginTop:1 }}>
        {slot.cls ? subDisplayLabel(slot.sub) : slot.teacher}
      </div>
      {slot.isZero && <div style={{ fontSize:9, color:'#94a3b8' }}>Zero</div>}
    </div>
  );
}

// ── Teacher slot cell (may have multiple parallel classes) ────────────────────
function TeacherSlotCell({ entries }) {
  // entries is array of {cls, sub, isZero}
  if (!entries || entries.length === 0) {
    return <div style={{ padding:'4px 6px', color:'#e5e7eb', fontSize:11, textAlign:'center' }}>—</div>;
  }
  if (entries.length === 1) {
    const e = entries[0];
    return (
      <div className={e.isZero ? "" : "cell-gradient"} style={S.cell(e.sub, e.isZero)}>
        <div style={{ fontWeight:600, fontSize:11 }}>{e.cls}</div>
        <div style={{ fontSize:10, color:'#6b7280' }}>{subDisplayLabel(e.sub)}</div>
        {e.isZero && <div style={{ fontSize:9, color:'#94a3b8' }}>Zero</div>}
      </div>
    );
  }
  // Multiple parallel classes (optional groups in 11/12)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      {entries.map((e, i) => (
        <div key={i} className={e.isZero ? "" : "cell-gradient"} style={{
          ...S.cell(e.sub, e.isZero),
          minHeight:'auto', padding:'3px 5px',
        }}>
          <div style={{ fontWeight:600, fontSize:10 }}>{e.cls}</div>
          <div style={{ fontSize:9, color:'#6b7280' }}>{subDisplayLabel(e.sub)}</div>
        </div>
      ))}
    </div>
  );
}

// ── Printable table ───────────────────────────────────────────────────────────
function PrintableTable({ title, rows, id }) {
  const ref = useRef();
  const hp  = useReactToPrint({ contentRef: ref, documentTitle: title });
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }} className="no-print">
        <button onClick={hp} style={{ ...S.btn(false), display:'flex', alignItems:'center', gap:6 }}>🖨️ Print / PDF</button>
      </div>
      <div ref={ref} style={{ overflowX:'auto' }}>
        <table id={id} style={{ borderCollapse:'collapse', fontSize:12, width:'100%', minWidth:560 }}>
          <thead>
            <tr>
              <th style={{ ...S.th, width:68 }}>Period</th>
              {DAYS.map(d => <th key={d} style={S.th}>{d}</th>)}
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Build rows for class timetable ────────────────────────────────────────────
function buildClassRows(timetable, cls) {
  return Array.from({ length: WD_PERIODS }).map((_, pi) => (
    <React.Fragment key={pi}>
      {pi === BREAK_WD && <tr><td colSpan={7} style={S.breakRow}>— BREAK —</td></tr>}
      <tr>
        <td style={{ ...S.td, background:'#f8fafc', fontWeight:600, fontSize:11, textAlign:'center', padding:'5px 6px', color:'#374151' }}>
          {pi === WD_PERIODS - 1 ? 'Zero' : `P${pi+1}`}
        </td>
        {DAYS.map(d => {
          const np = nPeriods(d);
          if (pi >= np) return <td key={d} style={{ ...S.td, background:'#f9fafb', textAlign:'center' }}><span style={{ color:'#e5e7eb' }}>—</span></td>;
          const slot = timetable[cls]?.[d]?.[pi];
          const isZero = isZeroPeriodSlot(d, pi);
          return <td key={d} style={{ ...S.td, ...S.tdMin }}><SlotCell slot={slot ? { ...slot, isZero } : null} /></td>;
        })}
      </tr>
    </React.Fragment>
  ));
}

// ── Build rows for teacher timetable (teacherTT = day -> [{cls,sub,isZero}][]) ─
function buildTeacherRows(teacherTT) {
  return Array.from({ length: WD_PERIODS }).map((_, pi) => (
    <React.Fragment key={pi}>
      {pi === BREAK_WD && <tr><td colSpan={7} style={S.breakRow}>— BREAK —</td></tr>}
      <tr>
        <td style={{ ...S.td, background:'#f8fafc', fontWeight:600, fontSize:11, textAlign:'center', padding:'5px 6px', color:'#374151' }}>
          {pi === WD_PERIODS - 1 ? 'Zero' : `P${pi+1}`}
        </td>
        {DAYS.map(d => {
          const np = nPeriods(d);
          if (pi >= np) return <td key={d} style={{ ...S.td, background:'#f9fafb', textAlign:'center' }}><span style={{ color:'#e5e7eb' }}>—</span></td>;
          const entries = teacherTT?.[d]?.[pi] || [];
          return <td key={d} style={{ ...S.td, ...S.tdMin }}><TeacherSlotCell entries={entries} /></td>;
        })}
      </tr>
    </React.Fragment>
  ));
}

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV = [
  { id:'dashboard',   label:'Dashboard',        icon:'⊞', group:'OVERVIEW'  },
  { id:'data',        label:'Manage Data',       icon:'✏️', group:'SETUP'     },
  { id:'classwise',   label:'Class Timetable',   icon:'📋', group:'TIMETABLE' },
  { id:'teacherwise', label:'Teacher Timetable', icon:'📅', group:null        },
  { id:'personal',    label:'Personal View',     icon:'🙋', group:null        },
  { id:'master',      label:'Teacher Master',    icon:'📊', group:null        },
  { id:'classmaster', label:'Classes Master',    icon:'🏫', group:null        },
  { id:'free',        label:'Free Teachers',     icon:'✅', group:null        },
  { id:'substitution',label:'Substitution',      icon:'🔄', group:'TOOLS'    },
];
const ADMIN_ONLY = ['dashboard','data','teacherwise','master','classmaster','free','substitution'];

// ── Main ──────────────────────────────────────────────────────────────────────
function AppInner() {
  const { role, teacherName, logout } = useAuth();
  const schoolData = useSchoolData();
  const { allTeacherNames, allClassNames, classTeachersMap, teacherSubjectsArray, getSubjectPeriods, getTeacherForSubject } = schoolData;

  const [section, setSection] = useState(role === 'teacher' ? 'personal' : 'dashboard');
  const [timetable, setTimetable] = useLocalStorage('dcpems_timetable', null);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);   // 0-100
  const [genCost, setGenCost]         = useState(null); // current best cost
  const [genPhase, setGenPhase]       = useState('');   // human-readable phase
  const [selectedClass, setSelectedClass] = useState(allClassNames[0] || '1A');
  const [selectedTeacher, setSelectedTeacher] = useState(role === 'teacher' ? teacherName : '');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTeacher, setSearchTeacher] = useState('');
  const [masterSearch, setMasterSearch] = useState('');
  const [classMasterSearch, setClassMasterSearch] = useState('');
  const masterRef = useRef();
  const classMasterRef = useRef();
  const handleMasterPrint = useReactToPrint({ contentRef: masterRef, documentTitle: 'Teacher Master Timetable' });
  const handleClassMasterPrint = useReactToPrint({ contentRef: classMasterRef, documentTitle: 'Classes Master Timetable' });

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setGenProgress(0);
    setGenCost(null);
    setGenPhase('Preparing data…');

    // Serialise functions → plain objects so they can cross the Worker boundary
    const subjectPeriodsMap   = {};
    const teacherForSubjectMap = {};
    allClassNames.forEach(cls => {
      subjectPeriodsMap[cls]    = getSubjectPeriods(cls);
      teacherForSubjectMap[cls] = {};
      const sp = subjectPeriodsMap[cls];
      Object.keys(sp).forEach(sub => {
        teacherForSubjectMap[cls][sub] = getTeacherForSubject(cls, sub);
      });
    });

    const worker = new Worker(
      new URL('./utils/timetableWorker.js', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e) => {
      const { type, percent, cost, iter, timetable, message } = e.data;

      if (type === 'progress') {
        setGenProgress(percent);
        setGenCost(cost);
        if (percent < 20)       setGenPhase('Phase 1 — Building initial timetable…');
        else if (percent < 60)  setGenPhase(`Phase 2 — Tabu Search, iteration ${iter}`);
        else if (percent < 90)  setGenPhase(`Phase 2 — Refining soft constraints… (iter ${iter})`);
        else                    setGenPhase('Finalising…');
      } else if (type === 'done') {
        setTimetable(timetable);
        setGenerating(false);
        setGenPhase('');
        setSection('classwise');
        worker.terminate();
      } else if (type === 'error') {
        console.error('Worker error:', message);
        setGenerating(false);
        setGenPhase('Error — check console');
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      console.error('Worker crashed:', err);
      setGenerating(false);
      setGenPhase('Worker error — see console');
      worker.terminate();
    };

    worker.postMessage({
      type: 'generate',
      payload: {
        allClassNames,
        classTeachersMap,
        subjectPeriodsMap,
        teacherForSubjectMap,
        allTeacherNames,
      },
    });
  }, [allClassNames, classTeachersMap, getSubjectPeriods, getTeacherForSubject, allTeacherNames, setTimetable]);

  const teacherTT = useMemo(() => {
    if (!timetable || !selectedTeacher) return null;
    return getTeacherTimetable(timetable, selectedTeacher, allClassNames);
  }, [timetable, selectedTeacher, allClassNames]);

  const displayTeachers = useMemo(() => allTeacherNames.filter(t => !t.includes(',')), [allTeacherNames]);

  const masterData = useMemo(() => {
    if (!timetable) return [];
    return buildMasterTimetable(timetable, displayTeachers, allClassNames);
  }, [timetable, displayTeachers, allClassNames]);

  const whatsappShare = () => {
    if (!teacherTT) return;
    let text = `*${selectedTeacher} – Weekly Timetable*\n`;
    DAYS.forEach(d => {
      text += `\n*${d}*\n`;
      const np = nPeriods(d);
      for (let p = 0; p < np; p++) {
        if (p === brk(d)) text += '--- BREAK ---\n';
        const entries = teacherTT[d][p];
        const label = entries?.length > 0
          ? entries.map(e => `${e.cls}(${subDisplayLabel(e.sub)})`).join(' | ')
          : 'Free';
        const pLabel = isZeroPeriodSlot(d, p) ? 'Zero' : `P${p+1}`;
        text += `${pLabel}: ${label}\n`;
      }
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const visibleNav = role === 'admin' ? NAV : NAV.filter(i => !ADMIN_ONLY.includes(i.id));

  return (
    <div style={S.app}>

      {/* ── GENERATION PROGRESS OVERLAY ── */}
      {generating && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(15,23,42,0.80)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:9999, backdropFilter:'blur(4px)',
        }}>
          <div style={{
            background:'#fff', borderRadius:18, padding:'40px 48px',
            maxWidth:440, width:'90%', textAlign:'center',
            boxShadow:'0 32px 80px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize:40, marginBottom:14 }}>⚙️</div>
            <div style={{ fontWeight:700, fontSize:19, color:'#1e293b', marginBottom:6 }}>
              Generating Timetable
            </div>
            <div style={{ fontSize:13, color:'#64748b', marginBottom:28, minHeight:22 }}>
              {genPhase || 'Starting…'}
            </div>
            {/* Progress bar */}
            <div style={{ background:'#f1f5f9', borderRadius:99, height:12, marginBottom:10, overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:99,
                background: genProgress < 15 ? '#f59e0b' : genProgress < 90 ? '#3b82f6' : '#22c55e',
                width:`${genProgress}%`,
                transition:'width 0.25s ease',
              }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#94a3b8', marginBottom:22 }}>
              <span>{genProgress}%</span>
              {genCost !== null && <span>Best cost: {genCost.toLocaleString()}</span>}
            </div>
            <div style={{ fontSize:11, color:'#cbd5e1', lineHeight:1.8 }}>
              Phase 1: Constraint-aware greedy initialisation
              <br/>Phase 2: Tabu Search — 2000 iterations with diversification
              <br/><span style={{ color:'#94a3b8' }}>Based on Hooshmand et al. (arXiv:1309.3285)</span>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div style={S.sidebar} className="no-print">
        <div style={S.sideHeader}>
          <div style={S.sideTitle}>🏫 DCPEMS</div>
          <div style={S.sideSub}>Timetable Manager</div>
        </div>
        <div style={{ flex:1, padding:'8px 0' }}>
          {(() => {
            let lastGroup = null;
            return visibleNav.map(item => {
              const showGroup = item.group && item.group !== lastGroup;
              lastGroup = item.group || lastGroup;
              return (
                <React.Fragment key={item.id}>
                  {showGroup && <div style={S.sideGroup}>{item.group}</div>}
                  <div style={S.sideItem(section === item.id)} onClick={() => setSection(item.id)}>
                    <span>{item.icon}</span><span>{item.label}</span>
                  </div>
                </React.Fragment>
              );
            });
          })()}
        </div>
        {role === 'admin' && (
          <div style={{ padding:'12px 14px', borderTop:'1px solid #334155' }}>
            <button onClick={handleGenerate} disabled={generating} style={{
              width:'100%', padding:'9px 0', borderRadius:8, border:'none',
              background: generating ? '#334155' : '#2563eb', color:'#fff',
              fontWeight:700, fontSize:13, cursor: generating ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
              {generating
                ? <><span className="spin">↻</span> {genProgress}% done…</>
                : '↻ Generate Timetable'
              }
            </button>
            {timetable && !generating && (
              <div style={{ fontSize:10, color:'#475569', textAlign:'center', marginTop:6 }}>
                Tabu Search · {allClassNames.length} classes
              </div>
            )}
          </div>
        )}
        <div style={{ padding:'10px 14px', borderTop:'1px solid #334155' }}>
          <div style={{ fontSize:11, color:'#64748b', marginBottom:5 }}>
            {role === 'admin' ? '👑 Admin' : `👤 ${teacherName}`}
          </div>
          <button onClick={logout} style={{ fontSize:11, color:'#64748b', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
            Sign out →
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={S.main}>

        {/* DASHBOARD */}
        {section === 'dashboard' && (
          <div className="fade-in">
            <div style={{ fontWeight:700, fontSize:22, marginBottom:4 }}>Dashboard</div>
            <div style={{ color:'#9ca3af', fontSize:13, marginBottom:20 }}>DCPEMS School Timetable Manager</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12, marginBottom:18 }}>
              {[
                { label:'Total Classes',  val:allClassNames.length,   bg:'#dbeafe', border:'#3b82f6' },
                { label:'Total Teachers', val:allTeacherNames.length, bg:'#dcfce7', border:'#22c55e' },
                { label:'Periods / Day',  val:'9 (Sat: 5)',           bg:'#fef3c7', border:'#f59e0b' },
                { label:'Working Days',   val:'Mon – Sat',            bg:'#ede9fe', border:'#8b5cf6' },
              ].map(c => (
                <div key={c.label} style={{ background:c.bg, borderRadius:10, padding:'14px 18px', border:`1px solid ${c.border}33` }}>
                  <div style={{ fontSize:11, color:'#6b7280', marginBottom:6 }}>{c.label}</div>
                  <div style={{ fontSize:22, fontWeight:700 }}>{c.val}</div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ fontWeight:600, marginBottom:10 }}>Quick Start</div>
              <div style={{ fontSize:13, color:'#6b7280', lineHeight:2 }}>
                1. Optionally edit teachers/subjects in <b>✏️ Manage Data</b><br/>
                2. Click <b>↻ Generate Timetable</b> in the sidebar<br/>
                3. Browse <b>Class Timetable</b> or <b>Teacher Timetable</b><br/>
                4. View <b>📊 Master Timetable</b> for full school overview<br/>
                5. Share via <b>Personal View</b> (WhatsApp / Print)<br/>
                6. Use <b>Substitution</b> to find cover for absent teachers
              </div>
            </div>
            {!timetable
              ? <div style={{ ...S.card, background:'#fffbeb', border:'1px solid #fcd34d' }}>
                  <div style={{ fontWeight:600, color:'#92400e' }}>No timetable generated yet</div>
                  <div style={{ fontSize:12, color:'#78350f', marginTop:4 }}>Click "↻ Generate Timetable" in the sidebar.</div>
                </div>
              : (() => {
                  const totalCost = genCost ?? 0;
                  // Quick per-constraint audit
                  const checks = [
                    { label:'No free slots in class timetable', ok: (() => { let f=0; allClassNames.forEach(cls => DAYS.forEach(d => { const np=nPeriods(d); for(let p=0;p<np;p++){ if(!isZeroPeriodSlot(d,p)){ const s=timetable[cls]?.[d]?.[p]; if(!s||s.sub==='Free')f++; }}})); return f===0; })() },
                    { label:'Core subjects in morning (best effort)', ok: (() => { let v=0; allClassNames.forEach(cls => DAYS.forEach(d => { const np=nPeriods(d); for(let p=0;p<np;p++){ const s=timetable[cls]?.[d]?.[p]; if(s && ['Maths','English','Science'].includes(s.sub) && p > breakAfter(d)) v++; }})); return v < 20; })() },
                    { label:'No double Computer in a day per class', ok: (() => { let v=0; allClassNames.forEach(cls => DAYS.forEach(d => { let c=0; const np=nPeriods(d); for(let p=0;p<np;p++){ const s=timetable[cls]?.[d]?.[p]; if(s?.sub==='Computer') c++; } if(c>1)v++; })); return v===0; })() },
                    { label:'No PE as first period', ok: (() => { let v=0; allClassNames.forEach(cls => DAYS.forEach(d => { const s=timetable[cls]?.[d]?.[0]; if(s?.sub==='PE') v++; })); return v===0; })() },
                    { label:'Activity after core for Std 7-10', ok: (() => { let v=0; allClassNames.filter(c=>isHigher(c)).forEach(cls => DAYS.forEach(d => { const np=nPeriods(d); for(let p=0;p<breakAfter(d);p++){ const s=timetable[cls]?.[d]?.[p]; if(s && ACTIVITY_SUBS.has(s.sub)) v++; }})); return v < 15; })() },
                  ];
                  const passing = checks.filter(c => c.ok).length;
                  return (
                    <div style={{ ...S.card, background:'#f0fdf4', border:'1px solid #86efac' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                        <div style={{ fontWeight:600, color:'#166534' }}>✓ Timetable active — Tabu Search complete</div>
                        <div style={{ fontSize:12, color:'#6b7280' }}>Quality checks: {passing}/{checks.length} passing</div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {checks.map((c,i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                            <span style={{ fontSize:14 }}>{c.ok ? '✅' : '⚠️'}</span>
                            <span style={{ color: c.ok ? '#166534' : '#92400e' }}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:12 }}>
                        Algorithm: Greedy + Tabu Search (2000 iterations, diversification enabled) · Saved in browser
                      </div>
                    </div>
                  );
                })()
            }
          </div>
        )}

        {/* DATA MANAGER */}
        {section === 'data' && (
          <div className="fade-in">
            <DataManager schoolData={schoolData} onDataChanged={() => setTimetable(null)} />
            {timetable === null && (
              <div style={{ ...S.card, background:'#fff7ed', border:'1px solid #fdba74', marginTop:4 }}>
                <div style={{ fontSize:13, color:'#9a3412' }}>
                  ⚠️ Data changed — timetable cleared. Click <b>↻ Generate Timetable</b> to rebuild.
                </div>
              </div>
            )}
          </div>
        )}

        {/* CLASS TIMETABLE */}
        {section === 'classwise' && (
          <div className="fade-in">
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
              <div style={{ fontWeight:700, fontSize:18 }}>Class Timetable</div>
              <select style={S.select} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                {allClassNames.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ display:'flex', gap:4 }}>
                <button style={S.btn(viewMode==='grid')} onClick={() => setViewMode('grid')}>Grid</button>
                <button style={S.btn(viewMode==='list')} onClick={() => setViewMode('list')}>List</button>
              </div>
            </div>
            {!timetable
              ? <div style={S.card}>Generate the timetable first using the sidebar button.</div>
              : viewMode === 'grid'
                ? <div style={S.card}><PrintableTable title={`Class ${selectedClass} Timetable`} rows={buildClassRows(timetable, selectedClass)} /></div>
                : <div className="fade-in">
                    {DAYS.map(d => (
                      <div key={d} style={S.card}>
                        <div style={{ fontWeight:600, marginBottom:10 }}>{d}</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                          {Array.from({ length: nPeriods(d) }).map((_, pi) => {
                            if (pi === brk(d)) return <div key="brk" style={{ width:'100%', fontSize:11, color:'#9ca3af', textAlign:'center', padding:'2px 0' }}>— BREAK —</div>;
                            const slot = timetable[selectedClass]?.[d]?.[pi];
                            const isZero = isZeroPeriodSlot(d, pi);
                            return (
                              <div key={pi} style={{ ...S.cell(slot?.sub||'Free', isZero), minWidth:96, padding:'6px 9px' }}>
                                <div style={{ fontSize:10, color:'#9ca3af' }}>{isZero ? 'Zero' : `P${pi+1}`}</div>
                                <div style={{ fontWeight:700, fontSize:12, marginTop:2 }}>{subDisplayLabel(slot?.sub)||'—'}</div>
                                <div style={{ fontSize:10, color:'#6b7280' }}>{slot?.teacher}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
            }
          </div>
        )}

        {/* TEACHER TIMETABLE */}
        {section === 'teacherwise' && (
          <div className="fade-in">
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
              <div style={{ fontWeight:700, fontSize:18 }}>Teacher Timetable</div>
              <select style={S.select} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
                <option value="">— Select Teacher —</option>
                {allTeacherNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {!timetable
              ? <div style={S.card}>Generate the timetable first.</div>
              : !selectedTeacher
                ? <div style={S.card}>Select a teacher to view their timetable.</div>
                : <div style={S.card}><PrintableTable title={`${selectedTeacher} — Weekly Timetable`} rows={buildTeacherRows(teacherTT)} /></div>
            }
          </div>
        )}

        {/* PERSONAL TIMETABLE */}
        {section === 'personal' && (
          <div className="fade-in">
            <div style={{ fontWeight:700, fontSize:18, marginBottom:14 }}>Personal Timetable</div>
            {role === 'admin' && (
              <div style={{ marginBottom:14 }}>
                <input style={{ ...S.input, maxWidth:240 }} placeholder="Search teacher…" value={searchTeacher} onChange={e => setSearchTeacher(e.target.value)} />
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:8 }}>
                  {displayTeachers.filter(n => n.toLowerCase().includes(searchTeacher.toLowerCase())).map(n => (
                    <button key={n} style={{ ...S.btn(selectedTeacher===n), fontSize:11, padding:'4px 10px' }} onClick={() => setSelectedTeacher(n)}>{n}</button>
                  ))}
                </div>
              </div>
            )}
            {!selectedTeacher
              ? <div style={S.card}>Select a teacher above to view their schedule.</div>
              : !timetable
                ? <div style={S.card}>Generate the timetable first.</div>
                : <div style={S.card}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
                      <div>
                        <span style={{ fontWeight:700, fontSize:16 }}>{selectedTeacher}</span>
                        {classTeachersMap && Object.entries(classTeachersMap).find(([,v]) => v===selectedTeacher)?.[0] && (
                          <span style={{ fontSize:11, color:'#3b82f6', marginLeft:8 }}>
                            Class Teacher: {Object.entries(classTeachersMap).find(([,v]) => v===selectedTeacher)[0]}
                          </span>
                        )}
                      </div>
                      <button onClick={whatsappShare} style={{ ...S.btn(false), background:'#f0fdf4', color:'#166534', border:'1px solid #86efac', display:'flex', alignItems:'center', gap:6 }}>
                        📲 Share on WhatsApp
                      </button>
                    </div>
                    <PrintableTable title={`${selectedTeacher} — Personal Timetable`} rows={buildTeacherRows(teacherTT)} />
                    {/* Weekly summary */}
                    <div style={{ marginTop:14, padding:'10px 14px', background:'#f8fafc', borderRadius:8, border:'1px solid #e5e7eb' }}>
                      <div style={{ fontWeight:600, fontSize:12, marginBottom:8 }}>Weekly Summary</div>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        {DAYS.map(d => {
                          const count = (teacherTT?.[d] || []).filter(e => e && e.length > 0).length;
                          return (
                            <div key={d} style={{ textAlign:'center', padding:'6px 12px', borderRadius:7, background: count===0?'#fef2f2':'#f0fdf4', border:`1px solid ${count===0?'#fecaca':'#86efac'}` }}>
                              <div style={{ fontSize:11, fontWeight:600 }}>{d}</div>
                              <div style={{ fontSize:16, fontWeight:700, color: count===0?'#ef4444':'#166534' }}>{count}</div>
                            </div>
                          );
                        })}
                        <div style={{ textAlign:'center', padding:'6px 12px', borderRadius:7, background:'#dbeafe', border:'1px solid #93c5fd' }}>
                          <div style={{ fontSize:11, fontWeight:600 }}>Total</div>
                          <div style={{ fontSize:16, fontWeight:700, color:'#1d4ed8' }}>
                            {DAYS.reduce((acc, d) => acc + (teacherTT?.[d]||[]).filter(e=>e&&e.length>0).length, 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
            }
          </div>
        )}

        {/* MASTER TIMETABLE */}
        {section === 'master' && (
          <div className="fade-in">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:18 }}>Master Timetable</div>
                <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>All teachers × all periods with total count</div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input style={{ ...S.input, maxWidth:200 }} placeholder="Search teacher…" value={masterSearch} onChange={e => setMasterSearch(e.target.value)} />
                {timetable && <button onClick={() => exportTeacherMasterToExcel(masterData)} style={{ ...S.btn(false), display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>📥 Download Excel</button>}
                {timetable && <button onClick={handleMasterPrint} style={{ ...S.btn(false), display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>🖨️ Print / PDF</button>}
              </div>
            </div>

            {!timetable
              ? <div style={S.card}>Generate the timetable first.</div>
              : <div style={{ overflowX:'auto' }} ref={masterRef}>
                  <table style={{ borderCollapse:'collapse', fontSize:11, minWidth:900 }}>
                    <thead>
                      <tr>
                        <th style={{ ...S.th, width:130, textAlign:'left', padding:'6px 10px' }}>Teacher</th>
                        {DAYS.map(d => {
                          const np = nPeriods(d);
                          return Array.from({ length:np }).map((_, pi) => {
                            const isZero = isZeroPeriodSlot(d, pi);
                            const isBreakAfter = pi === brk(d);
                            return (
                              <th key={`${d}-${pi}`} style={{
                                ...S.th, minWidth:48, padding:'4px 5px',
                                borderLeft: pi===0 ? '2px solid #cbd5e1' : undefined,
                                borderRight: isBreakAfter ? '2px dashed #cbd5e1' : undefined,
                                background: isZero ? '#f1f5f9' : '#f8fafc',
                                fontSize:10,
                              }}>
                                {isZero ? 'Z' : `P${pi+1}`}
                                <div style={{ fontSize:9, color:'#94a3b8', fontWeight:400 }}>{d}</div>
                              </th>
                            );
                          });
                        })}
                        <th style={{ ...S.th, width:64, background:'#dbeafe', color:'#1d4ed8', borderLeft:'2px solid #93c5fd' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterData
                        .filter(row => row.name.toLowerCase().includes(masterSearch.toLowerCase()))
                        .map((row, ri) => (
                          <tr key={row.name} style={{ background: ri%2===0 ? '#fff' : '#f9fafb' }}>
                            <td style={{ ...S.td, padding:'5px 10px', fontWeight:600, fontSize:12, whiteSpace:'nowrap', position:'sticky', left:0, background: ri%2===0?'#fff':'#f9fafb', zIndex:1 }}>
                              {row.name}
                            </td>
                            {DAYS.map(d => {
                              const np = nPeriods(d);
                              return Array.from({ length:np }).map((_, pi) => {
                                const slot = row.days[d][pi];
                                const isZero = isZeroPeriodSlot(d, pi);
                                const isBreakAfter = pi === brk(d);
                                return (
                                  <td key={`${d}-${pi}`} style={{
                                    ...S.td, minWidth:48,
                                    borderLeft: pi===0 ? '2px solid #e2e8f0' : undefined,
                                    borderRight: isBreakAfter ? '2px dashed #e2e8f0' : undefined,
                                    background: isZero ? '#f8fafc' : undefined,
                                  }}>
                                    {slot
                                      ? <div className="cell-gradient" style={{
                                          background: `linear-gradient(135deg, ${getSubColor(slot.sub)} 0%, rgba(255,255,255,0.6) 130%)`,
                                          borderLeft:`2px solid ${getSubBorder(slot.sub)}`,
                                          borderRadius:5, padding:'2px 4px',
                                          boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.03)'
                                        }}>
                                          <div style={{ fontWeight:600, fontSize:10, lineHeight:1.2 }}>{slot.cls}</div>
                                          <div style={{ fontSize:9, color:'#6b7280' }}>{subDisplayLabel(slot.sub)}</div>
                                        </div>
                                      : <div style={{ textAlign:'center', color:'#e5e7eb', fontSize:10 }}>—</div>
                                    }
                                  </td>
                                );
                              });
                            })}
                            <td style={{ ...S.td, textAlign:'center', fontWeight:700, fontSize:13, color:'#1d4ed8', background:'#eff6ff', borderLeft:'2px solid #93c5fd' }}>
                              {row.total}
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )}

        {/* CLASSES MASTER TIMETABLE */}
        {section === 'classmaster' && (
          <div className="fade-in">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:18 }}>Classes Master Timetable</div>
                <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>All classes × all periods overview</div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input style={{ ...S.input, maxWidth:200 }} placeholder="Search class…" value={classMasterSearch} onChange={e => setClassMasterSearch(e.target.value)} />
                {timetable && <button onClick={() => exportClassMasterToExcel(timetable, allClassNames)} style={{ ...S.btn(false), display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>📥 Download Excel</button>}
                {timetable && <button onClick={handleClassMasterPrint} style={{ ...S.btn(false), display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>🖨️ Print / PDF</button>}
              </div>
            </div>

            {!timetable
              ? <div style={S.card}>Generate the timetable first.</div>
              : <div style={{ overflowX:'auto' }} ref={classMasterRef}>
                  <table style={{ borderCollapse:'collapse', fontSize:11, minWidth:900 }}>
                    <thead>
                      <tr>
                        <th style={{ ...S.th, width:130, textAlign:'left', padding:'6px 10px' }}>Class / Section</th>
                        {DAYS.map(d => {
                          const np = nPeriods(d);
                          return Array.from({ length:np }).map((_, pi) => {
                            const isZero = isZeroPeriodSlot(d, pi);
                            const isBreakAfter = pi === brk(d);
                            return (
                              <th key={`${d}-${pi}`} style={{
                                ...S.th, minWidth:48, padding:'4px 5px',
                                borderLeft: pi===0 ? '2px solid #cbd5e1' : undefined,
                                borderRight: isBreakAfter ? '2px dashed #cbd5e1' : undefined,
                                background: isZero ? '#f1f5f9' : '#f8fafc',
                                fontSize:10,
                              }}>
                                {isZero ? 'Z' : `P${pi+1}`}
                                <div style={{ fontSize:9, color:'#94a3b8', fontWeight:400 }}>{d}</div>
                              </th>
                            );
                          });
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {allClassNames
                        .filter(c => c.toLowerCase().includes(classMasterSearch.toLowerCase()))
                        .map((cls, ri) => (
                          <tr key={cls} style={{ background: ri%2===0 ? '#fff' : '#f9fafb' }}>
                            <td style={{ ...S.td, padding:'5px 10px', fontWeight:600, fontSize:12, whiteSpace:'nowrap', position:'sticky', left:0, background: ri%2===0?'#fff':'#f9fafb', zIndex:1 }}>
                              <div style={{ display:'inline-block', padding:'3px 8px', borderRadius:5, background:`linear-gradient(135deg, ${getClassColor(cls).bg} 0%, rgba(255,255,255,0.6) 130%)`, border:`1px solid ${getClassColor(cls).border}`, color:getClassColor(cls).text, boxShadow:'inset 1px 1px 2px rgba(255,255,255,0.7)' }}>
                                {cls}
                              </div>
                            </td>
                            {DAYS.map(d => {
                              const np = nPeriods(d);
                              return Array.from({ length:np }).map((_, pi) => {
                                const slot = timetable[cls]?.[d]?.[pi];
                                const isZero = isZeroPeriodSlot(d, pi);
                                const isBreakAfter = pi === brk(d);
                                return (
                                  <td key={`${d}-${pi}`} style={{
                                    ...S.td, minWidth:48,
                                    borderLeft: pi===0 ? '2px solid #e2e8f0' : undefined,
                                    borderRight: isBreakAfter ? '2px dashed #e2e8f0' : undefined,
                                    background: isZero ? '#f8fafc' : undefined,
                                  }}>
                                    {slot && slot.sub !== 'Free'
                                      ? slot.sub === 'IT/PE/Hindi'
                                        ? <div className="cell-gradient" style={{
                                            background: `linear-gradient(135deg, ${getSubColor(slot.sub)} 0%, rgba(255,255,255,0.6) 130%)`,
                                            borderLeft:`2px solid ${getSubBorder(slot.sub)}`,
                                            borderRadius:5, padding:'2px 4px',
                                            boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.03)',
                                            display:'flex', flexDirection:'column', gap:1
                                          }}>
                                            <div style={{ fontSize:9, fontWeight:600, color:'#374151', lineHeight:1 }}>Hindi <span style={{fontWeight:400, color:'#6b7280', fontSize:8}}>(Mamta J)</span></div>
                                            <div style={{ fontSize:9, fontWeight:600, color:'#374151', lineHeight:1 }}>IT <span style={{fontWeight:400, color:'#6b7280', fontSize:8}}>(Varsha T)</span></div>
                                            <div style={{ fontSize:9, fontWeight:600, color:'#374151', lineHeight:1 }}>PE <span style={{fontWeight:400, color:'#6b7280', fontSize:8}}>(New PE)</span></div>
                                          </div>
                                        : <div className="cell-gradient" style={{
                                            background: `linear-gradient(135deg, ${getSubColor(slot.sub)} 0%, rgba(255,255,255,0.6) 130%)`,
                                            borderLeft:`2px solid ${getSubBorder(slot.sub)}`,
                                            borderRadius:5, padding:'2px 4px',
                                            boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.03)'
                                          }}>
                                            <div style={{ fontWeight:600, fontSize:10, lineHeight:1.2 }}>{subDisplayLabel(slot.sub)}</div>
                                            <div style={{ fontSize:9, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:80 }} title={slot.teacher}>{slot.teacher}</div>
                                          </div>
                                      : <div style={{ textAlign:'center', color:'#e5e7eb', fontSize:10 }}>—</div>
                                    }
                                  </td>
                                );
                              });
                            })}
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )}

        {/* FREE TEACHERS */}
        {section === 'free' && (
          <div className="fade-in">
            <div style={{ fontWeight:700, fontSize:18, marginBottom:14 }}>Free Teachers per Period</div>
            {!timetable
              ? <div style={S.card}>Generate timetable first.</div>
              : <div style={{ overflowX:'auto' }}>
                  <table style={{ borderCollapse:'collapse', fontSize:12, width:'100%' }}>
                    <thead>
                      <tr>
                        <th style={{ ...S.th, width:72 }}>Period</th>
                        {DAYS.map(d => <th key={d} style={S.th}>{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length:WD_PERIODS }).map((_, pi) => (
                        <React.Fragment key={pi}>
                          {pi===BREAK_WD && <tr><td colSpan={7} style={S.breakRow}>— BREAK —</td></tr>}
                          <tr>
                            <td style={{ ...S.td, background:'#f8fafc', fontWeight:600, textAlign:'center', fontSize:11 }}>
                              {pi===WD_PERIODS-1 ? 'Zero' : `P${pi+1}`}
                            </td>
                            {DAYS.map(d => {
                              const np = nPeriods(d);
                              if (pi>=np) return <td key={d} style={{ ...S.td, background:'#f9fafb', textAlign:'center' }}><span style={{ color:'#e5e7eb' }}>—</span></td>;
                              const free = getFreeTeachersAtSlot(timetable, displayTeachers, [], allClassNames, d, pi);
                              return (
                                <td key={d} style={{ ...S.td, verticalAlign:'top' }}>
                                  <div style={{ display:'flex', flexWrap:'wrap', gap:3, padding:3 }}>
                                    {free.length===0
                                      ? <span style={{ fontSize:10, color:'#d1d5db' }}>None</span>
                                      : free.map(t => (
                                          <span key={t} style={{ fontSize:10, padding:'2px 6px', borderRadius:8, background:'#f0fdf4', color:'#166534', border:'1px solid #86efac', whiteSpace:'nowrap' }}>{t}</span>
                                        ))
                                    }
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )}

        {/* SUBSTITUTION */}
        {section === 'substitution' && (
          <div className="fade-in">
            <SubstitutionPanel timetable={timetable} allTeacherNames={displayTeachers} teacherSubjectsArray={teacherSubjectsArray} allClassNames={allClassNames} />
          </div>
        )}

      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppWithAuth /></AuthProvider>;
}
function AppWithAuth() {
  const { role } = useAuth();
  if (!role) return <LoginScreen />;
  return <AppInner />;
}
