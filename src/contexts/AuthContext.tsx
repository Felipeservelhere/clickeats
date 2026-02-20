import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppUser {
  id: string;
  username: string;
  display_name: string;
  is_primary: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  login: (username: string, password: string) => Promise<string | null>;
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
      localStorage.setItem('app-user', JSON.stringify(appUser));
      return null;
    } catch {
      return 'Erro inesperado. Tente novamente.';
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('app-user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
