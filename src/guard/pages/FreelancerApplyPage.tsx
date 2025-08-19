import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Upload, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FileUpload from '@/components/ui/file-upload';
import GuardBottomNav from '@/components/mobile/GuardBottomNav';

interface FreelancerApplyPageProps {
  navigate: (path: string) => void;
}

const FreelancerApplyPage = ({ navigate }: FreelancerApplyPageProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [armed, setArmed] = useState(false);
  const [withVehicle, setWithVehicle] = useState(false);
  
  // Document URLs
  const [idDocUrl, setIdDocUrl] = useState('');
  const [gunPermitUrl, setGunPermitUrl] = useState('');
  const [driverLicenseUrl, setDriverLicenseUrl] = useState('');
  const [photoFormalUrl, setPhotoFormalUrl] = useState('');
  const [photoCasualUrl, setPhotoCasualUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('freelancer_apply', {
        body: {
          name,
          email,
          phone,
          address,
          armed,
          with_vehicle: withVehicle
        }
      });

      if (error) {
        toast.error('Failed to submit application');
      } else {
        toast.success('Application submitted successfully');
        navigate('/account');
      }
    } catch (error) {
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/account')}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Freelancer Application
          </h2>
          <div className="w-6" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-accent" />
                <CardTitle className="text-mobile-base">Basic Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-dark"
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-dark"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-dark"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Label>Armed Personnel</Label>
                </div>
                <Switch checked={armed} onCheckedChange={setArmed} />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <Label>With Vehicle</Label>
                </div>
                <Switch checked={withVehicle} onCheckedChange={setWithVehicle} />
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit"
            disabled={loading || !name || !email || !address}
            className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
      </div>

      {/* Bottom Navigation */}
      <GuardBottomNav currentPath="/apply" navigate={navigate} />
    </div>
  );
};

export default FreelancerApplyPage;