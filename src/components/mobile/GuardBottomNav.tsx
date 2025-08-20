import { Calendar, FileText, User, Building, Car, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface GuardBottomNavProps {
  currentPath: string;
  navigate: (path: string) => void;
}

const GuardBottomNav = ({ currentPath, navigate }: GuardBottomNavProps) => {
  const { hasRole } = useAuth();

  // Base tabs for all guards (freelancer gets only these 2)
  const baseTabs = [
    {
      id: 'bookings',
      path: '/bookings',
      icon: Calendar,
      label: 'Bookings',
      testId: 'nav-bookings'
    },
    {
      id: 'account',
      path: '/account',
      icon: User,
      label: 'Account',
      testId: 'nav-account'
    }
  ];

  // Additional tabs for company admins
  const companyTabs = [
    {
      id: 'company',
      path: '/company',
      icon: Building,
      label: 'Company',
      testId: 'nav-company'
    },
    {
      id: 'vehicles',
      path: '/vehicles',
      icon: Car,
      label: 'Vehicles',
      testId: 'nav-vehicles'
    },
    {
      id: 'staff',
      path: '/staff',
      icon: Users,
      label: 'Staff',
      testId: 'nav-staff'
    }
  ];

  // Determine which tabs to show based on role
  const tabs = hasRole('company_admin') 
    ? [baseTabs[0], ...companyTabs, baseTabs[1]] // Bookings, Company, Vehicles, Staff, Account
    : baseTabs; // Just Bookings, Account for freelancers

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-nav">
      <div className="flex max-w-mobile mx-auto">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.path || currentPath.startsWith(tab.path + '/');
          
          return (
            <button
              key={tab.id}
              data-testid={tab.testId}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center touch-target px-1 py-3 transition-colors min-h-[56px]",
                isActive 
                  ? "text-accent bg-accent/5" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5 mb-1", isActive && "text-accent")} />
              <span className="text-xs font-medium leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default GuardBottomNav;