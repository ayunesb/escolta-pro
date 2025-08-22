import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
          setRole(e.target.value as any);
          navigate(roleRoutes[e.target.value] || '/');
        }}
      >
        {userRoles.map(role => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>
    </div>
  );
};
