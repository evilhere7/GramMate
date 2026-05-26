import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function WalletDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const balance = 124.50;
  const pending = 12.00;

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
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-gray-400 font-medium mb-1">Available Balance</p>
              <h2 className="text-5xl font-bold text-white">${balance.toFixed(2)}</h2>
            </div>
            <div className="bg-primary/20 p-3 rounded-full text-primary">
              <Wallet size={24} />
            </div>
          </div>
          
          <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors relative z-10 flex items-center justify-center gap-2">
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
          
          <div className="flex items-center gap-2 mt-6 text-sm text-gray-400 bg-black/40 p-3 rounded-xl">
            <ShieldCheck size={16} className="text-secondary" />
            <span>Secured by Stripe Connect</span>
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
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-gray-800/50 hover:bg-gray-900 transition-colors cursor-default">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${i === 1 ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>
                  {i === 1 ? <ArrowDownLeft size={20} /> : <DollarSign size={20} />}
                </div>
                <div>
                  <p className="font-semibold text-white">{i === 1 ? 'Payout to Bank' : 'Video Earnings'}</p>
                  <p className="text-sm text-gray-500">Today, 2:30 PM</p>
                </div>
              </div>
              <div className={`font-bold ${i === 1 ? 'text-white' : 'text-primary'}`}>
                {i === 1 ? '-$50.00' : '+$0.05'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
