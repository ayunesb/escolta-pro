import { useAuth, UserRole } from "@/contexts/AuthContext";

export interface NavigationTab {
  id: string;
  label: string;
  path: string;
  icon?: string;
  visible: boolean;
}

export const useRoleNavigation = () => {
  const { hasRole } = useAuth();

  const getClientTabs = (): NavigationTab[] => [
    { id: 'home', label: 'Home', path: '/home', visible: true },
    { id: 'book', label: 'Book', path: '/book', visible: true },
    { id: 'bookings', label: 'Bookings', path: '/bookings', visible: true },
    { id: 'account', label: 'Account', path: '/account', visible: true },
  ];

  const getGuardTabs = (): NavigationTab[] => [
    { id: 'bookings', label: 'Bookings', path: '/bookings', visible: true },
    { id: 'billing', label: 'Billing', path: '/billing', visible: true },
    { id: 'analytics', label: 'Analytics', path: '/analytics', visible: hasRole('guard' as UserRole) },
    { id: 'account', label: 'Account', path: '/account', visible: true },
  ];

  const getCompanyAdminTabs = (): NavigationTab[] => [
    { id: 'company', label: 'Company', path: '/company', visible: true },
    { id: 'staff', label: 'Staff', path: '/staff', visible: true },
    { id: 'vehicles', label: 'Vehicles', path: '/vehicles', visible: true },
    { id: 'bookings', label: 'Bookings', path: '/bookings', visible: true },
    { id: 'billing', label: 'Billing', path: '/billing', visible: true },
    { id: 'analytics', label: 'Analytics', path: '/analytics', visible: true },
    { id: 'account', label: 'Account', path: '/account', visible: true },
  ];

  const getSuperAdminTabs = (): NavigationTab[] => [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', visible: true },
    { id: 'users', label: 'Users', path: '/users', visible: true },
    { id: 'companies', label: 'Companies', path: '/companies', visible: true },
    { id: 'payments', label: 'Payments', path: '/payments', visible: true },
    { id: 'analytics', label: 'Analytics', path: '/analytics', visible: true },
    { id: 'account', label: 'Account', path: '/account', visible: true },
  ];

  const getTabsForRole = () => {
    if (hasRole('company_admin' as UserRole)) return getCompanyAdminTabs();
    if (hasRole('guard' as UserRole)) return getGuardTabs();
    if (hasRole('client' as UserRole)) return getClientTabs();
    // Default to client tabs
    return getClientTabs();
  };

  const getPostLoginRedirect = () => {
    if (hasRole('company_admin' as UserRole)) return '/guard.html#/company';
    if (hasRole('guard' as UserRole)) return '/guard.html#/bookings';
    if (hasRole('client' as UserRole)) return '/client.html#/home';
    // Default redirect
    return '/client.html#/home';
  };

  return {
    getTabsForRole,
    getPostLoginRedirect,
    getClientTabs,
    getGuardTabs,
    getCompanyAdminTabs,
    getSuperAdminTabs
  };
};