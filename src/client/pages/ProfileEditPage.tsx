import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Eye, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProfileEditPageProps {
  navigate: (path: string) => void;
}

const ProfileEditPage = ({ navigate }: ProfileEditPageProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  // Form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [idDocFile, setIdDocFile] = useState<File | null>(null);
  const [idDocUrl, setIdDocUrl] = useState('');
  const [porFile, setPorFile] = useState<File | null>(null);
  const [porUrl, setPorUrl] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
    }
  }, [user]);

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from('profiles')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    return signedUrlData?.signedUrl || null;
  };

  const handleFileUpload = async (
    file: File, 
    type: 'id' | 'por',
    setProgress: (progress: number) => void
  ) => {
    if (!user) return;

    setProgress(0);
    const path = `users/${user.id}`;
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    try {
      const url = await uploadFile(file, path);
      clearInterval(progressInterval);
      setProgress(100);
      
      if (url) {
        if (type === 'id') {
          setIdDocUrl(url);
        } else {
          setPorUrl(url);
        }
        toast.success('File uploaded successfully');
      } else {
        toast.error('Failed to upload file');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      toast.error('Failed to upload file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('client_profile_upsert', {
        body: {
          name,
          email,
          id_doc_url: idDocUrl,
          proof_of_residence_url: porUrl
        }
      });

      if (error) {
        toast.error('Failed to update profile');
      } else {
        toast.success('Profile updated successfully');
        navigate('/account');
      }
    } catch (error) {
      toast.error('Failed to update profile');
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
            onClick={() => navigate('/account')}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Edit Profile
          </h2>
          <div className="w-6" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-dark"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* ID Document */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">ID Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Upload ID/Passport</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => document.getElementById('id-doc')?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </Button>
                    {idDocFile && (
                      <span className="text-mobile-sm text-muted-foreground">
                        {idDocFile.name}
                      </span>
                    )}
                  </div>
                  
                  <input
                    id="id-doc"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIdDocFile(file);
                        handleFileUpload(file, 'id', (progress) => 
                          setUploadProgress({ ...uploadProgress, id: progress })
                        );
                      }
                    }}
                  />
                  
                  {uploadProgress.id !== undefined && uploadProgress.id < 100 && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress.id}%` }}
                      />
                    </div>
                  )}
                  
                  {idDocUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 w-fit"
                      onClick={() => window.open(idDocUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proof of Residence */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Proof of Residence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Proof of Residence</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => document.getElementById('por-doc')?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </Button>
                    {porFile && (
                      <span className="text-mobile-sm text-muted-foreground">
                        {porFile.name}
                      </span>
                    )}
                  </div>
                  
                  <input
                    id="por-doc"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPorFile(file);
                        handleFileUpload(file, 'por', (progress) => 
                          setUploadProgress({ ...uploadProgress, por: progress })
                        );
                      }
                    }}
                  />
                  
                  {uploadProgress.por !== undefined && uploadProgress.por < 100 && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress.por}%` }}
                      />
                    </div>
                  )}
                  
                  {porUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 w-fit"
                      onClick={() => window.open(porUrl, '_blank')}
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
            disabled={loading || !name || !email}
            className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditPage;