import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const { error: resetError } = await resetPassword(email);
    if (resetError) {
      setError(resetError.message || 'Unable to send reset link');
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16 sm:px-8">
      <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-10 shadow-soft">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">Forgot password</p>
          <h1 className="text-3xl font-semibold text-slate-950">Reset your account access</h1>
          <p className="text-sm text-slate-500">Enter your account email, and we’ll send a secure link to reset your password.</p>
        </div>

        {submitted ? (
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-slate-900">
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-2 text-sm text-slate-600">If an account exists, we sent a reset link to the email you provided.</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={error}
            />
            <Button type="submit" className="w-full">Send reset link</Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
