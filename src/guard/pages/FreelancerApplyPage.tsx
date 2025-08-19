import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Upload, Car, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FileUpload from '@/components/ui/file-upload';
import GuardBottomNav from '@/components/mobile/GuardBottomNav';
import { t, getPreferredLanguage, formatMXN, Lang } from '@/lib/i18n';
import { LanguageToggle } from '@/components/ui/language-toggle';

interface FreelancerApplyPageProps {
  navigate: (path: string) => void;
}

const FreelancerApplyPage = ({ navigate }: FreelancerApplyPageProps) => {
  const [loading, setLoading] = useState(false);
  const [lang] = useState<Lang>(getPreferredLanguage());
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [armed, setArmed] = useState(false);
  const [withVehicle, setWithVehicle] = useState(false);
  
  // Pricing fields (in MXN centavos)
  const [hourlyRateCents, setHourlyRateCents] = useState(80000); // $800 MXN
  const [armedSurchargeCents, setArmedSurchargeCents] = useState(20000); // $200 MXN
  const [vehicleRateCents, setVehicleRateCents] = useState(350000); // $3,500 MXN
  const [armoredSurchargeCents, setArmoredSurchargeCents] = useState(150000); // $1,500 MXN
  
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
          with_vehicle: withVehicle,
          hourly_rate_mxn_cents: hourlyRateCents,
          armed_hourly_surcharge_mxn_cents: armedSurchargeCents,
          vehicle_hourly_rate_mxn_cents: withVehicle ? vehicleRateCents : null,
          armored_hourly_surcharge_mxn_cents: withVehicle ? armoredSurchargeCents : null
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
            {t('book_protector', lang)}
          </h2>
          <LanguageToggle />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-accent" />
                <CardTitle className="text-mobile-base">{t('personal_info', lang)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('name', lang)}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-dark"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('email', lang)}</Label>
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
                <Label htmlFor="phone">{t('phone', lang)}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-dark"
                  placeholder={t('phone', lang)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t('address', lang)}</Label>
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

          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-accent" />
                <CardTitle className="text-mobile-base">{t('pricing', lang)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">{t('hourly_rate_mxn', lang)}</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={hourlyRateCents / 100}
                  onChange={(e) => setHourlyRateCents(Math.round(parseFloat(e.target.value || '0') * 100))}
                  className="input-dark"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  {formatMXN(hourlyRateCents)} {t('hourly_rate_mxn', lang).toLowerCase()}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="armedSurcharge">{t('armed_surcharge_mxn', lang)}</Label>
                <Input
                  id="armedSurcharge"
                  type="number"
                  value={armedSurchargeCents / 100}
                  onChange={(e) => setArmedSurchargeCents(Math.round(parseFloat(e.target.value || '0') * 100))}
                  className="input-dark"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  +{formatMXN(armedSurchargeCents)} {t('armed_surcharge_mxn', lang).toLowerCase()}
                </p>
              </div>
              {withVehicle && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleRate">{t('vehicle_hourly_mxn', lang)}</Label>
                    <Input
                      id="vehicleRate"
                      type="number"
                      value={vehicleRateCents / 100}
                      onChange={(e) => setVehicleRateCents(Math.round(parseFloat(e.target.value || '0') * 100))}
                      className="input-dark"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatMXN(vehicleRateCents)} {t('vehicle_hourly_mxn', lang).toLowerCase()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="armoredSurcharge">{t('armored_surcharge_mxn', lang)}</Label>
                    <Input
                      id="armoredSurcharge"
                      type="number"
                      value={armoredSurchargeCents / 100}
                      onChange={(e) => setArmoredSurchargeCents(Math.round(parseFloat(e.target.value || '0') * 100))}
                      className="input-dark"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-muted-foreground">
                      +{formatMXN(armoredSurchargeCents)} {t('armored_surcharge_mxn', lang).toLowerCase()}
                    </p>
                  </div>
                </>
              )}
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
                  <Label>{t('armed_required', lang)}</Label>
                </div>
                <Switch checked={armed} onCheckedChange={setArmed} />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <Label>{t('vehicle_required', lang)}</Label>
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