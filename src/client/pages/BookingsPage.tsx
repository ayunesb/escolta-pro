import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/mobile/BottomNav';

interface Booking {
  id: string;
  pickup_address?: string;
  start_ts?: string;
  end_ts?: string;
  status: string;
  protectors: number;
  quote_amount?: number;
  currency?: string;
  created_at: string;
}

interface BookingsPageProps {
  navigate: (path: string) => void;
}

const BookingsPage = ({ navigate }: BookingsPageProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching bookings:', error);
        } else {
          setBookings(data || []);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-success text-white';
      case 'pending':
      case 'matching':
        return 'bg-warning text-black';
      case 'cancelled':
        return 'bg-destructive text-white';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'Time TBD';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDuration = (start?: string, end?: string) => {
    if (!start || !end) return 'Duration TBD';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    return `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-mobile-xl font-semibold text-foreground">
            My Bookings
          </h1>
          <p className="text-mobile-sm text-muted-foreground">
            Track your security escort requests
          </p>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-mobile-base font-medium text-foreground mb-2">
              No bookings yet
            </h3>
            <p className="text-mobile-sm text-muted-foreground mb-6">
              Book your first security escort to get started
            </p>
            <button
              onClick={() => navigate('/book')}
              className="text-accent hover:underline font-medium"
            >
              Book a Protector
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-mobile-base">
                      Booking #{booking.id.slice(-8)}
                    </CardTitle>
                    <Badge 
                      className={getStatusColor(booking.status)}
                      variant="secondary"
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {booking.pickup_address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-mobile-sm text-foreground">
                        {booking.pickup_address}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-mobile-sm text-foreground">
                      {formatDate(booking.start_ts)} at {formatTime(booking.start_ts)}
                      {booking.end_ts && ` • ${getDuration(booking.start_ts, booking.end_ts)}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-mobile-sm text-foreground">
                      {booking.protectors} protector{booking.protectors > 1 ? 's' : ''}
                    </span>
                  </div>

                  {booking.quote_amount && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-mobile-sm text-muted-foreground">
                        Total
                      </span>
                      <span className="text-mobile-sm font-semibold text-accent">
                        ${booking.currency || 'MXN'} {booking.quote_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentPath="/bookings" navigate={navigate} />
    </div>
  );
};

export default BookingsPage;