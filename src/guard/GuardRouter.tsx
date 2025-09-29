import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/pages/AuthPage';
import GuardHomePage from './pages/GuardHomePage';
import AssignmentsPage from './pages/AssignmentsPage';
import AssignmentDetailPage from './pages/AssignmentDetailPage';
import BookingsPage from './pages/BookingsPage';
import GuardAccountPage from './pages/GuardAccountPage';
import ProfileEditPage from './pages/ProfileEditPage';
import CompanyPage from './pages/CompanyPage';
import CompanyPermitsPage from './pages/CompanyPermitsPage';
import CompanyVehiclesPage from './pages/CompanyVehiclesPage';
import CompanyStaffPage from './pages/CompanyStaffPage';
import CompanyStaffNewPage from './pages/CompanyStaffNewPage';
import CompanyStaffDetailPage from './pages/CompanyStaffDetailPage';
import VehicleFormPage from './pages/VehicleFormPage';
import FreelancerApplyPage from './pages/FreelancerApplyPage';
import SecurityDashboardPage from './pages/SecurityDashboardPage';
import AuditTrailPage from './pages/AuditTrailPage';
import JobDetailPage from './pages/JobDetailPage';

const GuardRouter = () => {
  const { user, hasRole } = useAuth();
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

  // In demo mode, auth seeds very quickly; skip explicit loading state

  if (!user) {
    return <AuthPage />;
  }

  // Route parsing
  const [basePath, _queryString] = currentPath.split('?');
  const pathParts = basePath.split('/');

  // Role-based route protection
  const requiresCompanyAdmin = ['/company', '/company-permits', '/company-vehicles', '/company-vehicles-new', '/company-staff', '/company-staff-new'].includes(basePath) || basePath.startsWith('/company-staff/') || basePath.startsWith('/company-vehicles/');
  
  if (requiresCompanyAdmin && !hasRole('company_admin')) {
    navigate('/home');
    return <GuardHomePage navigate={navigate} />;
  }

  switch (basePath) {
    case '/home':
    case '/':
      return <GuardHomePage navigate={navigate} />;
    case '/assignments':
      return <AssignmentsPage navigate={navigate} />;
    case '/bookings':
      return <BookingsPage navigate={navigate} />;
    case '/account':
      return <ProfileEditPage />;
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
    case '/security':
      return <SecurityDashboardPage navigate={navigate} />;
    case '/audit-trail':
      return <AuditTrailPage navigate={navigate} />;
    default:
      if (basePath.startsWith('/assignment/')) {
        const assignmentId = pathParts[2];
        return <AssignmentDetailPage navigate={navigate} assignmentId={assignmentId} />;
      }
      if (basePath.startsWith('/job/')) {
        const bookingId = pathParts[2];
        return <JobDetailPage navigate={navigate} bookingId={bookingId} />;
      }
      if (basePath.startsWith('/company-staff/')) {
        const staffId = pathParts[2];
        return <CompanyStaffDetailPage navigate={navigate} staffId={staffId} />;
      }
      if (basePath.startsWith('/company-vehicles/')) {
        const vehicleId = pathParts[2];
        return <VehicleFormPage navigate={navigate} vehicleId={vehicleId} />;
      }
      // Redirect to home for unknown routes
      navigate('/home');
      return <GuardHomePage navigate={navigate} />;
  }
};

export default GuardRouter;