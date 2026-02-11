import React, { useState } from 'react';
import styled from 'styled-components';

const AuthContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
`;

const AuthBox = styled.div`
  background-color: #111;
  padding: 40px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #fff;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #888;
  margin-bottom: 32px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  background-color: #1a1a1a;
  border: 1px solid #333;
  color: #fff;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #FF6B35;
  }

  &::placeholder {
    color: #666;
  }
`;

const Button = styled.button`
  background-color: #FF6B35;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #ff5a27;
  }

  &:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
`;

const ToggleText = styled.p`
  text-align: center;
  font-size: 14px;
  color: #888;

  button {
    background: none;
    border: none;
    color: #FF6B35;
    cursor: pointer;
    font-weight: bold;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  background-color: #3d1700;
  color: #ff9999;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
`;

const SuccessMessage = styled.div`
  background-color: #001a00;
  color: #66ff66;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
`;

function AuthPage({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          username,
          country_code: countryCode
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      setSuccess('Account created! Logging in...');
      onLogin(data.access_token, data.user_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      onLogin(data.access_token, data.user_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      <AuthBox>
        <Title>GramMate</Title>
        <Subtitle>Earn money watching videos you love</Subtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        {isSignup ? (
          <Form onSubmit={handleSignup}>
            <Input
              type="text"
              placeholder="Username (3-50 chars)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password (8+ chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Country Code (US)"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </Form>
        ) : (
          <Form onSubmit={handleLogin}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </Form>
        )}

        <ToggleText>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? 'Log In' : 'Sign Up'}
          </button>
        </ToggleText>
      </AuthBox>
    </AuthContainer>
  );
}

export default AuthPage;
