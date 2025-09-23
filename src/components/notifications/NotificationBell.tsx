import { useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { formatDistanceToNow } from 'date-fns';

type Notification = {
  id: string;
  title: string;
  message?: string;
  read?: boolean;
  created_at: string;
  action_url?: string | null;
  type?: string | null;
}

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.action_url) {
      if (notification.action_url.startsWith('/')) {
        window.location.hash = notification.action_url;
        setIsOpen(false);
      } else {
        window.open(notification.action_url, '_blank');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Notifications
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Stay updated with your booking and system notifications
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm">We'll notify you about important updates</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification: Notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.read ? 'border-accent bg-accent/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium">
                        {notification.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-accent rounded-full" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                      
                      {notification.type && (
                        <Badge variant="secondary" className="text-xs">
                          {notification.type.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationBell;