import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompanyPageProps {
  navigate: (path: string) => void;
}

const CompanyPage = ({ navigate }: CompanyPageProps) => {
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [taxId, setTaxId] = useState('');
  const [payoutAccountId, setPayoutAccountId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('company_upsert', {
        body: {
          company_name: companyName,
          contact_name: contactName,
          contact_email: contactEmail,
          tax_id: taxId,
          payout_account_id: payoutAccountId
        }
      });

      if (error) {
        toast.error('Failed to update company');
      } else {
        toast.success('Company updated successfully');
        navigate('/account');
      }
    } catch (error) {
      toast.error('Failed to update company');
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
            Company Profile
          </h2>
          <div className="w-6" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-accent" />
                <CardTitle className="text-mobile-base">Company Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-dark"
                  placeholder="Enter company name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="input-dark"
                  placeholder="Enter tax identification number"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="input-dark"
                  placeholder="Enter contact person name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="input-dark"
                  placeholder="Enter contact email"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payoutAccountId">Payout Account ID</Label>
                <Input
                  id="payoutAccountId"
                  type="text"
                  value={payoutAccountId}
                  onChange={(e) => setPayoutAccountId(e.target.value)}
                  className="input-dark"
                  placeholder="Enter bank account or payment ID"
                />
                <p className="text-xs text-muted-foreground">
                  Account where payments will be deposited
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit"
            disabled={loading || !companyName || !contactName || !contactEmail || !taxId}
            className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            {loading ? 'Saving...' : 'Save Company Profile'}
          </Button>
        </form>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Button 
            variant="outline"
            onClick={() => navigate('/company-permits')}
            className="h-button"
          >
            Permits & Licenses
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/company-vehicles')}
            className="h-button"
          >
            Vehicle Fleet
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompanyPage;