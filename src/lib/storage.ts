import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

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
