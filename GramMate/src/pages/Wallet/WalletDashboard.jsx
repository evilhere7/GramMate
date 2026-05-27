import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';
import AppIcon from '../../components/brand/AppIcon';

export default function WalletDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const balance = 0.00;
  const pending = 0.00;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Wallet</h1>
        <p className="text-gray-400">Manage your earnings, withdrawals, and history.</p>
      </header>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-6 rounded-3xl relative overflow-hidden"
        >
          {/* Neon gradient background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
          {/* Subtle logo watermark backdrop */}
          <AppIcon size="xl" variant="plain" interactive={false} className="absolute -bottom-6 -right-6 opacity-[0.04] text-white rotate-12 scale-150 pointer-events-none select-none" />
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-gray-400 font-medium mb-1">Available Balance</p>
              <h2 className="text-5xl font-bold text-white">${balance.toFixed(2)}</h2>
            </div>
            <div className="bg-primary/20 p-3 rounded-full text-primary">
              <Wallet size={24} />
            </div>
          </div>
          
          <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors relative z-10 flex items-center justify-center gap-2 disabled:opacity-50" disabled>
            <span>Withdraw Funds</span>
            <ArrowUpRight size={18} />
          </button>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900 border border-gray-800 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <p className="text-gray-400 font-medium">Pending Clearing</p>
              <Clock size={20} className="text-yellow-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-300">${pending.toFixed(2)}</h3>
            <p className="text-sm text-gray-500 mt-2">Funds from recent engagement take 48h to clear.</p>
          </div>
          
          <div className="flex items-center gap-3 mt-6 text-sm text-gray-400 bg-black/45 p-3 rounded-2xl border border-gray-800/40 relative overflow-hidden">
            <AppIcon size="xs" variant="badge" interactive={false} className="shrink-0" />
            <span className="font-semibold text-gray-300">Secured by Stripe Connect & GramMate Trust</span>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800 mb-6">
        {['overview', 'transactions', 'methods'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 font-medium capitalize transition-colors relative ${activeTab === tab ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="wallet-tab" className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Transaction History Placeholder */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <p className="text-gray-500 italic">No transactions yet.</p>
        </div>
      )}
    </div>
  );
}
