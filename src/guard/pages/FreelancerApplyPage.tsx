import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FreelancerApplyPageProps {
  navigate: (path: string) => void;
}

const FreelancerApplyPage = ({ navigate }: FreelancerApplyPageProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('freelancer_apply', {
        body: { name, email, address }
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

          <Button 
            type="submit"
            disabled={loading || !name || !email || !address}
            className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FreelancerApplyPage;