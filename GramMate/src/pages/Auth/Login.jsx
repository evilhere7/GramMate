import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/brand/Logo';
import Modal from '../../components/ui/Modal';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  
  // Password Reset Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const { signIn, signUp, signInWithGoogle, resetPassword, authProcessing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectUser = (userEmail) => {
    if (userEmail && userEmail.toLowerCase() === 'evilmc777@gmail.com') {
      navigate('/admin');
    } else {
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authProcessing) return;
    setError('');

    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }
    if (!password) {
      setError('Please provide your password.');
      return;
    }

    try {
      if (isSignUp) {
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          return;
        }
        await signUp(email.trim(), password, {
          fullName: fullName.trim(),
          username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
        });
        redirectUser(email.trim());
      } else {
        await signIn(email.trim(), password);
        redirectUser(email.trim());
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleGoogleAuth = async () => {
    if (authProcessing) return;
    setError('');
    try {
      const result = await signInWithGoogle();
      const userEmail = result?.user?.email || '';
      redirectUser(userEmail);
    } catch (err) {
      if (!err?.message?.includes('closed')) {
        setError(err?.message || 'Google sign-in could not be completed.');
      }
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Please enter your account email address.');
      return;
    }
    setResetError('');
    const { error: sendErr } = await resetPassword(resetEmail.trim());
    if (sendErr) {
      setResetError(sendErr.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gm-bg)] text-[var(--gm-text)] flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
          <Logo size="lg" layout="vertical" />
        </Link>
      </div>

      {/* Auth Container */}
      <div className="w-full max-w-md gm-card p-6 md:p-8 bg-[var(--gm-surface)] shadow-2xl border border-[var(--gm-border-strong)]">
        {/* Toggle Mode Header */}
        <div className="flex border-b border-[var(--gm-border)] mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${
              !isSignUp 
                ? 'text-[var(--gm-brand)] border-b-2 border-[var(--gm-brand)]' 
                : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text)]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${
              isSignUp 
                ? 'text-[var(--gm-brand)] border-b-2 border-[var(--gm-brand)]' 
                : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text)]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={authProcessing}
          className="w-full gm-btn-secondary py-2.5 flex items-center justify-center gap-3 text-sm font-semibold mb-5 hover:bg-[var(--gm-surface-elevated)] transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-px bg-[var(--gm-border)] flex-1" />
          <span className="text-[11px] uppercase tracking-wider text-[var(--gm-text-tertiary)] font-bold">
            Or with email
          </span>
          <div className="h-px bg-[var(--gm-border)] flex-1" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--gm-text-secondary)] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gm-text-tertiary)]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="gm-input pl-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--gm-text-secondary)] mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gm-text-tertiary)] font-bold text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="creator_handle"
                    className="gm-input pl-9 text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--gm-text-secondary)] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gm-text-tertiary)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="gm-input pl-10 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[var(--gm-text-secondary)]">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetSent(false);
                    setResetError('');
                    setResetModalOpen(true);
                  }}
                  className="text-xs text-[var(--gm-brand)] hover:underline font-medium"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gm-text-tertiary)]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="gm-input pl-10 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={authProcessing}
            className="gm-btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2 text-sm font-bold shadow-sm"
          >
            <span>{authProcessing ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>

      {/* Password Reset Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Your Password"
      >
        {resetSent ? (
          <div className="text-center py-4 space-y-3">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold">Check your email</h3>
            <p className="text-xs text-[var(--gm-text-secondary)] leading-relaxed">
              We've dispatched password reset instructions to{' '}
              <span className="font-semibold text-[var(--gm-text)]">{resetEmail}</span>.
            </p>
            <button
              onClick={() => setResetModalOpen(false)}
              className="gm-btn-secondary text-xs px-4 py-2 mt-4"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <p className="text-xs text-[var(--gm-text-secondary)] leading-relaxed">
              Enter your email address and we'll send you an official link to securely reset your password.
            </p>

            {resetError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{resetError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--gm-text-secondary)] mb-1.5">
                Account Email
              </label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@example.com"
                className="gm-input text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="gm-btn-ghost text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={authProcessing}
                className="gm-btn-primary text-xs py-2 px-4"
              >
                {authProcessing ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
