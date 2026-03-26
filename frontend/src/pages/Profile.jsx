import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/lib/ThemeContext';
import {
  User, Building2, Shield, Bell, Lock, HelpCircle, FileText,
  ChevronRight, LogOut, Settings, TrendingUp, CheckCircle, AlertCircle, Clock, Target, Gift, Sun, Moon
} from 'lucide-react';

const KYC_STATUS_CONFIG = {
  approved:    { label: 'Verified',     bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
  pending:     { label: 'Pending',      bg: 'bg-amber-100',   text: 'text-amber-700',   icon: Clock },
  in_review:   { label: 'In Review',    bg: 'bg-blue-100',    text: 'text-blue-700',    icon: Clock },
  rejected:    { label: 'Rejected',     bg: 'bg-red-100',     text: 'text-red-700',     icon: AlertCircle },
  not_started: { label: 'Not Started',  bg: 'bg-muted',       text: 'text-muted-foreground', icon: AlertCircle },
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const { theme, toggleTheme, isDark } = useTheme();
  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: kyc = [] } = useQuery({
    queryKey: ['kyc'],
    queryFn: () => base44.entities.KYCRecord.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const kycStatus = kyc[0]?.status || 'not_started';
  const kycCfg = KYC_STATUS_CONFIG[kycStatus] || KYC_STATUS_CONFIG.not_started;
  const KycIcon = kycCfg.icon;

  const sections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Personal Information', path: '/profile/edit', desc: 'Name, email and details' },
        { icon: Building2, label: 'Bank Accounts', path: '/bank-accounts', desc: 'Manage linked banks' },
        { icon: Shield, label: 'KYC Verification', path: '/kyc', desc: 'Identity verification', badge: kycStatus !== 'approved' ? kycStatus : null },
      ],
    },
    {
      title: 'Security & Preferences',
      items: [
        { icon: Lock, label: 'Security Settings', path: '/profile/security', desc: 'Biometrics, 2FA & PIN' },
        { icon: Bell, label: 'Notifications', path: '/notifications', desc: 'Alerts and updates' },
        { icon: TrendingUp, label: 'Rate Alerts', path: '/rate-alerts', desc: 'Get notified on rates' },
        { icon: Target, label: 'Financial Goals', path: '/goals', desc: 'Track savings & investments' },
        { icon: Gift, label: 'Referrals', path: '/referrals', desc: 'Earn bonuses inviting friends' },
        { icon: isDark ? Moon : Sun, label: 'Theme', desc: isDark ? 'Dark mode' : 'Light mode', isThemeToggle: true },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & Support', path: '/support', desc: 'FAQs and contact' },
        { icon: FileText, label: 'Legal', path: '/legal', desc: 'Terms and privacy policy' },
      ],
    },
  ];

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      {/* Profile hero */}
      <div className="bg-gradient-to-br from-primary via-primary to-blue-700 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{user?.full_name || 'User'}</h1>
            <p className="text-sm opacity-70 truncate">{user?.email}</p>
            <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${kycCfg.bg} ${kycCfg.text}`}>
              <KycIcon className="w-3 h-3" />
              {kycCfg.label}
            </div>
          </div>
        </div>
      </div>

      {/* Admin link */}
      {user?.role === 'admin' && (
        <Link to="/admin" className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl hover:from-amber-100 hover:to-orange-100 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background" aria-label="Go to admin dashboard">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Settings className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Admin Dashboard</p>
            <p className="text-xs text-amber-700">Manage users, transactions & more</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-600" />
        </Link>
      )}

      {/* Sections */}
      {sections.map(section => (
        <div key={section.title}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{section.title}</p>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {section.items.map(({ icon: Icon, label, path, desc, badge, isThemeToggle }) => (
              isThemeToggle ? (
                <button 
                  key={label}
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3.5 px-4 py-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-muted-foreground" style={{ width: '1.1rem', height: '1.1rem' }} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <div className={`relative w-12 h-7 rounded-full transition-colors ${isDark ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </button>
              ) : (
                <Link key={label} to={path} className="flex items-center gap-3.5 px-4 py-4 hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background" aria-label={label}>
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-muted-foreground" style={{ width: '1.1rem', height: '1.1rem' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  {badge && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${(KYC_STATUS_CONFIG[badge] || KYC_STATUS_CONFIG.not_started).bg} ${(KYC_STATUS_CONFIG[badge] || KYC_STATUS_CONFIG.not_started).text}`}>
                      {badge.replace(/_/g, ' ')}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </Link>
              )
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={() => base44.auth.logout('/')}
        className="w-full flex items-center justify-center gap-2 py-3.5 text-muted-foreground text-sm font-semibold rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Sign out from your account"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}