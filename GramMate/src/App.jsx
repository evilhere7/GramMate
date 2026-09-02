import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import VideoFeed from './pages/Feed/VideoFeed';
import WalletDashboard from './pages/Wallet/WalletDashboard';
import UploadPage from './pages/Upload/UploadPage';
import CreatorProfilePage from './pages/Profile/CreatorProfilePage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Login from './pages/Auth/Login';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth"  element={<Login />} />

        {/* Main App with Sidebar Layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<VideoFeed />} />
          <Route path="feed"     element={<VideoFeed />} />
          <Route path="discover" element={<VideoFeed isDiscoverMode={true} />} />
          <Route path="wallet"   element={<WalletDashboard />} />
          <Route path="profile"  element={<CreatorProfilePage />} />
          <Route path="profile/:userId" element={<CreatorProfilePage />} />
          <Route path="upload"   element={<UploadPage />} />
          <Route path="studio"   element={<UploadPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
