import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Wallet, ArrowLeftRight, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import BackHeader from './BackHeader';
import { useTabHistory } from '@/hooks/useTabHistory';
import { useBackGesture } from '@/hooks/useBackGesture';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/convert', icon: ArrowLeftRight, label: 'Convert' },
  { path: '/transactions', icon: Clock, label: 'History' },
  { path: '/profile', icon: User, label: 'Profile' },
];

// Main tabs + all sub-pages that have their own back buttons
const TAB_ROUTES = [
  '/', '/wallet', '/convert', '/transactions', '/profile',
  '/wallet/receive', '/withdraw', '/bank-accounts', '/kyc',
  '/notifications', '/profile/security', '/profile/edit',
  '/support', '/legal', '/rate-alerts', '/calculator',
  '/goals', '/referrals', '/market-comparison',
];

export default function UserLayout() {
  const location = useLocation();
  const isTabRoute =
    TAB_ROUTES.includes(location.pathname) ||
    location.pathname.startsWith('/transactions/') ||
    location.pathname.startsWith('/receipt/');
  useTabHistory(); // Manage independent history stacks per tab
  useBackGesture(); // Handle Android hardware back button

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isTabRoute && <BackHeader />}
      <motion.main 
        className="flex-1 pb-20 max-w-lg mx-auto w-full"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Outlet />
      </motion.main>
      {/* Bottom Navigation - Clean & Interactive */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center justify-center gap-1.5 py-1 px-5 group"
                aria-label={`Navigate to ${label}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon 
                  className={`w-6 h-6 transition-all duration-200 ${
                    isActive 
                      ? 'text-primary scale-110' 
                      : 'text-muted-foreground group-hover:text-foreground group-active:scale-90'
                  }`} 
                  strokeWidth={isActive ? 2.5 : 1.8} 
                />
                <span className={`text-[11px] transition-colors duration-200 ${
                  isActive ? 'text-primary font-bold' : 'text-muted-foreground font-medium group-hover:text-foreground'
                }`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      {/* Screen reader announcer */}
      <div 
        id="sr-announcer"
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
}