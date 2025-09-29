/* @refresh reset */
import * as React from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { demoAuth, seedDemoData } from '@/demo/shims';

type Role = 'client' | 'company' | 'guard';
type AuthUser = { id: string; role: Role } | null;

type AuthCtx = {
  user: AuthUser;
  signInAs: (role: Role) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (r: string) => boolean; // added helper
};

export const AuthContext = createContext<AuthCtx | undefined>(undefined);

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

function getDemoRole(): Role {
  if (typeof window === 'undefined') return 'client';
  const url = new URL(window.location.href);
  const qp = url.searchParams.get('as');
  const stored = localStorage.getItem('demo.role');
  const candidate = (qp || stored) as Role | null;
  if (candidate === 'client' || candidate === 'company' || candidate === 'guard') {
    try { localStorage.setItem('demo.role', candidate); } catch {}
    return candidate;
  }
  return 'client';
}

async function fetchUserRoles(userId: string): Promise<string[]> {
  if (DEMO) {
    try {
      const { role } = demoAuth();
      return [role];
    } catch {
      return ['client'];
    }
  }
  const { data } = await (supabase as any).from('user_roles').select('*').eq('user_id', userId); // eslint-disable-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => r.role); // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);

  useEffect(() => {
    let sub: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    (async () => {
      if (DEMO) {
        // Seed & synthetic session
        try { seedDemoData(); } catch {}
        const role = getDemoRole();
        const roleUserMap: Record<Role, string> = {
          client: 'u_client_1',
          company: 'u_company_1',
          guard: 'u_guard_1'
        };
        setUser({ id: roleUserMap[role], role });
        return; // skip real supabase wiring in demo
      }
      const { data } = await (supabase as any).auth.getSession(); // eslint-disable-line @typescript-eslint/no-explicit-any
      const sessionUser = (data as any)?.session?.user ?? null; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (sessionUser) {
        const roles = await fetchUserRoles(sessionUser.id);
        sessionUser.role = roles[0] || 'client';
      }
      setUser(sessionUser);
      const res = await (supabase as any).auth.onAuthStateChange?.((_evt: any, session: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (DEMO) return; // demo handled by full page reload on role change
        const u = session?.user ?? null;
        if (u) {
          fetchUserRoles(u.id).then(rs => {
            u.role = rs[0] || 'client';
            setUser({ ...u });
          });
        } else {
          setUser(null);
        }
      });
      sub = res?.data?.subscription;
    })();
    return () => sub?.unsubscribe?.();
  }, []);

  const signInAs = async (role: Role) => {
    localStorage.setItem('demo.role', role);
    const url = new URL(window.location.href);
    url.searchParams.set('as', role);
    // Redirect to correct entrypoint html to load appropriate shell quickly
    if (DEMO) {
      if (role === 'company') url.pathname = '/admin.html';
      else if (role === 'client') url.pathname = '/client.html';
      else if (role === 'guard') url.pathname = '/guard.html';
    }
    window.location.href = url.toString();
  };

  const signOut = async () => {
  await (supabase as any).auth.signOut?.(); // eslint-disable-line @typescript-eslint/no-explicit-any
    localStorage.removeItem('demo.role');
    if (DEMO) {
      window.location.href = '/?as=client';
    } else {
      window.location.reload();
    }
  };

  const value = useMemo(() => ({ 
    user, 
    signInAs, 
    signOut,
    hasRole: (r: string) => {
      if (!user) return false;
      // map legacy roles expected by UI to demo roles
      const roleMap: Record<string, Role> = {
        client: 'client',
        company_admin: 'company',
        freelancer: 'guard',
        super_admin: 'company' // treat super admin as company in demo
      };
      const target = roleMap[r] || (r as Role);
      return user.role === target;
    }
  }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}