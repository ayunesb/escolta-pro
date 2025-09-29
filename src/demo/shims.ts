// Demo mode shims: in-memory auth, db, realtime, and stripe-like helpers.
// Import this file once near app bootstrap when VITE_DEMO_MODE === 'true'.

export type DemoUserRole = 'client' | 'company' | 'guard';

export interface DemoUser {
  id: string;
  role: DemoUserRole;
  name: string;
}

const LS_KEY = 'demo_state_v1';

interface BookingSeed {
  id: string;
  status: string;
  pickup_address: string;
  start_ts: string;
  end_ts: string;
  total_mxn_cents: number;
  client_id: string;
  assigned_user_id?: string;
  armed_required?: boolean;
  vehicle_required?: boolean;
  vehicle_type?: string;
  start_code?: string; // 6-digit code the guard shares with client
  service_start_ts?: string; // when client confirms code
  service_end_ts?: string; // when service is marked complete
  // Demo extension support
  service_end_planned_ts?: number; // planned end (ms epoch)
  hourly_rate_mxn?: number; // simple hourly rate in MXN for extensions
}

interface MessageSeed {
  id: string;
  booking_id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
}

interface PaymentLedgerRow {
  id: string;
  booking_id: string;
  amount_cents: number;
  company_cut_cents: number;
  guard_payout_cents: number;
  stripe_fees_cents: number;
  status: 'succeeded' | 'pending';
  created_at: string;
}

interface PayoutRow {
  id: string;
  booking_id: string;
  guard_id: string;
  amount_cents: number;
  status: 'initiated' | 'succeeded' | 'failed';
  created_at: string;
}

interface DemoState {
  users: DemoUser[];
  bookings: BookingSeed[];
  messages: MessageSeed[];
  payments: PaymentLedgerRow[];
  payouts: PayoutRow[];
  vehicles?: { id: string; label: string; plate: string; owner_user_id: string }[];
  profiles?: { id: string; full_name: string; role: DemoUserRole }[];
  roles?: { user_id: string; role: DemoUserRole }[];
}

const now = () => new Date().toISOString();

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {}
  const base: DemoState = { users: [], bookings: [], messages: [], payments: [], payouts: [], vehicles: [], profiles: [], roles: [] };
  persist(base);
  return base;
}

function persist(state: DemoState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

let state: DemoState = loadState();

export function seedDemoData() {
  if (state.users.length > 0) return; // already seeded
  const client: DemoUser = { id: 'u_client_1', role: 'client', name: 'Client One' };
  const company: DemoUser = { id: 'u_company_1', role: 'company', name: 'Company Admin' };
  const guard1: DemoUser = { id: 'u_guard_1', role: 'guard', name: 'Guard Alpha' };
  const guard2: DemoUser = { id: 'u_guard_2', role: 'guard', name: 'Guard Beta' };

  const booking1: BookingSeed = {
    id: 'b_pending_1',
    status: 'matching',
    pickup_address: 'Av. Reforma 100, CDMX',
    start_ts: new Date(Date.now() + 3600_000).toISOString(),
    end_ts: new Date(Date.now() + 3 * 3600_000).toISOString(),
    total_mxn_cents: 25000,
    client_id: client.id,
  };
  const booking2: BookingSeed = {
    id: 'b_inprogress_1',
    status: 'in_progress',
    pickup_address: 'Aeropuerto MEX T1',
    start_ts: new Date(Date.now() - 3600_000).toISOString(),
    end_ts: new Date(Date.now() + 2 * 3600_000).toISOString(),
    total_mxn_cents: 42000,
    client_id: client.id,
    assigned_user_id: guard1.id,
  service_end_planned_ts: Date.now() + 2 * 3600_000,
  hourly_rate_mxn: 350,
  };

  state = {
    users: [client, company, guard1, guard2],
    bookings: [booking1, booking2],
    messages: [
      { id: 'm1', booking_id: booking2.id, sender_id: client.id, body: 'Hola, estoy en camino', created_at: now() },
      { id: 'm2', booking_id: booking2.id, sender_id: guard1.id, body: 'Perfecto, ETA 5min', created_at: now() },
    ],
  payments: [],
  payouts: [],
    vehicles: [
      { id: 'veh_1', label: 'SUV Blindada', plate: 'ABC-123', owner_user_id: company.id },
      { id: 'veh_2', label: 'Sedan Ejecutivo', plate: 'XYZ-789', owner_user_id: company.id },
    ],
    profiles: [
      { id: client.id, full_name: client.name, role: 'client' },
      { id: company.id, full_name: company.name, role: 'company' },
      { id: guard1.id, full_name: guard1.name, role: 'guard' },
      { id: guard2.id, full_name: guard2.name, role: 'guard' },
    ],
    roles: [
      { user_id: client.id, role: 'client' },
      { user_id: company.id, role: 'company' },
      { user_id: guard1.id, role: 'guard' },
      { user_id: guard2.id, role: 'guard' },
    ],
  };
  persist(state);
}

export function demoAuth(role?: DemoUserRole) {
  if (role) {
    const u = state.users.find(u => u.role === role) || null;
    return u;
  }
  return state.users[0] || null;
}

export const demoDb = {
  listBookings(role: DemoUserRole, userId: string) {
    if (role === 'client') return state.bookings.filter(b => b.client_id === userId);
    if (role === 'guard') return state.bookings.filter(b => b.assigned_user_id === userId || b.status === 'matching');
    // company sees all
    return state.bookings;
  },
  createBooking(input: Omit<BookingSeed, 'id' | 'status'>) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const planned = input.end_ts ? new Date(input.end_ts).getTime() : undefined;
  const b: BookingSeed = { id: `b_${Date.now()}`, status: 'assigned' in (input as any) ? 'assigned' : 'matching', armed_required: !!(input as any).armed_required, vehicle_required: !!(input as any).vehicle_required, vehicle_type: (input as any).vehicle_type, start_code: code, service_end_planned_ts: planned, hourly_rate_mxn: 350, ...input };
    state.bookings.push(b); persist(state); return b;
  },
  updateBooking(id: string, patch: Partial<BookingSeed>) {
    const idx = state.bookings.findIndex(b => b.id === id); if (idx === -1) return null;
    state.bookings[idx] = { ...state.bookings[idx], ...patch }; persist(state); return state.bookings[idx];
  },
  addMessage(booking_id: string, sender_id: string | null, body: string) {
    const m: MessageSeed = { id: `m_${Date.now()}`, booking_id, sender_id, body, created_at: now() };
    state.messages.push(m); persist(state); demoRealtime.emit(`messages:${booking_id}`, m); return m;
  },
  listMessages(booking_id: string) {
    return state.messages.filter(m => m.booking_id === booking_id);
  },
  recordPayment(booking_id: string, amount_cents: number) {
    const fees = Math.round(amount_cents * 0.035) + 300; // 3.5% + 30 MXN
    const company_cut = Math.round(amount_cents * 0.25);
    const guard = amount_cents - fees - company_cut;
    const row: PaymentLedgerRow = { id: `pay_${Date.now()}`, booking_id, amount_cents, company_cut_cents: company_cut, guard_payout_cents: guard, stripe_fees_cents: fees, status: 'succeeded', created_at: now() };
    state.payments.push(row); persist(state); return row;
  },
  listPayments() { return state.payments; }
  , recordPayout(booking_id: string, guard_id: string, amount_cents: number) {
    const row: PayoutRow = { id: `po_${Date.now()}`, booking_id, guard_id, amount_cents, status: 'succeeded', created_at: now() };
    state.payouts.push(row); persist(state); return row;
  }
  , listPayouts() { return state.payouts; }
  , listPayoutsByGuard(guard_id: string) { return state.payouts.filter(p => p.guard_id === guard_id); }
  , listVehicles() { return state.vehicles || []; }
  , listProfiles() { return state.profiles || []; }
  , listRoles() { return state.roles || []; }
};

// Simple pub/sub bus for demo realtime
class DemoBus {
  private listeners: Record<string, Array<(payload: unknown) => void>> = {};
  on(channel: string, cb: (payload: unknown) => void) {
    this.listeners[channel] = this.listeners[channel] || [];
    this.listeners[channel].push(cb);
    return () => { this.listeners[channel] = (this.listeners[channel] || []).filter(x => x !== cb); };
  }
  emit(channel: string, payload: unknown) {
    (this.listeners[channel] || []).forEach(fn => fn(payload));
  }
}
export const demoRealtime = new DemoBus();

export const demoStripe = {
  createPaymentIntent(amount_cents: number) {
    return { id: `pi_${Date.now()}`, amount_cents, status: 'succeeded', clientSecret: 'demo_secret' };
  },
  transferSplit(booking_id: string, amount_cents: number) {
    return demoDb.recordPayment(booking_id, amount_cents);
  }
};

export function getDemoPaymentLedger() { return demoDb.listPayments(); }
