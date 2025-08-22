import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

interface RouteGuardProps {
  allowedRoles: string[];
  redirectTo?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ allowedRoles, redirectTo = '/' }) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
};
