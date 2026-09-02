import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import VideoFeed from './pages/Feed/VideoFeed';
import WalletDashboard from './pages/Wallet/WalletDashboard';
import CreatorProfilePage from './pages/CreatorProfilePage';
import UploadPage from './pages/UploadPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/Admin/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Application Layout with Sidebar / Bottom Nav */}
        <Route path="/" element={<MainLayout />}>
          {/* Public / View-Only Video Feed */}
          <Route index element={<VideoFeed />} />
          <Route path="discover" element={<VideoFeed isDiscoverMode={true} />} />

          {/* Wallet & Monetization */}
          <Route path="wallet" element={<WalletDashboard />} />

          {/* Creator Profile */}
          <Route path="profile" element={<CreatorProfilePage />} />
          <Route path="profile/:userId" element={<CreatorProfilePage />} />

          {/* Upload Video Studio */}
          <Route path="upload" element={<UploadPage />} />
        </Route>

        {/* Standalone Auth & Login Page */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth" element={<LoginPage />} />

        {/* Admin Control Center */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

