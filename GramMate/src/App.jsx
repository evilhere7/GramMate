import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import VideoFeed from './pages/Feed/VideoFeed';
import WalletDashboard from './pages/Wallet/WalletDashboard';
import UploadPage from './pages/Upload/UploadPage';
import CreatorProfilePage from './pages/Profile/CreatorProfilePage';
import AdminDashboard from './pages/Admin/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<VideoFeed />} />
          <Route path="explore" element={<VideoFeed />} />
          
          <Route path="wallet" element={
            <ProtectedRoute>
              <WalletDashboard />
            </ProtectedRoute>
          } />

          <Route path="profile/me" element={
            <ProtectedRoute>
              <CreatorProfilePage />
            </ProtectedRoute>
          } />

          <Route path="upload" element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="/login" element={
          <ProtectedRoute requireAuth={false}>
            <Login />
          </ProtectedRoute>
        } />
        
        <Route path="/signup" element={
          <ProtectedRoute requireAuth={false}>
            <Signup />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute requireAuth={true}>
            <div className="h-screen w-full bg-black text-white">
              <AdminDashboard />
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;