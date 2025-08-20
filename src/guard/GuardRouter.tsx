import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/pages/AuthPage';
import GuardHomePage from './pages/GuardHomePage';
import AssignmentsPage from './pages/AssignmentsPage';
import BookingsPage from './pages/BookingsPage';
import GuardAccountPage from './pages/GuardAccountPage';
import CompanyPage from './pages/CompanyPage';
import CompanyPermitsPage from './pages/CompanyPermitsPage';
import CompanyVehiclesPage from './pages/CompanyVehiclesPage';
import CompanyStaffPage from './pages/CompanyStaffPage';
import CompanyStaffNewPage from './pages/CompanyStaffNewPage';
import CompanyStaffDetailPage from './pages/CompanyStaffDetailPage';
import VehicleFormPage from './pages/VehicleFormPage';
import FreelancerApplyPage from './pages/FreelancerApplyPage';

const GuardRouter = () => {
  const { user, loading, hasRole } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/home');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/home');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Route parsing
  const [basePath, queryString] = currentPath.split('?');
  const pathParts = basePath.split('/');

  // Role-based route protection
  const requiresCompanyAdmin = ['/company', '/company-permits', '/company-vehicles', '/company-vehicles-new', '/company-staff', '/company-staff-new'].includes(basePath) || basePath.startsWith('/company-staff/') || basePath.startsWith('/company-vehicles/');
  
  if (requiresCompanyAdmin && !hasRole('company_admin')) {
    navigate('/bookings');
    return <BookingsPage navigate={navigate} />;
  }

  switch (basePath) {
    case '/home':
    case '/':
      return <BookingsPage navigate={navigate} />;
    case '/bookings':
      return <BookingsPage navigate={navigate} />;
    case '/account':
      return <GuardAccountPage navigate={navigate} />;
    case '/company':
      return <CompanyPage navigate={navigate} />;
    case '/company-permits':
      return <CompanyPermitsPage navigate={navigate} />;
    case '/company-vehicles':
      return <CompanyVehiclesPage navigate={navigate} />;
    case '/company-staff':
      return <CompanyStaffPage navigate={navigate} />;
    case '/company-staff-new':
      return <CompanyStaffNewPage navigate={navigate} />;
    case '/company-vehicles-new':
      return <VehicleFormPage navigate={navigate} />;
    case '/apply':
      return <FreelancerApplyPage navigate={navigate} />;
    default:
      if (basePath.startsWith('/company-staff/')) {
        const staffId = pathParts[2];
        return <CompanyStaffDetailPage navigate={navigate} staffId={staffId} />;
      }
      if (basePath.startsWith('/company-vehicles/')) {
        const vehicleId = pathParts[2];
        return <VehicleFormPage navigate={navigate} vehicleId={vehicleId} />;
      }
      // Redirect to bookings for unknown routes
      navigate('/bookings');
      return <BookingsPage navigate={navigate} />;
  }
};

export default GuardRouter;