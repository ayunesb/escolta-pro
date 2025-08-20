import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, X, Clock } from 'lucide-react';
import HapticButton from '@/components/mobile/HapticButton';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onClear: () => void;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onClear,
  onClose
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center">
      <Card className="w-full sm:w-96 max-h-[80vh] m-4 sm:mx-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              <CardTitle className="text-mobile-lg">Notifications</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <HapticButton
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  hapticPattern="light"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </HapticButton>
              )}
              <HapticButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                hapticPattern="light"
                className="p-1"
              >
                <X className="h-4 w-4" />
              </HapticButton>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-96 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-mobile-sm">
                No new notifications
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="border rounded-lg p-3 bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-mobile-sm font-medium text-foreground">
                    {notification.title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(notification.timestamp)}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">
                  {notification.message}
                </p>
                
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                >
                  {notification.type.replace('_', ' ')}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};