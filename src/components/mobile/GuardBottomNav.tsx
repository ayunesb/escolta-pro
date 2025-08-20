import { Calendar, FileText, User, Building, Car, Users, Home, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTimeAssignments } from '@/hooks/use-real-time';
import { Badge } from '@/components/ui/badge';

interface GuardBottomNavProps {
  currentPath: string;
  navigate: (path: string) => void;
}

const GuardBottomNav = ({ currentPath, navigate }: GuardBottomNavProps) => {
  const { hasRole } = useAuth();
  const { assignments } = useRealTimeAssignments();
  
  // Count pending assignments
  const pendingAssignments = assignments.filter(
    assignment => assignment.status === 'offered' || assignment.status === 'accepted'
  ).length;

  // Base tabs for all guards
  const baseTabs = [
    {
      id: 'home',
      path: '/home',
      icon: Home,
      label: 'Home',
      testId: 'nav-home'
    },
    {
      id: 'assignments',
      path: '/assignments',
      icon: Clock,
      label: 'Assignments',
      testId: 'nav-assignments',
      badge: pendingAssignments > 0 ? pendingAssignments : undefined
    },
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
    }
  ];

  // Determine which tabs to show based on role
  const tabs = hasRole('company_admin') 
    ? [baseTabs[0], baseTabs[1], baseTabs[2], ...companyTabs, baseTabs[3]] // Home, Assignments, Bookings, Company, Account
    : baseTabs.filter(tab => tab.id !== 'bookings'); // Home, Assignments, Account for freelancers

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
                "flex-1 flex flex-col items-center justify-center touch-target px-1 py-3 transition-colors min-h-[56px] relative",
                isActive 
                  ? "text-accent bg-accent/5" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <tab.icon className={cn("h-5 w-5 mb-1", isActive && "text-accent")} />
                {(tab as any).badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 min-w-[16px] text-xs px-1 py-0 flex items-center justify-center"
                  >
                    {(tab as any).badge > 9 ? '9+' : (tab as any).badge}
                  </Badge>
                )}
              </div>
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