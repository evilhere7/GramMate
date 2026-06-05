import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart3, Bell, Compass, Home, PlusSquare, Shield, User as UserIcon, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../brand/Logo';

const NAV_ITEMS = [
  { icon: Home, label: 'Landing', path: '/' },
  { icon: Compass, label: 'Feed', path: '/feed' },
  { icon: PlusSquare, label: 'Create', path: '/upload', special: true },
  { icon: BarChart3, label: 'Studio', path: '/studio' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: UserIcon, label: 'Profile', path: '/profile/me' },
  { icon: Shield, label: 'Admin', path: '/admin' },
];

export default function MainLayout() {
  const { isAuthenticated, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:sticky md:top-0 md:flex">
        <div className="mb-8 px-2">
          <Logo size="md" hoverGlow={false} />
        </div>

        <nav className="flex-1 space-y-2" aria-label="Product">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/feed' && location.pathname === '/explore');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4 border-t border-slate-200 pt-4">
          {isAuthenticated && (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-1 text-sm text-slate-500">Available earnings</p>
                <p className="text-2xl font-bold text-slate-950">$0.00</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">Withdrawals unlock after trust and clearing checks.</p>
              </div>
              <button
                onClick={signOut}
                className="w-full rounded-md px-3 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              >
                Sign out
              </button>
            </>
          )}
          <p className="px-3 pt-2 text-xs font-semibold text-slate-400">Copyright 2026 GramMate</p>
        </div>
      </aside>

      <main className="flex min-h-screen w-full flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
          <Logo size="sm" tagline={false} hoverGlow={false} />
          <div className="flex items-center gap-3">
            <Link to="/upload" className="rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label="Upload video">
              <PlusSquare size={22} />
            </Link>
            <button className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" />
              <Bell size={21} />
            </button>
          </div>
        </header>

        <div className="flex-1">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 z-50 flex h-16 w-full items-center justify-around border-t border-slate-200 bg-white px-2 md:hidden" aria-label="Mobile">
        {NAV_ITEMS.filter((item) => item.path !== '/admin').map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/feed' && location.pathname === '/explore');

          if (item.special) {
            return (
              <Link key={item.path} to={item.path} className="flex h-10 w-12 items-center justify-center rounded-md bg-blue-600 text-white" aria-label={item.label}>
                <Icon className="h-6 w-6" />
              </Link>
            );
          }

          return (
            <Link key={item.path} to={item.path} className={`flex h-full w-14 flex-col items-center justify-center ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="mt-1 text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
