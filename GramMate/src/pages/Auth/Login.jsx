import { useState } from 'react';
import { ArrowRight, KeyRound, Lock, Mail, MonitorSmartphone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/brand/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signInWithGoogle, resetPassword, authProcessing } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signIn(email, password);
      navigate('/feed');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to sign in');
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Enter your email first so we know where to send the reset link.');
      return;
    }
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to send reset link');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle('/feed');
      navigate('/feed');
    } catch (err) {
      setError(err?.message || 'Google sign-in failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gm-bg)] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-surface)] lg:grid-cols-[0.95fr_1.05fr]">
        {/* Left Panel */}
        <aside className="relative hidden overflow-hidden gradient-hero p-10 text-white lg:flex lg:flex-col lg:justify-between">
          {/* Ambient blobs */}
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[var(--gm-brand)] opacity-[0.12] blur-[100px]" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-[var(--gm-accent)] opacity-[0.1] blur-[100px]" />

          <div className="relative">
            <Logo size="lg" className="[&_h1]:text-white [&_p]:text-white/50" />
          </div>
          <div className="relative">
            <p className="text-display leading-tight text-white">Secure sessions for a real earning account.</p>
            <div className="mt-8 space-y-4">
              {['Email verification', 'Google OAuth', 'Password reset', 'Device management'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <MonitorSmartphone size={16} className="text-[var(--gm-accent-light)]" aria-hidden="true" />
                  </div>
                  <span className="font-semibold text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Panel — Form */}
        <main className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md animate-fade-in-up">
            <Logo size="md" className="mb-10 lg:hidden" />
            <h1 className="text-h1">Welcome back</h1>
            <p className="mt-2 text-body text-[var(--gm-text-secondary)]">Log in to watch, create, earn, and manage payouts.</p>

            {error && (
              <div className="mt-6 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger animate-fade-in">
                {error}
              </div>
            )}
            {resetSent && (
              <div className="mt-6 rounded-xl border border-success/30 bg-success/10 p-3 text-sm font-semibold text-success animate-fade-in">
                Password reset email sent.
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-caption font-semibold text-[var(--gm-text-secondary)]">Email</span>
                <span className="relative flex items-center">
                  <Mail className="absolute left-3.5 text-[var(--gm-text-tertiary)]" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg)] py-3 pl-11 pr-3.5 text-[var(--gm-text)] placeholder:text-[var(--gm-text-tertiary)] transition-all focus:border-[var(--gm-brand)] focus:ring-2 focus:ring-[var(--gm-brand-glow)] focus:outline-none"
                    placeholder="you@example.com"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-caption font-semibold text-[var(--gm-text-secondary)]">Password</span>
                <span className="relative flex items-center">
                  <Lock className="absolute left-3.5 text-[var(--gm-text-tertiary)]" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg)] py-3 pl-11 pr-3.5 text-[var(--gm-text)] placeholder:text-[var(--gm-text-tertiary)] transition-all focus:border-[var(--gm-brand)] focus:ring-2 focus:ring-[var(--gm-brand-glow)] focus:outline-none"
                    placeholder="Your password"
                  />
                </span>
              </label>

              <div className="flex items-center justify-between">
                <button type="button" onClick={handlePasswordReset} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--gm-brand-light)] hover:text-[var(--gm-brand)] transition-colors">
                  <KeyRound size={16} />
                  Reset password
                </button>
              </div>

              <button
                type="submit"
                disabled={authProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-3.5 font-bold text-white shadow-sm glow-brand transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.97]"
              >
                {authProcessing ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Signing in...
                  </>
                ) : (
                  <>Sign in <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--gm-border)]" />
              <span className="text-caption text-[var(--gm-text-tertiary)]">or</span>
              <div className="h-px flex-1 bg-[var(--gm-border)]" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              type="button"
              disabled={authProcessing}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg)] py-3.5 font-bold text-[var(--gm-text)] hover:bg-[var(--gm-surface-elevated)] transition-colors disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.97]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {authProcessing ? 'Starting Google sign-in…' : 'Continue with Google'}
            </button>

            <p className="mt-8 text-center text-sm text-[var(--gm-text-secondary)]">
              New to GramMate?{' '}
              <Link to="/signup" className="font-bold text-[var(--gm-brand-light)] hover:text-[var(--gm-brand)] transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
