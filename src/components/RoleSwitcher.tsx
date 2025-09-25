import * as React from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

const roleRoutes: Record<string, string> = {
  client: '/client.html#/home',
  freelancer: '/guard.html#/bookings',
  guard: '/guard.html#/bookings',
  company_admin: '/guard.html#/company',
  super_admin: '/admin.html#/dashboard',
};

export const RoleSwitcher: React.FC = () => {
  const { user, userRoles, activeRole, setRole } = useAuth();
  const navigate = useNavigate();

  // In demo mode always show switcher for the three canonical roles
  const roles = React.useMemo(() => {
    if (DEMO) return ['client','company','guard'] as UserRole[];
    return userRoles || [];
  }, [userRoles]);

  React.useEffect(() => {
    if (!DEMO) return;
    try {
      const saved = localStorage.getItem('demo_role');
      if (saved && (['client','company','guard'] as string[]).includes(saved) && saved !== activeRole) {
        setRole(saved as UserRole);
      }
    } catch {}
  }, [activeRole, setRole]);

  if (!user && !DEMO) return null;
  if (!roles.length) return null;

  return (
    <div className="role-switcher flex items-center gap-1 text-xs">
      <label className="font-medium">Role:</label>
      <select
        className="border rounded px-1 py-0.5 bg-background"
        value={activeRole ?? roles[0]}
        onChange={e => {
          const newRole = e.target.value as UserRole;
            try { if (DEMO) localStorage.setItem('demo_role', newRole); } catch {}
          if (roles.includes(newRole)) {
            setRole(newRole);
            navigate(roleRoutes[newRole] || '/');
          }
        }}
      >
        {roles.map(role => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>
    </div>
  );
};
