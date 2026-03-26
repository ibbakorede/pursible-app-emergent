import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Login from '@/pages/Login';
import Onboarding from '@/pages/Onboarding';
import RouteTransition from '@/components/layout/RouteTransition';
import OfflineQueueStatus from '@/components/shared/OfflineQueueStatus';
import { AriaLiveRegionContainer } from '@/components/shared/AriaLiveRegions';

// Layouts
import UserLayout from '@/components/layout/UserLayout';
import AdminLayout from '@/components/layout/AdminLayout';

// User pages - lazy loaded for better performance
const Home = lazy(() => import('@/pages/Home'));
const WalletOverview = lazy(() => import('@/pages/WalletOverview'));
const ReceiveUSD = lazy(() => import('@/pages/ReceiveUSD'));
const ConvertFunds = lazy(() => import('@/pages/ConvertFunds'));
const Transactions = lazy(() => import('@/pages/Transactions'));
const TransactionDetail = lazy(() => import('@/pages/TransactionDetail'));
const WithdrawNGN = lazy(() => import('@/pages/WithdrawNGN'));
const BankAccounts = lazy(() => import('@/pages/BankAccounts'));
const Profile = lazy(() => import('@/pages/Profile'));
const KYCFlow = lazy(() => import('@/pages/KYCFlow'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const SecuritySettings = lazy(() => import('@/pages/SecuritySettings'));
const Support = lazy(() => import('@/pages/Support'));
const Legal = lazy(() => import('@/pages/Legal'));
const RateAlerts = lazy(() => import('@/pages/RateAlerts'));
const CurrencyCalculator = lazy(() => import('@/pages/CurrencyCalculator'));
const ProfileEdit = lazy(() => import('@/pages/ProfileEdit'));
const Goals = lazy(() => import('@/pages/Goals'));
const Referrals = lazy(() => import('@/pages/Referrals'));
const TransactionReceipt = lazy(() => import('@/pages/TransactionReceipt'));
const MarketComparison = lazy(() => import('@/pages/MarketComparison'));

// Admin pages - lazy loaded for better performance
const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminKYC = lazy(() => import('@/pages/admin/AdminKYC'));
const AdminTransactions = lazy(() => import('@/pages/admin/AdminTransactions'));
const AdminLedger = lazy(() => import('@/pages/admin/AdminLedger'));
const AdminConversions = lazy(() => import('@/pages/admin/AdminConversions'));
const AdminWithdrawals = lazy(() => import('@/pages/admin/AdminWithdrawals'));
const AdminRisk = lazy(() => import('@/pages/admin/AdminRisk'));
const AdminSupport = lazy(() => import('@/pages/admin/AdminSupport'));
const AdminAuditLogs = lazy(() => import('@/pages/admin/AdminAuditLogs'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));

// Loading fallback for lazy-loaded admin routes
const AdminLoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated, user } = useAuth();

  // Show loading state
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show onboarding if user has no full_name
  if (user && !user.full_name) {
    return <Onboarding />;
  }

  return (
    <RouteTransition>
      <Routes>
        {/* All user pages — UserLayout provides the persistent bottom nav */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Suspense fallback={<AdminLoadingFallback />}><Home /></Suspense>} />
          <Route path="/wallet" element={<Suspense fallback={<AdminLoadingFallback />}><WalletOverview /></Suspense>} />
          <Route path="/convert" element={<Suspense fallback={<AdminLoadingFallback />}><ConvertFunds /></Suspense>} />
          <Route path="/transactions" element={<Suspense fallback={<AdminLoadingFallback />}><Transactions /></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<AdminLoadingFallback />}><Profile /></Suspense>} />
          <Route path="/wallet/receive" element={<Suspense fallback={<AdminLoadingFallback />}><ReceiveUSD /></Suspense>} />
          <Route path="/transactions/:id" element={<Suspense fallback={<AdminLoadingFallback />}><TransactionDetail /></Suspense>} />
          <Route path="/receipt/:id" element={<Suspense fallback={<AdminLoadingFallback />}><TransactionReceipt /></Suspense>} />
          <Route path="/withdraw" element={<Suspense fallback={<AdminLoadingFallback />}><WithdrawNGN /></Suspense>} />
          <Route path="/bank-accounts" element={<Suspense fallback={<AdminLoadingFallback />}><BankAccounts /></Suspense>} />
          <Route path="/kyc" element={<Suspense fallback={<AdminLoadingFallback />}><KYCFlow /></Suspense>} />
          <Route path="/notifications" element={<Suspense fallback={<AdminLoadingFallback />}><Notifications /></Suspense>} />
          <Route path="/profile/security" element={<Suspense fallback={<AdminLoadingFallback />}><SecuritySettings /></Suspense>} />
          <Route path="/support" element={<Suspense fallback={<AdminLoadingFallback />}><Support /></Suspense>} />
          <Route path="/legal" element={<Suspense fallback={<AdminLoadingFallback />}><Legal /></Suspense>} />
          <Route path="/rate-alerts" element={<Suspense fallback={<AdminLoadingFallback />}><RateAlerts /></Suspense>} />
          <Route path="/calculator" element={<Suspense fallback={<AdminLoadingFallback />}><CurrencyCalculator /></Suspense>} />
          <Route path="/profile/edit" element={<Suspense fallback={<AdminLoadingFallback />}><ProfileEdit /></Suspense>} />
          <Route path="/goals" element={<Suspense fallback={<AdminLoadingFallback />}><Goals /></Suspense>} />
          <Route path="/referrals" element={<Suspense fallback={<AdminLoadingFallback />}><Referrals /></Suspense>} />
          <Route path="/market-comparison" element={<Suspense fallback={<AdminLoadingFallback />}><MarketComparison /></Suspense>} />
        </Route>

        {/* Admin dashboard - lazy loaded */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Suspense fallback={<AdminLoadingFallback />}><AdminOverview /></Suspense>} />
          <Route path="/admin/users" element={<Suspense fallback={<AdminLoadingFallback />}><AdminUsers /></Suspense>} />
          <Route path="/admin/kyc" element={<Suspense fallback={<AdminLoadingFallback />}><AdminKYC /></Suspense>} />
          <Route path="/admin/transactions" element={<Suspense fallback={<AdminLoadingFallback />}><AdminTransactions /></Suspense>} />
          <Route path="/admin/ledger" element={<Suspense fallback={<AdminLoadingFallback />}><AdminLedger /></Suspense>} />
          <Route path="/admin/conversions" element={<Suspense fallback={<AdminLoadingFallback />}><AdminConversions /></Suspense>} />
          <Route path="/admin/withdrawals" element={<Suspense fallback={<AdminLoadingFallback />}><AdminWithdrawals /></Suspense>} />
          <Route path="/admin/risk" element={<Suspense fallback={<AdminLoadingFallback />}><AdminRisk /></Suspense>} />
          <Route path="/admin/support" element={<Suspense fallback={<AdminLoadingFallback />}><AdminSupport /></Suspense>} />
          <Route path="/admin/audit" element={<Suspense fallback={<AdminLoadingFallback />}><AdminAuditLogs /></Suspense>} />
          <Route path="/admin/settings" element={<Suspense fallback={<AdminLoadingFallback />}><AdminSettings /></Suspense>} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </RouteTransition>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          {/* Skip to content link for accessibility */}
          <a
            href="#main-content"
            className="absolute -left-full top-0 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-b text-sm font-medium focus:static"
          >
            Skip to content
          </a>
          <div id="main-content">
            <AriaLiveRegionContainer />
            <OfflineQueueStatus />
            <AuthenticatedApp />
          </div>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;