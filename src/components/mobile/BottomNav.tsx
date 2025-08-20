import { Home, Calendar, FileText, User, Receipt, BarChart3, Building, Users, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useHaptics } from '@/hooks/use-haptics';

interface BottomNavProps {
  currentPath: string;
  navigate: (path: string) => void;
}

const BottomNav = ({ currentPath, navigate }: BottomNavProps) => {
  const { hasRole } = useAuth();
  const haptics = useHaptics();

  // Role-based navigation configuration
  const getTabsForRole = () => {
    // Super Admin - sees everything
    if (hasRole('super_admin')) {
      return [
        { id: 'home', path: '/home', icon: Home, label: 'Dashboard', testId: 'nav-home' },
        { id: 'users', path: '/users', icon: Users, label: 'Users', testId: 'nav-users' },
        { id: 'companies', path: '/companies', icon: Building, label: 'Companies', testId: 'nav-companies' },
        { id: 'analytics', path: '/analytics', icon: BarChart3, label: 'Analytics', testId: 'nav-analytics' },
        { id: 'account', path: '/account', icon: User, label: 'Account', testId: 'nav-account' }
      ];
    }
    
    // Company Admin - full company management + billing for payouts
    if (hasRole('company_admin')) {
      return [
        { id: 'company', path: '/company', icon: Building, label: 'Company', testId: 'nav-company' },
        { id: 'staff', path: '/staff', icon: Users, label: 'Staff', testId: 'nav-staff' },
        { id: 'vehicles', path: '/vehicles', icon: Car, label: 'Vehicles', testId: 'nav-vehicles' },
        { id: 'bookings', path: '/bookings', icon: FileText, label: 'Bookings', testId: 'nav-bookings' },
        { id: 'billing', path: '/billing', icon: Receipt, label: 'Billing', testId: 'nav-billing' },
        { id: 'analytics', path: '/analytics', icon: BarChart3, label: 'Analytics', testId: 'nav-analytics' },
        { id: 'account', path: '/account', icon: User, label: 'Account', testId: 'nav-account' }
      ];
    }
    
    // Freelancer/Guard - accept bookings + billing for payouts + personal stats
    if (hasRole('freelancer')) {
      return [
        { id: 'bookings', path: '/bookings', icon: FileText, label: 'Bookings', testId: 'nav-bookings' },
        { id: 'billing', path: '/billing', icon: Receipt, label: 'Billing', testId: 'nav-billing' },
        { id: 'analytics', path: '/analytics', icon: BarChart3, label: 'Analytics', testId: 'nav-analytics' },
        { id: 'account', path: '/account', icon: User, label: 'Account', testId: 'nav-account' }
      ];
    }
    
    // Client (default) - booking focused
    return [
      { id: 'home', path: '/home', icon: Home, label: 'Home', testId: 'nav-home' },
      { id: 'book', path: '/book', icon: Calendar, label: 'Book', testId: 'nav-book' },
      { id: 'bookings', path: '/bookings', icon: FileText, label: 'Bookings', testId: 'nav-bookings' },
      { id: 'account', path: '/account', icon: User, label: 'Account', testId: 'nav-account' }
    ];
  };

  const tabs = getTabsForRole();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-nav">
      <div className="flex h-14 max-w-mobile mx-auto">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.path || currentPath.startsWith(tab.path + '/');
          
          return (
            <button
              key={tab.id}
              data-testid={tab.testId}
              onClick={() => {
                haptics.tap();
                navigate(tab.path);
              }}
              className={cn(
                "flex-1 flex flex-col items-center justify-center touch-target px-1 py-2 transition-colors",
                isActive 
                  ? "text-accent" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5 mb-1", isActive && "fill-current")} />
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

export { BottomNav };
export default BottomNav;