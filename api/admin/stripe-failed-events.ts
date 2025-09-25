import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadServerEnv } from '../../src/server/env';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/integrations/supabase/types';
import { logger } from '../../src/server/logger';

// Simple auth check placeholder: ensure a header X-Admin-Secret matches configured value.
// In production, replace with a real session/role validation middleware.
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  if (!ADMIN_API_SECRET || req.headers['x-admin-secret'] !== ADMIN_API_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
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
    if (error) throw error;
    res.status(200).json({ events: data });
  } catch (err) {
    logger.error('admin.failedEvents.fetch.error', { err: (err as Error).message });
    res.status(500).json({ error: 'Failed to load failed events' });
  }
}
