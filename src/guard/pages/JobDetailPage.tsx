import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Copy, ArrowLeft } from 'lucide-react';

interface Props { navigate: (path: string) => void; bookingId: string }

export default function JobDetailPage({ navigate, bookingId }: Props) {
  const [code, setCode] = useState<string>('••••••');
  const [status, setStatus] = useState<string>('assigned');
  const [startTs, setStartTs] = useState<string | undefined>(undefined);
  const [endTs, setEndTs] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const { data } = await (supabase as any).functions.invoke('get_start_code', { body: { booking_id: bookingId } }); // eslint-disable-line @typescript-eslint/no-explicit-any
      if (data?.start_code) setCode(String(data.start_code));
      const { data: b } = await (supabase as any).from('bookings').select('*').eq('id', bookingId).single(); // eslint-disable-line @typescript-eslint/no-explicit-any
      if (b?.status) setStatus(b.status);
      if (b?.service_start_ts) setStartTs(b.service_start_ts);
      if (b?.service_end_ts) setEndTs(b.service_end_ts);
    }
    load();
    const ch = (supabase as any).channel?.('bookings')?.on?.('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (p: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (p?.new?.id !== bookingId) return;
      if (p?.new?.status) setStatus(p.new.status);
      if (p?.new?.service_start_ts) setStartTs(p.new.service_start_ts);
      if (p?.new?.service_end_ts) setEndTs(p.new.service_end_ts);
    })?.subscribe?.();
    return () => { try { ch?.unsubscribe?.(); } catch {} };
  }, [bookingId]);

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      toast({ title: 'Copied', description: 'Start code copied to clipboard.' });
    });
  }

  async function complete() {
    try {
      const { error } = await (supabase as any).functions.invoke('complete_service', { body: { booking_id: bookingId } }); // eslint-disable-line @typescript-eslint/no-explicit-any
      if (error) throw error;
      toast({ title: 'Completed', description: 'Service has been marked as completed.' });
      setStatus('completed');
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 p-4 border-b border-border safe-top">
        <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-mobile-lg font-semibold">Job Details</h1>
      </div>
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Start Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-mono tracking-widest">{code}</div>
              <Button variant="outline" size="sm" onClick={copy}>
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Share this code with the client. Once they confirm, the job starts and your payout is released.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">Current status: <span className="font-medium capitalize">{status.replace('_',' ')}</span></div>
            {status === 'in_progress' && (
              <div className="mt-3">
                <Button onClick={complete}>Complete Service</Button>
              </div>
            )}
            {status === 'completed' && (
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <div>
                  <span className="mr-1">Started:</span>
                  <span className="font-medium text-foreground">{startTs ? new Date(startTs).toLocaleString() : '—'}</span>
                </div>
                <div>
                  <span className="mr-1">Completed:</span>
                  <span className="font-medium text-foreground">{endTs ? new Date(endTs).toLocaleString() : '—'}</span>
                </div>
                <div>
                  <span className="mr-1">Duration:</span>
                  <span className="font-medium text-foreground">
                    {(() => {
                      if (!startTs || !endTs) return '—';
                      const mins = Math.max(0, Math.round((new Date(endTs).getTime() - new Date(startTs).getTime()) / 60000));
                      const h = Math.floor(mins / 60);
                      const m = mins % 60;
                      return `${h}h ${m}m`;
                    })()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
