import React from 'react';
import { DocumentManager } from '@/components/documents/DocumentManager';
import { BottomNav } from '@/components/mobile/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentsPageProps {
  navigate: (path: string) => void;
}

const DocumentsPage = ({ navigate }: DocumentsPageProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-mobile-xl font-bold text-foreground">
              Documents
            </h1>
            <p className="text-mobile-sm text-muted-foreground">
              Manage your important documents securely
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your documents are stored securely with end-to-end encryption. 
              Only you and authorized personnel can access them.
            </AlertDescription>
          </Alert>

          {/* Document Types Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Required Documents</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Government-issued ID</li>
                    <li>• Professional licenses</li>
                    <li>• Insurance certificates</li>
                    <li>• Training certifications</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Optional Documents</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• References</li>
                    <li>• Additional certifications</li>
                    <li>• Medical clearances</li>
                    <li>• Background checks</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Manager */}
          <DocumentManager
            allowedTypes={['image/*', 'application/pdf', '.doc,.docx']}
            maxSizeBytes={10 * 1024 * 1024} // 10MB
          />
        </div>
      </div>

      <BottomNav currentPath="/documents" navigate={navigate} />
    </div>
  );
};

export default DocumentsPage;