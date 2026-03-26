import { useEffect, useState } from 'react';
import { ArrowLeft, Lock, Fingerprint, Key, Shield, ShieldCheck, Eye, AlertTriangle, ChevronRight, Smartphone, Bell, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import BiometricLockModal from '@/components/security/BiometricLockModal';
import NotificationSettings from '@/components/notifications/NotificationSettings';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';

async function isBiometricAvailable() {
  if (!window.PublicKeyCredential) return false;
  try { return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch { return false; }
}

async function hashPin(pinStr) {
  const encoded = new TextEncoder().encode(pinStr);
  const buf = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function SecuritySettings() {
  const [user, setUser] = useState(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [saving, setSaving] = useState(null);

  // Biometric enrollment modal
  const [bioModal, setBioModal] = useState({ open: false, key: null });

  // Transaction PIN modal
  const [pinModal, setPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSaving, setPinSaving] = useState(false);

  // Change Password modal
  const [pwModal, setPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // Delete Account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const biometricLogin     = user?.biometric_login_enabled     ?? false;
  const biometricTransfers = user?.biometric_transfer_enabled  ?? false;
  const twoFA              = user?.security_prefs?.two_fa      ?? false;
  const hasPin             = !!user?.transaction_pin_hash;

  useEffect(() => {
    base44.auth.me().then(setUser);
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  // Save a flat field to the user record
  const saveField = async (field, value) => {
    setSaving(field);
    try {
      await base44.auth.updateMe({ [field]: value });
      setUser(u => ({ ...u, [field]: value }));
      toast.success('Setting saved');
    } catch { toast.error('Failed to save setting'); }
    finally { setSaving(null); }
  };

  // Biometric toggle: open modal when enabling, save directly when disabling
  const handleBiometricToggle = (key, newValue) => {
    if (!biometricAvailable) {
      toast.error('Biometric authentication is not available on this device');
      return;
    }
    if (newValue) {
      setBioModal({ open: true, key });
    } else {
      saveField(key, false);
    }
  };

  // Called by BiometricLockModal on successful verification
  const onBiometricSuccess = async () => {
    await saveField(bioModal.key, true);
    setBioModal({ open: false, key: null });
  };

  // Transaction PIN save
  const handleSavePin = async () => {
    if (!/^\d{4}$/.test(pin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    setPinSaving(true);
    try {
      const hash = await hashPin(pin);
      await base44.auth.updateMe({ transaction_pin_hash: hash });
      setUser(u => ({ ...u, transaction_pin_hash: hash }));
      toast.success(hasPin ? 'Transaction PIN updated' : 'Transaction PIN set');
      setPinModal(false);
      setPin('');
      setConfirmPin('');
    } catch { toast.error('Failed to save PIN'); }
    finally { setPinSaving(false); }
  };

  // Change password save
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPw.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setPwSaving(true);
    try {
      await base44.auth.updateMe({ current_password: currentPw, password: newPw });
      toast.success('Password updated successfully');
      setPwModal(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password. Check your current password.');
    } finally { setPwSaving(false); }
  };

  const securityScore = [biometricLogin, biometricTransfers, twoFA].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Security</h1>
            <p className="text-xs text-muted-foreground">Manage access and authentication</p>
          </div>
        </div>

        {/* Security score card */}
        <div className={`rounded-2xl p-5 ${securityScore >= 2 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : securityScore === 1 ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-red-500 to-rose-600'} text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
          <div className="relative flex items-center gap-4">
            <ShieldCheck className="w-10 h-10 opacity-90 flex-shrink-0" />
            <div>
              <p className="font-bold text-lg">{securityScore === 0 ? 'Not Protected' : securityScore === 1 ? 'Basic Protection' : securityScore === 2 ? 'Good Protection' : 'Maximum Protection'}</p>
              <p className="text-sm opacity-80">
                {securityScore === 0 ? 'Enable security features to protect your account' : `${[biometricLogin && 'Biometrics', twoFA && '2FA'].filter(Boolean).join(' & ')} enabled`}
              </p>
              <div className="flex gap-1 mt-2">
                {[0, 1, 2].map(i => <div key={i} className={`h-1.5 w-8 rounded-full ${i < securityScore ? 'bg-white' : 'bg-white/30'}`} />)}
              </div>
            </div>
          </div>
        </div>

        {/* Biometric not available warning */}
        {!biometricAvailable && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Biometrics not detected</p>
              <p className="text-xs text-amber-700 mt-0.5">Your device or browser doesn't support Face ID / fingerprint authentication.</p>
            </div>
          </div>
        )}

        {/* Biometric section */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 px-1">Biometric Authentication</p>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {[
              { key: 'biometric_login_enabled',    icon: Fingerprint, bg: 'bg-blue-50',   color: 'text-blue-600',   title: 'App Login',            desc: 'Use Face ID or fingerprint to unlock the app',       val: biometricLogin },
              { key: 'biometric_transfer_enabled', icon: Smartphone,  bg: 'bg-purple-50', color: 'text-purple-600', title: 'High-Value Transfers',  desc: 'Require biometrics for withdrawals & large conversions', val: biometricTransfers },
            ].map(({ key, icon: Icon, bg, color, title, desc, val }) => (
              <div key={key} className={`flex items-center gap-4 p-4 ${!biometricAvailable ? 'opacity-50' : ''}`}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={val}
                  disabled={saving === key}
                  onCheckedChange={v => handleBiometricToggle(key, v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Push notifications section */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 px-1">Notifications</p>
          <NotificationSettings />
        </div>

        {/* Account security section */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 px-1">Account Security</p>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">

            {/* 2FA — coming soon */}
            <button
              onClick={() => toast.info('Two-factor authentication is coming soon')}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add a second layer of protection</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground mr-1">Soon</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Transaction PIN */}
            <button
              onClick={() => setPinModal(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Transaction PIN</p>
                <p className="text-xs text-muted-foreground">{hasPin ? 'Change your 4-digit withdrawal PIN' : 'Set a 4-digit withdrawal PIN'}</p>
              </div>
              {hasPin && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 mr-1">Set</span>}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Change Password */}
            <button
              onClick={() => setPwModal(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                <Key className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Change Password</p>
                <p className="text-xs text-muted-foreground">Update your account login password</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Active Sessions */}
            <button
              onClick={() => toast.info('Active session management is coming soon')}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Active Sessions</p>
                <p className="text-xs text-muted-foreground">View and revoke logged-in devices</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground mr-1">Soon</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <p className="text-xs font-semibold text-destructive uppercase tracking-wide mb-2.5 px-1">Danger Zone</p>
          <div className="bg-card border border-destructive/30 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-destructive/5 border-b border-destructive/20">
              <p className="text-xs text-destructive">These actions are permanent and cannot be undone.</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-destructive/5 transition-colors text-left"
            >
              <div className="w-11 h-11 rounded-2xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">Delete Account</p>
                <p className="text-xs text-muted-foreground">Permanently remove your account and all data</p>
              </div>
              <ChevronRight className="w-4 h-4 text-destructive/60" />
            </button>
          </div>
        </div>
      </div>

      {/* Biometric enrollment modal */}
      <BiometricLockModal
        open={bioModal.open}
        operationName={bioModal.key === 'biometric_login_enabled' ? 'enable biometric login' : 'enable biometric transfers'}
        onClose={() => setBioModal({ open: false, key: null })}
        onSuccess={onBiometricSuccess}
      />

      {/* Transaction PIN modal */}
      <Dialog open={pinModal} onOpenChange={open => { if (!open) { setPinModal(false); setPin(''); setConfirmPin(''); } }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              {hasPin ? 'Change Transaction PIN' : 'Set Transaction PIN'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">New PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4-digit PIN"
                className="rounded-xl text-center tracking-widest text-lg"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirm PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Repeat PIN"
                className="rounded-xl text-center tracking-widest text-lg"
                onKeyDown={e => e.key === 'Enter' && !pinSaving && handleSavePin()}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setPinModal(false); setPin(''); setConfirmPin(''); }}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-xl" onClick={handleSavePin} disabled={pinSaving || pin.length !== 4 || confirmPin.length !== 4}>
                {pinSaving ? 'Saving…' : 'Save PIN'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password modal */}
      <Dialog open={pwModal} onOpenChange={open => { if (!open) { setPwModal(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); } }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-muted-foreground" />
              Change Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Current Password</label>
              <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="rounded-xl" placeholder="Enter current password" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">New Password</label>
              <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="rounded-xl" placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                className="rounded-xl"
                placeholder="Repeat new password"
                onKeyDown={e => e.key === 'Enter' && !pwSaving && handleChangePassword()}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setPwModal(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-xl" onClick={handleChangePassword} disabled={pwSaving}>
                {pwSaving ? 'Updating…' : 'Update Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account modal */}
      <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
    </div>
  );
}
