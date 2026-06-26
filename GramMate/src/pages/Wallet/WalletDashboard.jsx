import { useState, useEffect } from 'react';
import { ArrowUpRight, BadgeDollarSign, Clock, CreditCard, Download, ShieldCheck, Wallet, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function WalletDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const fetchWalletData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: wData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setWallet(wData);

      const { data: tData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTransactions(tData || []);
    } catch (err) {
      console.error('Error fetching wallet/transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWalletData(); }, [user]);

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(false);

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawError('Please enter a valid positive amount.');
      return;
    }

    const amountCents = Math.round(amount * 100);
    const availableCents = wallet?.balance_cents || 0;

    if (amountCents > availableCents) {
      setWithdrawError('Insufficient available balance.');
      return;
    }

    try {
      const { error: reqError } = await supabase.from('withdrawal_requests').insert({
        wallet_id: wallet.id, user_id: user.id, amount_cents: amountCents, status: 'review',
      });
      if (reqError) throw reqError;

      const { error: txError } = await supabase.from('transactions').insert({
        wallet_id: wallet.id, user_id: user.id, amount_cents: -amountCents,
        transaction_type: 'withdrawal', status: 'review',
      });
      if (txError) throw txError;

      const { error: walletUpdateError } = await supabase
        .from('wallets')
        .update({ balance_cents: availableCents - amountCents, pending_cents: (wallet.pending_cents || 0) + amountCents })
        .eq('id', wallet.id);
      if (walletUpdateError) throw walletUpdateError;

      setWithdrawSuccess(true);
      setWithdrawAmount('');
      await fetchWalletData();
      setTimeout(() => setWithdrawOpen(false), 2000);
    } catch (err) {
      console.error('Withdrawal error:', err);
      setWithdrawError(err.message || 'Failed to submit withdrawal request.');
    }
  };

  const formatCurrency = (cents) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);

  const availableBalance = wallet?.balance_cents || 0;
  const pendingBalance = wallet?.pending_cents || 0;
  const riskHoldBalance = wallet?.risk_hold_cents || 0;

  const withdrawals = transactions.filter(t => t.transaction_type === 'withdrawal' && t.status === 'cleared');
  const lastPayoutCents = withdrawals.length > 0 ? Math.abs(withdrawals[0].amount_cents) : 0;

  const creatorEarningsCents = transactions
    .filter(t => ['ad_share', 'tip', 'donation', 'sponsorship'].includes(t.transaction_type) && t.status === 'cleared')
    .reduce((sum, t) => sum + t.amount_cents, 0);
  const viewerRewardsCents = transactions
    .filter(t => ['watch_reward', 'engagement_reward'].includes(t.transaction_type) && t.status === 'cleared')
    .reduce((sum, t) => sum + t.amount_cents, 0);
  const tipsDonationsCents = transactions
    .filter(t => ['tip', 'donation'].includes(t.transaction_type) && t.status === 'cleared')
    .reduce((sum, t) => sum + t.amount_cents, 0);
  const campaignRewardsCents = transactions
    .filter(t => t.transaction_type === 'campaign_reward' && t.status === 'cleared')
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const breakdown = [
    { label: 'Creator earnings', value: formatCurrency(creatorEarningsCents) },
    { label: 'Viewer rewards', value: formatCurrency(viewerRewardsCents) },
    { label: 'Tips and donations', value: formatCurrency(tipsDonationsCents) },
    { label: 'Campaign rewards', value: formatCurrency(campaignRewardsCents) },
  ];

  if (loading && !wallet) {
    return <div className="p-8 text-sm text-[var(--gm-text-secondary)]">Loading wallet…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-overline text-[var(--gm-brand-light)]">Wallet</p>
          <h1 className="mt-2 text-h1 text-[var(--gm-text)]">Earnings and withdrawals</h1>
          <p className="mt-2 max-w-2xl text-body text-[var(--gm-text-secondary)]">
            Track available balance, pending clearing, payout methods, and all reward sources from a single ledger.
          </p>
        </div>
        <button
          onClick={() => { setWithdrawError(null); setWithdrawSuccess(false); setWithdrawOpen(true); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--gm-brand)] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[var(--gm-brand-light)] transition-all active:scale-[0.97]"
        >
          Withdraw funds
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </header>

      {/* Balance cards */}
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Main balance card */}
        <article className="surface rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-caption text-[var(--gm-text-secondary)]">Available balance</p>
              <p className="mt-2 text-[2.75rem] font-bold leading-none tracking-tight text-[var(--gm-text)]">
                {formatCurrency(availableBalance)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)]">
              <Wallet size={20} className="text-[var(--gm-brand-light)]" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ['Pending', formatCurrency(pendingBalance), Clock],
              ['Last payout', formatCurrency(lastPayoutCents), CreditCard],
              ['Risk holds', formatCurrency(riskHoldBalance), ShieldCheck],
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-lg bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)] p-4">
                <Icon size={16} className="text-[var(--gm-text-tertiary)]" aria-hidden="true" />
                <p className="mt-3 text-caption text-[var(--gm-text-secondary)]">{label}</p>
                <p className="mt-1 text-h3 text-[var(--gm-text)]">{value}</p>
              </div>
            ))}
          </div>
        </article>

        {/* Safeguards card */}
        <article className="surface rounded-xl p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)]">
            <ShieldCheck size={18} className="text-success" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-h3 text-[var(--gm-text)]">Withdrawal safeguards</h2>
          <p className="mt-2 text-body text-[var(--gm-text-secondary)]">
            Every withdrawal runs through account verification, fake view detection, campaign rule checks, and manual review when risk increases.
          </p>
          <div className="mt-5 space-y-2">
            {['Stripe Connect ready', '48h clearing window', 'Audit trail on payout decisions'].map((item) => (
              <div key={item} className="rounded-lg border border-[var(--gm-border)] bg-[var(--gm-surface-elevated)] px-3 py-2.5 text-sm font-semibold text-[var(--gm-text)]">
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-[var(--gm-border)]">
        {['overview', 'transactions', 'methods'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-[var(--gm-brand)] text-[var(--gm-brand-light)]'
                : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {breakdown.map((item) => (
            <div key={item.label} className="surface rounded-xl p-5 card-hover">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)]">
                <BadgeDollarSign size={18} className="text-[var(--gm-brand-light)]" aria-hidden="true" />
              </div>
              <p className="mt-4 text-caption text-[var(--gm-text-secondary)]">{item.label}</p>
              <p className="mt-1 text-h2 text-[var(--gm-text)]">{item.value}</p>
            </div>
          ))}
        </section>
      )}

      {/* Transactions tab */}
      {activeTab === 'transactions' && (
        <section className="mt-6 overflow-hidden rounded-xl surface">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Clock size={32} className="mb-3 text-[var(--gm-text-tertiary)]" />
              <p className="text-h3 text-[var(--gm-text)]">No transactions yet</p>
              <p className="mt-1 text-body text-[var(--gm-text-secondary)]">Earnings and withdrawals will appear here as they occur.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-[var(--gm-border)] px-5 py-3 text-caption font-semibold text-[var(--gm-text-secondary)]">
                <span>Type</span><span>Amount</span><span>Status</span><span>Date</span>
              </div>
              <div className="divide-y divide-[var(--gm-border)]">
                {transactions.map((tx) => (
                  <div key={tx.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 text-sm hover:bg-[var(--gm-surface-elevated)] transition-colors">
                    <span className="font-semibold text-[var(--gm-text)] capitalize">{tx.transaction_type.replace('_', ' ')}</span>
                    <span className={`font-bold ${tx.amount_cents < 0 ? 'text-danger' : 'text-success'}`}>
                      {tx.amount_cents < 0 ? '-' : '+'}{formatCurrency(Math.abs(tx.amount_cents))}
                    </span>
                    <span className="rounded-full bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)] px-2.5 py-0.5 text-xs font-semibold text-[var(--gm-text-secondary)] capitalize">
                      {tx.status}
                    </span>
                    <span className="text-[var(--gm-text-tertiary)]">{new Date(tx.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Methods tab */}
      {activeTab === 'methods' && (
        <section className="mt-6 surface rounded-xl p-6">
          <h2 className="text-h3 text-[var(--gm-text)]">Payout methods</h2>
          <p className="mt-2 text-body text-[var(--gm-text-secondary)]">
            Connect Stripe, verify identity, and download monthly tax-ready statements.
          </p>
          <button className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--gm-border)] px-4 py-2.5 text-sm font-semibold text-[var(--gm-text)] hover:bg-[var(--gm-surface-elevated)] transition-colors">
            <Download size={16} aria-hidden="true" />
            Download statement
          </button>
        </section>
      )}

      {/* Withdraw Modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md surface rounded-2xl p-6 shadow-elevated animate-scale-in">
            <div className="flex items-center justify-between border-b border-[var(--gm-border)] pb-4">
              <h3 className="text-h3 text-[var(--gm-text)]">Withdraw funds</h3>
              <button
                onClick={() => setWithdrawOpen(false)}
                className="rounded-lg p-1.5 text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-elevated)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            {withdrawSuccess ? (
              <div className="my-8 text-center">
                <ShieldCheck size={40} className="mx-auto mb-3 text-success" />
                <p className="text-h3 text-[var(--gm-text)]">Withdrawal requested</p>
                <p className="mt-1 text-body text-[var(--gm-text-secondary)]">Your request is in review and will clear shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="mt-5 space-y-4">
                {withdrawError && (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger">
                    {withdrawError}
                  </div>
                )}
                <div>
                  <label className="block text-caption font-semibold text-[var(--gm-text-secondary)]">Available to withdraw</label>
                  <p className="mt-1 text-h2 text-[var(--gm-text)]">{formatCurrency(availableBalance)}</p>
                </div>
                <div>
                  <label className="block text-caption font-semibold text-[var(--gm-text-secondary)]">Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={(availableBalance / 100).toString()}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg)] px-3.5 py-2.5 text-[var(--gm-text)] placeholder:text-[var(--gm-text-tertiary)] focus:border-[var(--gm-brand)] focus:outline-none transition-colors"
                    placeholder="e.g. 50.00"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[var(--gm-brand)] py-3 text-sm font-bold text-white hover:bg-[var(--gm-brand-light)] transition-all active:scale-[0.97]"
                >
                  Submit request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
