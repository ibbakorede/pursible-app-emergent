/**
 * AmountStep - Amount entry step for withdrawals
 */
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Building2, ChevronRight, AlertCircle, Clock, Zap, History,
  ArrowDownToLine, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/currencies';
import { WITHDRAWAL_FEE, QUICK_AMOUNTS, getStatusStyles } from './withdrawConstants';

export default function AmountStep({
  amount,
  setAmount,
  balance,
  bank,
  recentTxns,
  onContinue,
  lightHaptic
}) {
  const numAmount = Number(amount) || 0;
  const youReceive = numAmount - WITHDRAWAL_FEE;
  
  const validationError = useMemo(() => {
    if (numAmount > 0 && numAmount < WITHDRAWAL_FEE + 100) {
      return `Minimum withdrawal: ${formatCurrency(WITHDRAWAL_FEE + 100, 'NGN')}`;
    }
    if (numAmount > balance) {
      return 'Insufficient balance';
    }
    return null;
  }, [numAmount, balance]);

  const canContinue = numAmount >= WITHDRAWAL_FEE + 100 && numAmount <= balance && !!bank;

  const handleQuickAmount = (val) => {
    lightHaptic?.();
    setAmount(String(val));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Withdraw NGN</h1>
          <p className="text-sm text-muted-foreground">Send to your bank account</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-5 rounded-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <p className="text-sm text-white/80 mb-0.5">Available Balance</p>
        <p className="text-3xl font-bold tabular-nums">{formatCurrency(balance, 'NGN')}</p>
      </div>

      {/* Amount Input */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">₦</span>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="pl-10 pr-4 py-7 text-3xl font-bold rounded-2xl text-center"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            data-testid="withdraw-amount-input"
          />
        </div>
        {validationError && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Quick amounts */}
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleQuickAmount(val)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                Number(amount) === val
                  ? 'bg-purple-600 text-white'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              {formatCurrency(val, 'NGN')}
            </button>
          ))}
        </div>
      </div>

      {/* Fee summary */}
      {numAmount > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Summary</p>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">Amount</span>
              <span className="text-sm font-semibold tabular-nums">{formatCurrency(numAmount, 'NGN')}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">Fee</span>
              <span className="text-sm text-muted-foreground tabular-nums">-{formatCurrency(WITHDRAWAL_FEE, 'NGN')}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-50/50">
              <span className="text-sm font-semibold">You receive</span>
              <span className="text-base font-bold text-emerald-600 tabular-nums">{formatCurrency(youReceive, 'NGN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bank selector */}
      {bank ? (
        <button
          type="button"
          onClick={onContinue}
          className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:bg-muted/50 transition-colors"
          data-testid="select-bank-button"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">{bank.bank_name}</p>
              <p className="text-xs text-muted-foreground">{bank.account_number} · {bank.account_name}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      ) : (
        <Link
          to="/bank-accounts"
          className="w-full flex items-center justify-center gap-2 p-4 bg-muted/50 border-2 border-dashed border-border rounded-2xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
        >
          <Building2 className="w-4 h-4" />
          Add a bank account to withdraw
        </Link>
      )}

      {/* Info badges */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { id: 'secure', icon: Shield, label: 'Secure', sub: 'Bank-grade encryption' },
          { id: 'time', icon: Clock, label: '1–24 hrs', sub: 'Estimated arrival' },
          { id: 'fee', icon: Zap, label: '₦50 fee', sub: 'Flat processing fee' },
        ].map(({ id, icon: Icon, label, sub }) => (
          <div key={id} className="bg-card border border-border rounded-xl p-3 text-center">
            <Icon className="w-4 h-4 text-purple-600 mx-auto mb-1.5" />
            <p className="text-xs font-semibold">{label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>
          </div>
        ))}
      </div>

      {/* Continue button */}
      <Button
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full py-6 text-base rounded-2xl bg-purple-600 hover:bg-purple-700"
        data-testid="withdraw-continue-button"
      >
        Continue
      </Button>

      {/* Recent transactions */}
      {recentTxns.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Withdrawals</p>
            </div>
            <Link to="/transactions" className="text-xs text-primary font-semibold hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {recentTxns.slice(0, 3).map(tx => {
              const statusClass = getStatusStyles(tx.status);
              return (
                <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                      <ArrowDownToLine className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{formatCurrency(tx.from_amount, 'NGN')}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass}`}>
                    {tx.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
