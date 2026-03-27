import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, ShieldCheck, ArrowLeftRight, BookOpen, 
  AlertTriangle, Headphones, FileText, Settings, LogOut, Wallet,
  CreditCard, Menu, X, ShieldOff
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

const sidebarItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/kyc', icon: ShieldCheck, label: 'KYC Review' },
  { path: '/admin/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/admin/ledger', icon: BookOpen, label: 'Ledger' },
  { path: '/admin/conversions', icon: CreditCard, label: 'Conversions' },
  { path: '/admin/withdrawals', icon: Wallet, label: 'Withdrawals' },
  { path: '/admin/risk', icon: AlertTriangle, label: 'Risk' },
  { path: '/admin/support', icon: Headphones, label: 'Support' },
  { path: '/admin/audit', icon: FileText, label: 'Audit Logs' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin dashboard. This area is restricted to administrators only.
          </p>
          <Link to="/">
            <Button>Return to App</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-6 border-b border-sidebar-border flex items-center gap-3">
        <img src="/paysible_icon_white.svg" alt="Paysible" className="w-10 h-10" />
        <div>
          <h1 className="text-xl font-bold text-white">Paysible</h1>
          <p className="text-xs text-sidebar-foreground/60">Admin Dashboard</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive(item)
                ? 'bg-sidebar-accent text-white font-medium'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white'
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => base44.auth.logout('/')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0 z-40">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 z-50">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 lg:px-6 flex items-center gap-3 pt-safe">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to App
          </Link>
        </header>
        <motion.main 
          className="p-4 lg:p-6"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}