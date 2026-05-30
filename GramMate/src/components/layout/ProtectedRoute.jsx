
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SplashLogo from '../../components/brand/SplashLogo';

export default function ProtectedRoute({ children, requireAuth = true }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <SplashLogo fullScreen />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!requireAuth && isAuthenticated) {
    // If it's a public only route (like login) and user is authenticated, send to feed
    return <Navigate to="/" replace />;
  }

  return children;
}
