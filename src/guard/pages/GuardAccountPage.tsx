import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Edit3, FileText, Shield, LogOut, Settings, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import HapticButton from '@/components/mobile/HapticButton';

interface GuardAccountPageProps {
  navigate: (path: string) => void;
}

const GuardAccountPage = ({ navigate }: GuardAccountPageProps) => {
  const { user, userRoles, signOut, hasRole } = useAuth();
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
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/home')}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Account
          </h2>
          <div className="w-6" />
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

        {/* Professional Actions */}
        <div className="space-y-4 mb-6">
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Professional
          </h2>
          
          <Card className="cursor-pointer card-hover">
            <CardContent 
              className="flex items-center gap-4 p-4 touch-target"
              onClick={() => navigate('/assignments')}
            >
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-mobile-base font-medium text-foreground">
                  My Assignments
                </h3>
                <p className="text-mobile-sm text-muted-foreground">
                  View and manage your assignments
                </p>
              </div>
            </CardContent>
          </Card>

          {hasRole('freelancer') && (
            <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardContent 
                className="flex items-center gap-4 p-4"
                onClick={() => navigate('/apply')}
              >
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Edit3 className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-mobile-base font-medium text-foreground">
                    Freelancer Application
                  </h3>
                  <p className="text-mobile-sm text-muted-foreground">
                    Submit or update your application
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Company Admin Actions */}
        {hasRole('company_admin') && (
          <div className="space-y-4 mb-6">
            <h2 className="text-mobile-lg font-semibold text-foreground">
              Company Management
            </h2>
            
            <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardContent 
                className="flex items-center gap-4 p-4"
                onClick={() => navigate('/company')}
              >
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-mobile-base font-medium text-foreground">
                    Company Profile
                  </h3>
                  <p className="text-mobile-sm text-muted-foreground">
                    Manage company information
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardContent 
                className="flex items-center gap-4 p-4"
                onClick={() => navigate('/company-staff')}
              >
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-mobile-base font-medium text-foreground">
                    Staff Management
                  </h3>
                  <p className="text-mobile-sm text-muted-foreground">
                    Manage company staff and guards
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardContent 
                className="flex items-center gap-4 p-4"
                onClick={() => navigate('/company-vehicles')}
              >
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-mobile-base font-medium text-foreground">
                    Vehicle Fleet
                  </h3>
                  <p className="text-mobile-sm text-muted-foreground">
                    Manage company vehicles
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings */}
        <div className="space-y-4 mb-8">
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

        {/* Sign Out */}
        <HapticButton 
          onClick={handleSignOut}
          variant="outline"
          hapticPattern="warning"
          className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </HapticButton>
      </div>
    </div>
  );
};

export default GuardAccountPage;