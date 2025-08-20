import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { mxn } from '@/utils/money';
import { MapPin, Clock, Shield, Car, Briefcase, ArrowLeft } from 'lucide-react';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import GuardBottomNav from '@/components/mobile/GuardBottomNav';

type Booking = {
  id: string;
  pickup_address: string;
  start_ts: string;
  end_ts: string;
  armed_required: boolean;
  vehicle_required: boolean;
  total_mxn_cents?: number;
  status: string;
  tier?: string;
};

interface BookingsPageProps {
  navigate: (path: string) => void;
}

export default function BookingsPage({ navigate }: BookingsPageProps) {
  const [tab, setTab] = useState<'available'|'mine'>('available');
  const [items, setItems] = useState<Booking[]>([]);
  const [busy, setBusy] = useState(false);

  async function load(scope:'available'|'mine') {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('bookings_guard_list', {
        body: { scope }
      });

      if (error) {
        throw error;
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('Load error:', e);
      toast({ title: 'Error', description: e.message || 'Failed to load' });
    } finally { 
      setBusy(false); 
    }
  }

  useEffect(() => { 
    load(tab); 
  }, [tab]);

  async function accept(booking_id: string) {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('booking_accept', {
        body: { booking_id }
      });

      if (error) {
        throw error;
      }
      
      toast({ title: 'Assigned', description: 'You accepted this job.' });
      await load('mine'); 
      setTab('mine');
    } catch (e: any) {
      console.error('Accept error:', e);
      toast({ title: 'Cannot accept', description: e.message || 'Try again' });
    } finally { 
      setBusy(false); 
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border safe-top">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/account')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-mobile-lg font-semibold">Guard Jobs</h1>
        </div>
      </div>

      <PullToRefresh onRefresh={() => load(tab)} className="h-full">
        <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <Button 
            variant={tab === 'available' ? 'default' : 'outline'}
            onClick={() => setTab('available')}
            className="flex-1"
          >
            Available
          </Button>
          <Button 
            variant={tab === 'mine' ? 'default' : 'outline'}
            onClick={() => setTab('mine')}
            className="flex-1"
          >
            My Jobs
          </Button>
        </div>

        {busy && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        )}

        {!busy && items.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {tab === 'available' ? 'No Available Jobs' : 'No Assigned Jobs'}
            </h3>
            <p className="text-muted-foreground">
              {tab === 'available' ? 'Check back later for new opportunities' : 'Accept jobs from the Available tab'}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {items.map(b => (
            <Card key={b.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{b.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(b.start_ts).toLocaleDateString()} at{' '}
                        {new Date(b.start_ts).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {typeof b.total_mxn_cents === 'number' && (
                      <div className="text-lg font-semibold text-primary">
                        {mxn(b.total_mxn_cents)}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground capitalize">
                      {b.status}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Shield className={`h-4 w-4 ${b.armed_required ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    <span className={b.armed_required ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                      {b.armed_required ? 'Armed' : 'Unarmed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Car className={`h-4 w-4 ${b.vehicle_required ? 'text-blue-500' : 'text-muted-foreground'}`} />
                    <span className={b.vehicle_required ? 'text-blue-600 font-medium' : 'text-muted-foreground'}>
                      {b.vehicle_required ? 'Vehicle' : 'No vehicle'}
                    </span>
                  </div>
                </div>

                {tab === 'available' && (
                  <Button 
                    onClick={() => accept(b.id)}
                    className="w-full"
                    disabled={busy}
                  >
                    Accept Job
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      </PullToRefresh>
      
      {/* Add GuardBottomNav for proper role-based navigation */}
      <GuardBottomNav currentPath="/bookings" navigate={navigate} />
    </div>
  );
}