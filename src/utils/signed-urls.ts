import { supabase } from "@/integrations/supabase/client";

export interface SignedUrlResult {
  url: string | null;
  error?: string;
}

/**
 * Generate a signed URL for secure document access
 * All documents should use signed URLs to prevent unauthorized access
 */
export const generateSignedUrl = async (
  bucket: string, 
  path: string, 
  expiresIn: number = 3600 // 1 hour default
): Promise<SignedUrlResult> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Signed URL generation error:', error);
      return { url: null, error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error) {
    console.error('Unexpected signed URL error:', error);
    return { 
      url: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Generate signed URL for license documents
 */
export const generateLicenseSignedUrl = async (path: string): Promise<SignedUrlResult> => {
  return generateSignedUrl('licenses', path);
};

/**
 * Generate signed URL for vehicle documents
 */
export const generateVehicleSignedUrl = async (path: string): Promise<SignedUrlResult> => {
  return generateSignedUrl('vehicles', path);
};

/**
 * Generate signed URL for incident media
 */
export const generateIncidentSignedUrl = async (path: string): Promise<SignedUrlResult> => {
  return generateSignedUrl('incidents', path);
};

/**
 * Generate signed URL for general documents
 */
export const generateDocumentSignedUrl = async (path: string): Promise<SignedUrlResult> => {
  return generateSignedUrl('documents', path);
};

/**
 * Generate signed URL for avatar images
 */
export const generateAvatarSignedUrl = async (path: string): Promise<SignedUrlResult> => {
  return generateSignedUrl('avatars', path, 86400); // 24 hours for avatars
};