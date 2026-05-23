import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { loginWithEmail, signUpWithEmail } from '../services/firebase';

// 3D Canvas Component for animated background
const Canvas3D = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    let particles = [];
    let time = 0;

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 1000,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 2 + 1,
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);

      time += 0.002;

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += 2;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        if (p.z > 1000) p.z = 0;

        const scale = 1000 / (p.z + 1000);
        const px = p.x * scale;
        const py = p.y * scale;
        const size = p.size * scale;

        ctx.fillStyle = `rgba(255, 107, 53, ${0.5 * (1 - p.z / 1000)})`;
        ctx.fillRect(px, py, size, size);

        // Draw connections
        particles.forEach((p2, j) => {
          if (i < j) {
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
              ctx.strokeStyle = `rgba(255, 107, 53, ${0.1 * (1 - dist / 150)})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(p2.x * (1000 / (p2.z + 1000)), p2.y * (1000 / (p2.z + 1000)));
              ctx.stroke();
            }
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return <Canvas3DElement ref={canvasRef} />;
};

const Canvas3DElement = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 1;
`;

const LoginContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
  position: relative;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 50%, rgba(255, 107, 53, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(76, 175, 255, 0.1) 0%, transparent 50%);
    z-index: 0;
    pointer-events: none;
  }
`;

const Canvas3DWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const FormWrapper = styled.div`
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 440px;
  padding: 0 20px;
`;

const GlassmorphismCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 50px 40px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  animation: slideUp 0.6s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 600px) {
    padding: 40px 25px;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, #ff6b35 0%, #4cbaff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 30px 0;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button`
  flex: 1;
  background: none;
  border: none;
  padding: 12px 0;
  color: ${props => (props.active ? '#ff6b35' : 'rgba(255, 255, 255, 0.5)')};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  transition: color 0.3s ease;

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: #ff6b35;
    transform: ${props => (props.active ? 'scaleX(1)' : 'scaleX(0)')};
    transition: transform 0.3s ease;
  }

  &:hover {
    color: rgba(255, 255, 255, 0.8);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  animation: fadeIn 0.4s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.15);
    border-color: #ff6b35;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px 16px;
  background: linear-gradient(135deg, #ff6b35 0%, #ff8955 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(255, 107, 53, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.3);
  color: #ff3b30;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 20px;
`;

const SuccessMessage = styled.div`
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.3);
  color: #34d399;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 20px;
`;

const DividerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 25px 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const DividerText = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
`;

const FooterText = styled.p`
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 20px;

  a {
    color: #ff6b35;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s ease;

    &:hover {
      color: #ff8955;
    }
  }
`;

const LoginPage = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (isSignUp) {
      if (!formData.displayName) {
        setError('Please enter your name');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(formData.email, formData.password, formData.displayName);
        setSuccess('Account created successfully! Welcome to GramMate!');
        setTimeout(() => onLoginSuccess(), 2000);
      } else {
        await loginWithEmail(formData.email, formData.password);
        setSuccess('Logged in successfully!');
        setTimeout(() => onLoginSuccess(), 1000);
      }
    } catch (err) {
      const errorMessage = err.code === 'auth/email-already-in-use' 
        ? 'Email already in use'
        : err.code === 'auth/user-not-found'
        ? 'User not found'
        : err.code === 'auth/wrong-password'
        ? 'Wrong password'
        : err.message || 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
  };

  return (
    <LoginContainer>
      <Canvas3DWrapper>
        <Canvas3D />
      </Canvas3DWrapper>
      
      <FormWrapper>
        <GlassmorphismCard>
          <Title>GramMate</Title>
          <Subtitle>{isSignUp ? 'Create your account' : 'Welcome back'}</Subtitle>

          <TabContainer>
            <Tab active={!isSignUp} onClick={() => !isSignUp && toggleMode()}>
              Login
            </Tab>
            <Tab active={isSignUp} onClick={() => isSignUp && toggleMode()}>
              Sign Up
            </Tab>
          </TabContainer>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <FormGroup>
                <Label>Full Name</Label>
                <Input
                  type="text"
                  name="displayName"
                  placeholder="John Doe"
                  value={formData.displayName}
                  onChange={handleInputChange}
                />
              </FormGroup>
            )}

            <FormGroup>
              <Label>Email Address</Label>
              <Input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup>
              <Label>Password</Label>
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
              />
            </FormGroup>

            {isSignUp && (
              <FormGroup>
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </FormGroup>
            )}

            <SubmitButton type="submit" disabled={loading}>
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </SubmitButton>
          </form>

          <DividerContainer>
            <DividerText>OR</DividerText>
          </DividerContainer>

          <FooterText>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <a onClick={toggleMode} style={{ cursor: 'pointer' }}>
              {isSignUp ? 'Sign in' : 'Sign up'}
            </a>
          </FooterText>
        </GlassmorphismCard>
      </FormWrapper>
    </LoginContainer>
  );
};

export default LoginPage;
