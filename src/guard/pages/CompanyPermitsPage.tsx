import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Eye, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import GuardBottomNav from '@/components/mobile/GuardBottomNav';

interface CompanyPermitsPageProps {
  navigate: (path: string) => void;
}

const CompanyPermitsPage = ({ navigate }: CompanyPermitsPageProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  // Form data
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [insuranceUrl, setInsuranceUrl] = useState('');
  const [gunPermitFile, setGunPermitFile] = useState<File | null>(null);
  const [gunPermitUrl, setGunPermitUrl] = useState('');

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('company_docs')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from('company_docs')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    return signedUrlData?.signedUrl || null;
  };

  const handleFileUpload = async (
    file: File, 
    type: 'insurance' | 'gun_permit'
  ) => {
    if (!user) return;

    const progressKey = type;
    setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
    const path = `companies/permits`;
    
    // Simulate progress for better UX
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 10, 90);
      setUploadProgress(prev => ({ ...prev, [progressKey]: progress }));
    }, 100);

    try {
      const url = await uploadFile(file, path);
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
      
      if (url) {
        if (type === 'insurance') {
          setInsuranceUrl(url);
        } else {
          setGunPermitUrl(url);
        }
        toast.success('File uploaded successfully');
      } else {
        toast.error('Failed to upload file');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
      toast.error('Failed to upload file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('company_permits_upsert', {
        body: {
          insurance_doc_url: insuranceUrl,
          collective_gun_permit_url: gunPermitUrl
        }
      });

      if (error) {
        toast.error('Failed to update permits');
      } else {
        toast.success('Permits updated successfully');
        navigate('/company');
      }
    } catch (error) {
      toast.error('Failed to update permits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/company')}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Company Permits
          </h2>
          <div className="w-6" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Insurance Document */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-accent" />
                <CardTitle className="text-mobile-base">Insurance Documentation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Insurance Policy</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => document.getElementById('insurance-doc')?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </Button>
                    {insuranceFile && (
                      <span className="text-mobile-sm text-muted-foreground">
                        {insuranceFile.name}
                      </span>
                    )}
                  </div>
                  
                  <input
                    id="insurance-doc"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setInsuranceFile(file);
                        handleFileUpload(file, 'insurance');
                      }
                    }}
                  />
                  
                  {uploadProgress.insurance !== undefined && uploadProgress.insurance < 100 && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress.insurance}%` }}
                      />
                    </div>
                  )}
                  
                  {insuranceUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 w-fit"
                      onClick={() => window.open(insuranceUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gun Permit Document */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Collective Gun Permit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Collective Gun Permit</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => document.getElementById('gun-permit-doc')?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </Button>
                    {gunPermitFile && (
                      <span className="text-mobile-sm text-muted-foreground">
                        {gunPermitFile.name}
                      </span>
                    )}
                  </div>
                  
                  <input
                    id="gun-permit-doc"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setGunPermitFile(file);
                        handleFileUpload(file, 'gun_permit');
                      }
                    }}
                  />
                  
                  {uploadProgress.gun_permit !== undefined && uploadProgress.gun_permit < 100 && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress.gun_permit}%` }}
                      />
                    </div>
                  )}
                  
                  {gunPermitUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 w-fit"
                      onClick={() => window.open(gunPermitUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit"
            disabled={loading}
            className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            {loading ? 'Saving...' : 'Save Permits'}
          </Button>
        </form>
      </div>

      {/* Bottom Navigation */}
      <GuardBottomNav currentPath="/company-permits" navigate={navigate} />
    </div>
  );
};

export default CompanyPermitsPage;