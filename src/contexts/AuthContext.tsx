import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppUser {
  id: string;
  username: string;
  display_name: string;
  is_primary: boolean;
  company_id?: string;
}

interface AdminUser {
  id: string;
  username: string;
  display_name: string;
}

interface CompanyInfo {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  adminUser: AdminUser | null;
  company: CompanyInfo | null;
  role: 'admin' | 'user' | null;
  login: (username: string, password: string) => Promise<string | null>;
  loginAdmin: (username: string, password: string) => Promise<string | null>;
  loginUnified: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('app-user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('admin-user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [company, setCompany] = useState<CompanyInfo | null>(() => {
    try {
      const saved = localStorage.getItem('app-company');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState<'admin' | 'user' | null>(() => {
    if (localStorage.getItem('admin-user')) return 'admin';
    if (localStorage.getItem('app-user')) return 'user';
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_username: username,
        p_password: password,
      });

      if (error) return 'Erro ao conectar. Tente novamente.';

      const result = data as any;
      if (!result.success) return result.message;

      const appUser: AppUser = result.user;
      setUser(appUser);
      setAdminUser(null);
      setRole('user');
      localStorage.setItem('app-user', JSON.stringify(appUser));
      localStorage.removeItem('admin-user');

      if (result.company) {
        setCompany(result.company);
        localStorage.setItem('app-company', JSON.stringify(result.company));
      }

      return null;
    } catch {
      return 'Erro inesperado. Tente novamente.';
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAdmin = useCallback(async (username: string, password: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('authenticate_admin', {
        p_username: username,
        p_password: password,
      });

      if (error) return 'Erro ao conectar. Tente novamente.';

      const result = data as any;
      if (!result.success) return result.message;

      const admin: AdminUser = result.user;
      setAdminUser(admin);
      setUser(null);
      setCompany(null);
      setRole('admin');
      localStorage.setItem('admin-user', JSON.stringify(admin));
      localStorage.removeItem('app-user');
      localStorage.removeItem('app-company');

      return null;
    } catch {
      return 'Erro inesperado. Tente novamente.';
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginUnified = useCallback(async (username: string, password: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('authenticate_any', {
        p_username: username,
        p_password: password,
      });

      if (error) {
        console.error('authenticate_any error:', error);
        return 'Erro ao conectar. Tente novamente.';
      }

      const result = data as any;
      if (!result.success) return result.message;

      if (result.role === 'admin') {
        const admin: AdminUser = result.user;
        setAdminUser(admin);
        setUser(null);
        setCompany(null);
        setRole('admin');
        localStorage.setItem('admin-user', JSON.stringify(admin));
        localStorage.removeItem('app-user');
        localStorage.removeItem('app-company');
      } else {
        const appUser: AppUser = result.user;
        setUser(appUser);
        setAdminUser(null);
        setRole('user');
        localStorage.setItem('app-user', JSON.stringify(appUser));
        localStorage.removeItem('admin-user');

        if (result.company) {
          setCompany(result.company);
          localStorage.setItem('app-company', JSON.stringify(result.company));
        }
      }

      return null;
    } catch (err) {
      console.error('loginUnified error:', err);
      return 'Erro inesperado. Tente novamente.';
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAdminUser(null);
    setCompany(null);
    setRole(null);
    localStorage.removeItem('app-user');
    localStorage.removeItem('admin-user');
    localStorage.removeItem('app-company');
  }, []);

  return (
    <AuthContext.Provider value={{ user, adminUser, company, role, login, loginAdmin, loginUnified, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
