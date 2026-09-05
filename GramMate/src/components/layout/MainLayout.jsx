import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  PlusSquare, 
  Wallet, 
  User as UserIcon, 
  ShieldAlert,
  ArrowUpRight,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../brand/Logo';
import { fetchWallet } from '../../services/supabaseService';

const NAV_ITEMS = [
  { icon: Home, label: 'Feed', path: '/' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: PlusSquare, label: 'Create', path: '/upload', highlight: true },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: UserIcon, label: 'Profile', path: '/profile' },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated, signOut } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      fetchWallet(user.id).then((wallet) => {
        if (isMounted && wallet) {
          setWalletBalance((wallet.balance_cents || 0) / 100);
        }
      });
    } else {
      setWalletBalance(0);
    }
    return () => { isMounted = false; };
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[var(--gm-bg)] text-[var(--gm-text)] overflow-hidden select-none">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--gm-border)] bg-[var(--gm-surface)] h-full p-4 relative z-40">
        {/* Brand Header */}
        <div className="mb-8 px-2 pt-2">
          <Link to="/" className="inline-block hover:opacity-95 transition-opacity">
            <Logo size="md" layout="horizontal" />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '');

            if (item.highlight) {
              return (
                <div key={item.path} className="pt-2 pb-2">
                  <Link
                    to={item.path}
                    className="gm-btn-primary w-full py-2.5 font-bold shadow-sm"
                  >
                    <PlusSquare size={18} />
                    <span>Upload Video</span>
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all text-sm font-semibold ${
                  isActive 
                    ? 'bg-[var(--gm-surface-elevated)] text-[var(--gm-text)] border border-[var(--gm-border)] font-bold' 
                    : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface-elevated)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--gm-brand)]' : 'text-[var(--gm-text-secondary)]'}`} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}

          {/* Admin Platform Link: Strictly shown ONLY to authorized Admin */}
          {isAdmin && (
            <div className="pt-3 border-t border-[var(--gm-border)] mt-2">
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-sm font-semibold ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-[var(--gm-surface-elevated)] text-amber-400 border border-amber-500/30'
                    : 'text-amber-500/80 hover:text-amber-400 hover:bg-[var(--gm-surface-elevated)]'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Admin Console</span>
              </Link>
            </div>
          )}
        </nav>

        {/* User & Wallet Section */}
        <div className="mt-auto space-y-3">
          {isAuthenticated ? (
            <>
              {/* Creator Wallet Card */}
              <div className="p-3.5 bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)] rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-[var(--gm-text-tertiary)] uppercase tracking-wider">
                    Balance
                  </span>
                  <Link 
                    to="/wallet" 
                    className="text-[11px] font-semibold text-[var(--gm-brand)] hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Wallet</span>
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
                <p className="text-xl font-extrabold tracking-tight text-[var(--gm-text)]">
                  ${walletBalance.toFixed(2)}
                </p>
              </div>

              {/* User Profile Mini Tab */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)]">
                <Link to="/profile" className="flex items-center gap-2.5 min-w-0 flex-1 group">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full object-cover border border-[var(--gm-border)]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--gm-brand-subtle)] text-[var(--gm-brand)] flex items-center justify-center font-bold text-xs">
                      {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--gm-text)] truncate group-hover:text-[var(--gm-brand)] transition-colors">
                      {user.displayName || 'Creator'}
                    </p>
                    <p className="text-[10px] text-[var(--gm-text-tertiary)] truncate">
                      @{user.username || 'user'}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-[var(--gm-text-tertiary)] hover:text-red-400 hover:bg-[var(--gm-surface)] rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="p-3 bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)] rounded-xl text-center space-y-2">
              <p className="text-xs text-[var(--gm-text-secondary)]">Join creators and viewers</p>
              <Link to="/login" className="gm-btn-primary w-full text-xs py-2">
                <LogIn size={14} />
                <span>Sign In / Join</span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 relative h-full w-full bg-[var(--gm-bg)] overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="h-full w-full overflow-y-auto no-scrollbar"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--gm-surface)] border-t border-[var(--gm-border)] flex justify-around items-center h-14 px-2 z-50">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '');
          
          if (item.highlight) {
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className="flex items-center justify-center w-10 h-10 bg-[var(--gm-brand)] text-white rounded-xl shadow-sm active:scale-95 transition-transform"
              >
                <PlusSquare size={20} />
              </Link>
            );
          }

          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex flex-col items-center justify-center w-12 h-full transition-colors ${
                isActive ? 'text-[var(--gm-brand)]' : 'text-[var(--gm-text-tertiary)] hover:text-[var(--gm-text)]'
              }`}
            >
              <Icon size={18} />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
