import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Logo from '../../components/brand/Logo';
import supabaseAuth from '../../services/supabaseAuth';
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // oobCode is used for Firebase Auth, access_token as a fallback
  const token = searchParams.get('oobCode') ?? searchParams.get('access_token') ?? searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    if (!token) {
      setError('Missing reset token. Please check the link sent to your email.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await supabaseAuth.confirmPasswordReset(token, values.password);
      setSubmitted(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gm-bg)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-8 sm:p-10 shadow-lg animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>

        <div className="mb-6 space-y-1 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gm-brand-light)]">Reset Password</p>
          <h1 className="text-h1 text-[var(--gm-text)]">Create new password</h1>
          <p className="text-body text-[var(--gm-text-secondary)]">Choose a strong, unique password to keep your GramMate account secure.</p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-success/30 bg-success/10 p-5 text-center space-y-3 animate-fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
              <CheckCircle2 className="text-success" size={24} />
            </div>
            <h3 className="font-bold text-[var(--gm-text)]">Password updated</h3>
            <p className="text-sm text-[var(--gm-text-secondary)]">
              Your password has been changed successfully. Redirecting you to sign in...
            </p>
            <div className="pt-2">
              <Link to="/login" className="text-sm font-bold text-[var(--gm-brand-light)] hover:text-[var(--gm-brand)] transition-colors">
                Return to login page
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-sm font-semibold text-danger animate-fade-in">
                {error}
              </div>
            )}
            
            {!token && (
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-sm font-medium text-[var(--gm-text)] animate-fade-in">
                Warning: No reset token detected in the URL. Please verify you clicked the complete link in your email.
              </div>
            )}

            <Input
              label="New Password"
              type="password"
              placeholder="Min. 8 characters"
              icon={Lock}
              disabled={loading}
              {...register('password')}
              error={errors.password?.message}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter password"
              icon={Lock}
              disabled={loading}
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!token}
            >
              Save password
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
