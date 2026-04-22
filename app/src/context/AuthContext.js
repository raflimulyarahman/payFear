'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth as authApi, setToken, getToken, clearToken } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = getToken();
    if (savedToken) {
      authApi.me()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          // Token expired or invalid
          clearToken();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: userData, token } = await authApi.login(email, password);
    setUser(userData);
    return userData;
  }, []);

  const signup = useCallback(async (data) => {
    const input = {
      name: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : data.name,
      email: data.email,
      password: data.password,
      role: (data.role || 'requester').toUpperCase(),
    };
    const { user: userData, token } = await authApi.register(input);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const switchRole = useCallback(() => {
    if (!user) return;
    const newRole = user.role === 'REQUESTER' ? 'EXECUTOR' : 'REQUESTER';
    setUser({ ...user, role: newRole });
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.me();
      setUser(userData);
      return userData;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signup, 
      logout, 
      switchRole, 
      refreshUser,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
