import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import NotificationCenter from './NotificationCenter';

const ROUTE_TITLES = {
  '/wallet/receive': 'Receive USD',
  '/withdraw': 'Withdraw NGN',
  '/bank-accounts': 'Bank Accounts',
  '/kyc': 'Verification',
  '/notifications': 'Notifications',
  '/profile/security': 'Security',
  '/support': 'Support',
  '/legal': 'Legal',
  '/rate-alerts': 'Rate Alerts',
  '/calculator': 'Currency Calculator',
  '/profile/edit': 'Edit Profile',
};

export default function BackHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  
  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const title = ROUTE_TITLES[location.pathname] || 'Back';
  const isRoot = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border safe:pt-safe">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto w-full min-h-[44px]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-foreground min-h-[44px] min-w-[44px]"
          aria-label="Go back to previous page"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground text-center flex-1">{title}</h1>
        {isRoot && user ? <NotificationCenter user={user} /> : <div className="w-10" />}
      </div>
    </header>
  );
}