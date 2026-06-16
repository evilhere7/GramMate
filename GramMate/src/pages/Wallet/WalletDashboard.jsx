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
      // Fetch wallet
      const { data: wData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setWallet(wData);

      // Fetch transactions
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

  useEffect(() => {
    fetchWalletData();
  }, [user]);

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
      // 1. Create withdrawal request
      const { error: reqError } = await supabase
        .from('withdrawal_requests')
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          amount_cents: amountCents,
          status: 'review'
        });

      if (reqError) throw reqError;

      // 2. Also insert a pending withdrawal transaction to show in history and temporarily deduct from wallet if needed (or just show request)
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          amount_cents: -amountCents,
          transaction_type: 'withdrawal',
          status: 'review'
        });

      if (txError) throw txError;

      // 3. Update wallet balance locally (deduct pending withdrawal)
      const { error: walletUpdateError } = await supabase
        .from('wallets')
        .update({
          balance_cents: availableCents - amountCents,
          pending_cents: (wallet.pending_cents || 0) + amountCents
        })
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

  const formatCurrency = (cents) => {
    const dollars = (cents || 0) / 100;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollars);
  };

  const availableBalance = wallet?.balance_cents || 0;
  const pendingBalance = wallet?.pending_cents || 0;
  const riskHoldBalance = wallet?.risk_hold_cents || 0;

  // Find last payout: most recent completed withdrawal transaction
  const withdrawals = transactions.filter(t => t.transaction_type === 'withdrawal' && t.status === 'cleared');
  const lastPayoutCents = withdrawals.length > 0 ? Math.abs(withdrawals[0].amount_cents) : 0;

  // Breakdown calculations
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
    return <div className="p-8 text-slate-500">Loading wallet...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Wallet</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">Earnings and withdrawals</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Track available balance, pending clearing, payout methods, and all reward sources from a single ledger.</p>
        </div>
        <button 
          onClick={() => {
            setWithdrawError(null);
            setWithdrawSuccess(false);
            setWithdrawOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Withdraw funds
          <ArrowUpRight size={18} aria-hidden="true" />
        </button>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Available balance</p>
              <p className="mt-2 text-5xl font-bold tracking-normal text-slate-950">{formatCurrency(availableBalance)}</p>
            </div>
            <div className="rounded-md bg-blue-50 p-3 text-blue-700">
              <Wallet size={24} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ['Pending', formatCurrency(pendingBalance), Clock],
              ['Last payout', formatCurrency(lastPayoutCents), CreditCard],
              ['Risk holds', formatCurrency(riskHoldBalance), ShieldCheck],
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-md bg-slate-50 p-4">
                <Icon size={18} className="text-slate-500" aria-hidden="true" />
                <p className="mt-3 text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white">
          <ShieldCheck size={24} className="text-green-400" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-bold">Withdrawal safeguards</h2>
          <p className="mt-3 leading-7 text-slate-300">Every withdrawal runs through account verification, fake view detection, campaign rule checks, and manual review when risk increases.</p>
          <div className="mt-6 grid gap-3">
            {['Stripe Connect ready', '48h clearing window', 'Audit trail on payout decisions'].map((item) => (
              <div key={item} className="rounded-md bg-white/10 p-3 text-sm font-semibold text-slate-100">{item}</div>
            ))}
          </div>
        </article>
      </section>

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        {['overview', 'transactions', 'methods'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-3 text-sm font-bold capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {breakdown.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-5">
              <BadgeDollarSign size={20} className="text-blue-600" aria-hidden="true" />
              <p className="mt-4 text-sm text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{item.value}</p>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'transactions' && (
        <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
              <Clock size={36} className="mb-2 text-slate-400" />
              <p className="text-lg font-bold text-slate-950">No transactions yet</p>
              <p className="text-sm mt-1">Earnings and withdrawals will appear here as they occur.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-slate-200 p-4 text-sm font-bold text-slate-500">
                <span>Type</span><span>Amount</span><span>Status</span><span>Date</span>
              </div>
              {transactions.map((tx) => (
                <div key={tx.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-slate-100 p-4 text-sm last:border-b-0">
                  <span className="font-semibold text-slate-900 capitalize">{tx.transaction_type.replace('_', ' ')}</span>
                  <span className={`font-bold ${tx.amount_cents < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.amount_cents < 0 ? '-' : '+'}{formatCurrency(Math.abs(tx.amount_cents))}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700 capitalize">{tx.status}</span>
                  <span className="text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </>
          )}
        </section>
      )}

      {activeTab === 'methods' && (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-950">Payout methods</h2>
          <p className="mt-2 text-slate-600">Connect Stripe, verify identity, and download monthly tax-ready statements.</p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 font-bold text-slate-900 hover:bg-slate-50">
            <Download size={18} aria-hidden="true" />
            Download statement
          </button>
        </section>
      )}

      {/* Withdraw Modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-950">Withdraw Funds</h3>
              <button onClick={() => setWithdrawOpen(false)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            {withdrawSuccess ? (
              <div className="my-6 text-center text-green-600">
                <ShieldCheck size={48} className="mx-auto mb-2" />
                <p className="font-bold">Withdrawal Requested Successfully</p>
                <p className="text-sm mt-1">Your request is in review and will clear shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="mt-4 space-y-4">
                {withdrawError && (
                  <div className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">
                    {withdrawError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Available to withdraw</label>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{formatCurrency(availableBalance)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Amount to withdraw (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={(availableBalance / 100).toString()}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                    placeholder="e.g. 50.00"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
