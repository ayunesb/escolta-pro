import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatMXN } from '@/utils/pricing';
import { MapPin, Clock, Shield, Car, RefreshCw, Eye, UserCheck, Users } from 'lucide-react';
import BottomNav from '@/components/mobile/BottomNav';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import HapticButton from '@/components/mobile/HapticButton';
import { t, getPreferredLanguage, type Lang } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';

interface BookingsPageProps {
  navigate: (path: string) => void;
}

interface Booking {
  id: string;
  pickup_address: string;
  start_ts: string;
  end_ts: string;
  armed_required: boolean;
  vehicle_required: boolean;
  vehicle_type?: string;
  total_mxn_cents: number;
  status: string;
  notes?: string;
  created_at: string;
  client_id?: string;
  assigned_user_id?: string;
  assigned_company_id?: string;
}

const BookingsPage = ({ navigate }: BookingsPageProps) => {
  const [currentLang] = useState<Lang>(getPreferredLanguage());
  const { hasRole } = useAuth();
  const { toast } = useToast();
  
  // Separate state for different booking types
  const [availableBookings, setAvailableBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  // Determine what bookings to show based on role
  const getBookingsContent = () => {
    if (hasRole('client')) {
      return {
        title: t('my_bookings', currentLang),
        showAvailable: false,
        showMyBookings: true,
        showBook: true
      };
    } else if (hasRole('freelancer') || hasRole('company_admin')) {
      return {
        title: t('bookings', currentLang),
        showAvailable: true,
        showMyBookings: true,
        showBook: false
      };
    }
    return {
      title: t('bookings', currentLang),
      showAvailable: false,
      showMyBookings: false,
      showBook: false
    };
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      if (hasRole('client')) {
        // Clients see their own bookings
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setMyBookings(data || []);
      } else if (hasRole('freelancer') || hasRole('company_admin')) {
        // Guards and companies see available + assigned bookings
        const [availableRes, assignedRes] = await Promise.all([
          // Available bookings (matching status)
          supabase
            .from('bookings')
            .select('*')
            .eq('status', 'matching')
            .order('created_at', { ascending: false }),
          // My assigned bookings
          supabase
            .from('bookings')
            .select('*')
            .not('status', 'eq', 'matching')
            .order('created_at', { ascending: false })
        ]);

        if (availableRes.error) throw availableRes.error;
        if (assignedRes.error) throw assignedRes.error;

        setAvailableBookings(availableRes.data || []);
        setMyBookings(assignedRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Accept booking (for guards)
  const acceptBooking = async (bookingId: string) => {
    if (!hasRole('freelancer')) return;
    
    setAccepting(bookingId);
    try {
      const { data, error } = await supabase.functions.invoke('booking_accept', {
        body: { booking_id: bookingId }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Booking accepted successfully'
      });

      // Refresh bookings
      fetchBookings();
    } catch (error: any) {
      console.error('Error accepting booking:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept booking',
        variant: 'destructive'
      });
    } finally {
      setAccepting(null);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matching':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'assigned':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'enroute':
        return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'onsite':
        return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'in_progress':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'canceled':
      case 'failed':
        return 'bg-red-500/10 text-red-600 border-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    return t(status, currentLang);
  };

  const renderBookingCard = (booking: Booking, showAccept: boolean = false) => (
    <Card key={booking.id} className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-mobile-sm font-medium line-clamp-1">
                {booking.pickup_address}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-mobile-sm text-muted-foreground">
                {new Date(booking.start_ts).toLocaleDateString('es-MX', {
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric'
                })} at {new Date(booking.start_ts).toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Badge>
            <span className="text-mobile-sm font-semibold text-accent">
              {formatMXN(booking.total_mxn_cents)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Service Details */}
        <div className="flex gap-4 text-mobile-sm">
          {booking.armed_required && (
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-amber-500" />
              <span className="text-amber-600 font-medium">Armed</span>
            </div>
          )}
          {booking.vehicle_required && (
            <div className="flex items-center gap-1">
              <Car className="h-4 w-4 text-blue-500" />
              <span className="text-blue-600 font-medium">
                {booking.vehicle_type || 'Vehicle'}
              </span>
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="mt-3 text-mobile-sm text-muted-foreground">
          Duration: {Math.round((new Date(booking.end_ts).getTime() - new Date(booking.start_ts).getTime()) / (1000 * 60 * 60))} hours
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="mt-2 text-mobile-sm text-muted-foreground">
            <span className="font-medium">Notes:</span> {booking.notes}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          {showAccept && booking.status === 'matching' && (
            <HapticButton 
              onClick={() => acceptBooking(booking.id)}
              disabled={accepting === booking.id}
              hapticPattern="medium"
              className="flex-1"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {accepting === booking.id ? 'Accepting...' : 'Accept Job'}
            </HapticButton>
          )}
          
          {booking.status === 'matching' && hasRole('client') && (
            <HapticButton 
              variant="outline" 
              size="sm" 
              className="w-full"
              disabled
              hapticPattern="light"
            >
              {t('finding_guards', currentLang)}
            </HapticButton>
          )}

          {['assigned', 'enroute', 'onsite', 'in_progress'].includes(booking.status) && (
            <HapticButton 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate(`/booking/${booking.id}`)}
              hapticPattern="light"
            >
              {hasRole('client') ? t('track_service', currentLang) : 'Manage Job'}
            </HapticButton>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const bookingsContent = getBookingsContent();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-mobile-xl font-bold text-foreground">
            {bookingsContent.title}
          </h1>
          <HapticButton
            variant="ghost"
            size="sm"
            onClick={fetchBookings}
            hapticPattern="light"
            className="p-2"
          >
            <RefreshCw className="h-4 w-4" />
          </HapticButton>
        </div>

        <PullToRefresh onRefresh={fetchBookings} className="min-h-96">
          {/* Available Jobs Section (for guards/companies) */}
          {bookingsContent.showAvailable && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-accent" />
                <h2 className="text-mobile-lg font-semibold">Available Jobs</h2>
                <Badge variant="secondary" className="ml-auto">
                  {availableBookings.length}
                </Badge>
              </div>
              
              {availableBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No available jobs at the moment</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {availableBookings.map((booking) => 
                    renderBookingCard(booking, hasRole('freelancer'))
                  )}
                </div>
              )}
            </div>
          )}

          {/* My Bookings/Jobs Section */}
          {bookingsContent.showMyBookings && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-accent" />
                <h2 className="text-mobile-lg font-semibold">
                  {hasRole('client') ? 'My Bookings' : 'My Jobs'}
                </h2>
                <Badge variant="secondary" className="ml-auto">
                  {myBookings.length}
                </Badge>
              </div>
              
              {myBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-mobile-lg font-medium mb-2">
                      {hasRole('client') ? t('no_bookings', currentLang) : 'No jobs yet'}
                    </h3>
                    <p className="text-mobile-sm text-muted-foreground text-center mb-4">
                      {hasRole('client') 
                        ? t('book_first_service', currentLang)
                        : 'Accept available jobs to see them here'
                      }
                    </p>
                    {bookingsContent.showBook && (
                      <HapticButton 
                        onClick={() => navigate('/book')}
                        hapticPattern="medium"
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        {t('book_protector', currentLang)}
                      </HapticButton>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4 pb-20">
                  {myBookings.map((booking) => renderBookingCard(booking, false))}
                </div>
              )}
            </div>
          )}
        </PullToRefresh>
      </div>

      <BottomNav currentPath="/bookings" navigate={navigate} />
    </div>
  );
};

export default BookingsPage;