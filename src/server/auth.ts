import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { loadServerEnv } from './env';

export interface AuthResult {
  userId: string | null;
  roles: string[];
}

/**
 * Validate a bearer token using a service client; returns user id and roles.
 */
export async function validateBearerToken(authHeader: string | undefined): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return { userId: null, roles: [] };
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return { userId: null, roles: [] };
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = loadServerEnv();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return { userId: null, roles: [] };
  const svc = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userRes } = await svc.auth.getUser(token);
  const userId = userRes?.user?.id ?? null;
  if (!userId) return { userId: null, roles: [] };
  const { data: rolesData } = await svc.from('user_roles').select('role').eq('user_id', userId);
  const roles = rolesData?.map(r => r.role) ?? [];
  return { userId, roles };
}

export function hasAnyRole(result: AuthResult, allowed: string[]): boolean {
  return result.roles.some(r => allowed.includes(r));
}
