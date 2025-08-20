import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Scan, 
  Eye, 
  Clock,
  TrendingUp,
  Users,
  Database,
  Lock
} from 'lucide-react';
import { useSecurityMonitoring } from '@/hooks/use-security-monitoring';
import { formatDistanceToNow } from 'date-fns';
import HapticButton from '@/components/mobile/HapticButton';
import { OptimizedSkeleton } from '@/components/performance/OptimizedSkeleton';

interface SecurityDashboardProps {
  navigate?: (path: string) => void;
}

export const SecurityDashboard = ({ navigate }: SecurityDashboardProps) => {
  const { 
    alerts, 
    metrics, 
    loading, 
    acknowledgeAlert, 
    runSecurityScan 
  } = useSecurityMonitoring();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'low':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return AlertTriangle;
      case 'medium':
        return Eye;
      case 'low':
        return Activity;
      default:
        return Shield;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <OptimizedSkeleton type="list-item" className="h-32" />
        <OptimizedSkeleton type="list-item" className="h-48" />
        <OptimizedSkeleton type="list-item" className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mobile-sm text-muted-foreground">Total Alerts</p>
                <p className="text-mobile-lg font-semibold text-foreground">
                  {metrics.totalAlerts}
                </p>
              </div>
              <Shield className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mobile-sm text-muted-foreground">Critical</p>
                <p className="text-mobile-lg font-semibold text-destructive">
                  {metrics.criticalAlerts}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mobile-sm text-muted-foreground">Active (24h)</p>
                <p className="text-mobile-lg font-semibold text-warning">
                  {metrics.activeIncidents}
                </p>
              </div>
              <Activity className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mobile-sm text-muted-foreground">Last Scan</p>
                <p className="text-mobile-sm font-medium text-muted-foreground">
                  {metrics.lastScanTime 
                    ? formatDistanceToNow(new Date(metrics.lastScanTime), { addSuffix: true })
                    : 'Never'
                  }
                </p>
              </div>
              <Scan className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <HapticButton
              onClick={runSecurityScan}
              variant="outline"
              size="sm"
              hapticPattern="medium"
              className="flex items-center gap-2"
            >
              <Scan className="h-4 w-4" />
              Run Security Scan
            </HapticButton>
            
            <HapticButton
              onClick={() => navigate?.('/audit-trail')}
              variant="outline"
              size="sm"
              hapticPattern="light"
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              View Audit Trail
            </HapticButton>

            <HapticButton
              onClick={() => navigate?.('/security')}
              variant="outline"
              size="sm"
              hapticPattern="light"
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Security Settings
            </HapticButton>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Security Alerts
            </CardTitle>
            {alerts.length > 5 && (
              <button
                onClick={() => navigate?.('/security-alerts')}
                className="text-accent hover:underline text-mobile-sm"
              >
                View All
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-mobile-base font-medium text-foreground mb-2">
                No Security Alerts
              </h3>
              <p className="text-mobile-sm text-muted-foreground">
                Your system is secure. All security checks passed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => {
                const SeverityIcon = getSeverityIcon(alert.severity);
                
                return (
                  <Alert key={alert.id} className="relative">
                    <SeverityIcon className="h-4 w-4" />
                    <AlertDescription className="pr-20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-mobile-sm font-medium text-foreground">
                            {alert.message}
                          </p>
                          {alert.metadata && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <code className="bg-muted px-2 py-1 rounded">
                                {JSON.stringify(alert.metadata, null, 2).slice(0, 100)}...
                              </code>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="absolute top-2 right-2"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Security Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-mobile-sm font-medium">Authentication Security</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Healthy
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-mobile-sm font-medium">Database Security</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Healthy
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-mobile-sm font-medium">Access Control</span>
              </div>
              <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                Review Needed
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-mobile-sm font-medium">Data Encryption</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Healthy
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};