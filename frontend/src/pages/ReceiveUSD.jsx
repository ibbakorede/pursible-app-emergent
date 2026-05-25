import { Copy, Share2, ArrowLeft, Check, Clock, Shield, Zap, AlertCircle, ArrowDownToLine, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Channel color configuration
const CHANNEL_COLORS = {
  usd_wire: { color: '#85B7EB', bg: 'rgba(133,183,235,0.12)' },
  stable_wallet: { color: '#5DCAA5', bg: 'rgba(93,202,165,0.12)' },
  ngn_bank: { color: '#97C459', bg: 'rgba(151,196,89,0.12)' },
};

const TYPE_INFO = {
  usd_wire: {
    title: 'USD Wire Transfer',
    description: 'Send a domestic or international wire transfer. Funds typically arrive within 1–3 business days.',
    emoji: '🇺🇸',
    sublabel: 'USD Wire',
    badge: '1–3 business days',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    headerGradient: 'from-blue-600 to-blue-800',
  },
  stable_wallet: {
    title: 'USDT / Stablecoin',
    description: 'Send USDC or USDT to the wallet address below. Ensure you use the correct network to avoid loss of funds.',
    emoji: '💚',
    sublabel: 'Stablecoin',
    badge: 'Near instant',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    headerGradient: 'from-teal-500 to-emerald-700',
    useSVG: true,
  },
  ngn_bank: {
    title: 'NGN Bank Transfer',
    description: 'Send a Naira bank transfer to the account below. Use your registered email as the payment reference.',
    emoji: '🇳🇬',
    sublabel: 'NGN Bank',
    badge: 'Same day',
    badgeColor: 'bg-green-50 text-green-700 border-green-200',
    headerGradient: 'from-green-600 to-green-800',
  },
};

const TetherLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#26A17B"/>
    <path d="M17.922 17.383v-.002c-.108.008-.664.042-1.922.042-1.002 0-1.71-.03-1.96-.042v.003c-3.867-.17-6.754-.842-6.754-1.646 0-.803 2.887-1.476 6.754-1.648v2.62c.254.018.974.061 1.977.061 1.2 0 1.8-.05 1.905-.061v-2.619c3.86.172 6.74.844 6.74 1.647 0 .803-2.88 1.476-6.74 1.645zm0-3.565v-2.346h5.382V8H8.703v3.472h5.382v2.345c-4.382.202-7.677 1.07-7.677 2.115 0 1.046 3.295 1.913 7.677 2.116v7.57h3.837v-7.571c4.374-.202 7.662-1.069 7.662-2.115 0-1.046-3.288-1.912-7.662-2.114z" fill="white"/>
  </svg>
);

function ChannelTab({ account, isActive, onClick }) {
  const info = TYPE_INFO[account.type] || {};
  const colors = CHANNEL_COLORS[account.type] || { color: '#97C459', bg: 'rgba(151,196,89,0.12)' };
  
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all flex-1 min-w-0"
      style={{
        border: isActive ? `1.5px solid ${colors.color}` : '0.5px solid rgba(255,255,255,0.1)',
        background: isActive ? colors.bg : 'rgba(255,255,255,0.03)',
      }}
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-white shadow-sm border border-border">
        {account.type === 'stable_wallet'
          ? <TetherLogo size={48} />
          : <span className="text-2xl leading-none">{info.emoji}</span>}
      </div>
      <span 
        className="text-xs font-semibold"
        style={{ color: isActive ? colors.color : 'rgba(255,255,255,0.55)' }}
      >
        {info.sublabel}
      </span>
    </button>
  );
}

function CopyField({ label, value, fieldKey, copiedField, onCopy }) {
  const isCopied = copiedField === fieldKey;
  return (
    <div className="flex items-center justify-between px-5 py-4 group">
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <p className="text-sm font-semibold break-all leading-relaxed">{value}</p>
      </div>
      <button
        onClick={() => onCopy(fieldKey, value)}
        className="flex-shrink-0 flex items-center gap-1.5 transition-all"
        style={{
          padding: '6px 10px',
          borderRadius: '9px',
          background: isCopied ? 'rgba(122,140,84,0.18)' : 'rgba(255,255,255,0.05)',
          color: isCopied ? '#97C459' : 'rgba(255,255,255,0.7)',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        {isCopied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Copied
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}

function AccountDetails({ account, userEmail }) {
  const [copiedField, setCopiedField] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const info = TYPE_INFO[account.type] || {};
  const fields = (account.fields || []).filter(f => f.value).map((f, idx) => ({ ...f, _id: idx }));

  const copyToClipboard = (key, value) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAll = () => {
    const text = fields.map(f => `${f.label}: ${f.value}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success('All details copied!');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const shareDetails = async () => {
    const text = `${info.title}\n\n${fields.map(f => `${f.label}: ${f.value}`).join('\n')}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: info.title, text });
      } catch (err) {
        // User cancelled or error
        copyAll();
      }
    } else {
      copyAll();
      toast.success('Details copied (share not supported)');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className={`bg-gradient-to-br ${info.headerGradient || 'from-primary to-blue-700'} rounded-3xl p-6 text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                {account.type === 'stable_wallet'
                  ? <TetherLogo size={32} />
                  : <span className="text-2xl">{info.emoji}</span>}
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">{account.label || info.title}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border mt-1 ${info.badgeColor}`}>
                  <Clock className="w-3 h-3" /> {info.badge}
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm opacity-75 leading-relaxed">{info.description}</p>
        </div>
      </div>

      {/* Fields card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 bg-muted/30 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account Details</p>
        </div>
        <div className="divide-y divide-border">
          {fields.map(({ _id, key, label, value }) => (
            <CopyField
              key={_id}
              fieldKey={key}
              label={label}
              value={value}
              copiedField={copiedField}
              onCopy={copyToClipboard}
            />
          ))}
        </div>
      </div>

      {/* Copy all + Share button row */}
      <div className="flex gap-3">
        <button
          onClick={copyAll}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: copiedAll ? 'rgba(122,140,84,0.18)' : 'transparent',
            border: copiedAll ? '1px solid rgba(122,140,84,0.4)' : '1px solid rgba(255,255,255,0.15)',
            color: copiedAll ? '#97C459' : 'rgba(255,255,255,0.8)',
          }}
        >
          {copiedAll ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy all
            </>
          )}
        </button>
        <button
          onClick={shareDetails}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors text-white"
          style={{ background: '#5C6B3E' }}
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Wire reference info banner */}
      {account.type === 'usd_wire' && userEmail && (
        <div 
          className="flex items-start gap-3"
          style={{
            background: 'rgba(239,159,39,0.06)',
            border: '0.5px solid rgba(239,159,39,0.25)',
            borderRadius: '12px',
            padding: '10px 14px',
          }}
        >
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FAC775' }} />
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Use your registered email <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#FAC775' }}>{userEmail}</span> as the wire reference.
          </p>
        </div>
      )}

      {/* NGN reference info banner */}
      {account.type === 'ngn_bank' && userEmail && (
        <div 
          className="flex items-start gap-3"
          style={{
            background: 'rgba(239,159,39,0.06)',
            border: '0.5px solid rgba(239,159,39,0.25)',
            borderRadius: '12px',
            padding: '10px 14px',
          }}
        >
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FAC775' }} />
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Use your registered email <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#FAC775' }}>{userEmail}</span> as the payment reference.
          </p>
        </div>
      )}

      {/* Warning for stablecoin */}
      {account.type === 'stable_wallet' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-0.5">Network Warning</p>
            <p className="text-xs text-amber-700">Only send USDT or USDC on the correct network. Sending on the wrong network may result in permanent loss of funds.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReceiveUSD() {
  const [selectedType, setSelectedType] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['deposit-accounts'],
    queryFn: () => base44.entities.DepositAccount.filter({ is_active: true }),
  });

  // Auto-select first account
  const effectiveType = selectedType || (accounts[0]?.type ?? null);

  // Fetch real USD deposit details from Bridge when the USD tab is active
  const { data: usdDepositData } = useQuery({
    queryKey: ['deposit-fiat-usd'],
    queryFn: () => base44.functions.invoke('depositFiat', { currency: 'USD' }),
    enabled: !!user?.email && effectiveType === 'usd_wire',
    staleTime: 5 * 60 * 1000,
  });

  // Fetch real NGN virtual account details from Flutterwave when the NGN tab is active
  const { data: ngnDepositData } = useQuery({
    queryKey: ['deposit-fiat-ngn'],
    queryFn: () => base44.functions.invoke('depositFiat', { currency: 'NGN' }),
    enabled: !!user?.email && effectiveType === 'ngn_bank',
    staleTime: 5 * 60 * 1000,
  });

  // Overlay real provider fields onto the admin-configured DepositAccount record.
  const resolveAccountFields = (account) => {
    if (!account) return account;
    if (account.type === 'usd_wire' && usdDepositData?.success && usdDepositData?.depositDetails) {
      const d = usdDepositData.depositDetails;
      return {
        ...account,
        fields: [
          { key: 'bank_name',      label: 'Bank Name',               value: d.bankName },
          { key: 'routing_number', label: 'Routing Number',           value: d.routingNumber },
          { key: 'account_number', label: 'Account Number',           value: d.accountNumber },
          { key: 'account_type',   label: 'Account Type',             value: d.accountType },
          { key: 'reference',      label: 'Payment Reference / Memo', value: d.reference },
        ].filter(f => f.value),
      };
    }
    if (account.type === 'ngn_bank' && ngnDepositData?.success && ngnDepositData?.depositDetails) {
      const d = ngnDepositData.depositDetails;
      return {
        ...account,
        fields: [
          { key: 'bank_name',      label: 'Bank Name',      value: d.bankName },
          { key: 'account_number', label: 'Account Number', value: d.accountNumber },
          { key: 'account_name',   label: 'Account Name',   value: d.accountName },
        ].filter(f => f.value),
      };
    }
    return account;
  };

  const selectedAccount = resolveAccountFields(
    accounts.find(a => a.type === effectiveType) || accounts[0]
  );

  if (isLoading) return <LoadingSpinner text="Loading deposit details..." />;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/wallet" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Deposit Funds</h1>
            <p className="text-xs text-muted-foreground">Add money to your wallets</p>
          </div>
        </div>

        {/* Info badges */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'secure', icon: Shield, label: 'Secure', sub: 'End-to-end encrypted' },
            { id: 'fast', icon: Zap, label: 'Fast', sub: 'Multiple channels' },
            { id: 'no-limit', icon: ArrowDownToLine, label: 'No limit', sub: 'Deposit any amount' },
          ].map(({ id, icon: Icon, label, sub }) => (
            <div key={id} className="bg-card border border-border rounded-xl p-3 text-center">
              <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>
            </div>
          ))}
        </div>

        {/* No accounts state */}
        {accounts.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <ArrowDownToLine className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold">Deposit details coming soon</p>
            <p className="text-sm text-muted-foreground">Our team is configuring deposit channels. Please check back or contact support.</p>
          </div>
        )}

        {/* Channel tabs */}
        {accounts.length > 0 && (
          <>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Choose deposit method</p>
              <div className="flex gap-3">
                {accounts.map((account) => (
                  <ChannelTab
                    key={account.id}
                    account={account}
                    isActive={effectiveType === account.type}
                    onClick={() => setSelectedType(account.type)}
                  />
                ))}
              </div>
            </div>

            {/* Account details */}
            {selectedAccount && <AccountDetails account={selectedAccount} userEmail={user?.email} />}

            {/* How it works */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 bg-muted/30 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">How it works</p>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { step: '1', text: 'Copy the account details above' },
                  { step: '2', text: 'Initiate a transfer from your bank or wallet' },
                  { step: '3', text: 'Your balance updates once funds are confirmed' },
                ].map(({ step, text }) => (
                  <div key={`step-${step}`} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {step}
                    </div>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
