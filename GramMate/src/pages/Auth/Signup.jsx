import { useState } from 'react';
import { ArrowRight, BadgeCheck, Lock, Mail, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Logo from '../../components/brand/Logo';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('creator');
  const [error, setError] = useState('');
  const { signUp, signInWithGoogle, authProcessing } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signUp(email, password, { username, fullName: '', role: role.toUpperCase() });
      navigate('/feed');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create an account');
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    try {
      await signInWithGoogle('/feed');
      navigate('/feed');
    } catch (err) {
      setError(err?.message || 'Google sign-up failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid-cols-[1.05fr_0.95fr]">
        <main className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Logo size="md" className="mb-10" hoverGlow={false} />
            <h1 className="text-3xl font-bold text-slate-950">Create your GramMate account</h1>
            <p className="mt-2 text-slate-600">Choose how you want to begin. You can switch between viewer and creator tools anytime.</p>

            {error && <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

            <form onSubmit={handleSignup} className="mt-8 space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
                {['creator', 'viewer'].map((item) => (
                  <button key={item} type="button" onClick={() => setRole(item)} className={`rounded-md px-3 py-2 text-sm font-bold capitalize ${role === item ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}>
                    {item}
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Username</span>
                <span className="relative flex items-center">
                  <User className="absolute left-3 text-slate-400" size={19} />
                  <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-md border border-slate-300 py-3 pl-10 pr-3 text-slate-950" placeholder="yourhandle" />
                </span>
              </label>
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
                  <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-slate-300 py-3 pl-10 pr-3 text-slate-950" placeholder="At least 8 characters" />
                </span>
              </label>
              <button type="submit" disabled={authProcessing} className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                {authProcessing ? 'Creating account...' : 'Create account'}
                {!authProcessing && <ArrowRight size={18} />}
              </button>
            </form>

            <button onClick={handleGoogleSignUp} type="button" disabled={authProcessing} className="mt-4 w-full rounded-md border border-slate-300 bg-white py-3 font-bold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              {authProcessing ? 'Starting Google sign-up…' : 'Continue with Google'}
            </button>

            <p className="mt-8 text-center text-sm text-slate-600">
              Already have an account? <Link to="/login" className="font-bold text-blue-700">Sign in</Link>
            </p>
          </div>
        </main>
        <aside className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="rounded-lg border border-white/10 p-6">
            <BadgeCheck size={28} className="text-blue-400" />
            <h2 className="mt-5 text-3xl font-bold">Verification-ready from day one.</h2>
            <p className="mt-4 leading-7 text-slate-300">Profiles include creator badges, public URLs, social links, wallet checks, and review history so monetization feels trustworthy.</p>
          </div>
          <p className="text-sm font-semibold text-slate-400">Email verification may be required depending on Supabase project settings.</p>
        </aside>
      </div>
    </div>
  );
}
