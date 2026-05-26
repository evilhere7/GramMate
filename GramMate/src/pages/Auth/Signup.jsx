import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, UserPlus, Github, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { error } = await signUp(email, password, { username });
      if (error) throw error;
      // Depending on confirm email settings, might need to redirect to verification page
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create an account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden px-4">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-gray-950/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 relative z-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">Join GramMate</h1>
          <p className="text-gray-400 font-medium">Watch. Create. Earn.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <div className="relative flex items-center">
              <User className="absolute left-4 text-gray-500" size={20} />
              <input 
                type="text"
                required
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 text-gray-500" size={20} />
              <input 
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>
          
          <div>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-gray-500" size={20} />
              <input 
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && <UserPlus size={18} className="group-hover:scale-110 transition-transform" />}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-950/50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-semibold py-3 rounded-xl transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.81 15.71 17.59V20.35H19.28C21.36 18.43 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.28 20.35L15.71 17.59C14.72 18.25 13.46 18.66 12 18.66C9.17 18.66 6.77 16.75 5.86 14.18H2.18V17.03C3.99 20.63 7.7 23 12 23Z" fill="#34A853"/>
                <path d="M5.86 14.18C5.63 13.49 5.5 12.76 5.5 12C5.5 11.24 5.63 10.51 5.86 9.82V6.97H2.18C1.43 8.46 1 10.18 1 12C1 13.82 1.43 15.54 2.18 17.03L5.86 14.18Z" fill="#FBBC05"/>
                <path d="M12 5.34C13.62 5.34 15.07 5.9 16.21 6.99L19.35 3.85C17.46 2.09 14.97 1 12 1C7.7 1 3.99 3.37 2.18 6.97L5.86 9.82C6.77 7.25 9.17 5.34 12 5.34Z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
