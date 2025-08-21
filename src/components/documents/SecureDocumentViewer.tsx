import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generateSignedUrl } from "@/utils/signed-urls";
import { Loader2, Eye, FileText, Download, AlertCircle } from "lucide-react";

interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  bucket: string;
  path: string;
  size?: number;
  uploadedAt?: string;
}

interface SecureDocumentViewerProps {
  document: DocumentInfo;
  onView?: (signedUrl: string) => void;
}

export const SecureDocumentViewer = ({ document, onView }: SecureDocumentViewerProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateUrl = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateSignedUrl(document.bucket, document.path, 3600); // 1 hour
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.url) {
        setSignedUrl(result.url);
        onView?.(result.url);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate secure link';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      generateUrl();
    }
  };

  const handleDownload = () => {
    if (signedUrl) {
      const downloadElement = globalThis.document.createElement('a');
      downloadElement.href = signedUrl;
      downloadElement.download = document.name;
      globalThis.document.body.appendChild(downloadElement);
      downloadElement.click();
      globalThis.document.body.removeChild(downloadElement);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">{document.name}</CardTitle>
              <CardDescription className="text-xs">
                {document.type} • {formatFileSize(document.size)}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {document.bucket}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-md mb-3">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={handleView}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-3 w-3" />
                View
              </>
            )}
          </Button>
          
          {signedUrl && (
            <Button 
              onClick={handleDownload}
              variant="outline"
              size="sm"
            >
              <Download className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {document.uploadedAt && (
          <p className="text-xs text-muted-foreground mt-2">
            Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};