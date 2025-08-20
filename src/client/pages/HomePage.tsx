import { useState, useEffect } from 'react';
import { Star, MapPin, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/mobile/BottomNav';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import HapticButton from '@/components/mobile/HapticButton';
import SwipeGestures from '@/components/mobile/SwipeGestures';

interface Guard {
  id: string;
  photo_url?: string;
  skills?: any;
  rating: number;
  city?: string;
  hourly_rate_mxn_cents?: number;
  armed_hourly_surcharge_mxn_cents?: number;
  company_id?: string;
}

interface HomePageProps {
  navigate: (path: string) => void;
}

const HomePage = ({ navigate }: HomePageProps) => {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGuards = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_public_guards');
      
      if (error) {
        console.error('Error fetching guards:', error);
        return;
      }

      setGuards(((data || []) as unknown as Guard[]));
    } catch (error) {
      console.error('Error fetching guards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuards();
  }, []);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const valueProps = [
    {
      icon: Shield,
      title: "Professional Security",
      description: "Licensed and trained protection specialists"
    },
    {
      icon: Star,
      title: "5-Star Service", 
      description: "Highest rated security escort service"
    },
    {
      icon: MapPin,
      title: "24/7 Availability",
      description: "Round-the-clock protection when you need it"
    },
    {
      icon: ArrowRight,
      title: "Verified Guards",
      description: "Background checked and certified personnel"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PullToRefresh onRefresh={fetchGuards}>
        <div className="safe-top px-mobile">
          {/* Hero Section */}
          <div className="pt-8 pb-6 text-center">
            <h1 data-testid="hero-title" className="text-hero font-hero text-foreground mb-4">
              Professional Security<br />at Your Service
            </h1>
            <p className="text-mobile-base text-muted-foreground mb-8 max-w-sm mx-auto">
              Book verified security escorts for your protection and peace of mind
            </p>
            <HapticButton 
              data-testid="hero-cta"
              onClick={() => navigate('/book')}
              size="lg"
              hapticPattern="medium"
              className="w-full max-w-xs"
            >
              Book a Protector
            </HapticButton>
          </div>

          {/* Value Proposition Swipeable Cards */}
          <div className="py-6">
            <SwipeGestures 
              className="overflow-hidden"
              enableHaptics={true}
            >
              <div 
                data-testid="value-carousel"
                className="flex gap-4 overflow-x-auto scroll-snap-x pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {valueProps.map((prop, index) => (
                  <Card 
                    key={index}
                    data-testid={`value-card-${index + 1}`}
                    className="flex-shrink-0 w-64 h-card scroll-snap-center card-hover"
                  >
                    <CardContent className="p-4 h-full flex items-center space-x-3">
                      <div className="rounded-lg bg-accent/10 p-2 flex-shrink-0">
                        <prop.icon className="h-6 w-6 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-mobile-sm font-semibold text-foreground">
                          {prop.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {prop.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </SwipeGestures>
          </div>

          {/* Featured Guards */}
          <div className="py-6">
            <h2 className="text-mobile-lg font-semibold text-foreground mb-4">
              Featured Protectors
            </h2>
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {guards.map((guard) => (
                  <Card 
                    key={guard.id}
                    className="cursor-pointer card-hover"
                    onClick={() => navigate(`/profile?id=${guard.id}`)}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-3 flex items-center justify-center">
                        {guard.photo_url ? (
                          <img 
                            src={guard.photo_url} 
                            alt="Guard" 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Shield className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs text-foreground">
                          {guard.rating.toFixed(1)}
                        </span>
                      </div>
                      
                      {guard.hourly_rate_mxn_cents && (
                        <div className="text-xs font-semibold text-accent mb-1">
                          {formatPrice(guard.hourly_rate_mxn_cents)}/hr
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        {guard.city && (
                          <Badge variant="secondary" className="text-xs">
                            {guard.city}
                          </Badge>
                        )}
                        
                        {guard.company_id && (
                          <div className="flex items-center justify-center gap-1">
                            <ArrowRight className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-muted-foreground">Verified</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>

      {/* Bottom Navigation */}
      <BottomNav currentPath="/home" navigate={navigate} />
    </div>
  );
};

export default HomePage;