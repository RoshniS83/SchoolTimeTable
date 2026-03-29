import React, { createContext, useContext, useState } from 'react';

// Roles: 'admin' (full access) | 'teacher' (personal view only) | null (logged out)
// Admin PIN: 1234 (change in production!)
const ADMIN_PIN = '1234';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => {
    try { return sessionStorage.getItem('dcpems_role') || null; } catch { return null; }
  });
  const [teacherName, setTeacherName] = useState(() => {
    try { return sessionStorage.getItem('dcpems_teacher') || ''; } catch { return ''; }
  });

  const loginAdmin = (pin) => {
    if (pin === ADMIN_PIN) {
      setRole('admin');
      sessionStorage.setItem('dcpems_role', 'admin');
      return true;
    }
    return false;
  };

  const loginTeacher = (name) => {
    setRole('teacher');
    setTeacherName(name);
    sessionStorage.setItem('dcpems_role', 'teacher');
    sessionStorage.setItem('dcpems_teacher', name);
  };

  const logout = () => {
    setRole(null);
    setTeacherName('');
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ role, teacherName, loginAdmin, loginTeacher, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
