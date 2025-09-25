import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HapticButton from '@/components/mobile/HapticButton';
import { BookingMatchCard } from '@/components/booking/BookingMatchCard';
import { useBookingMatching } from '@/hooks/use-booking-matching';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Users, Shield, Clock, TrendingUp, BanknoteIcon } from 'lucide-react';
import { getPaymentLedger, simulatePayment } from '@/lib/api';

interface Booking {
  id: string;
  client_id: string;
  status: string;
  start_ts: string;
  end_ts?: string;
  pickup_address: string;
  protectors: number;
  armed_required: boolean;
  vehicle_required: boolean;
  total_mxn_cents?: number;
  created_at: string;
}

interface MatchCriteria {
  armedRequired: boolean;
  vehicleRequired: boolean;
  startTime: Date;
  duration: number;
}

export const BookingsDashboard = () => {
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const { matchingGuards, isMatching, matchingProgress, findMatchingGuards, resetMatching } = useBookingMatching();
  const [ledger, setLedger] = useState<ReturnType<typeof getPaymentLedger>>([] as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  const demo = import.meta.env.VITE_DEMO_MODE === 'true';

  useEffect(() => {
    if (demo) {
      const id = setInterval(() => setLedger(getPaymentLedger() as any), 1500); // eslint-disable-line @typescript-eslint/no-explicit-any
      setLedger(getPaymentLedger() as any);
      return () => clearInterval(id);
    }
  }, [demo]);

  // Fetch bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings-dashboard'],
    queryFn: async () => {
  const { data, error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Booking[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Handle finding matches for a booking
  const handleFindMatches = async (bookingId: string, criteria: MatchCriteria) => {
    setSelectedBooking(bookingId);
    
    await findMatchingGuards({
      city: 'Mexico City', // This should come from booking data
      armed_required: criteria.armedRequired,
      vehicle_required: criteria.vehicleRequired,
      start_ts: criteria.startTime.toISOString(),
      min_hours: criteria.duration
    });
  };

  // Handle assigning a guard to a booking
  const handleAssignGuard = async (bookingId: string, guardId: string) => {
    try {
  const { error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .from('bookings')
        .update({ 
          assigned_user_id: guardId,
          status: 'assigned'
        })
        .eq('id', bookingId);

      if (error) throw error;
      
      // Reset matching state
      resetMatching();
      setSelectedBooking(null);
      
      // Refresh bookings data
      // This would trigger a refetch of the bookings query
    } catch (error) {
      console.error('Error assigning guard:', error);
    }
  };

  // Get booking statistics
  const stats = {
    total: bookings.length,
    active: bookings.filter(b => ['matching', 'assigned', 'in_progress'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    revenue: bookings
      .filter(b => b.total_mxn_cents)
      .reduce((sum, b) => sum + (b.total_mxn_cents || 0), 0) / 100
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matching': return 'bg-warning text-warning-foreground';
      case 'assigned': return 'bg-info text-info-foreground';
      case 'in_progress': return 'bg-accent text-accent-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
  {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-accent" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Bookings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-warning" />
              <div>
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-success" />
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-accent" />
              <div>
                <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
                <div className="text-xs text-muted-foreground">Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {demo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BanknoteIcon className="w-5 h-5 text-accent" /> Payment Simulator
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {ledger.length === 0 ? (
              <div className="text-sm text-muted-foreground">No payments yet. Complete a booking payment to see the split.</div>
            ) : (
              <table className="w-full text-xs md:text-sm">
                <thead className="text-muted-foreground text-[10px] uppercase">
                  <tr className="text-left">
                    <th className="p-1">ID</th>
                    <th className="p-1">Booking</th>
                    <th className="p-1">Total</th>
                    <th className="p-1">Fees</th>
                    <th className="p-1">Company</th>
                    <th className="p-1">Guard</th>
                    <th className="p-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.slice().reverse().map((row: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <tr key={row.id} className="border-t">
                      <td className="p-1 font-mono">{row.id.replace('pay_','')}</td>
                      <td className="p-1 font-mono">{row.booking_id}</td>
                      <td className="p-1">${'{'}(row.amount_cents/100).toFixed(2){'}'}</td>
                      <td className="p-1">${'{'}(row.stripe_fees_cents/100).toFixed(2){'}'}</td>
                      <td className="p-1">${'{'}(row.company_cut_cents/100).toFixed(2){'}'}</td>
                      <td className="p-1">${'{'}(row.guard_payout_cents/100).toFixed(2){'}'}</td>
                      <td className="p-1">
                        <Badge className="text-[10px]" variant={row.status === 'succeeded' ? 'default' : 'secondary'}>
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bookings Management */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending Match</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {bookings
            .filter(b => ['assigned', 'in_progress'].includes(b.status))
            .map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking}
                onSelect={setSelectedBooking}
              />
            ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {bookings
            .filter(b => b.status === 'matching')
            .map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking}
                onSelect={setSelectedBooking}
                showMatchButton
                onFindMatches={handleFindMatches}
              />
            ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {bookings
            .filter(b => ['completed', 'cancelled'].includes(b.status))
            .map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking}
                onSelect={setSelectedBooking}
              />
            ))}
        </TabsContent>
      </Tabs>

      {/* Guard Matches Modal/Section */}
      {selectedBooking && matchingGuards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Guards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {matchingGuards.map((guard) => (
              <BookingMatchCard
                key={guard.id}
                guard={guard}
                isArmed={true} // This should come from booking data
                hours={4} // This should come from booking data
                onSelect={(guardId) => handleAssignGuard(selectedBooking, guardId)}
                isSelected={false}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface BookingCardProps {
  booking: Booking;
  onSelect: (id: string) => void;
  showMatchButton?: boolean;
  onFindMatches?: (bookingId: string, criteria: MatchCriteria) => void;
}

const BookingCard = ({ booking, onSelect, showMatchButton, onFindMatches }: BookingCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matching': return 'bg-warning text-warning-foreground';
      case 'assigned': return 'bg-info text-info-foreground';
      case 'in_progress': return 'bg-accent text-accent-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  const demo = import.meta.env.VITE_DEMO_MODE === 'true';
  const handleSimPay = () => {
    if (!booking.total_mxn_cents) return;
    simulatePayment(booking.id, booking.total_mxn_cents);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">
                #{booking.id.slice(0, 8)}
              </span>
            </div>
            <div className="text-sm font-medium">
              {new Date(booking.start_ts).toLocaleString()}
            </div>
          </div>
          
          {booking.total_mxn_cents && (
            <div className="text-right">
              <div className="font-semibold">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN'
                }).format(booking.total_mxn_cents / 100)}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">{booking.pickup_address}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{booking.protectors} guards</span>
            </div>
            
            {booking.armed_required && (
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Armed
              </Badge>
            )}
          </div>
        </div>

        {showMatchButton && onFindMatches && (
          <div className="mt-3">
            <HapticButton
              onClick={() => onFindMatches(booking.id, {
                armedRequired: booking.armed_required,
                vehicleRequired: booking.vehicle_required,
                startTime: new Date(booking.start_ts),
                duration: 4
              })}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Find Guards
            </HapticButton>
          </div>
        )}
        {demo && booking.total_mxn_cents && booking.status !== 'completed' && (
          <div className="mt-2">
            <HapticButton
              onClick={handleSimPay}
              size="sm"
              variant="secondary"
              className="w-full"
            >
              Simulate Payment
            </HapticButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
};