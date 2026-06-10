import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const processRecoveryLink = async () => {
      if (window.location.search.includes('type=recovery') || window.location.search.includes('access_token')) {
        const { data, error: linkError } = await supabase.auth.getSessionFromUrl();
        if (linkError) {
          setError(linkError.message || 'Unable to process reset link.');
          return;
        }
        if (data?.session) {
          setReady(true);
          return;
        }
      }
      setReady(true);
    };

    processRecoveryLink();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const { error: updateError } = await updatePassword(password);
    if (updateError) {
      setError(updateError.message || 'Unable to update password.');
      return;
    }

    setSubmitted(true);
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16 sm:px-8">
      <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-10 shadow-soft">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">Reset password</p>
          <h1 className="text-3xl font-semibold text-slate-950">Choose a new secure password</h1>
          <p className="text-sm text-slate-500">Use a strong password to keep your GramMate account protected.</p>
        </div>

        {submitted ? (
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-slate-900">
            <p className="font-semibold">Password updated</p>
            <p className="mt-2 text-sm text-slate-600">You can now sign in with your new password.</p>
            <Link to="/login" className="mt-4 inline-flex text-brand-600 hover:underline">Return to login</Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Input label="New password" type="password" placeholder="********" value={password} onChange={(event) => setPassword(event.target.value)} />
            <Input label="Confirm password" type="password" placeholder="********" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            <Button type="submit" className="w-full" disabled={!ready}>Save password</Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
