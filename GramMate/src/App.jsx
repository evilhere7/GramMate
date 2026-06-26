import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import ForbiddenPage from './pages/Auth/ForbiddenPage';
import VideoFeed from './pages/Feed/VideoFeed';
import WalletDashboard from './pages/Wallet/WalletDashboard';
import UploadPage from './pages/Upload/UploadPage';
import CreatorProfilePage from './pages/Profile/CreatorProfilePage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import LandingPage from './pages/Landing/LandingPage';
import CreatorStudio from './pages/Studio/CreatorStudio';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/" element={<MainLayout />}>
          <Route path="feed" element={<VideoFeed />} />
          <Route path="explore" element={<VideoFeed />} />
          <Route path="wallet" element={<ProtectedRoute><WalletDashboard /></ProtectedRoute>} />
          <Route path="profile/me" element={<ProtectedRoute><CreatorProfilePage /></ProtectedRoute>} />
          <Route path="upload" element={<ProtectedRoute requireCreator><UploadPage /></ProtectedRoute>} />
          <Route path="studio" element={<ProtectedRoute requireCreator><CreatorStudio /></ProtectedRoute>} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
        <Route path="/403" element={<ForbiddenPage />} />

        <Route path="/login" element={<ProtectedRoute requireAuth={false}><Login /></ProtectedRoute>} />
        <Route path="/signup" element={<ProtectedRoute requireAuth={false}><Signup /></ProtectedRoute>} />
        <Route path="/forgot-password" element={<ProtectedRoute requireAuth={false}><ForgotPassword /></ProtectedRoute>} />
        <Route path="/reset-password" element={<ProtectedRoute requireAuth={false}><ResetPassword /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
