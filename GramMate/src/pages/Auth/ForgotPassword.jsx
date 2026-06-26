import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Logo from '../../components/brand/Logo';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword, authProcessing } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) return;
    setError('');

    const { error: resetError } = await resetPassword(email);
    if (resetError) {
      setError(resetError.message || 'Unable to send reset link');
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gm-bg)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-8 sm:p-10 shadow-lg animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>

        <div className="mb-6 space-y-1 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gm-brand-light)]">Forgot Password</p>
          <h1 className="text-h1 text-[var(--gm-text)]">Reset your access</h1>
          <p className="text-body text-[var(--gm-text-secondary)]">Enter your email and we'll send you a secure link to reset your password.</p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-success/30 bg-success/10 p-5 text-center space-y-3 animate-fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
              <Mail className="text-success" size={24} />
            </div>
            <h3 className="font-bold text-[var(--gm-text)]">Check your inbox</h3>
            <p className="text-sm text-[var(--gm-text-secondary)]">
              If an account exists for <strong className="text-[var(--gm-text)]">{email}</strong>, we sent a secure password reset link.
            </p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-sm font-semibold text-danger animate-fade-in">
                {error}
              </div>
            )}
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={authProcessing}
            />
            <Button
              type="submit"
              className="w-full"
              loading={authProcessing}
              icon={KeyRound}
            >
              Send reset link
            </Button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--gm-text-secondary)] hover:text-[var(--gm-brand-light)] transition-colors"
          >
            <ArrowLeft size={16} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
