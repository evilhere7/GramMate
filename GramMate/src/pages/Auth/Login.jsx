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
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Enter your email first so we know where to send the reset link.');
      return;
    }
    const { error } = await resetPassword(email);
    if (error) setError(error.message);
    else setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <Logo size="lg" className="[&_h1]:text-white [&_p]:text-slate-400" hoverGlow={false} />
          <div>
            <p className="text-4xl font-bold leading-tight">Secure sessions for a real earning account.</p>
            <div className="mt-8 space-y-4">
              {['Email verification', 'Google OAuth', 'Password reset', 'Device management'].map((item) => (
                <div key={item} className="flex items-center gap-3 text-slate-200">
                  <MonitorSmartphone size={18} className="text-blue-400" aria-hidden="true" />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Logo size="md" className="mb-10 lg:hidden" hoverGlow={false} />
            <h1 className="text-3xl font-bold text-slate-950">Welcome back</h1>
            <p className="mt-2 text-slate-600">Log in to watch, create, earn, and manage payouts.</p>

            {error && <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
            {resetSent && <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">Password reset email sent.</div>}

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <span className="relative flex items-center">
                  <Mail className="absolute left-3 text-slate-400" size={19} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 py-3 pl-10 pr-3 text-slate-950" placeholder="you@example.com" />
                </span>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
                <span className="relative flex items-center">
                  <Lock className="absolute left-3 text-slate-400" size={19} />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-slate-300 py-3 pl-10 pr-3 text-slate-950" placeholder="Your password" />
                </span>
              </label>
              <div className="flex items-center justify-between">
                <button type="button" onClick={handlePasswordReset} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
                  <KeyRound size={16} />
                  Reset password
                </button>
              </div>
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <button onClick={signInWithGoogle} type="button" className="mt-4 w-full rounded-md border border-slate-300 bg-white py-3 font-bold text-slate-900 hover:bg-slate-50">
              Continue with Google
            </button>

            <p className="mt-8 text-center text-sm text-slate-600">
              New to GramMate? <Link to="/signup" className="font-bold text-blue-700">Create an account</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
