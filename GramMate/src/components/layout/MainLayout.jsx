
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Compass, PlusSquare, Wallet, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../brand/Logo';
import AppIcon from '../brand/AppIcon';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Discover', path: '/explore' },
  { icon: PlusSquare, label: 'Create', path: '/upload', special: true },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: UserIcon, label: 'Profile', path: '/profile/me' },
];

export default function MainLayout() {
  const { isAuthenticated, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden dark">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-800 bg-black h-full p-4">
        <div className="mb-10 pl-2">
          <Logo size="lg" hoverGlow />
        </div>
        
        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/feed');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive ? 'bg-gray-900 text-primary' : 'hover:bg-gray-900/50 text-gray-300 hover:text-white'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110 transition-transform' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="text-lg font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-gray-900 space-y-4">
          {isAuthenticated && (
            <>
              <div className="p-4 bg-gradient-to-br from-gray-950 to-black border border-gray-800/60 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-2xl rounded-full" />
                <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-white">$0.00</p>
              </div>
              <button 
                onClick={signOut}
                className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-white hover:bg-gray-900 rounded-xl transition-colors text-sm font-medium"
              >
                Sign Out
              </button>
            </>
          )}
          <div className="text-center pt-2">
            <p className="text-[10px] text-gray-600 font-black tracking-[0.2em] uppercase leading-none">
              © 2026 GramMate
            </p>
            <p className="text-[8px] text-gray-500 font-bold tracking-[0.15em] uppercase mt-1 leading-none">
              Watch • Create • Earn
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-full w-full bg-black md:bg-gray-950 overflow-hidden">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 bg-black/85 backdrop-blur-xl border-b border-gray-900 shrink-0 z-40">
          <Logo size="sm" tagline={false} hoverGlow={false} />
          
          <div className="flex items-center gap-4">
            <Link to="/upload" className="p-1 text-gray-400 hover:text-white transition-colors">
              <PlusSquare size={22} />
            </Link>
            
            {/* Visual notifications/inbox panel indicator with neon pulse glow */}
            <div className="relative cursor-pointer p-1 text-gray-400 hover:text-white transition-colors">
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-black animate-pulse shadow-[0_0_8px_rgba(255,46,99,0.8)]" />
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full overflow-y-auto no-scrollbar"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Sticky Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-black/90 backdrop-blur-lg border-t border-gray-800 flex justify-around items-center h-16 px-2 z-50">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/feed');
          
          if (item.special) {
            return (
              <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center w-12 h-10 bg-primary text-black rounded-xl">
                <Icon className="w-6 h-6" />
              </Link>
            );
          }

          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center w-16 h-full ${isActive ? 'text-primary' : 'text-gray-400'}`}>
              <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
