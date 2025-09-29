import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { demoAuth, demoDb, demoRealtime, demoStripe, type DemoUserRole } from '@/demo/shims';

// ----- real client (unchanged) -----
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const real = SUPABASE_URL && SUPABASE_KEY
  ? createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_KEY)
  : ({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

// Pseudo table names we expose in demo
type DemoTable = 'bookings' | 'messages' | 'payments' | 'vehicles' | 'user_roles' | 'profiles' | 'assignments' | 'guards';

function snapshot(table: DemoTable): any[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  switch (table) {
    case 'bookings':
      return demoDb.listBookings('company', 'u_company_1') as any[]; // broad list
    case 'guards': {
      // derive guards list from seeded users in demoDb
      const guards = (demoDb as any).listRoles?.()?.filter((r: any) => r.role === 'guard').map((r: any) => r.user_id) || []; // eslint-disable-line @typescript-eslint/no-explicit-any
      return guards.map((id: string) => ({
        id,
        rating: 4.9,
        city: 'CDMX',
        skills: ['protective-driving','advance-work'],
        hourly_rate_mxn_cents: 5000,
        armed_hourly_surcharge_mxn_cents: 1500,
        status: 'active',
        photo_url: undefined
      }));
    }
  case 'payments': {
      // Map demo ledger rows to a payment-like shape used by BillingDashboard
      const rows = (demoDb.listPayments() as any[]).map((p: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        id: p.id,
        booking_id: p.booking_id,
    amount_cents: p.amount_cents,
        amount_captured: p.amount_cents,
        amount_preauth: 0,
        status: p.status || 'succeeded',
        created_at: p.created_at,
        provider: 'stripe',
        charge_id: null,
      }));
      return rows as any[];
    }
    case 'vehicles':
      return demoDb.listVehicles() as any[];
    case 'profiles':
      return (demoDb as any).listProfiles?.() || [];
    case 'user_roles':
      return (demoDb as any).listRoles?.() || [];
    case 'messages':
      return [];
  case 'assignments':
    default:
      return [];
  }
}

function makeQueryBuilder(table: DemoTable) {
  const _filters: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
  let _order: { key?: string; ascending?: boolean } = {};
  const _not: Array<{ col: string; op: string; value: any }> = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  const _in: Array<{ col: string; values: any[] }>=[]; // eslint-disable-line @typescript-eslint/no-explicit-any

  const exec = () => {
    let rows = snapshot(table).slice();
    Object.entries(_filters).forEach(([k, v]) => {
      rows = rows.filter(r => (r as any)[k] === v); // eslint-disable-line @typescript-eslint/no-explicit-any
    });
    _in.forEach(cond => {
      rows = rows.filter(r => cond.values.includes((r as any)[cond.col])); // eslint-disable-line @typescript-eslint/no-explicit-any
    });
    // apply .not filters (support minimal 'is null' exclusion)
    _not.forEach(nf => {
      // minimal .not() support for common ops
      if (nf.op === 'is' && nf.value === null) {
        rows = rows.filter(r => (r as any)[nf.col] !== null && (r as any)[nf.col] !== undefined);
      } else if (nf.op === 'eq') {
        rows = rows.filter(r => (r as any)[nf.col] !== nf.value);
      }
    });
    // Guard special case: if filtering by assigned_user_id also show open matching bookings
    if ('assigned_user_id' in _filters && table === 'bookings') {
      const open = snapshot('bookings').filter(b => (b as any).status === 'matching'); // eslint-disable-line @typescript-eslint/no-explicit-any
      const existingIds = new Set(rows.map(r => (r as any).id)); // eslint-disable-line @typescript-eslint/no-explicit-any
      open.forEach(b => { if (!existingIds.has((b as any).id)) rows.push(b); }); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (_order.key) {
      rows = rows.sort((a: any, b: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const av = a[_order.key!]; const bv = b[_order.key!];
        if (av === bv) return 0;
        return (_order.ascending ?? true) ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    }
    return { data: rows, error: null };
  };

  const builder: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
    select() { return builder; },
    insert(_payload: any) { return { data: [], error: null }; }, // no-op
    update() { return { eq: async () => ({ data: [], error: null }) }; },
    upsert(p: any) { return { data: Array.isArray(p) ? p : [p], error: null }; },
    single: async () => ({ data: exec().data[0] ?? null, error: null }),
    eq(k: string, v: any) { _filters[k] = v; return builder; },
    order(k: string, opts?: { ascending?: boolean }) { _order = { key: k, ascending: opts?.ascending }; return builder; },
  limit(_n: number) { return builder; },
  not(col: string, op: string, value: any) { _not.push({ col, op, value }); return builder; },
  in(col: string, values: any[]) { _in.push({ col, values }); return builder; },
    then(res: any) { return Promise.resolve(exec()).then(res); },
  };
  return builder;
}

const demo = {
  from(table: string) {
    const allowed: DemoTable[] = ['bookings','messages','payments','vehicles','user_roles','profiles','assignments','guards'];
    const t = allowed.includes(table as DemoTable) ? table as DemoTable : 'bookings';
    return makeQueryBuilder(t);
  },

  rpc: async (fn: string, args?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // Demo RPCs
    // helpers
    function demoRecordPayment(bookingId: string, amountMxn: number) {
      try {
        const cents = Math.round(amountMxn * 100);
        (demoDb as any).recordPayment?.(bookingId, cents); // eslint-disable-line @typescript-eslint/no-explicit-any
        demoRealtime.emit('payments', { type: 'payment.created', booking_id: bookingId, amount_mxn: amountMxn });
      } catch {}
    }
    function demoBroadcastPlannedEnd(bookingId: string, newEndTs: number) {
      try {
        const list = (demoDb as any).listBookings?.('company', 'u_company_1') as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        const current = list.find(b => b.id === bookingId);
        if (current) demoRealtime.emit('bookings', { new: current });
      } catch {}
      demoRealtime.emit('booking_timer_updated', { booking_id: bookingId, service_end_planned_ts: newEndTs });
    }

    if (fn === 'extend_service') {
      const { booking_id, extra_hours } = args || {};
      if (!booking_id || !extra_hours || Number(extra_hours) < 1) {
        return { data: null, error: { message: 'bad_request' } } as any;
      }
      const list = (demoDb as any).listBookings?.('company', 'u_company_1') as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      const b = list.find(x => x.id === booking_id);
      if (!b || b.status !== 'in_progress') {
        return { data: null, error: { message: 'not_in_progress' } } as any;
      }
      const start = b.service_start_ts ? new Date(b.service_start_ts).getTime() : undefined;
      if (!start) return { data: null, error: { message: 'not_started' } } as any;
      const plannedEnd = typeof b.service_end_planned_ts === 'number' ? b.service_end_planned_ts : start;
      const msPerHour = 3600_000;
      const currentHours = Math.max(1, Math.ceil((plannedEnd - start) / msPerHour));
      const maxHours = 8;
      const remaining = Math.max(0, maxHours - currentHours);
      if (remaining <= 0) {
        return { data: null, error: { message: 'max_hours_reached' } } as any;
      }
      const extendBy = Math.min(remaining, Number(extra_hours));
      const newPlannedEnd = plannedEnd + extendBy * msPerHour;
      const rate = Number(b.hourly_rate_mxn ?? 350);
      const extraAmount = rate * extendBy;
      const updated = (demoDb as any).updateBooking?.(booking_id, { service_end_planned_ts: newPlannedEnd });
      if (updated) {
        demoBroadcastPlannedEnd(booking_id, newPlannedEnd);
      }
      demoRecordPayment(booking_id, extraAmount);
      return { data: { booking_id, added_hours: extendBy, new_service_end_planned_ts: newPlannedEnd, extra_amount_mxn: extraAmount, rate_mxn: rate }, error: null } as any;
    }
    return { data: null, error: null };
  },

  // ---- Realtime ----
  channel(name: string) {
    const handlers: Array<(p: any) => void> = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    const api: any = {
      on(_evt: string, _filter: any, cb: (payload: any) => void) { // eslint-disable-line @typescript-eslint/no-explicit-any
        handlers.push(cb);
        demoRealtime.on(name, cb);
        return api;
      },
      subscribe(cb?: (status: 'SUBSCRIBED') => void) { cb?.('SUBSCRIBED'); return { unsubscribe: () => {/* noop */} }; },
      unsubscribe() { /* noop */ }
    };
    return api;
  },
  removeChannel(_channel: any) { /* noop for demo */ },

  // ---- Auth ----
  auth: {
    async getSession() {
      const u = demoAuth();
      const user = u ? { id: u.id, role: u.role } : null;
      return { data: { session: user ? { user } : null }, error: null };
    },
    onAuthStateChange(cb: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const u = demoAuth();
      const user = u ? { id: u.id, role: u.role } : null;
      const payload = ['SIGNED_IN', { session: user ? { user } : null }] as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      try { cb?.(...payload); } catch {}
      return { data: { subscription: { unsubscribe() {} } }, error: null };
    },
    async signOut() { return { error: null }; },
  },

  // ---- Storage ----
  storage: {
    from(_bucket: string) {
      return {
        async upload(_path: string, _file: File | Blob) {
          // pretend success
          const fakePath = `demo/${Date.now()}-${Math.random().toString(36).slice(2)}`;
          return { data: { path: fakePath }, error: null };
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: `${location.origin}/${path}` }, error: null };
        },
      };
    }
  },

  // ---- Functions (keep existing demo invoke behavior) ----
  functions: {
    async invoke(fn: string, opts?: { body?: any }) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (fn === 'create_booking_payment') {
        const body = opts?.body || {};
        const clientId = (demoAuth()?.id) || 'demo-client';
        const durationHours = Number(body.duration_hours) || 1;
        const endTs = body.start_ts ? new Date(new Date(body.start_ts).getTime() + durationHours * 3600_000).toISOString() : body.start_ts;
        // persist via demoDb so list queries see it
        const booking = demoDb.createBooking({
          pickup_address: body.pickup_address,
          start_ts: body.start_ts,
          end_ts: endTs,
          total_mxn_cents: body.total_mxn_cents,
          client_id: clientId,
          // pass-through extras commonly displayed
          armed_required: !!body.armed_required,
          vehicle_required: !!body.vehicle_required,
          vehicle_type: body.vehicle_type,
      notes: body.notes,
      min_hours: durationHours,
        } as any);
  // Notify listeners that bookings changed (for guard/company live views)
  try { demoRealtime.emit('bookings', { new: booking }); } catch {}
  // Simulate immediate successful charge and split payout in demo
    try { (demoStripe as any).transferSplit?.(booking.id, Number(body.total_mxn_cents) || 0); } catch {}
  // In demo, send users to the local success page instead of an external checkout
        const successUrl = `${location.origin}/client.html?as=client#booking-success?booking_id=${booking.id}`;
        return { data: { url: successUrl, booking_id: booking.id }, error: null };
      }
      if (fn === 'bookings_guard_list') {
        const body = opts?.body || {};
        const scope = String(body.scope || 'available') as 'available'|'mine';
        const guardId = (demoAuth()?.id) || 'u_guard_1';
        // available: matching; mine: assigned to me and not matching
        const all = demoDb.listBookings('guard', guardId) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        const list = scope === 'available'
          ? all.filter(b => b.status === 'matching')
          : all.filter(b => b.assigned_user_id === guardId && b.status !== 'matching');
        return { data: list, error: null };
      }
      if (fn === 'booking_accept') {
        const body = opts?.body || {};
        const bookingId = body.booking_id;
        const guardId = body.guard_id || (demoAuth()?.id);
        const updated = demoDb.updateBooking(bookingId, { assigned_user_id: guardId, status: 'assigned' });
        if (updated) demoRealtime.emit('bookings', { new: updated });
        return { data: { message: 'accepted', booking_id: bookingId }, error: null };
      }
      if (fn === 'booking_accept_atomic') {
        // demo: no race, just reuse booking_accept logic
        const body = opts?.body || {};
        const bookingId = body.booking_id;
        const guardId = body.guard_id || (demoAuth()?.id);
        const updated = demoDb.updateBooking(bookingId, { assigned_user_id: guardId, status: 'assigned' });
        if (!updated) {
          return { data: null, error: { message: 'no longer available' } } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        demoRealtime.emit('bookings', { new: updated });
        return { data: { message: 'accepted', booking_id: bookingId }, error: null };
      }
      if (fn === 'document_signed_url') {
        return { data: { signed_url: 'blob:demo' }, error: null };
      }
      if (fn === 'assignment_update') {
        const body = opts?.body || {};
        const bookingId = body.booking_id;
        const patch: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (body.status) patch.status = body.status;
        if (body.assigned_user_id) patch.assigned_user_id = body.assigned_user_id;
        const updated = demoDb.updateBooking(bookingId, patch);
        if (updated) demoRealtime.emit('bookings', { new: updated });
        return { data: { message: 'updated', booking_id: bookingId }, error: null };
      }
      if (fn === 'get_start_code') {
        const body = opts?.body || {};
        const bookingId = body.booking_id;
        const booking = (demoDb as any).listBookings?.('company', 'u_company_1')?.find((b: any) => b.id === bookingId); // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!booking) return { data: null, error: { message: 'not found' } } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        return { data: { start_code: booking.start_code }, error: null };
      }
      if (fn === 'payouts_list') {
        const guardId = (demoAuth()?.id) || 'u_guard_1';
        const payouts = (demoDb as any).listPayoutsByGuard?.(guardId) || [];
        // Map to expected shape: id, amount_mxn_cents, status, created_at
        const mapped = payouts.map((p: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: p.id,
          amount_mxn_cents: p.amount_cents,
          status: p.status === 'succeeded' ? 'paid' : p.status,
          period_start: p.created_at,
          period_end: p.created_at,
          created_at: p.created_at,
        }));
        return { data: { payouts: mapped }, error: null };
      }
      if (fn === 'connect_onboarding_link') {
        return { data: { url: 'https://connect.stripe.com/test/onboarding' }, error: null };
      }
      if (fn === 'confirm_start_code') {
        const body = opts?.body || {};
        const { booking_id, code } = body;
        const booking = (demoDb as any).updateBooking?.(booking_id, {});
        const list = (demoDb as any).listBookings?.('company', 'u_company_1') as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        const current = list.find(b => b.id === booking_id);
        if (!current) return { data: null, error: { message: 'not found' } } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (String(current.start_code) !== String(code)) {
          return { data: null, error: { message: 'invalid_code' } } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const now = new Date().toISOString();
        const updated = (demoDb as any).updateBooking?.(booking_id, { service_start_ts: now, status: 'in_progress' });
        if (updated) {
          demoRealtime.emit('bookings', { new: updated });
          // Trigger guard payout at start (demo): pay guard their share from the original amount
          try {
            const total = Number(current.total_mxn_cents) || 0;
            const fees = Math.round(total * 0.035) + 300;
            const company_cut = Math.round(total * 0.25);
            const guard_amount = total - fees - company_cut;
            if (current.assigned_user_id && guard_amount > 0) {
              (demoDb as any).recordPayout?.(booking_id, current.assigned_user_id, guard_amount);
            }
          } catch {}
          // Simulate 10-min-before ending notification by emitting near end_ts (no real timer persisted in demo)
        }
        return { data: { ok: true, service_start_ts: now }, error: null };
      }
      if (fn === 'complete_service') {
        const body = opts?.body || {};
        const { booking_id } = body;
        const list = (demoDb as any).listBookings?.('company', 'u_company_1') as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        const current = list.find(b => b.id === booking_id);
        if (!current) return { data: null, error: { message: 'not found' } } as any;
        const now = new Date().toISOString();
        const updated = (demoDb as any).updateBooking?.(booking_id, { service_end_ts: now, status: 'completed' });
        if (updated) {
          demoRealtime.emit('bookings', { new: updated });
        }
        // Provide a tiny summary payload
        return { data: { ok: true, service_end_ts: now }, error: null };
      }
      return { data: {}, error: null };
    }
  },
} as const;

export const supabase = DEMO ? (demo as any) : real; // eslint-disable-line @typescript-eslint/no-explicit-any
export const stripeDemo = demoStripe; // handy export if you use it elsewhere