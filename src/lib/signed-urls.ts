// Unified signed URL function for secure file access
import { supabase } from '@/integrations/supabase/client';

export async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('signed_url', {
    body: { bucket, path }
  });
  if (error || !data?.signed_url) {
    console.error('Failed to get signed URL:', error);
    return null;
  }
  return data.signed_url;
}
