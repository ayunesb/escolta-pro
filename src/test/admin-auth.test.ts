import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateBearerToken, hasAnyRole } from '@/server/auth';

// Mock env loader
vi.mock('@/server/env', () => ({ loadServerEnv: () => ({ SUPABASE_URL: 'u', SUPABASE_SERVICE_KEY: 'k', STRIPE_SECRET_KEY: 'x', STRIPE_WEBHOOK_SECRET: 'y' }) }));

// Mock supabase client
const getUserMock = vi.fn();
const fromMock = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    from: fromMock
  })
}));

beforeEach(() => {
  getUserMock.mockReset();
  fromMock.mockReset();
});

describe('validateBearerToken', () => {
  it('returns empty when header invalid', async () => {
    const res = await validateBearerToken(undefined);
    expect(res.userId).toBeNull();
  });

  it('extracts roles', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user1' } } });
    fromMock.mockReturnValue({ select: () => ({ eq: () => ({ data: [{ role: 'company_admin' }] }) }) });
    const res = await validateBearerToken('Bearer token123');
    expect(res.userId).toBe('user1');
    expect(res.roles).toContain('company_admin');
    expect(hasAnyRole(res, ['company_admin'])).toBe(true);
  });
});
