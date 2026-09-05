import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowUpRight, 
  Wallet as WalletIcon, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  DollarSign, 
  Send
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { fetchWallet, fetchTransactions, requestWithdrawal } from '../../services/supabaseService';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

export default function WalletDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState({ balance_cents: 0, pending_cents: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Withdraw Modal
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('Bank Transfer (ACH)');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const loadWalletData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [walletData, txData] = await Promise.all([
        fetchWallet(user.id),
        fetchTransactions(user.id),
      ]);
      if (walletData) setWallet(walletData);
      if (txData) setTransactions(txData);
    } catch (err) {
      console.error('[WalletDashboard] Error loading wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const balance = (wallet.balance_cents || 0) / 100;
  const pending = (wallet.pending_cents || 0) / 100;

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

    setSubmittingWithdraw(true);
    try {
      const amountCents = Math.round(amountNum * 100);
      const newTx = await requestWithdrawal(user.id, amountCents, withdrawMethod);
      setTransactions((prev) => [newTx, ...prev]);
      setWallet((prev) => ({
        ...prev,
        balance_cents: Math.max(0, (prev.balance_cents || 0) - amountCents)
      }));
      toast.success('Payout request submitted for processing.');
      setWithdrawModalOpen(false);
      setWithdrawAmount('');
    } catch (err) {
      toast.error(err.message || 'Failed to submit payout request.');
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
            Creator & Viewer Wallet
          </h1>
          <p className="text-xs text-[var(--gm-text-secondary)] mt-1">
            Real-time balance, creator payouts, and financial transactions.
          </p>
        </div>

        <button
          onClick={() => setWithdrawModalOpen(true)}
          disabled={balance <= 0}
          className="gm-btn-primary text-xs px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <ArrowUpRight size={15} />
          <span>Request Payout</span>
        </button>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
            Ready for withdrawal to your verified account
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
            Processing advertiser payouts and viewer rewards
          </p>
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
              const isPositive = (tx.amount_cents || 0) > 0;
              const formattedAmount = (Math.abs(tx.amount_cents || 0) / 100).toFixed(2);
              return (
                <div key={tx.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[var(--gm-text)] mb-0.5">
                      {tx.description || (isPositive ? 'Reward Deposit' : 'Payout Withdrawal')}
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
                      {isPositive ? `+$${formattedAmount}` : `-$${formattedAmount}`}
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
              min="1"
              required
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`Max: $${balance.toFixed(2)}`}
              className="gm-input text-xs"
            />
            <span className="text-[10px] text-[var(--gm-text-tertiary)] mt-1 block">
              Available balance: ${balance.toFixed(2)}
            </span>
          </div>

          <div>
            <label className="block font-semibold mb-1">Destination Method</label>
            <select
              value={withdrawMethod}
              onChange={(e) => setWithdrawMethod(e.target.value)}
              className="gm-input text-xs"
            >
              <option value="Bank Transfer (ACH)">Bank Transfer (ACH / Stripe)</option>
              <option value="Debit Card Instant">Debit Card Instant Payout</option>
              <option value="PayPal">PayPal Transfer</option>
            </select>
          </div>

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
              disabled={submittingWithdraw || balance <= 0}
              className="gm-btn-primary text-xs"
            >
              {submittingWithdraw ? 'Submitting...' : 'Confirm Withdrawal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
