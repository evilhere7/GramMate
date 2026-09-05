import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import VideoFeed from './pages/Feed/VideoFeed';
import WalletDashboard from './pages/Wallet/WalletDashboard';
import UploadPage from './pages/Upload/UploadPage';
import CreatorProfilePage from './pages/Profile/CreatorProfilePage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Login from './pages/Auth/Login';
import ForbiddenPage from './pages/ForbiddenPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Route (Public Only) */}
        <Route 
          path="/login" 
          element={
            <ProtectedRoute publicOnly>
              <Login />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/auth"  
          element={
            <ProtectedRoute publicOnly>
              <Login />
            </ProtectedRoute>
          } 
        />

        {/* 403 Access Denied */}
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Dedicated Admin Console (Protected & Strictly Restricted to evilmc777@gmail.com) */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAuth requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Main Consumer Social App */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<VideoFeed />} />
          <Route path="feed" element={<VideoFeed />} />
          <Route path="discover" element={<VideoFeed isDiscoverMode={true} />} />

          {/* Wallet (Requires Login) */}
          <Route 
            path="wallet" 
            element={
              <ProtectedRoute requireAuth>
                <WalletDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Current User Profile (Requires Login) */}
          <Route 
            path="profile"  
            element={
              <ProtectedRoute requireAuth>
                <CreatorProfilePage />
              </ProtectedRoute>
            } 
          />
          {/* Public Profile by Username or User ID */}
          <Route path="profile/:userId" element={<CreatorProfilePage />} />

          {/* Creator Upload Studio (Requires Login) */}
          <Route 
            path="upload"   
            element={
              <ProtectedRoute requireAuth>
                <UploadPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="studio"   
            element={
              <ProtectedRoute requireAuth>
                <UploadPage />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
