import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type Metadata = Record<string, unknown>;

interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'unusual_activity' | 'data_access' | 'permission_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  userId?: string;
  metadata?: Metadata;
}

interface SecurityMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  activeIncidents: number;
  lastScanTime?: string;
}

export const useSecurityMonitoring = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalAlerts: 0,
    criticalAlerts: 0,
    activeIncidents: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSecurityAlerts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .in('action', ['failed_login', 'unusual_activity', 'data_access', 'permission_change'])
        .order('ts', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching security alerts:', error);
        return;
      }

      const securityAlerts: SecurityAlert[] = data.map(log => ({
        id: String(log.id),
        type: log.action as SecurityAlert['type'],
        severity: getSeverityFromAction(log.action),
        message: generateAlertMessage(log),
        timestamp: log.ts,
        userId: log.actor_id,
        metadata: (log.diff && typeof log.diff === 'object') ? log.diff as Metadata : {}
      }));

      setAlerts(securityAlerts);
      
      // Calculate metrics
      const criticalCount = securityAlerts.filter(alert => alert.severity === 'critical').length;
      const activeIncidents = securityAlerts.filter(alert => 
        alert.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      ).length;

      setMetrics({
        totalAlerts: securityAlerts.length,
        criticalAlerts: criticalCount,
        activeIncidents,
        lastScanTime: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error in security monitoring:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getSeverityFromAction = (action: string): SecurityAlert['severity'] => {
    switch (action) {
      case 'failed_login':
        return 'medium';
      case 'unusual_activity':
        return 'high';
      case 'data_access':
        return 'low';
      case 'permission_change':
        return 'critical';
      default:
        return 'low';
    }
  };

  const generateAlertMessage = (log: unknown): string => {
    if (!log || typeof log !== 'object') return 'Security event';
    const l = log as Record<string, unknown>;
    const action = typeof l.action === 'string' ? l.action : 'unknown';
    switch (action) {
      case 'failed_login':
        return `Failed login attempt detected`;
      case 'unusual_activity':
        return `Unusual activity pattern detected`;
      case 'data_access':
        return `Sensitive data accessed`;
      case 'permission_change':
        return `User permissions modified`;
      default:
        return `Security event: ${action}`;
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      // Mark alert as acknowledged in audit logs
      await supabase
        .from('audit_logs')
        .update({ 
          diff: { acknowledged: true, acknowledged_by: user?.id, acknowledged_at: new Date().toISOString() }
        })
        .eq('id', parseInt(alertId));

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      toast({
        title: "Alert Acknowledged",
        description: "Security alert has been acknowledged",
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive"
      });
    }
  };

  const runSecurityScan = async () => {
    try {
      setLoading(true);
      
      // Trigger security scan via edge function
      const { data, error } = await supabase.functions.invoke('security_scan', {
        body: { scan_type: 'comprehensive' }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Security Scan Complete",
        description: `Scan completed. Found ${data.issues_count || 0} potential issues.`,
      });

      // Refresh alerts after scan
      await fetchSecurityAlerts();

    } catch (error) {
      console.error('Error running security scan:', error);
      toast({
        title: "Scan Failed",
        description: "Security scan could not be completed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityAlerts();

    // Set up real-time subscription for new security events
    const subscription = supabase
      .channel('security-alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'audit_logs',
        filter: `action=in.(failed_login,unusual_activity,data_access,permission_change)`
      }, (payload: unknown) => {
        if (!payload || typeof payload !== 'object' || !('new' in payload)) return;
        const pl = payload as { new: Record<string, unknown> };
        const row = pl.new;
        const idVal = row.id;
        if (typeof idVal !== 'string' && typeof idVal !== 'number') return;
        const actionVal = row.action;
        if (typeof actionVal !== 'string') return;
        const tsVal = row.ts;
        if (typeof tsVal !== 'string') return;
        const newAlert: SecurityAlert = {
          id: String(idVal),
          type: actionVal as SecurityAlert['type'],
          severity: getSeverityFromAction(actionVal),
          message: generateAlertMessage(row),
          timestamp: tsVal,
          userId: typeof row.actor_id === 'string' ? row.actor_id : undefined,
          metadata: (row.diff && typeof row.diff === 'object') ? row.diff as Metadata : {}
        };

        setAlerts(prev => [newAlert, ...prev]);
        
        // Show toast for critical alerts
        if (newAlert.severity === 'critical' || newAlert.severity === 'high') {
          toast({
            title: "Security Alert",
            description: newAlert.message,
            variant: "destructive"
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSecurityAlerts, toast, user]);

  return {
    alerts,
    metrics,
    loading,
    acknowledgeAlert,
    runSecurityScan,
    refreshAlerts: fetchSecurityAlerts
  };
};