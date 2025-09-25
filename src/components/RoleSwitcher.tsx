import * as React from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

  if (!user || !userRoles || userRoles.length < 2) return null;

  return (
    <div className="role-switcher">
      <label>Switch Role:</label>
      <select
        value={activeRole ?? userRoles[0]}
        onChange={e => {
          const newRole = e.target.value as UserRole;
          if (userRoles.includes(newRole)) {
            setRole(newRole);
            navigate(roleRoutes[newRole] || '/');
          }
        }}
      >
        {userRoles.map(role => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>
    </div>
  );
};
