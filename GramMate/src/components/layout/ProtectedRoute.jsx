
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SplashLogo from '../../components/brand/SplashLogo';
import useProfile from '../../hooks/useProfile';

export default function ProtectedRoute({ children, requireAuth = true, requireCreator = false }) {
  const { isAuthenticated, loading } = useAuth();
  const { loading: profileLoading, isCreator } = useProfile();

  if (loading || (requireAuth && requireCreator && profileLoading)) {
    return <SplashLogo fullScreen />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!requireAuth && isAuthenticated) {
    // If it's a public only route (like login) and user is authenticated, send to feed
    return <Navigate to="/" replace />;
  }

  if (requireAuth && requireCreator && !isCreator) {
    return <Navigate to="/profile/me" replace />;
  }

  return children;
}
