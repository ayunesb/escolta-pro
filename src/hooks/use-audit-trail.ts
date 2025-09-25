import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  actorId: string;
  timestamp: string;
  changes: Record<string, unknown>;
  actorEmail?: string;
}

interface AuditFilters {
  startDate?: string;
  endDate?: string;
  action?: string;
  entity?: string;
  actorId?: string;
}

export const useAuditTrail = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const { user } = useAuth();

  const fetchAuditEntries = useCallback(async (
    filters: AuditFilters = {}, 
    page = 0, 
    limit = 50
  ) => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          entity,
          entity_id,
          actor_id,
          ts,
          diff,
          profiles!audit_logs_actor_id_fkey (email)
        `, { count: 'exact' })
        .order('ts', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      // Apply filters
      if (filters.startDate) {
        query = query.gte('ts', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('ts', filters.endDate);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.entity) {
        query = query.eq('entity', filters.entity);
      }
      if (filters.actorId) {
        query = query.eq('actor_id', filters.actorId);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching audit entries:', error);
        return;
      }

      // runtime guards for untyped supabase response
      const isRecord = (x: unknown): x is Record<string, unknown> => {
        return typeof x === 'object' && x !== null;
      };

      const auditEntries: AuditEntry[] = (data || []).map((entry: unknown) => {
        const e = isRecord(entry) ? entry : {}
        const diff = isRecord(e.diff) ? e.diff : {}
        const profiles = isRecord(e.profiles) ? e.profiles : undefined

        return {
          id: String(e.id ?? ''),
          action: String(e.action ?? ''),
          entity: String(e.entity ?? ''),
          entityId: String(e.entity_id ?? ''),
          actorId: String(e.actor_id ?? ''),
          timestamp: String(e.ts ?? ''),
          changes: diff as Record<string, unknown>,
          actorEmail: profiles ? String(profiles.email ?? '') : undefined,
        }
      })

      setEntries(page === 0 ? auditEntries : prev => [...prev, ...auditEntries]);
      setTotalCount(count || 0);

    } catch (error) {
      console.error('Error in audit trail fetch:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const logAuditEntry = useCallback(async (
    action: string,
    entity: string,
    entityId: string,
    changes: Record<string, unknown> = {}
  ) => {
    if (!user) return;

    try {
      await supabase
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          action,
          entity,
          entity_id: entityId,
          // Supabase client expects Json for the `diff` column. Cast at the adapter boundary.
          diff: changes as unknown as Json
        });
    } catch (error) {
      console.error('Error logging audit entry:', error);
    }
  }, [user]);

  const exportAuditLog = useCallback(async (
    filters: AuditFilters = {},
    format: 'csv' | 'json' = 'csv'
  ) => {
    try {
      const response = await supabase.functions.invoke('export_audit_log', {
        body: { filters, format }
      });

      if (response.error) {
        throw response.error;
      }

      // Create download link
      const blob = new Blob([response.data.content], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-log-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting audit log:', error);
      throw error;
    }
  }, []);

  const getActionColor = (action: string): string => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return 'text-green-600 bg-green-50';
      case 'update':
      case 'modify':
        return 'text-blue-600 bg-blue-50';
      case 'delete':
      case 'remove':
        return 'text-red-600 bg-red-50';
      case 'login':
      case 'access':
        return 'text-purple-600 bg-purple-50';
      case 'failed_login':
      case 'error':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatActionDescription = (entry: AuditEntry): string => {
    const { action, entity, changes } = entry;
    
    switch (action) {
      case 'booking_create':
        return `Created new booking for ${changes.pickup_address || 'unknown location'}`;
      case 'assignment_status_update':
        return `Updated assignment status from ${changes.previous_status} to ${changes.new_status}`;
      case 'user_login':
        return 'User signed in';
      case 'failed_login':
        return 'Failed login attempt';
      case 'profile_update':
        return 'Updated profile information';
      case 'company_create':
        return `Created company: ${changes.name || 'unnamed'}`;
      case 'guard_create':
        return 'Added new guard to system';
      case 'document_upload':
        return `Uploaded document: ${changes.doc_type || 'unknown type'}`;
      case 'incident_report':
        return `Reported incident: ${changes.type || 'general'}`;
      default:
        return `${action.replace('_', ' ')} on ${entity}`;
    }
  };

  useEffect(() => {
    fetchAuditEntries();
  }, [fetchAuditEntries]);

  return {
    entries,
    loading,
    totalCount,
    fetchAuditEntries,
    logAuditEntry,
    exportAuditLog,
    getActionColor,
    formatActionDescription
  };
};