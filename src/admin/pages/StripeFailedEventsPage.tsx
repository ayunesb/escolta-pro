import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FailedStripeEventRow {
  id: string;
  type: string;
  error: string;
  created_at: string;
  payload: any; // eslint-disable-line @typescript-eslint/no-explicit-any -- JSON blob for inspection only
}

// Very lightweight viewer; expects service role channel via secure admin environment / RLS conditions.
export function StripeFailedEventsPage() {
  const [rows, setRows] = useState<FailedStripeEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
  async function load() {
      setLoading(true);
      try {
  const { data: sessionRes } = await supabase.auth.getSession();
  const access = sessionRes.session?.access_token;
  if (!access) throw new Error('No session');
  const resp = await fetch('/api/admin/stripe-failed-events', { headers: { 'Authorization': `Bearer ${access}` } });
    if (!resp.ok) throw new Error(`Failed to load (${resp.status})`);
    const json = await resp.json();
    if (!cancelled) setRows(json.events as FailedStripeEventRow[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 30_000); // refresh every 30s
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (loading) return <div className="p-4">Loading failed Stripe events...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Stripe Failed Events (Last {rows.length})</h1>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="p-2">ID</th>
            <th className="p-2">Type</th>
            <th className="p-2">Error</th>
            <th className="p-2">Created</th>
            <th className="p-2">Payload</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b align-top">
              <td className="p-2 font-mono text-xs max-w-[140px] truncate" title={r.id}>{r.id}</td>
              <td className="p-2 whitespace-nowrap">{r.type}</td>
              <td className="p-2 max-w-[240px] truncate" title={r.error}>{r.error}</td>
              <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
              <td className="p-2 max-w-[320px]">
                <details>
                  <summary className="cursor-pointer text-blue-600">View</summary>
                  <pre className="mt-2 max-h-64 overflow-auto bg-muted/30 p-2 rounded text-[10px] leading-tight">{JSON.stringify(r.payload, null, 2)}</pre>
                </details>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-muted-foreground">No failed events recorded.</td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground">Auto-refreshes every 30s. Immutable log (no updates/deletes).</p>
    </div>
  );
}

export default StripeFailedEventsPage;
