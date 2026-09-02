import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Check, 
  X, 
  ArrowLeft,
  Bot,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('fraud');
  
  const [fraudItems, setFraudItems] = useState([
    { id: 'f-1', user: '@spam_bot_99', videoId: 'v-98a9b2', reason: 'Abnormal Watch Time Looping (>24 hrs continuously)', riskScore: '98%', status: 'flagged' },
    { id: 'f-2', user: '@click_farm_asia', videoId: 'v-102x9a', reason: 'Coordinated headless browser fingerprint cluster', riskScore: '94%', status: 'flagged' },
    { id: 'f-3', user: '@reward_farmer_01', videoId: 'v-882k01', reason: 'Proxy rotation with synthetic canvas emulation', riskScore: '89%', status: 'flagged' },
  ]);

  const [pendingPayouts, setPendingPayouts] = useState([
    { id: 'p-1', creator: '@alex_creator', amount: 250.00, method: 'USDC on Solana', requestedTime: '15 mins ago', status: 'pending' },
    { id: 'p-2', creator: '@tech_visionary', amount: 480.00, method: 'Stripe Connect ACH', requestedTime: '1 hour ago', status: 'pending' },
    { id: 'p-3', creator: '@beat_master', amount: 125.00, method: 'USDC on Solana', requestedTime: '3 hours ago', status: 'pending' },
  ]);

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  };

  const handleBan = (id, username) => {
    setFraudItems(fraudItems.filter(f => f.id !== id));
    showToast(`Account ${username} banned & rewards revoked.`);
  };

  const handleApprovePayout = (id, creator, amount) => {
    setPendingPayouts(pendingPayouts.filter(p => p.id !== id));
    showToast(`Approved $${amount} payout for ${creator}!`);
  };

  const stats = [
    { label: 'Active Creators & Viewers', value: '48,920', icon: Users, color: 'text-secondary', change: '+18.4% this week' },
    { label: '24h Watch-to-Earn Pool', value: '$34,850', icon: DollarSign, color: 'text-primary', change: '89.2% distribution efficiency' },
    { label: 'Bot Interceptions (24h)', value: '1,420', icon: Bot, color: 'text-amber-400', change: '$4,120 fraud saved' },
  ];

  return (
    <div className="min-h-full w-full bg-zinc-950 text-white p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-zinc-900 border border-emerald-500/40 text-emerald-400 text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-400">
            <ShieldAlert size={26} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Admin & Fraud Radar</h1>
            <p className="text-xs sm:text-sm text-zinc-400">Live platform telemetry, anti-bot mitigation, and creator payout queue.</p>
          </div>
        </div>

        <Link
          to="/"
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 rounded-xl transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Feed</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-2.5 rounded-2xl bg-zinc-950 ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                <p className="text-xs text-zinc-500 font-semibold mt-1">{stat.change}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab('fraud')}
          className={`pb-3 font-bold text-sm transition-colors flex items-center gap-2 relative ${
            activeTab === 'fraud' ? 'text-primary' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Bot size={16} />
          <span>Live Fraud Radar ({fraudItems.length})</span>
          {activeTab === 'fraud' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary" />}
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`pb-3 font-bold text-sm transition-colors flex items-center gap-2 relative ${
            activeTab === 'payouts' ? 'text-primary' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <DollarSign size={16} />
          <span>Pending Creator Payouts ({pendingPayouts.length})</span>
          {activeTab === 'payouts' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary" />}
        </button>
      </div>

      {/* Fraud Monitoring Content */}
      {activeTab === 'fraud' && (
        <div className="space-y-4">
          {fraudItems.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/40 rounded-3xl border border-zinc-800 text-zinc-400 text-sm">
              All bot flags reviewed! Platform integrity 100%.
            </div>
          ) : (
            fraudItems.map(item => (
              <div key={item.id} className="bg-zinc-900 border border-zinc-800 hover:border-red-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-sm text-white">{item.user}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-full">
                      Risk: {item.riskScore}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{item.reason}</p>
                  <p className="text-[11px] text-zinc-500 mt-1 font-mono">Telemetry Ref: {item.videoId}</p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleBan(item.id, item.user)}
                    className="px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <X size={14} />
                    <span>Ban & Clawback</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Payouts Content */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          {pendingPayouts.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/40 rounded-3xl border border-zinc-800 text-zinc-400 text-sm">
              No pending withdrawal requests. All payouts dispatched.
            </div>
          ) : (
            pendingPayouts.map(p => (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-sm text-white">{p.creator}</span>
                    <span className="text-xs text-zinc-400 font-mono">• {p.method}</span>
                  </div>
                  <p className="text-xs text-zinc-500">Requested {p.requestedTime}</p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-lg font-black text-emerald-400">${p.amount.toFixed(2)}</span>
                  <button
                    onClick={() => handleApprovePayout(p.id, p.creator, p.amount)}
                    className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>Approve Instant Payout</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
