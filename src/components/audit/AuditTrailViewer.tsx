import { useState } from 'react';
import { 
  Database, 
  Download, 
  Filter, 
  Search,
  User,
  FileText,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuditTrail } from '@/hooks/use-audit-trail';
import HapticButton from '@/components/mobile/HapticButton';
import { OptimizedSkeleton } from '@/components/performance/OptimizedSkeleton';

interface AuditTrailViewerProps {
  navigate?: (path: string) => void;
}

export const AuditTrailViewer = ({ navigate: _navigate }: AuditTrailViewerProps) => {
  const {
    entries,
    loading,
    totalCount,
    fetchAuditEntries,
    exportAuditLog,
    getActionColor,
    formatActionDescription
  } = useAuditTrail();

  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Apply filters with debounce
    const timeoutId = setTimeout(() => {
      fetchAuditEntries(newFilters, 0, 50);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      await exportAuditLog(filters, format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      action: '',
      entity: '',
      startDate: '',
      endDate: '',
      search: ''
    };
    setFilters(clearedFilters);
    fetchAuditEntries(clearedFilters, 0, 50);
  };

  const renderAuditEntry = ({ item: entry, index: _index }: { item: unknown; index: number }) => {
    const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
    const e = isRecord(entry) ? entry : {} as Record<string, unknown>;
    const action = String(e.action ?? '');
    const entity = String(e.entity ?? '');
    const timestamp = String(e.ts ?? e.timestamp ?? '');
    const actorEmail = String((e.profiles as Record<string, unknown> | undefined)?.email ?? e.actor_email ?? e.actor_id ?? '');
    const entityId = String(e.entity_id ?? e.entityId ?? '');
    const changes = isRecord(e.diff ?? e.changes) ? (e.diff ?? e.changes) as Record<string, unknown> : {};

    return (
      <Card key={entityId || String(e.id ?? Math.random())} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`px-2 py-1 rounded-md text-xs font-medium ${getActionColor(action)}`}>
              {action.replace('_', ' ').toUpperCase()}
            </div>
            <Badge variant="outline" className="text-xs">
              {entity}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: true }) : ''}
          </div>
        </div>

        <div className="space-y-2">
            <p className="text-mobile-sm font-medium text-foreground">
            {formatActionDescription({
              id: String(e.id ?? ''),
              action,
              entity,
              entityId,
              actorId: String(e.actor_id ?? ''),
              timestamp,
              changes,
              actorEmail: actorEmail || undefined
            })}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{actorEmail || String(e.actor_id ?? '')}</span>
            {entityId && (
              <>
                <span>•</span>
                <span>ID: {entityId.slice(-8)}</span>
              </>
            )}
          </div>
          {Object.keys(changes).length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-accent cursor-pointer hover:underline">
                View Changes ({Object.keys(changes).length} fields)
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <pre className="text-xs text-muted-foreground overflow-x-auto">
                  {JSON.stringify(changes, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <div className="flex items-center gap-2">
              <HapticButton
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                hapticPattern="light"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </HapticButton>
              
              <HapticButton
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                hapticPattern="light"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </HapticButton>
            </div>
          </div>
          
          <div className="text-mobile-sm text-muted-foreground">
            {totalCount.toLocaleString()} total entries
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-mobile-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entries..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-mobile-sm font-medium">Action</label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => handleFilterChange('action', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="failed_login">Failed Login</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-mobile-sm font-medium">Entity</label>
                <Select
                  value={filters.entity}
                  onValueChange={(value) => handleFilterChange('entity', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All entities</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="guard">Guard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-mobile-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-mobile-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Audit Entries */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <OptimizedSkeleton key={i} type="list-item" className="h-32" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-mobile-base font-medium text-foreground mb-2">
              No Audit Entries Found
            </h3>
            <p className="text-mobile-sm text-muted-foreground">
              Try adjusting your filters or check back later
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-auto">
          {entries.map((entry) => renderAuditEntry({ item: entry, index: 0 }))}
        </div>
      )}
    </div>
  );
};