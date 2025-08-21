import { useRoleNavigation } from "@/hooks/use-role-navigation";
import { useSafeArea } from "@/components/mobile/SafeAreaProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home, Calendar, User, CreditCard, Building, Users, BarChart3 } from "lucide-react";

interface MobileBottomTabsProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const getTabIcon = (tabId: string) => {
  switch (tabId) {
    case 'home':
      return Home;
    case 'book':
    case 'bookings':
      return Calendar;
    case 'billing':
      return CreditCard;
    case 'company':
      return Building;
    case 'staff':
    case 'users':
      return Users;
    case 'analytics':
      return BarChart3;
    case 'account':
      return User;
    default:
      return Home;
  }
};

export const MobileBottomTabs = ({ currentPath, onNavigate }: MobileBottomTabsProps) => {
  const { getTabsForRole } = useRoleNavigation();
  const { insets, isNative } = useSafeArea();
  
  const tabs = getTabsForRole().filter(tab => tab.visible);
  
  if (tabs.length === 0) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t border-border",
        "flex items-center justify-around px-2 py-2",
        "safe-area-bottom"
      )}
      style={{
        paddingBottom: isNative ? `max(${insets.bottom}px, 8px)` : '8px'
      }}
    >
      {tabs.map((tab) => {
        const Icon = getTabIcon(tab.id);
        const isActive = currentPath === tab.path || currentPath.startsWith(tab.path + '/');
        
        return (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(tab.path)}
            className={cn(
              "flex flex-col items-center gap-1 h-auto py-2 px-1 min-w-0 flex-1",
              isActive && "text-primary bg-primary/10"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs truncate">{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
};