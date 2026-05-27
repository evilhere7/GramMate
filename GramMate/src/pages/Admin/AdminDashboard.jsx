
import { ShieldAlert, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Users', value: '45,231', icon: Users, color: 'text-blue-500' },
    { label: 'Pending Withdrawals', value: '$12,450', icon: TrendingUp, color: 'text-primary' },
    { label: 'Reported Content', value: '23', icon: AlertTriangle, color: 'text-yellow-500' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <header className="mb-8 flex items-center gap-3">
        <ShieldAlert className="text-primary w-8 h-8" />
        <h1 className="text-3xl font-bold text-white">Admin Control Center</h1>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center justify-between"
          >
            <div>
              <p className="text-gray-400 font-medium mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
            <div className={`p-4 bg-black rounded-full ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fraud Monitoring */}
        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-800 pb-4">Live Fraud Monitoring</h2>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex justify-between items-center p-4 bg-black rounded-xl border border-red-500/20">
                <div>
                  <p className="text-red-400 font-bold text-sm mb-1">Suspicious Bot Engagement</p>
                  <p className="text-gray-400 text-xs">User: @spam_bot_99 • Video ID: {i}8a9b2</p>
                </div>
                <button className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors">
                  Ban User
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Pending Withdrawals */}
        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-800 pb-4">Pending Payouts</h2>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between items-center p-4 bg-black rounded-xl border border-gray-800">
                <div>
                  <p className="text-white font-bold text-sm mb-1">@creator_pro</p>
                  <p className="text-gray-400 text-xs">Stripe Connect • Requested 2h ago</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-primary font-bold">${(i * 150).toFixed(2)}</span>
                  <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors">
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
