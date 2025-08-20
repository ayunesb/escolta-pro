import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Star, MapPin, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/mobile/BottomNav';

interface Guard {
  id: string;
  photo_url?: string;
  skills: any;
  rating: number;
  city?: string;
  hourly_rate_mxn_cents?: number;
  armed_hourly_surcharge_mxn_cents?: number;
  vehicle_hourly_rate_mxn_cents?: number;
  armored_hourly_surcharge_mxn_cents?: number;
  dress_codes?: string[];
  status?: string;
  company_id?: string;
}

interface ProfilePageProps {
  navigate: (path: string) => void;
  id: string | null;
}

const ProfilePage = ({ navigate, id }: ProfilePageProps) => {
  const [guard, setGuard] = useState<Guard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/home');
      return;
    }

    const fetchGuard = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_public_guard_by_id', { _id: id });
        
        if (error) {
          console.error('Error fetching guard:', error);
          navigate('/home');
        } else {
          const rows = (data as any[]) || [];
          if (rows.length === 0) {
            navigate('/home');
          } else {
            setGuard(rows[0] as any);
          }
        }
      } catch (error) {
        console.error('Error fetching guard:', error);
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };

    fetchGuard();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!guard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-mobile-lg font-semibold text-foreground mb-2">
            Protector not found
          </h2>
          <Button onClick={() => navigate('/home')} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const skills = guard.skills || {};
  const skillsList = Object.entries(skills).filter(([_, value]) => value === true).map(([key]) => key);
  
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/home')}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Protector Profile
          </h2>
          <div className="w-6" />
        </div>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
              {guard.photo_url ? (
                <img 
                  src={guard.photo_url} 
                  alt="Guard" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Shield className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="text-mobile-lg font-semibold text-foreground">
                {guard.rating.toFixed(1)}
              </span>
              <span className="text-mobile-sm text-muted-foreground">
                rating
              </span>
            </div>

            {guard.city && (
              <div className="flex items-center justify-center gap-1 mb-4">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-mobile-sm text-muted-foreground">
                  {guard.city}
                </span>
              </div>
            )}

            {guard.company_id && (
              <Badge className="bg-green-500 text-white mb-4">
                <CheckCircle className="h-3 w-3 mr-1" />
                Company Verified
              </Badge>
            )}

            <div className="space-y-2">
              {guard.hourly_rate_mxn_cents && (
                <div className="text-mobile-xl font-semibold text-accent">
                  {formatPrice(guard.hourly_rate_mxn_cents)}/hr
                </div>
              )}
              
              {guard.armed_hourly_surcharge_mxn_cents && guard.armed_hourly_surcharge_mxn_cents > 0 && (
                <div className="text-mobile-sm text-muted-foreground">
                  +{formatPrice(guard.armed_hourly_surcharge_mxn_cents)}/hr armed
                </div>
              )}
              
              {guard.vehicle_hourly_rate_mxn_cents && guard.vehicle_hourly_rate_mxn_cents > 0 && (
                <div className="text-mobile-sm text-muted-foreground">
                  Vehicle: {formatPrice(guard.vehicle_hourly_rate_mxn_cents)}/hr
                </div>
              )}
              
              {guard.armored_hourly_surcharge_mxn_cents && guard.armored_hourly_surcharge_mxn_cents > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Armored Vehicle Available
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills & Qualifications */}
        {skillsList.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-mobile-base">Skills & Qualifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dress Codes */}
        {guard.dress_codes && guard.dress_codes.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-mobile-base">Available Dress Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {guard.dress_codes.map((code) => (
                  <Badge key={code} variant="outline" className="text-xs">
                    {code.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Book Button */}
        <div className="mb-6">
          <Button 
            onClick={() => navigate(`/book?pid=${guard.id}`)}
            className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            Book this Protector
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentPath="/profile" navigate={navigate} />
    </div>
  );
};

export default ProfilePage;