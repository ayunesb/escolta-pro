import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Edit3, FileText, Shield, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import BottomNav from '@/components/mobile/BottomNav';
import { toast } from 'sonner';

interface AccountPageProps {
  navigate: (path: string) => void;
}

const AccountPage = ({ navigate }: AccountPageProps) => {
  const { user, userRoles, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-mobile-xl font-semibold text-foreground">
            Account
          </h1>
          <p className="text-mobile-sm text-muted-foreground">
            Manage your profile and settings
          </p>
        </div>

        {/* User Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-mobile-base">
                  {user?.email}
                </CardTitle>
                <div className="flex gap-2 mt-2">
                  {userRoles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Client Actions */}
        <div className="space-y-4 mb-6">
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Profile
          </h2>
          
          <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
            <CardContent 
              className="flex items-center gap-4 p-4"
              onClick={() => navigate('/profile-edit')}
            >
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Edit3 className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-mobile-base font-medium text-foreground">
                  Edit Profile
                </h3>
                <p className="text-mobile-sm text-muted-foreground">
                  Update your personal information and documents
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
            <CardContent 
              className="flex items-center gap-4 p-4"
              onClick={() => navigate('/bookings')}
            >
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-mobile-base font-medium text-foreground">
                  Booking History
                </h3>
                <p className="text-mobile-sm text-muted-foreground">
                  View your past and upcoming bookings
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <div className="space-y-4 mb-6">
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Settings
          </h2>
          
          <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
            <CardContent 
              className="flex items-center gap-4 p-4"
              onClick={toggleTheme}
            >
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-mobile-base font-medium text-foreground">
                  Theme
                </h3>
                <p className="text-mobile-sm text-muted-foreground">
                  Currently: {theme === 'dark' ? 'Dark' : 'Light'} mode
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & Support */}
        <div className="space-y-4 mb-8">
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Security
          </h2>
          
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="text-mobile-base font-medium text-foreground">
                  Account Security
                </h3>
                <p className="text-mobile-sm text-muted-foreground">
                  Your account is secure and verified
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sign Out */}
        <Button 
          onClick={handleSignOut}
          variant="outline"
          className="w-full h-button rounded-button border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentPath="/account" navigate={navigate} />
    </div>
  );
};

export default AccountPage;