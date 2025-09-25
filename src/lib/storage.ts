import { createClient } from '@supabase/supabase-js';

// Safely read import.meta.env without using `any`
const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
const supabaseUrl = metaEnv?.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = metaEnv?.VITE_SUPABASE_ANON_KEY ?? '';

// When running tests locally without env vars, avoid calling createClient('', '') which errors.
// Export a small mock supabase with the methods our hooks/components use.
// Shape of the chainable query builder mock used in tests
type MockChain = {
  select: (..._args: unknown[]) => MockChain;
  insert: (..._args: unknown[]) => MockChain;
  update: (..._args: unknown[]) => MockChain;
  eq: (..._args: unknown[]) => MockChain;
  order: (..._args: unknown[]) => MockChain;
  limit: (..._args: unknown[]) => MockChain;
  single: () => Promise<{ data: Record<string, unknown> | undefined; error: null }>;
  then: (fn: (res: { data: unknown[] }) => unknown) => Promise<unknown>;
};

export const createMockSupabase = () => {
  const mock = {
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
    from: (table: string) => {
      // chainable query builder mock used in tests
      const defaultMessages = [
        {
          id: 'mock-1',
          booking_id: 'test',
          sender_id: null,
          body: 'mensaje de prueba',
          created_at: new Date().toISOString(),
        },
      ];
  const chain = {
        select(..._args: unknown[]) { return chain; },
        insert(..._args: unknown[]) { return chain; },
        update(..._args: unknown[]) { return chain; },
        eq(..._args: unknown[]) { return chain; },
        order(..._args: unknown[]) { return chain; },
        limit(..._args: unknown[]) { return chain; },
        // support .single() used after .select()/insert
        async single() { return { data: defaultMessages[0], error: null }; },
        // support promise-style .then() after ordering/selecting - always async
        then(fn: (res: { data: unknown[] }) => unknown) {
          const data = table === 'messages' ? defaultMessages : [];
          return Promise.resolve({ data }).then(fn);
        },
      };
      return chain;
    },
    channel: () => ({
      on: () => ({ subscribe: async () => ({}) }),
    }),
    removeChannel: () => {},
    storage: {
      from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: '' } }) }),
    },
  } as {
    auth: { getUser: () => Promise<{ data: { user: null } }> };
    from: (table: string) => MockChain;
    channel: () => { on: (...args: unknown[]) => { subscribe: () => Promise<unknown> } };
    removeChannel: () => void;
    storage: { from: (bucket: string) => { createSignedUrl: (path: string, expires?: number) => Promise<{ data?: { signedUrl?: string } }>; upload?: (path: string, file: unknown, opts?: unknown) => Promise<{ error?: unknown }>; } };
  };

  return mock;
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : createMockSupabase();

export async function createSignedUrl(path: string, expiresSeconds = 60 * 5) {
  // Use storage.createSignedUrl; for server-side we use Edge Function; client uses this as helper
  if (!supabase.storage) throw new Error('Supabase storage not initialized');
  const signed = await (supabase.storage.from('documents').createSignedUrl(path, expiresSeconds) as Promise<{ data?: { signedUrl?: string } } | null>);
  if (!signed || !signed.data || typeof signed.data.signedUrl !== 'string') {
    throw new Error('Failed to create signed url');
  }
  return signed.data.signedUrl as string;
}

export async function uploadWithSignedUrl(file: File, destPath: string, onProgress?: (p: number) => void) {
  // Upload via a signed URL fetched from edge function or server.
  // Fallback: use supabase.storage.upload when anon key present.
  if (supabase.storage && (metaEnv?.VITE_SUPABASE_ANON_KEY)) {
    // supabase.storage may be the mock in tests or the real client; guard upload call
    if (typeof supabase.storage.from === 'function' && typeof supabase.storage.from('documents').upload === 'function') {
      const res = await (supabase.storage.from('documents').upload(destPath, file, { upsert: true }) as Promise<{ error?: unknown } | null>);
      if (res && (res as { error?: unknown }).error) throw (res as { error?: unknown }).error;
      return destPath;
    }
    // If the mock does not support upload, fallthrough to signed URL flow
  }
  // If no anon key, try to POST to signed_url function to get upload URL
  const resp = await fetch('/api/document_signed_url', { method: 'POST', body: JSON.stringify({ path: destPath }) });
  if (!resp.ok) throw new Error('Failed to get signed upload url');
  const { uploadUrl } = await resp.json();
  const put = await fetch(uploadUrl, { method: 'PUT', body: file });
  if (!put.ok) throw new Error('Upload failed');
  return destPath;
}
