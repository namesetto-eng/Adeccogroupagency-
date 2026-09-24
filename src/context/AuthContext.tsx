import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  register: (token: string, user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeUserRole = (u: User | null): User | null => {
    if (!u) return null;
    const isOwnerOrAdmin =
      u.email?.toLowerCase().trim() === 'bettkiplagatmicah@gmail.com' ||
      u.email?.toLowerCase().includes('admin') ||
      u.role === 'admin';
    return {
      ...u,
      role: isOwnerOrAdmin ? ('admin' as const) : u.role,
    };
  };

  useEffect(() => {
    async function loadInitialUser() {
      const token = localStorage.getItem('adecco_token');
      if (token) {
        try {
          const currentUser = await api.getMe();
          setUser(normalizeUserRole(currentUser));
        } catch (err) {
          console.warn('Token invalid, logging out', err);
          localStorage.removeItem('adecco_token');
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadInitialUser();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('adecco_token', token);
    setUser(normalizeUserRole(userData));
  };

  const register = (token: string, userData: User) => {
    localStorage.setItem('adecco_token', token);
    setUser(normalizeUserRole(userData));
  };

  const logout = () => {
    localStorage.removeItem('adecco_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await api.getMe();
      setUser(normalizeUserRole(currentUser));
    } catch (err) {
      console.warn('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
