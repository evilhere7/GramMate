import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { confirmPasswordReset } from '../../services/firebaseAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

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
  const token = searchParams.get('oobCode') ?? searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    if (!token) {
      setError('Missing reset token. Use the reset link sent to your email.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await confirmPasswordReset(token, values.password);
      setSubmitted(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
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
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Input
              label="New password"
              type="password"
              placeholder="********"
              {...register('password')}
              error={errors.password?.message}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="********"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating password…' : 'Save password'}
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
