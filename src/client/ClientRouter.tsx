import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/pages/AuthPage';
import HomePage from './pages/HomePage';
import BookPage from './pages/BookPage';
import QuotePage from './pages/QuotePage';
import BookingsPage from './pages/BookingsPage';
import AccountPage from './pages/AccountPage';
import ProfilePage from './pages/ProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import { BookingDetailPage } from './pages/BookingDetailPage';

const ClientRouter = () => {
  const { user, loading } = useAuth();
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
    case '/account':
      return <AccountPage navigate={navigate} />;
    case '/profile':
      return <ProfilePage navigate={navigate} id={queryParams.get('id')} />;
    case '/profile-edit':
      return <ProfileEditPage navigate={navigate} />;
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