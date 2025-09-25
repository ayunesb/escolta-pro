import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { demoDb } from '@/demo/shims';

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

type DemoRole = 'client' | 'company' | 'guard';
const getDemoRole = (): DemoRole => {
  if (typeof window === 'undefined') return 'client';
  const url = new URL(window.location.href);
  const qp = url.searchParams.get('as');
  const stored = localStorage.getItem('demo.role');
  const role = (qp || stored) as DemoRole;
  if (role === 'client' || role === 'company' || role === 'guard') {
    try { localStorage.setItem('demo.role', role); } catch {}
    return role;
  }
  return 'client';
};

function demoSession() {
  const role = getDemoRole();
  return { user: { id: `demo-${role}`, role } as any }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

let supabaseImpl: any; // eslint-disable-line @typescript-eslint/no-explicit-any

if (isDemo) {
  supabaseImpl = {
    auth: {
      async getSession() {
        return { data: { session: demoSession() }, error: null };
      },
      onAuthStateChange(cb: (evt: string, session: any) => void) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setTimeout(() => cb('SIGNED_IN', demoSession()), 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      async signOut() { localStorage.removeItem('demo.role'); return { error: null }; },
      async signInWithPassword() { return { data: {}, error: null }; },
      async signUp() { return { data: {}, error: null }; },
    },
    async rpc(fnName: string, _params?: Record<string, any>) { // eslint-disable-line @typescript-eslint/no-explicit-any
      switch (fnName) {
        case 'guards_list':
        case 'list_guards':
        case 'get_guards':
          return { data: (window as any).__demoDb?.guards || [], error: null }; // eslint-disable-line @typescript-eslint/no-explicit-any
        default:
          return { data: null, error: null };
      }
    },
  } as const;
} else {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;
  supabaseImpl = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storage: localStorage, persistSession: true, autoRefreshToken: true }
  });
}

export const supabase = supabaseImpl as unknown;