import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Flame, 
  CreditCard, 
  Check, 
  X, 
  ChevronRight,
  Zap,
  Building2,
  Wallet,
  Gift
} from 'lucide-react';

const INITIAL_TRANSACTIONS = [
  { id: 'tx-1', type: 'earn', title: 'Watch-to-Earn Pool Yield', desc: '48 mins watched across feed', time: '10 mins ago', amount: 0.082, status: 'completed' },
  { id: 'tx-2', type: 'tip_received', title: 'Tip from @crypto_fan', desc: 'On video: Tokyo Street Vibes', time: '2 hours ago', amount: 5.00, status: 'completed' },
  { id: 'tx-3', type: 'withdraw', title: 'Payout to Stripe Bank', desc: 'Transfer to Chase •••• 4821', time: 'Yesterday', amount: -50.00, status: 'completed' },
  { id: 'tx-4', type: 'earn', title: 'Watch-to-Earn Pool Yield', desc: '120 mins watched across feed', time: '2 days ago', amount: 0.194, status: 'completed' },
  { id: 'tx-5', type: 'tip_received', title: 'Tip from @sarah_creator', desc: 'On video: AI Workflow Secrets', time: '3 days ago', amount: 2.00, status: 'completed' },
  { id: 'tx-6', type: 'bonus', title: 'Streak Multiplier Bonus (1.5x)', desc: '7-Day Watch Streak Milestone', time: '4 days ago', amount: 10.00, status: 'completed' },
];

export default function WalletDashboard() {
  const [balance, setBalance] = useState(124.50);
  const [pending] = useState(14.20);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterType, setFilterType] = useState('all');

  // Modals
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('50.00');
  const [withdrawMethod, setWithdrawMethod] = useState('usdc'); // 'usdc' | 'bank'
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const [showDepositModal, setShowDepositModal] = useState(false);

  const handleWithdraw = (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0 || amt > balance) return;

    setBalance(prev => prev - amt);
    const newTx = {
      id: `tx-${Date.now()}`,
      type: 'withdraw',
      title: withdrawMethod === 'usdc' ? 'Withdrawal to Solana/USDC' : 'Payout to Stripe Bank',
      desc: withdrawMethod === 'usdc' ? 'Instant Web3 Wallet Transfer' : 'Direct Deposit',
      time: 'Just now',
      amount: -amt,
      status: 'completed'
    };
    setTransactions([newTx, ...transactions]);
    setWithdrawSuccess(true);
    setTimeout(() => {
      setWithdrawSuccess(false);
      setShowWithdrawModal(false);
    }, 1800);
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    if (filterType === 'earnings') return t.type === 'earn' || t.type === 'bonus';
    if (filterType === 'tips') return t.type === 'tip_received';
    if (filterType === 'withdrawals') return t.type === 'withdraw';
    return true;
  });

  return (
    <div className="min-h-full w-full bg-zinc-950 text-white p-4 md:p-8 max-w-5xl mx-auto pb-28 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Creator & Viewer Wallet</span>
            <span className="flex items-center gap-1 text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full">
              <Flame size={14} className="fill-amber-400" /> 1.5x Multiplier Active
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time Watch-to-Earn accrual, tips, and instant multi-chain / fiat withdrawals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
          >
            <span>Withdraw</span>
            <ArrowUpRight size={16} />
          </button>
          <button
            onClick={() => setShowDepositModal(true)}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold text-sm rounded-xl transition-all"
          >
            Deposit / Buy
          </button>
        </div>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Main Available Balance */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="md:col-span-2 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/15 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-secondary/10 blur-3xl rounded-full pointer-events-none" />

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Available Balance</span>
              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                <TrendingUp size={12} /> +$18.40 today
              </div>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              ${balance.toFixed(2)} <span className="text-sm font-semibold text-zinc-400 font-mono">USDC</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-2">Accruing live every second from Watch-to-Earn videos.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
            <div>
              <span className="text-[11px] text-zinc-400 block mb-0.5">Lifetime Watch Rewards</span>
              <span className="text-base font-extrabold text-secondary">$84.60</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-400 block mb-0.5">Tips & Creator Gifts</span>
              <span className="text-base font-extrabold text-amber-400">$89.90</span>
            </div>
          </div>
        </motion.div>

        {/* Pending Clearance Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col justify-between shadow-xl"
        >
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pending Clearing</span>
              <Clock size={18} className="text-amber-400" />
            </div>
            <h3 className="text-3xl font-extrabold text-white">${pending.toFixed(2)}</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Bot & fraud verification clears in 24 hours via GramMate smart risk engine.
            </p>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/80 p-3 rounded-2xl flex items-center gap-2.5 mt-4">
            <ShieldCheck size={18} className="text-secondary shrink-0" />
            <span className="text-xs font-medium text-zinc-300">Protected by Stripe Connect & Web3 Multi-sig</span>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 mb-6">
        <div className="flex gap-4">
          {['overview', 'transactions', 'methods'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 font-bold text-sm capitalize transition-colors relative ${
                activeTab === tab ? 'text-primary' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="wallet-tab-line" className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'transactions' && (
          <div className="flex items-center gap-1.5 pb-2">
            {['all', 'earnings', 'tips', 'withdrawals'].map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                  filterType === f ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-3 bg-secondary/15 text-secondary rounded-xl">
                <Zap size={20} />
              </div>
              <div>
                <span className="text-xs text-zinc-400 font-medium">Yield Rate</span>
                <p className="text-lg font-bold text-white">$0.045 / min</p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-3 bg-primary/15 text-primary rounded-xl">
                <Gift size={20} />
              </div>
              <div>
                <span className="text-xs text-zinc-400 font-medium">Tips Sent / Received</span>
                <p className="text-lg font-bold text-white">18 Total</p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl">
                <CreditCard size={20} />
              </div>
              <div>
                <span className="text-xs text-zinc-400 font-medium">Payout Speed</span>
                <p className="text-lg font-bold text-white">Instant (&lt;5s)</p>
              </div>
            </div>
          </div>

          {/* Recent Activity List */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {transactions.slice(0, 4).map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-zinc-900/70 hover:bg-zinc-900 rounded-2xl border border-zinc-800/80 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-3 rounded-2xl ${
                      tx.amount > 0 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-primary/15 text-primary border border-primary/20'
                    }`}>
                      {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{tx.title}</p>
                      <p className="text-xs text-zinc-500">{tx.desc} • {tx.time}</p>
                    </div>
                  </div>
                  <div className={`text-base font-extrabold ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">No transactions found for this filter.</div>
          ) : (
            filteredTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-zinc-900/70 hover:bg-zinc-900 rounded-2xl border border-zinc-800/80 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 rounded-2xl ${
                    tx.amount > 0 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-primary/15 text-primary border border-primary/20'
                  }`}>
                    {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{tx.title}</p>
                    <p className="text-xs text-zinc-500">{tx.desc} • {tx.time}</p>
                  </div>
                </div>
                <div className={`text-base font-extrabold ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                  {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Payout Methods Tab */}
      {activeTab === 'methods' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Web3 Direct</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold">Connected</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-1">Solana / Phantom Wallet</h4>
              <p className="text-xs text-zinc-400 font-mono">7xKW...98Lq (USDC / SOL)</p>
            </div>
            <button className="mt-6 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-colors">
              Manage Wallet Address
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Fiat Banking</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold">Verified</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-1">Stripe Connect Payouts</h4>
              <p className="text-xs text-zinc-400">Chase Checking •••• 4821</p>
            </div>
            <button className="mt-6 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-colors">
              Update Bank Account
            </button>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full relative shadow-2xl">
            <button onClick={() => setShowWithdrawModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <X size={20} />
            </button>

            {withdrawSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                  <Check size={32} className="stroke-[3]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Withdrawal Initiated!</h3>
                <p className="text-xs text-zinc-400">${withdrawAmount} is on its way to your destination.</p>
              </div>
            ) : (
              <form onSubmit={handleWithdraw}>
                <h3 className="text-xl font-bold text-white mb-1">Withdraw Earnings</h3>
                <p className="text-xs text-zinc-400 mb-6">Transfer available balance with zero platform fee.</p>

                {/* Method selector */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('usdc')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      withdrawMethod === 'usdc' ? 'bg-secondary/15 border-secondary text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Zap size={18} className="text-secondary mb-1" />
                    <span className="text-xs font-bold block">Instant USDC</span>
                    <span className="text-[10px] text-zinc-400">&lt;5s on Solana</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('bank')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      withdrawMethod === 'bank' ? 'bg-primary/15 border-primary text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Building2 size={18} className="text-primary mb-1" />
                    <span className="text-xs font-bold block">Bank Payout</span>
                    <span className="text-[10px] text-zinc-400">Stripe Connect ACH</span>
                  </button>
                </div>

                {/* Amount input */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs mb-1.5 font-semibold">
                    <span className="text-zinc-400">Amount to withdraw</span>
                    <span className="text-primary cursor-pointer" onClick={() => setWithdrawAmount(balance.toFixed(2))}>Max (${balance.toFixed(2)})</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-400">$</span>
                    <input 
                      type="number"
                      step="0.01"
                      max={balance}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-9 pr-4 text-base font-bold text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={parseFloat(withdrawAmount) > balance || parseFloat(withdrawAmount) <= 0}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-600/90 disabled:opacity-40 text-white font-extrabold rounded-xl shadow-lg shadow-primary/20 text-sm transition-all"
                >
                  Confirm ${withdrawAmount} Payout
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full relative text-center">
            <button onClick={() => setShowDepositModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <X size={20} />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-secondary/20 text-secondary mx-auto flex items-center justify-center mb-3">
              <Wallet size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Deposit / Buy Tokens</h3>
            <p className="text-xs text-zinc-400 mb-6">Top up your balance to tip creators and unlock exclusive premium drops.</p>
            <div className="space-y-2.5">
              {['10.00', '25.00', '50.00', '100.00'].map(amt => (
                <button
                  key={amt}
                  onClick={() => {
                    setBalance(prev => prev + parseFloat(amt));
                    setShowDepositModal(false);
                  }}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-colors flex justify-between px-5 items-center"
                >
                  <span>Buy ${amt} Tokens</span>
                  <ChevronRight size={16} className="text-zinc-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
