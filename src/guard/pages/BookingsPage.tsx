import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Calendar, Clock, Users, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  pickup_address?: string;
  start_ts?: string;
  end_ts?: string;
  protectors: number;
  protectees: number;
  armed_required: boolean;
  vehicle_required: boolean;
  vehicle_type?: string;
  tier: string;
  status: string;
  city?: string;
  dress_code?: string;
  notes?: string;
}

interface BookingsPageProps {
  navigate: (path: string) => void;
}

const BookingsPage = ({ navigate }: BookingsPageProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableBookings = async () => {
      if (!user) return;
      
      try {
        // Get bookings that are in 'matching' status and don't have assignments yet
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('status', 'matching')
          .not('id', 'in', 
            `(SELECT booking_id FROM assignments WHERE guard_id = '${user.id}')`
          )
          .order('start_ts', { ascending: true });
        
        if (error) {
          console.error('Error fetching available bookings:', error);
        } else {
          setBookings(data || []);
        }
      } catch (error) {
        console.error('Error fetching available bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableBookings();
  }, [user]);

  const handleApplyForJob = async (bookingId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          booking_id: bookingId,
          guard_id: user.id,
          status: 'offered'
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to apply for this job. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Application Sent",
          description: "Your application has been submitted successfully.",
        });
        // Remove the booking from the list or refresh
        setBookings(prev => prev.filter(b => b.id !== bookingId));
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      toast({
        title: "Error",
        description: "Failed to apply for this job. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'premium':
        return 'bg-accent text-white';
      case 'standard':
        return 'bg-success text-white';
      case 'direct':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
            Available Jobs
          </h2>
          <div className="w-6" />
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-mobile-base font-medium text-foreground mb-2">
              No available jobs
            </h3>
            <p className="text-mobile-sm text-muted-foreground">
              New job opportunities will appear here when available
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-mobile-base">
                      Job #{booking.id.slice(-8)}
                    </CardTitle>
                    <Badge className={getStatusColor(booking.tier)}>
                      {booking.tier.toUpperCase()}
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
                  
                  {booking.start_ts && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-mobile-sm text-foreground">
                        {new Date(booking.start_ts).toLocaleDateString()} at{' '}
                        {new Date(booking.start_ts).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  )}

                  {booking.start_ts && booking.end_ts && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-mobile-sm text-foreground">
                        Duration: {Math.round(
                          (new Date(booking.end_ts).getTime() - 
                           new Date(booking.start_ts).getTime()) / (1000 * 60 * 60)
                        )}h
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-mobile-sm text-foreground">
                      {booking.protectors} guard{booking.protectors > 1 ? 's' : ''} • {booking.protectees} client{booking.protectees > 1 ? 's' : ''}
                    </span>
                  </div>

                  {booking.armed_required && (
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-mobile-sm text-foreground">
                        Armed protection required
                      </span>
                    </div>
                  )}

                  {booking.vehicle_required && booking.vehicle_type && (
                    <div className="flex items-center gap-3">
                      <span className="text-mobile-sm text-foreground">
                        🚗 Vehicle: {booking.vehicle_type}
                      </span>
                    </div>
                  )}

                  {booking.dress_code && (
                    <div className="flex items-center gap-3">
                      <span className="text-mobile-sm text-foreground">
                        👔 Dress code: {booking.dress_code}
                      </span>
                    </div>
                  )}

                  {booking.notes && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-mobile-sm text-foreground">
                        <strong>Notes:</strong> {booking.notes}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <Button 
                      onClick={() => handleApplyForJob(booking.id)}
                      size="sm" 
                      className="w-full bg-accent hover:bg-accent/90"
                    >
                      Apply for This Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;