import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// When running tests locally without env vars, avoid calling createClient('', '') which errors.
// Export a small mock supabase with the methods our hooks/components use.
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
      const chain: any = {
        select(..._args: any[]) { return chain; },
        insert(..._args: any[]) { return chain; },
        update(..._args: any[]) { return chain; },
        eq(..._args: any[]) { return chain; },
        order(..._args: any[]) { return chain; },
        limit(..._args: any[]) { return chain; },
        // support .single() used after .select()/insert
        async single() { return { data: defaultMessages[0], error: null }; },
        // support promise-style .then() after ordering/selecting - always async
        then(fn: any) {
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
  } as any;
  return mock;
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : createMockSupabase();

export async function createSignedUrl(path: string, expiresSeconds = 60 * 5) {
  // Use storage.createSignedUrl; for server-side we use Edge Function; client uses this as helper
  if (!supabase.storage) throw new Error('Supabase storage not initialized');
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, expiresSeconds);
  if (error) throw error;
  return data.signedUrl as string;
}

export async function uploadWithSignedUrl(file: File, destPath: string, onProgress?: (p: number) => void) {
  // Upload via a signed URL fetched from edge function or server.
  // Fallback: use supabase.storage.upload when anon key present.
  if (supabase.storage && import.meta.env.VITE_SUPABASE_ANON_KEY) {
    const { error } = await supabase.storage.from('documents').upload(destPath, file, { upsert: true });
    if (error) throw error;
    return destPath;
  }
  // If no anon key, try to POST to signed_url function to get upload URL
  const resp = await fetch('/api/document_signed_url', { method: 'POST', body: JSON.stringify({ path: destPath }) });
  if (!resp.ok) throw new Error('Failed to get signed upload url');
  const { uploadUrl } = await resp.json();
  const put = await fetch(uploadUrl, { method: 'PUT', body: file });
  if (!put.ok) throw new Error('Upload failed');
  return destPath;
}
