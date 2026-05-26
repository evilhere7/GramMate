import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import VideoFeed from './pages/Feed/VideoFeed';
import WalletDashboard from './pages/Wallet/WalletDashboard';

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
              <div className="flex h-full items-center justify-center text-white">
                <h1 className="text-3xl font-bold">My Profile</h1>
              </div>
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
      </Routes>
    </Router>
  );
}

export default App;