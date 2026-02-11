import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import WalletPage from './pages/WalletPage';
import UploadPage from './pages/UploadPage';
import CreatorProfilePage from './pages/CreatorProfilePage';

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

function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (token) {
      // Fetch current user profile
      fetchUserProfile();
      fetchWallet();
    }
  }, [token]);

  const fetchUserProfile = async () => {
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
  };

  const fetchWallet = async () => {
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
  };

  const handleLogin = (loginToken, userId) => {
    setToken(loginToken);
    localStorage.setItem('token', loginToken);
    localStorage.setItem('user_id', userId);
    setCurrentPage('feed');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    setToken(null);
    setUser(null);
    setCurrentPage('auth');
  };

  if (!token) {
    return (
      <AppContainer>
        <AuthPage onLogin={handleLogin} />
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
