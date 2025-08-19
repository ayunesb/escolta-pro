import { Shield, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentPath: string;
  navigate: (path: string) => void;
}

const BottomNav = ({ currentPath, navigate }: BottomNavProps) => {
  const tabs = [
    {
      id: 'protector',
      label: 'Protector',
      icon: Shield,
      path: '/home'
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: Calendar,
      path: '/bookings'
    },
    {
      id: 'account',
      label: 'Account',
      icon: User,
      path: '/account'
    }
  ];

  return (
    <nav 
      data-testid="bottom-nav"
      className="fixed bottom-0 left-1/2 transform -translate-x-1/2 safe-bottom"
      style={{ zIndex: 100 }}
    >
      <div className="bg-card border border-border rounded-full shadow-lg">
        <div className="flex items-center justify-center w-nav-pill max-w-mobile h-16 px-4">
          {tabs.map((tab) => {
            const isActive = currentPath === tab.path || 
              (tab.path === '/home' && (currentPath === '/' || currentPath === '/home'));
            
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-full transition-colors touch-target",
                  isActive 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;