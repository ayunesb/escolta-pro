import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'client' | 'freelancer' | 'company_admin' | 'super_admin';

export type { UserRole };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRoles: UserRole[];
  activeRole: UserRole | null;
  setRole: (role: UserRole) => void;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string, role?: UserRole) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
    const [activeRole, setActiveRole] = useState<UserRole | null>(null);

  const fetchUserRoles = async (userId: string) => {
    try {
  const { data, error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }
      
      return data?.map(r => r.role as UserRole) || [];
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const init = async () => {
      try {
        // getSession shim compatibility
        const sessionRes = await (supabase as any).auth.getSession?.(); // eslint-disable-line @typescript-eslint/no-explicit-any
        const currentSession = sessionRes?.data?.session ?? null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          const roles = await fetchUserRoles(currentSession.user.id);
          setUserRoles(roles);
          setActiveRole(roles[0] ?? null);
        }
      } catch (e) {
        // silent in demo
      } finally {
        setLoading(false);
      }

      try {
        const sub = (supabase as any).auth.onAuthStateChange?.((_evt: string, session: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          setSession(session ?? null);
          setUser(session?.user ?? null);
        });
        unsub = () => sub?.data?.subscription?.unsubscribe?.();
      } catch {}
    };
    init();
    return () => { unsub?.(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await (supabase as any).auth.signInWithPassword({ // eslint-disable-line @typescript-eslint/no-explicit-any
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, role?: UserRole) => {
    const redirectUrl = `${window.location.origin}/`;
    
  const { error } = await (supabase as any).auth.signUp({ // eslint-disable-line @typescript-eslint/no-explicit-any
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName || '',
          last_name: lastName || '',
          role: role || 'client'
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await (supabase as any).auth.signOut(); // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  const hasRole = (role: UserRole): boolean => {
    return userRoles.includes(role);
  };

  const setRole = (role: UserRole) => {
    if (userRoles.includes(role)) {
      setActiveRole(role);
    }
  };

  const value = {
    user,
    session,
    userRoles,
    activeRole,
    setRole: setRole,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};