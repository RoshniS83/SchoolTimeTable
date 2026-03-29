import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { getAllTeacherNames } from '../data/schoolData.js';

function getTeacherNames() {
  try {
    const stored = localStorage.getItem('dcpems_teachers');
    if (stored) {
      const t = JSON.parse(stored);
      return Object.keys(t).sort();
    }
  } catch { }
  return getAllTeacherNames();
}

export default function LoginScreen() {
  const { loginAdmin, loginTeacher } = useAuth();
  const [mode, setMode] = useState('choose');
  const [pin, setPin] = useState('');
  const [teacher, setTeacher] = useState('');
  const [error, setError] = useState('');
  const teachers = useMemo(() => getTeacherNames(), []);

  const handleAdmin = (e) => {
    e.preventDefault();
    if (!loginAdmin(pin)) setError('Incorrect PIN. Please try again.');
  };

  const handleTeacher = (e) => {
    e.preventDefault();
    if (!teacher) { setError('Please select your name.'); return; }
    loginTeacher(teacher);
  };

  const card = {
    background: '#fff', borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
    padding: '36px 40px', width: '100%', maxWidth: 400,
  };
  const btn = (primary) => ({
    padding: '10px 20px', borderRadius: 8, border: 'none',
    background: primary ? '#2563eb' : '#f1f5f9',
    color: primary ? '#fff' : '#374151',
    fontWeight: 600, fontSize: 14, cursor: 'pointer',
    width: '100%', marginTop: 8, fontFamily: 'inherit',
  });
  const input = {
    padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb',
    fontSize: 14, width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit', marginTop: 4,
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
      padding: 20,
    }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏫</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#1e293b' }}>DCPEMS</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>School Timetable Manager</div>
      </div>

      <div style={card}>
        {mode === 'choose' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, textAlign: 'center' }}>Sign in as</div>
            <button style={btn(true)} onClick={() => setMode('admin')}>👑 Administrator</button>
            <button style={btn(false)} onClick={() => setMode('teacher')}>👤 Teacher</button>
          </div>
        )}

        {mode === 'admin' && (
          <form onSubmit={handleAdmin}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Admin Login</div>
            <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Admin PIN</label>
            <input style={input} type="password" placeholder="Enter PIN"
              value={pin} onChange={e => { setPin(e.target.value); setError(''); }} autoFocus />
            {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}
            <button type="submit" style={{ ...btn(true), marginTop: 16 }}>Login</button>
            <button type="button" style={btn(false)} onClick={() => { setMode('choose'); setError(''); setPin(''); }}>← Back</button>
          </form>
        )}

        {mode === 'teacher' && (
          <form onSubmit={handleTeacher}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Teacher Login</div>
            <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Select your name</label>
            <select style={{ ...input, background: '#fff', cursor: 'pointer' }}
              value={teacher} onChange={e => { setTeacher(e.target.value); setError(''); }}>
              <option value="">— Select —</option>
              {teachers.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}
            <button type="submit" style={{ ...btn(true), marginTop: 16 }}>View My Timetable</button>
            <button type="button" style={btn(false)} onClick={() => { setMode('choose'); setError(''); }}>← Back</button>
          </form>
        )}
      </div>

      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 20 }}>
        Admin PIN: 1234 &nbsp;·&nbsp; Change in <code>src/hooks/useAuth.jsx</code>
      </div>
    </div>
  );
}
