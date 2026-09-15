import { useEffect, useState } from 'react';
import { Check, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { createSubscriptionCheckout } from '../../services/paymentService';

const money = (cents, currency) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);

export default function PremiumPage() {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    supabase.from('subscription_plans').select('*').eq('active', true).order('price_cents').then(({ data }) => {
      if (mounted) setPlans(data || []);
      setLoading(false);
    }).catch(() => {
      if (mounted) setPlans([]);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const startCheckout = async (plan) => {
    if (!isAuthenticated) {
      window.location.assign('/login');
      return;
    }
    setError('');
    setCheckoutPlan(plan.id);
    try {
      const result = await createSubscriptionCheckout(plan.id);
      if (!result.url) throw new Error('Checkout is not available for this plan yet.');
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError.message);
      setCheckoutPlan(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 pb-24">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--gm-brand-light)]">Premium</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--gm-text)]">Support GramMate with Premium</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--gm-text-secondary)]">Payments are verified by the provider webhook before Premium access is activated.</p>
      </header>

      {error && <div className="mt-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-semibold text-danger">{error}</div>}

      {loading ? <p className="mt-10 text-sm text-[var(--gm-text-secondary)]">Loading plans...</p> : (
        <section className="mt-10 grid gap-5 md:grid-cols-2">
          {plans.length === 0 && (
            <div className="gm-card p-6 text-sm text-[var(--gm-text-secondary)] md:col-span-2">
              Premium plans are not available yet. An administrator must configure an active plan and provider price before checkout can begin.
            </div>
          )}
          {plans.map((plan) => (
            <article key={plan.id} className="gm-card flex flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[var(--gm-text)]">{plan.name}</h2>
                  <p className="mt-2 text-sm text-[var(--gm-text-secondary)]">{plan.description}</p>
                </div>
                <CreditCard className="text-[var(--gm-brand)]" size={22} aria-hidden="true" />
              </div>
              <p className="mt-8 text-3xl font-black text-[var(--gm-text)]">{money(plan.price_cents, plan.currency)}<span className="ml-1 text-sm font-semibold text-[var(--gm-text-tertiary)]">/{plan.billing_interval}</span></p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--gm-text-secondary)]">
                <li className="flex gap-2"><Check size={16} className="text-success" /> Provider-hosted secure checkout</li>
                <li className="flex gap-2"><Check size={16} className="text-success" /> Verified subscription status</li>
                <li className="flex gap-2"><Check size={16} className="text-success" /> Cancel through the configured provider</li>
              </ul>
              <button type="button" onClick={() => startCheckout(plan)} disabled={checkoutPlan !== null} className="gm-btn-primary mt-8 w-full py-3">
                {checkoutPlan === plan.id ? 'Opening checkout...' : 'Choose plan'}
              </button>
            </article>
          ))}
        </section>
      )}

      <div className="mt-8 flex gap-3 rounded-xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 text-xs text-[var(--gm-text-secondary)]">
        <ShieldCheck size={18} className="shrink-0 text-success" aria-hidden="true" />
        <p>Returning from checkout does not activate Premium by itself. GramMate waits for a verified payment provider event.</p>
      </div>
    </div>
  );
}
