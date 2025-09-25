import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Calendar, MapPin, User, Settings, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getPaymentLedger } from '@/lib/api';
import GuardBottomNav from '@/components/mobile/GuardBottomNav';
import { useRealTimeAssignments, useRealTimeNotifications } from '@/hooks/use-real-time';
import HapticButton from '@/components/mobile/HapticButton';

interface Assignment {
  id: string;
  booking_id: string;
  status: string;
  check_in_ts?: string;
  check_out_ts?: string;
  on_site_ts?: string;
  bookings?: {
    pickup_address?: string;
    start_ts?: string;
    end_ts?: string;
    client_id?: string;
  } | Record<string, unknown>;
}

function isBookingRecord(value: unknown): value is { pickup_address?: string; start_ts?: string; end_ts?: string; client_id?: string } {
  if (!value || typeof value !== 'object') return false;
  // soft presence checks
  return true;
}

interface GuardHomePageProps {
  navigate: (path: string) => void;
}

const GuardHomePage = ({ navigate }: GuardHomePageProps) => {
  const { user, hasRole } = useAuth();
  const demo = import.meta.env.VITE_DEMO_MODE === 'true';
  const [payouts, setPayouts] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  
  // Use real-time assignments hook
  const { assignments, loading } = useRealTimeAssignments();
  
  // Use real-time notifications
  const { notifications, requestNotificationPermission } = useRealTimeNotifications();

  useEffect(() => {
    // Request notification permission on mount
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Periodically refresh demo payment payouts for this guard
  useEffect(() => {
    if (!demo || !user?.id) return;
    let alive = true;
    async function refresh() {
      try {
        const ledger = getPaymentLedger() as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('bookings')
          .select('id,assigned_user_id');
        const assignedMap = new Map((data || []).map((b: any) => [b.id, b.assigned_user_id])); // eslint-disable-line @typescript-eslint/no-explicit-any
        const filtered = ledger.filter(row => assignedMap.get(row.booking_id) === user.id);
        if (alive) setPayouts(filtered);
      } catch (e) { /* swallow */ }
    }
    refresh();
    const id = setInterval(refresh, 2000);
    return () => { alive = false; clearInterval(id); };
  }, [demo, user?.id]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'offered':
        return 'bg-warning text-black';
      case 'accepted':
        return 'bg-success text-white';
      case 'in_progress':
        return 'bg-accent text-white';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-mobile-xl font-semibold text-foreground">
              Welcome Back
            </h1>
            <p className="text-mobile-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HapticButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/account')}
              hapticPattern="light"
              className="w-10 h-10 bg-muted rounded-full flex items-center justify-center p-0"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
            </HapticButton>
            
            {notifications.length > 0 && (
              <HapticButton
                variant="ghost"
                size="sm"
                onClick={() => {/* Show notifications */}}
                hapticPattern="light"
                className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center p-0 relative"
              >
                <Bell className="h-5 w-5 text-accent" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              </HapticButton>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
            <CardContent 
              className="p-4 text-center"
              onClick={() => navigate('/assignments')}
            >
              <Calendar className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="text-mobile-sm font-medium text-foreground">
                Assignments
              </h3>
            </CardContent>
          </Card>

          {hasRole('freelancer') && (
            <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardContent 
                className="p-4 text-center"
                onClick={() => navigate('/apply')}
              >
                <User className="h-8 w-8 text-accent mx-auto mb-2" />
                <h3 className="text-mobile-sm font-medium text-foreground">
                  Apply
                </h3>
              </CardContent>
            </Card>
          )}

          {hasRole('company_admin') && (
            <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardContent 
                className="p-4 text-center"
                onClick={() => navigate('/security')}
              >
                <Shield className="h-8 w-8 text-accent mx-auto mb-2" />
                <h3 className="text-mobile-sm font-medium text-foreground">
                  Security
                </h3>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Assignments */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-mobile-lg font-semibold text-foreground">
              Recent Assignments
            </h2>
            {assignments.length > 0 && (
              <button
                onClick={() => navigate('/assignments')}
                className="text-accent hover:underline text-mobile-sm"
              >
                View All
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-mobile-base font-medium text-foreground mb-2">
                  No assignments yet
                </h3>
                <p className="text-mobile-sm text-muted-foreground">
                  Your assignments will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={getStatusColor(String(assignment.status))}>
                        {String(assignment.status).replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        #{assignment.id.slice(-8)}
                      </span>
                    </div>
                    
        {isBookingRecord(assignment.bookings) && assignment.bookings.pickup_address && (
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-mobile-sm text-foreground">
          {assignment.bookings.pickup_address}
                        </span>
                      </div>
                    )}
                    
        {isBookingRecord(assignment.bookings) && assignment.bookings.start_ts && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-mobile-sm text-foreground">
          {new Date(assignment.bookings.start_ts).toLocaleDateString()} at{' '}
          {new Date(assignment.bookings.start_ts).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {demo && payouts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-mobile-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              Payouts (Demo)
              <Badge variant="outline" className="text-[10px]">{payouts.length}</Badge>
            </h2>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left">Booking</th>
                    <th className="p-2 text-left">Total</th>
                    <th className="p-2 text-left">Your Share</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.slice().reverse().map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2 font-mono">{p.booking_id}</td>
                      <td className="p-2">${'{'}(p.amount_cents/100).toFixed(2){'}'}</td>
                      <td className="p-2 text-success font-medium">${'{'}(p.guard_payout_cents/100).toFixed(2){'}'}</td>
                      <td className="p-2">
                        <Badge variant={p.status === 'succeeded' ? 'default' : 'secondary'} className="text-[10px]">
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <GuardBottomNav currentPath="/home" navigate={navigate} />
    </div>
  );
};

export default GuardHomePage;