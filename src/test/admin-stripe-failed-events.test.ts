import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '@/../api/admin/stripe-failed-events';

// Mock env
vi.mock('@/server/env', () => ({ loadServerEnv: () => ({ SUPABASE_URL: 'u', SUPABASE_SERVICE_KEY: 'k', STRIPE_SECRET_KEY: 'x', STRIPE_WEBHOOK_SECRET: 'y' }) }));

// Mock auth util to control role outcome
vi.mock('@/server/auth', () => ({
  validateBearerToken: vi.fn(async (h: string) => h?.includes('good') ? { userId: 'u1', roles: ['company_admin'] } : { userId: null, roles: [] }),
  hasAnyRole: (r: { roles: string[] }, allowed: string[]) => r.roles.some(x => allowed.includes(x))
}));

// Mock supabase client data fetch
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ order: () => ({ limit: () => ({ data: [{ id: 'e1', type: 't', error: 'err', payload: {}, created_at: new Date().toISOString() }], error: null }) }) })
    })
  })
}));

function makeReq(headers: Record<string,string> = {}): any {
  return { method: 'GET', headers };
}
function makeRes(): any {
  const r: any = { statusCode: 200 };
  r.status = (c: number) => { r.statusCode = c; return r; };
  r.json = (b: any) => { r.body = b; return r; };
  r.send = (b: any) => { r.body = b; return r; };
  return r;
}

describe('admin stripe failed events API', () => {
  beforeEach(() => { /* reset if needed */ });

  it('rejects unauthorized', async () => {
    const req = makeReq({ Authorization: 'Bearer bad' });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns events for authorized user', async () => {
    const req = makeReq({ Authorization: 'Bearer good' });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.events?.length).toBeGreaterThan(0);
  });
});
