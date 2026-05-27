
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Compass, PlusSquare, Wallet, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="text-3xl font-bold text-primary mb-12 tracking-tighter pl-2">
          GramMate
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
        
        {isAuthenticated && (
          <div className="mt-auto space-y-4">
            <div className="p-4 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-2xl rounded-full" />
              <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold">$0.00</p>
            </div>
            <button 
              onClick={signOut}
              className="w-full text-left px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-900 rounded-xl transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative h-full w-full bg-black md:bg-gray-950">
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
