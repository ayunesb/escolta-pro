import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, MapPin, Shield, Car, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatMXN } from '@/utils/pricing';

interface BookingSuccessPageProps {
  navigate: (path: string) => void;
  bookingId?: string;
}

interface BookingRecord {
  id: string;
  pickup_address?: string;
  start_ts: string;
  end_ts: string;
  armed_required?: boolean;
  vehicle_required?: boolean;
  vehicle_type?: string;
  min_hours?: number;
  total_mxn_cents?: number;
  status?: string;
  [key: string]: unknown;
}

function isBookingRecord(value: unknown): value is BookingRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.start_ts === 'string' && typeof v.end_ts === 'string';
}

const BookingSuccessPage = ({ navigate, bookingId }: BookingSuccessPageProps) => {
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<
    | {
        id: string;
        booking_id: string;
        amount_cents: number;
        status: string;
        created_at: string;
      }
    | null
  >(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        navigate('/home');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (error) throw error;
  setBooking(isBookingRecord(data) ? data : null);

        // Atomic update: set status to 'matching' when newly created
        try {
          await supabase
            .from('bookings')
            .update({ status: 'matching' })
            .eq('id', bookingId)
            .in('status', ['pending', null as any]); // eslint-disable-line @typescript-eslint/no-explicit-any
        } catch {}

        // Load payment receipt for this booking (demo mode provides a payments snapshot)
        try {
          const { data: payData } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            .from('payments')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: false })
            .single();
          if (payData) setPayment(payData as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        } catch {}

      } catch (error) {
        console.error('Error fetching booking:', error);
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find your booking. Please contact support if you need assistance.
            </p>
            <Button onClick={() => navigate('/home')} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
  date: date.toLocaleDateString('es-MX', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
  time: date.toLocaleTimeString('es-MX', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })
    };
  };

  const startDateTime = formatDateTime(booking.start_ts);
  const endDateTime = formatDateTime(booking.end_ts);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Your protection service has been booked and paid for successfully.
          </p>
        </div>

        {/* Booking Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Finding Your Protector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Matching in Progress
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              We're currently matching you with qualified security professionals in your area. 
              You'll receive a notification once a protector accepts your booking.
            </p>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Pickup Location</div>
                <div className="text-sm text-muted-foreground">{booking.pickup_address}</div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Service Period</div>
                <div className="text-sm text-muted-foreground">
                  {startDateTime.date}
                </div>
                <div className="text-sm text-muted-foreground">
                  {startDateTime.time} - {endDateTime.time}
                </div>
              </div>
            </div>

            {/* Service Options */}
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Service Options</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {booking.armed_required && (
                    <Badge variant="outline" className="text-xs">
                      Armed Protection
                    </Badge>
                  )}
                  {booking.vehicle_required && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {booking.vehicle_type}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {booking.min_hours} hours minimum
                  </Badge>
                </div>
              </div>
            </div>

            {/* Total */}
            {booking.total_mxn_cents && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Paid</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatMXN(booking.total_mxn_cents)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Receipt */}
        {payment && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Payment Receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <Badge variant={payment.status === 'succeeded' ? 'default' : 'secondary'}>
                  {payment.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Amount</span>
                <span className="font-medium">{formatMXN(payment.amount_cents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Receipt ID</span>
                <span className="font-mono text-xs">{payment.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Date</span>
                <span>{new Date(payment.created_at).toLocaleString('es-MX')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/bookings')} 
            className="w-full"
          >
            View My Bookings
          </Button>
          <Button 
            onClick={() => navigate('/home')} 
            variant="outline" 
            className="w-full"
          >
            Back to Home
          </Button>
        </div>

        {/* Support Note */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@blindado.app" className="text-accent hover:underline">
              support@blindado.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;