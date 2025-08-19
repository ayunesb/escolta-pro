import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Eye, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CompanyStaffNewPageProps {
  navigate: (path: string) => void;
}

const CompanyStaffNewPage = ({ navigate }: CompanyStaffNewPageProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  // Form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('guard');
  
  // Document files and URLs
  const [idDocFile, setIdDocFile] = useState<File | null>(null);
  const [idDocUrl, setIdDocUrl] = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseUrl, setLicenseUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');

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
      .createSignedUrl(filePath, 3600);

    return signedUrlData?.signedUrl || null;
  };

  const handleFileUpload = async (
    file: File, 
    type: 'id' | 'license' | 'photo'
  ) => {
    if (!user) return;

    const progressKey = type;
    setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
    const path = `companies/staff`;
    
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
        if (type === 'id') {
          setIdDocUrl(url);
        } else if (type === 'license') {
          setLicenseUrl(url);
        } else {
          setPhotoUrl(url);
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
      // Get company ID from user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profileData?.company_id) {
        toast.error('Company ID not found');
        return;
      }

      const { error } = await supabase.functions.invoke('company_staff_upsert', {
        body: {
          company_id: profileData.company_id,
          name,
          email,
          address,
          role,
          id_doc_url: idDocUrl,
          driver_license_url: licenseUrl,
          photo_formal_url: photoUrl
        }
      });

      if (error) {
        toast.error('Failed to add staff member');
      } else {
        toast.success('Staff member added successfully');
        navigate('/company-staff');
      }
    } catch (error) {
      toast.error('Failed to add staff member');
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
            onClick={() => navigate('/company-staff')}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Add Staff Member
          </h2>
          <div className="w-6" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-accent" />
                <CardTitle className="text-mobile-base">Basic Information</CardTitle>
              </div>
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
                  placeholder="Enter full name"
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
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-dark"
                  placeholder="Enter address"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-dark w-full"
                  required
                >
                  <option value="guard">Security Guard</option>
                  <option value="driver">Driver</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Required Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ID Document */}
              <div className="space-y-2">
                <Label>ID Document</Label>
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
                        handleFileUpload(file, 'id');
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

              {/* Driver License */}
              <div className="space-y-2">
                <Label>Driver's License</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => document.getElementById('license-doc')?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </Button>
                    {licenseFile && (
                      <span className="text-mobile-sm text-muted-foreground">
                        {licenseFile.name}
                      </span>
                    )}
                  </div>
                  
                  <input
                    id="license-doc"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLicenseFile(file);
                        handleFileUpload(file, 'license');
                      }
                    }}
                  />
                  
                  {uploadProgress.license !== undefined && uploadProgress.license < 100 && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress.license}%` }}
                      />
                    </div>
                  )}
                  
                  {licenseUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 w-fit"
                      onClick={() => window.open(licenseUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  )}
                </div>
              </div>

              {/* Professional Photo */}
              <div className="space-y-2">
                <Label>Professional Photo</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => document.getElementById('photo-doc')?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </Button>
                    {photoFile && (
                      <span className="text-mobile-sm text-muted-foreground">
                        {photoFile.name}
                      </span>
                    )}
                  </div>
                  
                  <input
                    id="photo-doc"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoFile(file);
                        handleFileUpload(file, 'photo');
                      }
                    }}
                  />
                  
                  {uploadProgress.photo !== undefined && uploadProgress.photo < 100 && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress.photo}%` }}
                      />
                    </div>
                  )}
                  
                  {photoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 w-fit"
                      onClick={() => window.open(photoUrl, '_blank')}
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
            disabled={loading || !name || !email || !address}
            className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            {loading ? 'Adding...' : 'Add Staff Member'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompanyStaffNewPage;