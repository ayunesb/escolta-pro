import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { mxn } from '@/utils/money';
import { MapPin, Clock, Shield, Car, Briefcase, ArrowLeft, Copy } from 'lucide-react';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import GuardBottomNav from '@/components/mobile/GuardBottomNav';
// import { getPaymentLedger } from '@/lib/api';

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
  const demo = import.meta.env.VITE_DEMO_MODE === 'true';
  const [payouts, setPayouts] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [codes, setCodes] = useState<Record<string, string>>({});

  async function load(scope:'available'|'mine') {
    setBusy(true);
    try {
  const { data, error } = await (supabase as any).functions.invoke('bookings_guard_list', { // eslint-disable-line @typescript-eslint/no-explicit-any
        body: { scope }
      });

      if (error) {
        throw error;
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('Load error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Error', description: msg || 'Failed to load' });
    } finally { 
      setBusy(false); 
    }
  }

  useEffect(() => { 
    load(tab); 
  }, [tab]);

  // Realtime refresh when bookings update (demo emits on 'bookings' channel)
  useEffect(() => {
    const channel = (supabase as any).channel?.('bookings') // eslint-disable-line @typescript-eslint/no-explicit-any
      ?.on?.('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        load(tab);
      })
      ?.subscribe?.();
    return () => {
      try { channel?.unsubscribe?.(); } catch { /* no-op */ }
    };
  }, [tab]);

  // Demo-only: fetch start codes for the guard's own jobs and cache them
  useEffect(() => {
    if (!demo || tab !== 'mine' || items.length === 0) return;
    let cancelled = false;
    async function fetchCodes() {
      const missing = items.filter(b => !codes[b.id]);
      for (const b of missing) {
        try {
          const { data } = await (supabase as any).functions.invoke('get_start_code', { body: { booking_id: b.id } }); // eslint-disable-line @typescript-eslint/no-explicit-any
          if (!cancelled && data?.start_code) {
            setCodes(prev => ({ ...prev, [b.id]: String(data.start_code) }));
          }
        } catch {}
      }
    }
    fetchCodes();
    return () => { cancelled = true; };
  }, [demo, tab, items, codes]);

  useEffect(() => {
    if (!demo) return;
    let active = true;
    async function loadPayouts() {
      try {
        const { data } = await (supabase as any).functions.invoke('payouts_list', { body: {} }); // eslint-disable-line @typescript-eslint/no-explicit-any
        if (active) setPayouts((data?.payouts || []) as any[]); // eslint-disable-line @typescript-eslint/no-explicit-any
      } catch {}
    }
    loadPayouts();
    const id = setInterval(loadPayouts, 3000);
    return () => { active = false; clearInterval(id); };
  }, [demo]);

  async function accept(booking_id: string) {
    setBusy(true);
    try {
  const { data, error } = await (supabase as any).functions.invoke('booking_accept', { // eslint-disable-line @typescript-eslint/no-explicit-any
        body: { booking_id }
      });

      if (error) {
        throw error;
      }
      
      toast({ title: 'Assigned', description: 'You accepted this job.' });
      await load('mine'); 
      setTab('mine');
    } catch (err: unknown) {
      console.error('Accept error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Cannot accept', description: msg || 'Try again' });
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

        {demo && payouts.length > 0 && tab === 'mine' && (
          <div className="border rounded p-3 text-xs mb-4">
            <div className="font-semibold mb-2">Recent Payouts (Demo)</div>
            <div className="space-y-1 max-h-40 overflow-auto">
        {payouts.slice(-5).reverse().map((p: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <div key={p.id} className="flex justify-between">
          <span className="font-mono truncate mr-2">{p.booking_id}</span>
          <span>${(p.amount_mxn_cents/100).toFixed(2)}</span>
                </div>
              ))}
            </div>
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

                {demo && tab === 'mine' && b.status === 'assigned' && codes[b.id] && (
                  <div className="mb-3 inline-flex items-center gap-2 text-xs bg-muted/40 rounded px-2 py-1">
                    <span className="opacity-70">Start Code:</span>
                    <span className="font-mono tracking-widest text-sm">{codes[b.id]}</span>
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(codes[b.id])}>
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                )}

                {tab === 'available' && (
                  <Button 
                    onClick={() => accept(b.id)}
                    className="w-full"
                    disabled={busy}
                  >
                    Accept Job
                  </Button>
                )}
                {tab === 'mine' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/job/${b.id}`)}
                      disabled={busy}
                    >
                      Manage Job
                    </Button>
                    <Button 
                      onClick={() => navigate(`/job/${b.id}`)}
                      disabled={busy}
                    >
                      Start Code
                    </Button>
                  </div>
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