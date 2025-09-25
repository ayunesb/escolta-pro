import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SuperAdminPage from '@/guard/pages/SuperAdminPage';
import SystemSettingsPage from '@/guard/pages/SystemSettingsPage';
import AuthPage from '@/pages/AuthPage';
import StripeFailedEventsPage from './pages/StripeFailedEventsPage';
import AdminLayout from './components/AdminLayout';

const AdminRouter = () => {
  const { user, loading, hasRole } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/dashboard');

  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.hash.slice(1) || '/dashboard';
      setCurrentPath(path);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  // Show loading spinner while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Check if user has super admin role
  if (!hasRole('company_admin')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this area.</p>
        </div>
      </div>
    );
  }

  let page: JSX.Element;
  switch (currentPath) {
    case '/settings':
      page = <SystemSettingsPage navigate={navigate} />; break;
    case '/stripe-failed-events':
      page = <StripeFailedEventsPage />; break;
    case '/dashboard':
    default:
      page = <SuperAdminPage navigate={navigate} />; break;
  }
  return (
    <AdminLayout currentPath={currentPath} onNavigate={navigate}>
      {page}
    </AdminLayout>
  );
};

export default AdminRouter;