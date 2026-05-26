import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import VideoFeed from './pages/Feed/VideoFeed';
import WalletDashboard from './pages/Wallet/WalletDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children, requireAuth = false, requireAdmin = false }) {
  const { isAuthenticated, currentUser } = useAuth();

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Basic admin check simulation - in real app use custom claims
  if (requireAdmin && (!currentUser || !currentUser.email?.includes('admin'))) {
    return <Navigate to="/" />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Application Layout with Sidebar/Bottom Nav */}
        <Route path="/" element={<MainLayout />}>
          {/* Public/View-Only Feed */}
          <Route index element={<VideoFeed />} />
          <Route path="discover" element={<VideoFeed />} />

          {/* Protected Creator/Monetization Routes */}
          <Route 
            path="wallet" 
            element={
              <ProtectedRoute requireAuth>
                <WalletDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="profile" 
            element={
              <ProtectedRoute requireAuth>
                <div className="p-8 text-white"><h1 className="text-3xl">Profile Page</h1></div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="upload" 
            element={
              <ProtectedRoute requireAuth>
                <div className="p-8 text-white"><h1 className="text-3xl">Upload Video</h1></div>
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Standalone Pages without Layout */}
        <Route 
          path="/login" 
          element={<div className="h-screen w-full bg-black flex items-center justify-center text-white"><h1 className="text-3xl">Login Page Placeholder</h1></div>} 
        />
        
        {/* Admin Area */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAuth requireAdmin>
              <div className="h-screen w-full bg-black text-white">
                <AdminDashboard />
              </div>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
