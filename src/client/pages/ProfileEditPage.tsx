import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import FileUpload from '@/components/ui/file-upload';
import BottomNav from '@/components/mobile/BottomNav';

interface ProfileEditPageProps {
  navigate: (path: string) => void;
}

const ProfileEditPage = ({ navigate }: ProfileEditPageProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Document URLs
  const [idDocUrl, setIdDocUrl] = useState('');
  const [proofOfResidenceUrl, setProofOfResidenceUrl] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      // Load existing profile data
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      // Load profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setPhone(profile.phone_e164 || '');
      }

      // Load document URLs
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_type', 'profile')
        .eq('owner_id', user.id);

      if (documents) {
        documents.forEach(doc => {
          switch (doc.doc_type) {
            case 'id':
            case 'passport':
              setIdDocUrl(doc.file_path);
              break;
            case 'proof_of_residence':
              setProofOfResidenceUrl(doc.file_path);
              break;
          }
        });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('client_profile_upsert', {
        body: {
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          id_doc_url: idDocUrl,
          proof_of_residence_url: proofOfResidenceUrl
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

  const handleDocumentUpload = async (url: string, docType: string) => {
    switch (docType) {
      case 'id':
        setIdDocUrl(url);
        break;
      case 'proof_of_residence':
        setProofOfResidenceUrl(url);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
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
              <CardTitle className="text-mobile-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-dark"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input-dark"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
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
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-dark"
                  placeholder="Enter phone number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Required Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Required Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUpload
                label="Government ID or Passport"
                bucketName="licenses"
                storagePath={`profiles/users/${user?.id}`}
                currentFileUrl={idDocUrl}
                onUploadComplete={(url) => handleDocumentUpload(url, 'id')}
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />

              <FileUpload
                label="Proof of Residence"
                bucketName="licenses"
                storagePath={`profiles/users/${user?.id}`}
                currentFileUrl={proofOfResidenceUrl}
                onUploadComplete={(url) => handleDocumentUpload(url, 'proof_of_residence')}
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit"
            disabled={loading || !firstName || !lastName || !email}
            className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentPath="/profile-edit" navigate={navigate} />
    </div>
  );
};

export default ProfileEditPage;