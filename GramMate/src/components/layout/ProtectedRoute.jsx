import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SplashLogo from '../../components/brand/SplashLogo';

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  publicOnly = false 
}) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SplashLogo fullScreen />;
  }

  // If page is for non-logged in users only (e.g. /login)
  if (publicOnly && isAuthenticated) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // If page requires login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If page requires admin privileges
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
