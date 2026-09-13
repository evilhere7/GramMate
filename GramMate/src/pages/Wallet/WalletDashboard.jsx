import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowUpRight, 
  Wallet as WalletIcon, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  Gift,
  ShieldAlert,
  Landmark,
  LockKeyhole,
  Info
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchEconomySettings,
  fetchWalletLedger,
  fetchWalletSummary,
  fetchWithdrawalRequests,
  submitWithdrawalRequest
} from '../../services/economyService';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

export default function WalletDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState({ available_cents: 0, pending_cents: 0, points_balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Withdraw Modal
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const loadWalletData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [walletData, txData] = await Promise.all([
        fetchWalletSummary(user.id),
        fetchWalletLedger(user.id),
      ]);
      const [settingsData, withdrawalData] = await Promise.all([
        fetchEconomySettings(),
        fetchWithdrawalRequests(user.id),
      ]);
      if (walletData) setWallet(walletData);
      if (txData) setTransactions(txData);
      setSettings(settingsData);
      setWithdrawals(withdrawalData);
    } catch (err) {
      console.error('[WalletDashboard] Error loading wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const balance = ((wallet.available_cents ?? wallet.balance_cents) || 0) / 100;
  const pending = (wallet.pending_cents || 0) / 100;
  const hold = (wallet.risk_hold_cents || 0) / 100;
  const lifetimeEarned = (wallet.lifetime_earned_cents || 0) / 100;
  const lifetimeWithdrawn = (wallet.lifetime_withdrawn_cents || 0) / 100;
  const lifetimeRewards = (wallet.lifetime_rewards_cents || 0) / 100;
  const pointsBalance = wallet.points_balance || 0;
  const featureFlags = settings?.feature_flags || {};
  const withdrawalsEnabled = Boolean(featureFlags.withdrawals_enabled);
  const minimumWithdrawalCents = settings?.viewer_reward_rules?.minimum_redemption_cents || 500;
  const minimumWithdrawal = minimumWithdrawalCents / 100;
  const providerStatus = settings?.payment_provider_status || {};
  const configuredProviderCount = Object.values(providerStatus).filter((status) => status === 'configured' || status === 'active').length;
  const amountNeeded = Math.max(0, minimumWithdrawal - balance);

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    if (amountNum > balance) {
      toast.error('Requested amount exceeds available balance.');
      return;
    }
    if (amountNum < minimumWithdrawal) {
      toast.error(`Minimum withdrawal is $${minimumWithdrawal.toFixed(2)}.`);
      return;
    }
    if (!withdrawalsEnabled) {
      toast.info('Withdrawals are not available yet. GramMate needs a real payout provider first.');
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const amountCents = Math.round(amountNum * 100);
      await submitWithdrawalRequest({
        amountCents,
        payoutMethod: withdrawMethod,
        destinationLabel: withdrawDestination,
      });
      await loadWalletData();
      toast.success('Withdrawal request submitted for review.');
      setWithdrawModalOpen(false);
      setWithdrawAmount('');
      setWithdrawDestination('');
    } catch (err) {
      toast.error(err.message || 'Your withdrawal could not be submitted. Please try again.');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="py-20 text-center">
        <EmptyState
          icon={WalletIcon}
          title="Sign in to view your wallet"
          description="Track your earnings, creator rewards, and withdrawals in one unified balance."
          actionLabel="Sign In"
          onAction={() => window.location.assign('/login')}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[var(--gm-border)]">
        <div>
          <h1 className="text-2xl font-black text-[var(--gm-text)] tracking-tight">
            Wallet
          </h1>
          <p className="text-xs text-[var(--gm-text-secondary)] mt-1">
            Cash ledger, points, pending balances, and payout readiness.
          </p>
        </div>

        <button
          onClick={() => setWithdrawModalOpen(true)}
          disabled={!withdrawalsEnabled || balance < minimumWithdrawal}
          className="gm-btn-primary text-xs px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
          title={!withdrawalsEnabled ? 'Withdrawals require a configured payout provider' : 'Request withdrawal'}
        >
          <ArrowUpRight size={15} />
          <span>{withdrawalsEnabled ? 'Request Withdrawal' : 'Withdrawals Unavailable'}</span>
        </button>
      </div>

      <div className="mb-6 rounded-lg border border-amber-500/25 bg-amber-500/10 p-4 text-xs text-amber-100">
        <div className="flex gap-3">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-300" />
          <div>
            <p className="font-bold text-amber-200">Real-money safety status</p>
            <p className="mt-1 text-amber-100/85">
              GramMate does not create money from views. Cash balances only become withdrawable after confirmed platform revenue, settlement, fraud review, and a configured payout provider.
            </p>
          </div>
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Available Balance */}
        <div className="gm-card p-6 border border-[var(--gm-border)] bg-[var(--gm-surface)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--gm-text-tertiary)] uppercase tracking-wider">
            Available Balance
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="text-3xl font-black text-[var(--gm-text)] tracking-tight mb-1">
            ${balance.toFixed(2)}
          </p>
          <p className="text-[11px] text-[var(--gm-text-secondary)]">
            {balance >= minimumWithdrawal ? 'Eligible once withdrawals are enabled' : `You need $${amountNeeded.toFixed(2)} more to reach the minimum`}
          </p>
        </div>

        {/* Pending Clearance */}
        <div className="gm-card p-6 border border-[var(--gm-border)] bg-[var(--gm-surface)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--gm-text-tertiary)] uppercase tracking-wider">
            Pending Clearance
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={16} />
            </span>
          </div>
          <p className="text-3xl font-black text-[var(--gm-text)] tracking-tight mb-1">
            ${pending.toFixed(2)}
          </p>
          <p className="text-[11px] text-[var(--gm-text-secondary)]">
            Settlement, refund window, and fraud review
          </p>
        </div>

        <div className="gm-card p-6 border border-[var(--gm-border)] bg-[var(--gm-surface)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--gm-text-tertiary)] uppercase tracking-wider">
              GramMate Points
            </span>
            <span className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Gift size={16} />
            </span>
          </div>
          <p className="text-3xl font-black text-[var(--gm-text)] tracking-tight mb-1">
            {pointsBalance.toLocaleString()}
          </p>
          <p className="text-[11px] text-[var(--gm-text-secondary)]">
            Points are rewards, not guaranteed cash
          </p>
        </div>

        <div className="gm-card p-6 border border-[var(--gm-border)] bg-[var(--gm-surface)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--gm-text-tertiary)] uppercase tracking-wider">
              Risk Hold
            </span>
            <span className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <LockKeyhole size={16} />
            </span>
          </div>
          <p className="text-3xl font-black text-[var(--gm-text)] tracking-tight mb-1">
            ${hold.toFixed(2)}
          </p>
          <p className="text-[11px] text-[var(--gm-text-secondary)]">
            Held for payout or fraud review
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-xs">
        <div className="gm-card p-4">
          <p className="font-bold text-[var(--gm-text)]">Total earned</p>
          <p className="mt-1 text-lg font-black">${lifetimeEarned.toFixed(2)}</p>
        </div>
        <div className="gm-card p-4">
          <p className="font-bold text-[var(--gm-text)]">Total withdrawn</p>
          <p className="mt-1 text-lg font-black">${lifetimeWithdrawn.toFixed(2)}</p>
        </div>
        <div className="gm-card p-4">
          <p className="font-bold text-[var(--gm-text)]">Viewer rewards</p>
          <p className="mt-1 text-lg font-black">${lifetimeRewards.toFixed(2)}</p>
        </div>
      </div>

      <div className="gm-card border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Landmark size={18} className="text-[var(--gm-brand)] mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[var(--gm-text)]">Payout providers</p>
              <p className="text-xs text-[var(--gm-text-secondary)] mt-1">
                {configuredProviderCount > 0
                  ? `${configuredProviderCount} provider(s) configured. Withdrawals still require admin review.`
                  : 'No payout provider is configured yet. Withdrawals remain disabled.'}
              </p>
            </div>
          </div>
          <span className={`gm-badge ${withdrawalsEnabled ? 'gm-badge-success' : 'gm-badge-warning'} self-start md:self-auto`}>
            {withdrawalsEnabled ? 'Withdrawals enabled' : 'Architecture only'}
          </span>
        </div>
      </div>

      {/* Transaction History */}
      <div className="gm-card border border-[var(--gm-border)] bg-[var(--gm-surface)] overflow-hidden">
        <div className="p-4 border-b border-[var(--gm-border)] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--gm-text)]">
            Transaction Activity
          </h2>
          <span className="text-xs text-[var(--gm-text-tertiary)]">
            {transactions.length} entries
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            <div className="h-8 bg-[var(--gm-surface-elevated)] rounded-md animate-pulse" />
            <div className="h-8 bg-[var(--gm-surface-elevated)] rounded-md animate-pulse" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={WalletIcon}
              title="No transactions yet"
              description="When you earn rewards, receive tips, or request payouts, your ledger entries will display here."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--gm-border)]">
            {transactions.map((tx) => {
              const isPositive = tx.direction !== 'debit';
              const formattedAmount = (Math.abs(tx.amount_cents || 0) / 100).toFixed(2);
              const points = tx.points || 0;
              return (
                <div key={tx.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[var(--gm-text)] mb-0.5">
                      {tx.description || tx.transaction_type?.replace(/_/g, ' ') || 'Ledger entry'}
                    </p>
                    <p className="text-[10px] text-[var(--gm-text-tertiary)]">
                      {new Date(tx.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`font-black text-sm ${isPositive ? 'text-emerald-500' : 'text-[var(--gm-text)]'}`}>
                      {points > 0 ? `+${points.toLocaleString()} pts` : `${isPositive ? '+' : '-'}$${formattedAmount}`}
                    </p>
                    <span className={`text-[10px] font-semibold uppercase ${
                      tx.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {tx.status || 'completed'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="gm-card border border-[var(--gm-border)] bg-[var(--gm-surface)] overflow-hidden mt-8">
        <div className="p-4 border-b border-[var(--gm-border)] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--gm-text)]">Withdrawal Requests</h2>
          <span className="text-xs text-[var(--gm-text-tertiary)]">{withdrawals.length} requests</span>
        </div>
        {withdrawals.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={Info}
              title="No withdrawal history yet"
              description="Requests will appear here after payout providers are configured and you submit a withdrawal for admin review."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--gm-border)]">
            {withdrawals.map((request) => (
              <div key={request.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[var(--gm-text)]">{request.payout_method}</p>
                  <p className="text-[10px] text-[var(--gm-text-tertiary)]">
                    {new Date(request.created_at).toLocaleDateString()} · {request.payout_destination_label || 'Destination not stored'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm">${((request.amount_cents || 0) / 100).toFixed(2)}</p>
                  <span className="text-[10px] font-semibold uppercase text-amber-400">{request.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout Modal */}
      <Modal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title="Request Payout"
      >
        <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Withdrawal Amount ($)</label>
            <input
              type="number"
              step="0.01"
              max={balance}
              min={minimumWithdrawal}
              required
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`Max: $${balance.toFixed(2)}`}
              className="gm-input text-xs"
            />
            <span className="text-[10px] text-[var(--gm-text-tertiary)] mt-1 block">
              Available balance: ${balance.toFixed(2)} · Minimum: ${minimumWithdrawal.toFixed(2)}
            </span>
          </div>

          <div>
            <label className="block font-semibold mb-1">Destination Method</label>
            <select
              value={withdrawMethod}
              onChange={(e) => setWithdrawMethod(e.target.value)}
              className="gm-input text-xs"
            >
              <option value="bank_transfer">Bank transfer</option>
              <option value="paypal">PayPal</option>
              <option value="esewa">eSewa</option>
              <option value="khalti">Khalti</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Destination Label</label>
            <input
              type="text"
              value={withdrawDestination}
              onChange={(e) => setWithdrawDestination(e.target.value)}
              placeholder="Example: PayPal email or bank nickname"
              className="gm-input text-xs"
            />
            <span className="text-[10px] text-[var(--gm-text-tertiary)] mt-1 block">
              Do not enter card numbers, passwords, or sensitive banking credentials.
            </span>
          </div>

          {!withdrawalsEnabled && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-amber-100">
              Withdrawals are not available yet. This form is ready for a real payout provider but will not submit until an admin enables the feature flag.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--gm-border)]">
            <button
              type="button"
              onClick={() => setWithdrawModalOpen(false)}
              className="gm-btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingWithdraw || !withdrawalsEnabled || balance < minimumWithdrawal}
              className="gm-btn-primary text-xs"
            >
              {submittingWithdraw ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
