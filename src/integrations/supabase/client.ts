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
    functions: {
      async invoke(fn: string, opts?: { body?: any }) { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (fn === 'create_booking_payment') {
          const body = opts?.body || {};
          // simulate booking creation + payment intent URL
          const booking = {
            id: `b_${Date.now()}`,
            status: 'matching',
            pickup_address: body.pickup_address,
            start_ts: body.start_ts,
            end_ts: body.duration_hours ? new Date(new Date(body.start_ts).getTime() + body.duration_hours * 3600_000).toISOString() : body.start_ts,
            total_mxn_cents: body.total_mxn_cents,
            client_id: demoSession().user.id,
          };
          (window as any).__demoDb = (window as any).__demoDb || {}; // eslint-disable-line @typescript-eslint/no-explicit-any
          (window as any).__demoDb.bookings = [(window as any).__demoDb.bookings || [], booking].flat();
          return { data: { url: 'https://demo.checkout/booking/' + booking.id }, error: null };
        }
        if (fn === 'booking_accept') {
          return { data: { message: 'accepted' }, error: null };
        }
        if (fn === 'document_signed_url') {
          return { data: { signed_url: 'blob:demo' }, error: null };
        }
        if (fn === 'assignment_update') {
          return { data: { message: 'updated' }, error: null };
        }
        return { data: {}, error: null };
      }
    },
    // Minimal query builder
    from(table: string) {
      const filters: Array<{ col: string; op: 'eq'; value: unknown }> = [];
      let limitVal: number | null = null;
      let orderCol: string | null = null;
      let orderAsc = true;

      const role = getDemoRole();
      const session = demoSession();
      const userId = session.user.id;

      function baseData() {
        if (table === 'bookings') {
          // simple role scoping
            const all = (window as any).__demoDb?.bookings || []; // eslint-disable-line @typescript-eslint/no-explicit-any
            if (role === 'client') return all.filter((b: any) => b.client_id === userId); // eslint-disable-line @typescript-eslint/no-explicit-any
            if (role === 'guard') return all.filter((b: any) => b.assigned_user_id === userId || b.status === 'matching');
            return all; // company sees all
        }
        if (table === 'notifications') return (window as any).__demoDb?.notifications || []; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (table === 'user_roles') {
          // map demo role to app roles
          const roleMap: Record<string, string[]> = {
            client: ['client'],
            company: ['company_admin'],
            guard: ['freelancer']
          };
          return roleMap[role].map(r => ({ role: r, user_id: userId }));
        }
        if (table === 'profiles') {
          return [{ id: userId, company_id: 'demo-company-1' }];
        }
        if (table === 'assignments') return (window as any).__demoDb?.assignments || []; // eslint-disable-line @typescript-eslint/no-explicit-any
        return [];
      }

      function applyFilters(rows: any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return rows.filter(r => filters.every(f => r[f.col] === f.value));
      }

      function exec() {
        let rows = applyFilters(baseData());
        if (orderCol) {
          rows = rows.slice().sort((a: any, b: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const av = a[orderCol!]; const bv = b[orderCol!];
            if (av === bv) return 0; return (av > bv ? 1 : -1) * (orderAsc ? 1 : -1);
          });
        }
        if (limitVal != null) rows = rows.slice(0, limitVal);
        return { data: rows, error: null };
      }

      const chain: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
        select() { return chain; },
        eq(col: string, value: unknown) { filters.push({ col, op: 'eq', value }); return chain; },
        order(col: string, opts?: { ascending?: boolean }) { orderCol = col; orderAsc = opts?.ascending !== false; return chain; },
        limit(n: number) { limitVal = n; return chain; },
        update(_patch: Record<string, unknown>) { return chain; }, // no-op in demo for now
        single() { return chain; },
        then(resolver: (v: any) => any) { return Promise.resolve(exec()).then(resolver); }, // thenable
      };
      return chain;
    },
    // Realtime stubs
    channel(_name: string) {
      const chan: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
        on(_evt: string, _cfg: Record<string, unknown>, _cb: (payload: unknown) => void) { return chan; },
        subscribe() { return { data: { status: 'SUBSCRIBED' } }; }
      };
      return chan;
    },
    removeChannel(_c: unknown) { /* noop */ },
  } as const;
} else {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;
  supabaseImpl = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storage: localStorage, persistSession: true, autoRefreshToken: true }
  });
}

export const supabase = supabaseImpl as unknown;