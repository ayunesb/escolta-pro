import React, { useState, useEffect } from 'react';
import { Upload, File as FileIcon, Download, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { toast } from '@/hooks/use-toast';
import { i18n } from '@/lib/i18n';
import { format } from 'date-fns';

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    owner_type?: 'user' | 'company';
    document_type?: string;
    tags?: string[];
  };
}

interface DocumentManagerProps {
  organizationId?: string;
  allowedTypes?: string[];
  maxSizeBytes?: number;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  organizationId,
  allowedTypes = ['image/*', 'application/pdf', '.doc,.docx'],
  maxSizeBytes = 10 * 1024 * 1024 // 10MB default
}) => {
  const { user } = useAuth();
  const client = useSupabase();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFileData, setSelectedFileData] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('general');

  useEffect(() => {
    loadDocuments();
  }, [organizationId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Get document list from storage
      const folderPath = organizationId 
        ? `${user?.id}/${organizationId}` 
        : `${user?.id}`;

      const { data: files, error } = await client.storage
        .from('documents')
        .list(folderPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error loading documents:', error);
        toast({
          title: 'Error',
          description: 'Failed to load documents',
          variant: 'destructive'
        });
        return;
      }

      const documentsWithMetadata: Document[] = files?.map(file => ({
        id: file.id || file.name,
        name: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'unknown',
        created_at: file.created_at || new Date().toISOString(),
        updated_at: file.updated_at || new Date().toISOString(),
        metadata: {
          owner_type: organizationId ? 'company' : 'user',
          document_type: documentType,
        }
      })) || [];

      setDocuments(documentsWithMetadata);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSizeBytes) {
      toast({
        title: 'File too large',
        description: `File must be smaller than ${(maxSizeBytes / 1024 / 1024).toFixed(1)}MB`,
        variant: 'destructive'
      });
      return;
    }

    // Check file type
    const isValidType = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      toast({
        title: 'Invalid file type',
        description: `Allowed types: ${allowedTypes.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

  setSelectedFileData(file);
  };

  const uploadDocument = async () => {
    if (!selectedFileData || !user) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const folderPath = organizationId 
        ? `${user.id}/${organizationId}` 
        : `${user.id}`;
      
  const fileName = `${Date.now()}_${selectedFileData?.name}`;
      const filePath = `${folderPath}/${fileName}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const { data, error } = await client.storage
        .from('documents')
        .upload(filePath, selectedFileData as File, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            owner_type: organizationId ? 'company' : 'user',
            document_type: documentType,
            original_name: selectedFileData?.name
          }
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload failed',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Document uploaded',
        description: 'Your document has been uploaded successfully'
      });

  setSelectedFileData(null);
      setUploadProgress(0);
      loadDocuments();

    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const { data: signedUrlData } = await client.functions.invoke('document_signed_url', {
        body: { 
          document_path: document.name,
          expires_in: 300 // 5 minutes
        }
      });

      if (signedUrlData?.signed_url) {
        window.open(signedUrlData.signed_url, '_blank');
      } else {
        throw new Error('Failed to generate signed download link');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Download failed',
        description: 'Could not generate download link',
        variant: 'destructive'
      });
    }
  };

  const deleteDocument = async (document: Document) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const folderPath = organizationId 
        ? `${user?.id}/${organizationId}` 
        : `${user?.id}`;
      
      const { error } = await client.storage
        .from('documents')
        .remove([`${folderPath}/${document.name}`]);

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: 'Delete failed',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Document deleted',
        description: 'Document has been removed'
      });

      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Delete error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    return '📎';
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {i18n('documents.upload_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="file-upload">Select File</Label>
              <Input
                id="file-upload"
                type="file"
                accept={allowedTypes.join(',')}
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {i18n('documents.max_size', { size: (maxSizeBytes / 1024 / 1024).toFixed(1) })}
              </p>
            </div>
            <div>
              <Label htmlFor="document-type">Document Type</Label>
              <select
                id="document-type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="general">General</option>
                <option value="license">License</option>
                <option value="insurance">Insurance</option>
                <option value="contract">Contract</option>
                <option value="invoice">Invoice</option>
                <option value="identification">Identification</option>
              </select>
            </div>
          </div>

          {selectedFileData && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedFileData?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFileData ? formatFileSize(selectedFileData.size) : ''}
                  </p>
                </div>
                <Button onClick={uploadDocument} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
              {uploading && (
                <div className="mt-2">
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents yet</h3>
              <p className="text-muted-foreground">
                Upload your first document to get started
              </p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(document.type)}</span>
                      <div>
                        <h4 className="font-medium">{document.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(document.size)}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(document.created_at), 'MMM dd, yyyy')}
                          </span>
                          {document.metadata?.document_type && (
                            <Badge variant="secondary" className="text-xs">
                              {document.metadata.document_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadDocument(document)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDocument(document)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};