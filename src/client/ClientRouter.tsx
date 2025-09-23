import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/pages/AuthPage';
import HomePage from './pages/HomePage';
import BookPage from './pages/BookPage';
import QuotePage from './pages/QuotePage';
import BookingsPage from './pages/BookingsPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import BookingCancelledPage from './pages/BookingCancelledPage';
import AccountPage from './pages/AccountPage';
import ProfilePage from './pages/ProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import { BookingDetailPage } from './pages/BookingDetailPage';
import BillingPage from './pages/BillingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CompanyPage from './pages/CompanyPage';
import StaffPage from './pages/StaffPage';
import VehiclesPage from './pages/VehiclesPage';
import UsersPage from './pages/UsersPage';
import CompaniesPage from './pages/CompaniesPage';

const ClientRouter = () => {
  console.warn('ClientRouter loading...');
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/home');
  console.warn('Current path:', currentPath, 'User:', user?.id, 'Loading:', loading);

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
  const queryParams = new URLSearchParams(queryString || '');
  
  // Handle dynamic routes like /booking/:id
  const pathSegments = basePath.split('/');

  switch (basePath) {
    case '/home':
    case '/':
      return <HomePage navigate={navigate} />;
    case '/book':
      return <BookPage navigate={navigate} pid={queryParams.get('pid')} />;
    case '/quote':
      return <QuotePage navigate={navigate} />;
    case '/bookings':
      return <BookingsPage navigate={navigate} />;
    case '/booking-success':
      const bookingId = queryParams.get('booking_id');
      return <BookingSuccessPage navigate={navigate} bookingId={bookingId} />;
    case '/booking-cancelled':
      return <BookingCancelledPage navigate={navigate} />;
    case '/account':
      return <AccountPage navigate={navigate} />;
    case '/profile':
      return <ProfilePage navigate={navigate} id={queryParams.get('id')} />;
    case '/profile-edit':
      return <ProfileEditPage navigate={navigate} />;
    case '/billing':
      return <BillingPage navigate={navigate} />;
    case '/analytics':
      return <AnalyticsPage navigate={navigate} />;
    case '/company':
      return <CompanyPage navigate={navigate} />;
    case '/staff':
      return <StaffPage navigate={navigate} />;
    case '/vehicles':
      return <VehiclesPage navigate={navigate} />;
    case '/users':
      return <UsersPage navigate={navigate} />;
    case '/companies':
      return <CompaniesPage navigate={navigate} />;
    default:
      // Handle dynamic routes
      if (pathSegments[1] === 'booking' && pathSegments[2]) {
        const bookingId = pathSegments[2];
        return <BookingDetailPage navigate={navigate} bookingId={bookingId} />;
      }
      
      // Redirect to home for unknown routes
      navigate('/home');
      return <HomePage navigate={navigate} />;
  }
};

export default ClientRouter;