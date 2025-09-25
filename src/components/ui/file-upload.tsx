import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Eye, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
  currentFileUrl?: string;
  bucketName: string;
  storagePath: string;
  accept?: string;
  maxSizeBytes?: number;
  label: string;
  required?: boolean;
  disabled?: boolean;
}

const FileUpload = ({
  onUploadComplete,
  onUploadError,
  currentFileUrl,
  bucketName,
  storagePath,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  label,
  required = false,
  disabled = false
}: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.currentTarget.files;
    const file = fileList?.[0] ?? null;
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeBytes) {
      toast.error(`File size must be less than ${Math.round(maxSizeBytes / 1024 / 1024)}MB`);
      return;
    }

    setSelectedFile(file);
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${storagePath}/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get signed URL for private buckets
        // Use edge function for signed URL
        const { data: signedUrlData, error: urlError } = await supabase.functions.invoke('document_signed_url', {
          body: { document_path: filePath, expires_in: 300 }
        });

      if (urlError) throw urlError;

      const fileUrl = signedUrlData.signedUrl || filePath;
      setUploadProgress(100);
      
      onUploadComplete(fileUrl);
      toast.success(`${label} uploaded successfully`);
      
      // Reset state
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: unknown) {
      console.error('Upload error:', err);
      let errorMessage = 'Upload failed';
      if (err instanceof Error && err.message) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        const maybeMsg = (err as { message?: unknown }).message;
        if (typeof maybeMsg === 'string') errorMessage = maybeMsg;
      }
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const viewFile = async () => {
    if (!currentFileUrl) return;
    window.open(currentFileUrl, '_blank');
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-mobile-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        {currentFileUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={viewFile}
            className="text-accent hover:text-accent/80"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        )}
      </div>

      <div className="relative border-2 border-dashed border-border rounded-lg p-4">
        {!selectedFile && !currentFileUrl && (
          <div className="text-center">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-mobile-sm text-muted-foreground mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              {accept.replace(/\./g, '').toUpperCase()} files up to {Math.round(maxSizeBytes / 1024 / 1024)}MB
            </p>
          </div>
        )}

        {selectedFile && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent/10 rounded flex items-center justify-center">
                  <Upload className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-mobile-sm font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-muted-foreground text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            {!uploading && (
              <Button
                type="button"
                onClick={uploadFile}
                disabled={disabled}
                className="w-full"
              >
                Upload {label}
              </Button>
            )}
          </div>
        )}

        {currentFileUrl && !selectedFile && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-success/10 rounded flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-mobile-sm font-medium text-foreground">File uploaded</p>
                <p className="text-xs text-muted-foreground">Click View to see document</p>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default FileUpload;