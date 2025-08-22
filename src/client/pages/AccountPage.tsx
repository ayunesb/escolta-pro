import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatMXN } from '@/utils/pricing';
import { User, Camera, FileText, Settings, LogOut, Shield, Star } from 'lucide-react';
import BottomNav from '@/components/mobile/BottomNav';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { t, getPreferredLanguage, type Lang } from '@/lib/i18n';

interface AccountPageProps {
  navigate: (path: string) => void;
}

interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_e164?: string;
  role: string;
  kyc_status: string;
  photo_url?: string;
}

interface GuardProfile {
  id: string;
  hourly_rate_mxn_cents: number;
  armed_hourly_surcharge_mxn_cents: number;
  rating: number;
  city?: string;
  active: boolean;
  availability_status: string;
}

const AccountPage = ({ navigate }: AccountPageProps) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guardProfile, setGuardProfile] = useState<GuardProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLang] = useState<Lang>(getPreferredLanguage());

  useEffect(() => {
    loadProfile();
  }, [user, loadProfile]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      setProfile(profileData);

      // If user has guard role, load guard-specific data
      if (profileData.role === 'freelancer' || profileData.role === 'company_admin') {
        const { data: guardData, error: guardError } = await supabase
          .from('guards')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (guardError) {
          console.error('Error loading guard profile:', guardError);
        } else if (guardData) {
          setGuardProfile(guardData);
        }
      }
  } catch (error: unknown) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
  } catch (error: unknown) {
      console.error('Sign out error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive'
      });
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-mobile-xl font-bold text-foreground">
            {t('account', currentLang)}
          </h1>
          <LanguageToggle />
        </div>

        <div className="space-y-6 pb-20">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  {profile.photo_url ? (
                    <img 
                      src={profile.photo_url} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-mobile-lg font-semibold">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  <p className="text-mobile-sm text-muted-foreground">
                    {profile.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {profile.role}
                    </Badge>
                    <Badge className={getKycStatusColor(profile.kyc_status)}>
                      {t(profile.kyc_status, currentLang)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/profile-edit')}
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('edit_profile', currentLang)}
              </Button>
            </CardContent>
          </Card>

          {/* Guard Pricing Card (for freelancers and company admins) */}
          {guardProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('guard_profile', currentLang)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-mobile-sm font-medium">{t('base_rate', currentLang)}</Label>
                    <p className="text-mobile-lg font-semibold text-accent">
                      {formatMXN(guardProfile.hourly_rate_mxn_cents)}/hr
                    </p>
                  </div>
                  <div>
                    <Label className="text-mobile-sm font-medium">Armed Surcharge</Label>
                    <p className="text-mobile-lg font-semibold text-accent">
                      +{formatMXN(guardProfile.armed_hourly_surcharge_mxn_cents)}/hr
                    </p>
                  </div>
                  <div>
                    <Label className="text-mobile-sm font-medium">{t('rating', currentLang)}</Label>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-mobile-base font-semibold">
                        {guardProfile.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-mobile-sm font-medium">Status</Label>
                    <Badge variant={guardProfile.active ? "default" : "secondary"}>
                      {t(guardProfile.active ? 'active' : 'inactive', currentLang)}
                    </Badge>
                  </div>
                </div>

                {guardProfile.city && (
                  <div>
                    <Label className="text-mobile-sm font-medium">{t('service_area', currentLang)}</Label>
                    <p className="text-mobile-base">{guardProfile.city}</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/profile-edit')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {t('edit_guard_settings', currentLang)}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('account_actions', currentLang)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/profile-edit')}
              >
                <FileText className="h-4 w-4 mr-2" />
                {t('documents_verification', currentLang)}
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/profile-edit')}
              >
                <Camera className="h-4 w-4 mr-2" />
                {t('update_profile_photo', currentLang)}
              </Button>

              <Separator />

              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('sign_out', currentLang)}
              </Button>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-mobile-sm text-muted-foreground">
                  Escolta Pro v1.0.0
                </p>
                <p className="text-xs text-muted-foreground">
                  Professional security services platform
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav currentPath="/account" navigate={navigate} />
    </div>
  );
};

export default AccountPage;