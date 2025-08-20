import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatMXN } from '@/utils/pricing';
import { MapPin, Clock, Shield, Car, RefreshCw, Eye } from 'lucide-react';
import BottomNav from '@/components/mobile/BottomNav';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import HapticButton from '@/components/mobile/HapticButton';
import { t, getPreferredLanguage, type Lang } from '@/lib/i18n';
import { useRealTimeBookings, useRealTimeNotifications } from '@/hooks/use-real-time';
import { VirtualList } from '@/components/performance/VirtualList';

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
}

const BookingsPage = ({ navigate }: BookingsPageProps) => {
  const [currentLang] = useState<Lang>(getPreferredLanguage());
  
  // Use real-time bookings hook
  const { bookings, loading, refetch } = useRealTimeBookings();
  
  // Use real-time notifications
  const { 
    notifications, 
    requestNotificationPermission,
    clearNotifications 
  } = useRealTimeNotifications();

  useEffect(() => {
    // Request notification permission on mount
    requestNotificationPermission();
  }, [requestNotificationPermission]);

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
            {t('bookings', currentLang)}
          </h1>
          <HapticButton
            variant="ghost"
            size="sm"
            onClick={refetch}
            hapticPattern="light"
            className="p-2"
          >
            <RefreshCw className="h-4 w-4" />
          </HapticButton>
        </div>

        <PullToRefresh onRefresh={refetch} className="min-h-96">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-mobile-lg font-medium mb-2">
                  {t('no_bookings', currentLang)}
                </h3>
                <p className="text-mobile-sm text-muted-foreground text-center mb-4">
                  {t('book_first_service', currentLang)}
                </p>
                <HapticButton 
                  onClick={() => navigate('/book')}
                  hapticPattern="medium"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {t('book_protector', currentLang)}
                </HapticButton>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 pb-20">
              {bookings.map((booking) => (
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

                    {/* Action buttons based on status */}
                    {booking.status === 'matching' && (
                      <div className="mt-4">
                        <HapticButton 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          disabled
                          hapticPattern="light"
                        >
                          {t('finding_guards', currentLang)}
                        </HapticButton>
                      </div>
                    )}

                    {['assigned', 'enroute', 'onsite', 'in_progress'].includes(booking.status) && (
                      <div className="mt-4">
                        <HapticButton 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => navigate(`/booking/${booking.id}`)}
                          hapticPattern="light"
                        >
                          {t('track_service', currentLang)}
                        </HapticButton>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </PullToRefresh>
      </div>

      <BottomNav currentPath="/bookings" navigate={navigate} />
    </div>
  );
};

export default BookingsPage;