import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import * as StaticConstants from '../constants';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'employee' | 'client';
  client_id?: number;
}

interface AppConfig {
  INSTITUTIONAL_CONTACTS: typeof StaticConstants.INSTITUTIONAL_CONTACTS;
  ENTERPRISE_LINKS: typeof StaticConstants.ENTERPRISE_LINKS;
  BRAND_CONFIG: typeof StaticConstants.BRAND_CONFIG;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
  config: AppConfig;
  refreshConfig: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<AppConfig>({
    INSTITUTIONAL_CONTACTS: StaticConstants.INSTITUTIONAL_CONTACTS,
    ENTERPRISE_LINKS: StaticConstants.ENTERPRISE_LINKS,
    BRAND_CONFIG: StaticConstants.BRAND_CONFIG,
  });

  const refreshConfig = async () => {
    try {
      const settings = await apiFetch('/settings');
      setConfig(prev => ({
        INSTITUTIONAL_CONTACTS: { ...prev.INSTITUTIONAL_CONTACTS, ...(settings.INSTITUTIONAL_CONTACTS || {}) },
        ENTERPRISE_LINKS: { ...prev.ENTERPRISE_LINKS, ...(settings.ENTERPRISE_LINKS || {}) },
        BRAND_CONFIG: { ...prev.BRAND_CONFIG, ...(settings.BRAND_CONFIG || {}) },
      }));
    } catch (err) {
      console.error('Failed to fetch dynamic settings:', err);
    }
  };

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      // Fetch config regardless of auth status to show logo/branding on login page
      await refreshConfig();

      if (token && storedUser) {
        try {
          const verifiedUser = await apiFetch('/auth/me');
          setUser(verifiedUser);
        } catch (err) {
          console.error('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, config, refreshConfig }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
