import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadServerEnv } from '../../src/server/env';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/integrations/supabase/types';
import { logger } from '../../src/server/logger';
import { validateBearerToken, hasAnyRole } from '../../src/server/auth';

// Very lightweight in-memory rate limiter (per process). For production, swap with durable store.
const WINDOW_MS = 30_000; // 30s window
const MAX_REQUESTS = 20; // per window per user
const hits: Record<string, { count: number; windowStart: number }> = {};

function rateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = hits[key] || { count: 0, windowStart: now };
  if (now - bucket.windowStart > WINDOW_MS) {
    bucket.count = 0;
    bucket.windowStart = now;
  }
  bucket.count += 1;
  hits[key] = bucket;
  return bucket.count <= MAX_REQUESTS;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  // Role-based auth: expect Authorization: Bearer <token>
  const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
  const authResult = await validateBearerToken(authHeader);
  if (!authResult.userId || !hasAnyRole(authResult, ['company_admin', 'super_admin'])) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const rateKey = authResult.userId;
  if (!rateLimit(rateKey)) {
    logger.warn('admin.failedEvents.rate_limited', { user: authResult.userId });
    res.status(429).json({ error: 'Too Many Requests' });
    return;
  }
  try {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = loadServerEnv();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Missing Supabase service env');
  const client = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client
      .from('stripe_failed_events' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
  logger.info('admin.failedEvents.fetch', { user: authResult.userId, count: data?.length || 0 });
    if (error) throw error;
    res.status(200).json({ events: data });
  } catch (err) {
    logger.error('admin.failedEvents.fetch.error', { err: (err as Error).message });
    res.status(500).json({ error: 'Failed to load failed events' });
  }
}
