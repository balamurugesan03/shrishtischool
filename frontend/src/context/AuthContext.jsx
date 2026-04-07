import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('school_user')); } catch { return null; }
  });

  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('school_token', res.token);
    localStorage.setItem('school_user', JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('school_token');
    localStorage.removeItem('school_user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isAdmin, isStaff, role: user?.role }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
