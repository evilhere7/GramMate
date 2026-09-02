import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  PlusSquare, 
  Wallet, 
  User as UserIcon, 
  ShieldAlert,
  Flame,
  ArrowUpRight,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { icon: Home, label: 'Feed', path: '/' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: PlusSquare, label: 'Create', path: '/upload', special: true },
  { icon: Wallet, label: 'Wallet', path: '/wallet', badge: '+$18' },
  { icon: UserIcon, label: 'Profile', path: '/profile' },
];

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden select-none">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl h-full p-4 relative z-40">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 px-2 pt-2">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary via-rose-500 to-secondary flex items-center justify-center font-black text-white text-lg shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
              GM
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                <span>Gram</span><span className="text-primary">Mate</span>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block -mt-1">
                Watch-to-Earn
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '');

            if (item.special) {
              return (
                <div key={item.path} className="pt-2 pb-2">
                  <Link
                    to={item.path}
                    className="flex items-center justify-center gap-2.5 w-full py-3 bg-gradient-to-r from-primary via-rose-500 to-secondary hover:opacity-95 text-white font-extrabold rounded-2xl shadow-lg shadow-primary/25 transition-all group"
                  >
                    <PlusSquare size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span>Upload Video</span>
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-zinc-900 text-white border border-zinc-800 font-bold shadow-md shadow-black/40' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-zinc-400 group-hover:text-white'} transition-colors`} />
                  <span className="text-sm">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Admin link for easy showcase */}
          <Link
            to="/admin"
            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all font-semibold ${
              location.pathname === '/admin'
                ? 'bg-zinc-900 text-white border border-zinc-800'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span className="text-sm">Admin Radar</span>
          </Link>
        </nav>

        {/* Creator Wallet Card on Sidebar */}
        <div className="mt-auto">
          <div className="p-4 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-2xl relative overflow-hidden shadow-xl mb-3">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-2xl rounded-full pointer-events-none" />
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Your Balance</span>
              <span className="text-[10px] font-bold text-secondary flex items-center gap-0.5">
                <Flame size={12} className="fill-secondary" /> 1.5x active
              </span>
            </div>
            <p className="text-2xl font-black text-white tracking-tight">$124.50</p>
            <Link 
              to="/wallet" 
              className="text-xs font-bold text-primary hover:text-rose-400 mt-2.5 inline-flex items-center gap-1 transition-colors"
            >
              <span>Manage Wallet</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* User Profile Mini Tab */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/50 border border-zinc-850">
            <Link to="/profile" className="flex items-center gap-2.5 group">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover border border-primary/50 group-hover:scale-105 transition-transform"
              />
              <div>
                <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">Alex Rivera</p>
                <p className="text-[10px] text-zinc-500 font-semibold">@alex_creator</p>
              </div>
            </Link>

            <Link to="/login" className="p-2 text-zinc-500 hover:text-white transition-colors" title="Switch Account / Sign In">
              <LogOut size={16} />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 relative h-full w-full bg-black overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="h-full w-full overflow-y-auto no-scrollbar"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Glassmorphic Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 flex justify-around items-center h-16 px-3 z-50">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '');
          
          if (item.special) {
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className="flex items-center justify-center w-12 h-10 bg-gradient-to-tr from-primary to-rose-500 text-white rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-transform"
              >
                <PlusSquare size={22} />
              </Link>
            );
          }

          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex flex-col items-center justify-center w-14 h-full transition-colors relative ${
                isActive ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className="text-[10px] mt-1 font-bold tracking-tight">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="mobile-nav-dot"
                  className="w-1 h-1 rounded-full bg-primary absolute -bottom-1"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
