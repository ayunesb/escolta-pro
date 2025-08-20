import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallbackRoute?: string;
  navigate?: (path: string) => void;
}

export const RouteGuard = ({ 
  children, 
  allowedRoles, 
  fallbackRoute = '/home',
  navigate 
}: RouteGuardProps) => {
  const { hasRole, loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Check if user has any of the allowed roles
  const hasPermission = allowedRoles.some(role => hasRole(role as any));

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access this page. This section is only available to authorized users.
            </p>
            {navigate && (
              <Button 
                onClick={() => navigate(fallbackRoute)}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};