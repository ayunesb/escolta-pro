import { useState, useEffect, useMemo } from 'react';
import { Star, MapPin, Shield, ArrowRight, Users, Building, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageToggle } from '@/components/ui/language-toggle';
import ThemeToggle from '@/components/ui/theme-toggle';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/mobile/BottomNav';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import HapticButton from '@/components/mobile/HapticButton';
import SwipeGestures from '@/components/mobile/SwipeGestures';
import { LazyImage } from '@/components/performance/LazyImage';
import { OptimizedSkeleton } from '@/components/performance/OptimizedSkeleton';
import { useImagePreloader, useDebounce } from '@/hooks/use-performance';
import { t, getPreferredLanguage } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { formatMXN } from '@/utils/pricing';
import { RouteGuard } from '@/components/auth/RouteGuard';

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
  const { hasRole } = useAuth();
  const [guards, setGuards] = useState<Guard[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeGuards: 0,
    monthlyRevenue: 0,
    completedJobs: 0
  });
  const [loading, setLoading] = useState(true);

  // Preload guard images for better performance
  const guardImageUrls = useMemo(() => 
    guards.filter(guard => guard.photo_url).map(guard => guard.photo_url!),
    [guards]
  );
  
  const { isLoaded: isImageLoaded } = useImagePreloader(guardImageUrls);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (hasRole('client')) {
        // Clients see available guards
        const { data, error } = await supabase.rpc('get_public_guards');
        if (error) throw error;
        setGuards((data || []) as unknown as Guard[]);
      } else if (hasRole('freelancer')) {
        // Guards see recent job opportunities
        const [bookingsRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('*')
            .eq('status', 'matching')
            .order('created_at', { ascending: false })
            .limit(5)
        ]);
        
        // Set recent opportunities as "guards" for display
        // (This is a temporary approach - would typically have separate state)
      } else if (hasRole('company_admin')) {
        // Company admins see dashboard stats
        const [bookingsRes, guardsRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('*')
            .not('assigned_company_id', 'is', null),
          supabase
            .from('guards')
            .select('*')
            .eq('status', 'active')
        ]);

        setStats({
          totalBookings: bookingsRes.data?.length || 0,
          activeGuards: guardsRes.data?.length || 0,
          monthlyRevenue: 0, // Would calculate from completed bookings
          completedJobs: bookingsRes.data?.filter(b => b.status === 'completed').length || 0
        });
      } else if (hasRole('super_admin')) {
        // Super admin sees global stats + all guards
        const [bookingsRes, guardsRes] = await Promise.all([
          supabase.from('bookings').select('*'),
          supabase.from('guards').select('*')
        ]);

        setGuards((guardsRes.data || []) as Guard[]);
        setStats({
          totalBookings: bookingsRes.data?.length || 0,
          activeGuards: guardsRes.data?.filter(g => g.status === 'active').length || 0,
          monthlyRevenue: 0, // Would calculate from all bookings
          completedJobs: bookingsRes.data?.filter(b => b.status === 'completed').length || 0
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  // Role-based content configuration
  const getHomeContent = () => {
    if (hasRole('client')) {
      return {
        title: 'Professional Security\nat Your Service',
        subtitle: 'Book verified security escorts for your protection and peace of mind',
        ctaText: 'Book a Protector',
        ctaAction: () => navigate('/book'),
        showGuards: true,
        showStats: false
      };
    } else if (hasRole('freelancer')) {
      return {
        title: 'Ready for Your\nNext Assignment',
        subtitle: 'View available jobs and manage your security escort services',
        ctaText: 'View Available Jobs',
        ctaAction: () => navigate('/bookings'),
        showGuards: false,
        showStats: true
      };
    } else if (hasRole('company_admin')) {
      return {
        title: 'Company\nDashboard',
        subtitle: 'Manage your security team, bookings, and business operations',
        ctaText: 'Manage Staff',
        ctaAction: () => navigate('/staff'),
        showGuards: false,
        showStats: true
      };
    } else if (hasRole('super_admin')) {
      return {
        title: 'System\nOverview',
        subtitle: 'Monitor platform activity, users, and global operations',
        ctaText: 'User Management',
        ctaAction: () => navigate('/users'),
        showGuards: true,
        showStats: true
      };
    }
    return {
      title: 'Welcome',
      subtitle: 'Loading your dashboard...',
      ctaText: 'Continue',
      ctaAction: () => {},
      showGuards: false,
      showStats: false
    };
  };

  const homeContent = getHomeContent();

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

  // Role-based stats display
  const getStatsCards = () => {
    if (hasRole('freelancer')) {
      return [
        { icon: DollarSign, title: 'Available Jobs', value: stats.totalBookings, color: 'text-green-600' },
        { icon: TrendingUp, title: 'Completed', value: stats.completedJobs, color: 'text-blue-600' }
      ];
    } else if (hasRole('company_admin')) {
      return [
        { icon: Users, title: 'Active Guards', value: stats.activeGuards, color: 'text-green-600' },
        { icon: Building, title: 'Total Jobs', value: stats.totalBookings, color: 'text-blue-600' },
        { icon: DollarSign, title: 'Completed', value: stats.completedJobs, color: 'text-purple-600' }
      ];
    } else if (hasRole('super_admin')) {
      return [
        { icon: Users, title: 'Active Guards', value: stats.activeGuards, color: 'text-green-600' },
        { icon: Building, title: 'Total Bookings', value: stats.totalBookings, color: 'text-blue-600' },
        { icon: TrendingUp, title: 'Completed', value: stats.completedJobs, color: 'text-purple-600' },
        { icon: DollarSign, title: 'Revenue', value: formatMXN(stats.monthlyRevenue), color: 'text-amber-600' }
      ];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-background">
      <PullToRefresh onRefresh={fetchData}>
        <div className="safe-top px-mobile">
          {/* Hero Section */}
          <div className="pt-8 pb-6 text-center">
            <h1 data-testid="hero-title" className="text-hero font-hero text-foreground mb-4">
              {homeContent.title}
            </h1>
            <p className="text-mobile-base text-muted-foreground mb-8 max-w-sm mx-auto">
              {homeContent.subtitle}
            </p>
            <HapticButton 
              data-testid="hero-cta"
              onClick={homeContent.ctaAction}
              size="lg"
              hapticPattern="medium"
              className="w-full max-w-xs"
            >
              {homeContent.ctaText}
            </HapticButton>
          </div>

          {/* Stats Dashboard (for non-clients) */}
          {homeContent.showStats && (
            <div className="py-6">
              <h2 className="text-mobile-lg font-semibold text-foreground mb-4">
                {hasRole('super_admin') ? 'Platform Overview' : 
                 hasRole('company_admin') ? 'Company Stats' : 
                 'Your Dashboard'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {getStatsCards().map((stat, index) => (
                  <Card key={index} className="card-hover">
                    <CardContent className="p-4 text-center">
                      <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                      <div className="text-2xl font-bold text-foreground">
                        {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">{stat.title}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Value Proposition Swipeable Cards (for clients) */}
          {hasRole('client') && (
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
          )}

      {/* Featured Guards (for clients and super admin) */}
      {homeContent.showGuards && (
        <div className="py-6">
          <h2 className="text-mobile-lg font-semibold text-foreground mb-4">
            {hasRole('super_admin') ? 'All Guards' : 'Featured Protectors'}
          </h2>
          {loading ? (
            <OptimizedSkeleton type="guard-card" count={4} className="grid grid-cols-2 gap-4" />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {guards.map((guard) => (
                <Card 
                  key={guard.id}
                  className="cursor-pointer card-hover"
                  onClick={() => hasRole('client') ? navigate(`/book?pid=${guard.id}`) : navigate(`/profile?id=${guard.id}`)}
                >
                  <CardContent className="p-3 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
                      {guard.photo_url ? (
                        <LazyImage
                          src={guard.photo_url}
                          alt="Guard profile"
                          className="w-full h-full rounded-full object-cover"
                          priority={false}
                          fallback={
                            <Shield className="h-8 w-8 text-muted-foreground" />
                          }
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
      )}
        </div>
      </PullToRefresh>

      {/* Bottom Navigation */}
      <BottomNav currentPath="/home" navigate={navigate} />
    </div>
  );
};

export default HomePage;