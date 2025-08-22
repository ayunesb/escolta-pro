import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Megaphone, Settings, HelpCircle, Eye } from 'lucide-react';

interface SystemSettingsPageProps {
  navigate: (path: string) => void;
}

export const SystemSettingsPage = ({ navigate }: SystemSettingsPageProps) => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [impersonateId, setImpersonateId] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleMaintenance = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setMaintenanceMode(!maintenanceMode);
      toast({
        title: 'Maintenance Mode',
        description: maintenanceMode ? 'Disabled' : 'Enabled',
      });
      setLoading(false);
    }, 800);
  };

  const handleBroadcast = async () => {
    setLoading(true);
    // Simulate broadcast
    setTimeout(() => {
      toast({
        title: 'Broadcast Sent',
        description: broadcastMessage,
      });
      setBroadcastMessage('');
      setLoading(false);
    }, 800);
  };

  const handleImpersonate = async () => {
    setLoading(true);
    // Simulate impersonation
    setTimeout(() => {
      toast({
        title: 'Impersonation Started',
        description: `Now impersonating user ID: ${impersonateId}`,
      });
      setImpersonateId('');
      setLoading(false);
    }, 800);
  };

  const handleSupport = () => {
    setSupportOpen(true);
    toast({
      title: 'Support Chat Opened',
      description: 'A support session has started.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-mobile-xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" /> System Settings
          </h1>
          <Badge variant="secondary">Super Admin</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Maintenance Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Platform Config</CardTitle>
              <CardDescription>Toggle platform-wide maintenance mode</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <span>Maintenance Mode</span>
                <Switch checked={maintenanceMode} onCheckedChange={handleToggleMaintenance} disabled={loading} />
              </div>
            </CardContent>
          </Card>
          {/* Broadcast Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Broadcast</CardTitle>
              <CardDescription>Send a message to all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input"
                  placeholder="Enter broadcast message"
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  disabled={loading}
                />
                <Button onClick={handleBroadcast} disabled={loading || !broadcastMessage}>Send</Button>
              </div>
            </CardContent>
          </Card>
          {/* Impersonation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Impersonation</CardTitle>
              <CardDescription>Impersonate a user by ID</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input"
                  placeholder="User ID"
                  value={impersonateId}
                  onChange={e => setImpersonateId(e.target.value)}
                  disabled={loading}
                />
                <Button onClick={handleImpersonate} disabled={loading || !impersonateId}>Impersonate</Button>
              </div>
            </CardContent>
          </Card>
          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" /> Support</CardTitle>
              <CardDescription>Start a support session</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSupport} disabled={loading}>Open Support Chat</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
