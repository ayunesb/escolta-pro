import { Shield, Calendar, User, Building, Users, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface GuardBottomNavProps {
  currentPath: string;
  navigate: (path: string) => void;
}

const GuardBottomNav = ({ currentPath, navigate }: GuardBottomNavProps) => {
  const { hasRole } = useAuth();
  
  // For regular guards: only bookings and account
  const tabs = [
    {
      id: 'bookings',
      label: 'Bookings',
      icon: Briefcase,
      path: '/bookings'
    }
  ];

  // Add company admin tabs if user has the role
  if (hasRole('company_admin')) {
    tabs.push(
      {
        id: 'company',
        label: 'Company',
        icon: Building,
        path: '/company'
      },
      {
        id: 'staff',
        label: 'Staff',
        icon: Users,
        path: '/company-staff'
      }
    );
  }

  // Always show account last
  tabs.push({
    id: 'account',
    label: 'Account',
    icon: User,
    path: '/account'
  });

  return (
    <nav 
      data-testid="guard-bottom-nav"
      className="fixed bottom-0 left-1/2 transform -translate-x-1/2 safe-bottom"
      style={{ zIndex: 100 }}
    >
      <div className="bg-card border border-border rounded-full shadow-lg">
        <div className="flex items-center justify-center w-nav-pill max-w-mobile h-16 px-4">
          {tabs.map((tab) => {
            const isActive = currentPath === tab.path || 
              (tab.path === '/bookings' && (currentPath === '/' || currentPath === '/home'));
            
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 px-2 rounded-full transition-colors touch-target text-xs",
                  isActive 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4 mb-1" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default GuardBottomNav;