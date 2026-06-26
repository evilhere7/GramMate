import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart3, Bell, Compass, Home, Moon, PlusSquare, Shield, Sun, User as UserIcon, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from '../brand/Logo';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Feed', path: '/feed' },
  { icon: PlusSquare, label: 'Create', path: '/upload', special: true },
  { icon: BarChart3, label: 'Studio', path: '/studio' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: UserIcon, label: 'Profile', path: '/profile/me' },
  { icon: Shield, label: 'Admin', path: '/admin', adminOnly: true },
];

export default function MainLayout() {
  const { isAuthenticated, user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [walletBalance, setWalletBalance] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch real wallet balance
  useEffect(() => {
    if (!user) return;
    const fetchWallet = async () => {
      try {
        const { data } = await supabase
          .from('wallets')
          .select('balance_cents')
          .eq('user_id', user.id)
          .maybeSingle();
        setWalletBalance(data?.balance_cents ?? 0);
      } catch (err) {
        console.error('Error fetching wallet for sidebar:', err);
      }
    };

    const checkAdmin = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        setIsAdmin(data?.role === 'admin' || data?.role === 'ADMIN');
      } catch (err) {
        console.error('Error checking admin role:', err);
      }
    };

    fetchWallet();
    checkAdmin();
  }, [user]);

  const formatBalance = (cents) => {
    if (cents === null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[var(--gm-bg)]">
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden h-screen w-[272px] shrink-0 flex-col border-r border-[var(--gm-border)] bg-[var(--gm-surface)] md:sticky md:top-0 md:flex">
        {/* Logo */}
        <div className="p-5 pb-2">
          <Logo size="md" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 pt-4" aria-label="Main navigation">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path
              || (item.path === '/feed' && location.pathname === '/explore');

            if (item.special) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="mt-2 mb-2 flex items-center gap-3 rounded-xl bg-[var(--gm-brand)] px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[var(--gm-brand-light)] active:scale-[0.97]"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--gm-surface-elevated)] text-[var(--gm-brand-light)]'
                    : 'text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-elevated)] hover:text-[var(--gm-text)]'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[var(--gm-brand)]" />
                )}
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto space-y-3 border-t border-[var(--gm-border)] p-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-elevated)] hover:text-[var(--gm-text)] transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

          {isAuthenticated && (
            <>
              {/* Real Wallet Balance */}
              <div className="rounded-xl surface-brand p-4">
                <p className="text-overline text-[var(--gm-brand-light)]">Available balance</p>
                <p className="mt-1 text-h2 text-[var(--gm-text)]">
                  {formatBalance(walletBalance)}
                </p>
                <p className="mt-2 text-caption text-[var(--gm-text-tertiary)]">
                  Withdrawals unlock after trust checks
                </p>
              </div>

              {/* Sign Out */}
              <button
                onClick={signOut}
                className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-elevated)] hover:text-[var(--gm-text)] transition-colors"
              >
                Sign out
              </button>
            </>
          )}

          <p className="px-4 pt-1 text-[10px] font-medium text-[var(--gm-text-tertiary)]">
            © 2026 GramMate
          </p>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex min-h-screen w-full flex-1 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--gm-border)] glass px-4 md:hidden">
          <Logo size="sm" tagline={false} />
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface)] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link
              to="/upload"
              className="rounded-lg p-2 text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface)] transition-colors"
              aria-label="Upload video"
            >
              <PlusSquare size={20} />
            </Link>
            <button
              className="relative rounded-lg p-2 text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface)] transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </main>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav
        className="fixed bottom-0 z-50 flex h-16 w-full items-center justify-around border-t border-[var(--gm-border)] glass px-2 md:hidden"
        aria-label="Mobile navigation"
      >
        {filteredNavItems.filter(item => !item.adminOnly).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path
            || (item.path === '/feed' && location.pathname === '/explore');

          if (item.special) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex h-10 w-12 items-center justify-center rounded-xl bg-[var(--gm-brand)] text-white shadow-sm active:scale-95 transition-transform hover:bg-[var(--gm-brand-light)]"
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex h-full w-14 flex-col items-center justify-center transition-colors ${
                isActive
                  ? 'text-[var(--gm-brand-light)]'
                  : 'text-[var(--gm-text-tertiary)]'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="mt-1 text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
