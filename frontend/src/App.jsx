import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import WalletPage from './pages/WalletPage';
import UploadPage from './pages/UploadPage';
import CreatorProfilePage from './pages/CreatorProfilePage';
import { onAuthChange, logout as firebaseLogout, getCurrentUser } from './services/firebase';

const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  background-color: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
`;

const Navigation = styled.nav`
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #111;
  padding: 12px 0;
  border-bottom: 1px solid #222;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  color: ${props => (props.active ? '#FF6B35' : '#888')};
  font-size: 14px;
  padding: 8px 16px;
  cursor: pointer;
  transition: color 0.2s;
  font-weight: ${props => (props.active ? 'bold' : 'normal')};

  &:hover {
    color: #FF6B35;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  font-size: 12px;

  button {
    background: #FF6B35;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    
    &:hover {
      background: #ff5a27;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 107, 53, 0.3);
  border-radius: 50%;
  border-top-color: #ff6b35;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin-top: 16px;
  font-size: 14px;
`;

function App() {
  const [currentPage, setCurrentPage] = useState('firebase-login');
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setFirebaseUser(user);
      setLoading(false);
      
      if (!user) {
        // User logged out
        setToken(null);
        setCurrentPage('firebase-login');
      } else {
        // User logged in
        setCurrentPage('feed');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`http://localhost:8000/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  }, [token]);

  const fetchWallet = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:8000/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setWalletBalance(data.balance_cents / 100);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      // Fetch current user profile and wallet when token changes
      fetchUserProfile();
      fetchWallet();
    }
  }, [token, fetchUserProfile, fetchWallet]);

  useEffect(() => {
    if (firebaseUser && !token) {
      handleFirebaseLogin();
    }
  }, [firebaseUser, token]);

  const handleFirebaseLogin = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return;
    }

    const idToken = await currentUser.getIdToken();
    try {
      const response = await fetch('http://localhost:8000/auth/firebase-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          email: currentUser.email,
          displayName: currentUser.displayName || 'User'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Backend authentication failed');
      }

      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_id', data.user_id);
      setCurrentPage('feed');
    } catch (error) {
      console.error('Backend auth error:', error);
    }
  };

  const handleLogin = (loginToken, userId) => {
    setToken(loginToken);
    localStorage.setItem('token', loginToken);
    localStorage.setItem('user_id', userId);
    setCurrentPage('feed');
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      setToken(null);
      setUser(null);
      setFirebaseUser(null);
      setCurrentPage('firebase-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <AppContainer>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading...</LoadingText>
        </LoadingContainer>
      </AppContainer>
    );
  }

  // Show Firebase login page if not authenticated
  if (!firebaseUser) {
    return (
      <AppContainer>
        <LoginPage onLoginSuccess={handleFirebaseLogin} />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Navigation>
        <NavButton 
          active={currentPage === 'feed'} 
          onClick={() => setCurrentPage('feed')}
        >
          Feed
        </NavButton>
        <NavButton 
          active={currentPage === 'upload'} 
          onClick={() => setCurrentPage('upload')}
        >
          Upload
        </NavButton>
        <NavButton 
          active={currentPage === 'wallet'} 
          onClick={() => setCurrentPage('wallet')}
        >
          Wallet (${walletBalance.toFixed(2)})
        </NavButton>
        <NavButton 
          active={currentPage === 'profile'} 
          onClick={() => setCurrentPage('profile')}
        >
          Profile
        </NavButton>
        <UserInfo>
          {user && (
            <>
              <span>{user.username}</span>
              {user.is_creator && <span style={{ color: '#FF6B35' }}>Creator</span>}
              <button onClick={handleLogout}>Logout</button>
            </>
          )}
          {firebaseUser && !user && (
            <>
              <span>{firebaseUser.displayName || firebaseUser.email}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          )}
        </UserInfo>
      </Navigation>

      {currentPage === 'feed' && <FeedPage token={token} onEarnings={fetchWallet} />}
      {currentPage === 'upload' && <UploadPage token={token} />}
      {currentPage === 'wallet' && <WalletPage token={token} onWithdraw={fetchWallet} />}
      {currentPage === 'profile' && <CreatorProfilePage token={token} userId={localStorage.getItem('user_id')} />}
    </AppContainer>
  );
}

export default App;
