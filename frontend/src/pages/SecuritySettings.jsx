/**
 * SecuritySettings - Security Settings Page
 * Refactored to use smaller, single-responsibility components
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Lock, Key, Eye, Trash2, ChevronRight, Shield
} from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import BiometricLockModal from '@/components/security/BiometricLockModal';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';
import { registerBiometric } from '@/lib/biometricAuth';

// Import refactored components
import {
  BiometricSection,
  TransactionPinModal,
  ChangePasswordModal
} from '@/components/security';

export default function SecuritySettings() {
  const { user, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();
  
  // Modal states
  const [bioModal, setBioModal] = useState({ open: false, key: null });
  const [pinModal, setPinModal] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch user settings
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['security-settings', user?.email],
    queryFn: async () => {
      const records = await base44.entities.UserSettings.filter({ user_email: user?.email });
      return records?.[0]?.settings || {};
    },
    enabled: !!user?.email,
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (newSettings) => {
      const existingRecords = await base44.entities.UserSettings.filter({ user_email: user.email });
      if (existingRecords?.length > 0) {
        await base44.entities.UserSettings.update(existingRecords[0].id, { settings: newSettings });
      } else {
        await base44.entities.UserSettings.create({ user_email: user.email, settings: newSettings });
      }
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
    },
  });

  // Handle biometric toggle
  const handleBiometricToggle = useCallback((key) => {
    setBioModal({ open: true, key });
  }, []);

  // Handle biometric enrollment success
  const handleBiometricSuccess = useCallback(async () => {
    try {
      if (bioModal.key === 'biometric_login_enabled') {
        await registerBiometric(user.email, user.full_name || user.email);
      }
      await updateSettings.mutateAsync({
        ...settings,
        [bioModal.key]: true,
      });
      toast.success(bioModal.key === 'biometric_login_enabled' ? 'Biometric login enabled!' : 'Biometric transfers enabled!');
    } catch (error) {
      toast.error('Failed to enable biometric feature');
    }
    setBioModal({ open: false, key: null });
  }, [bioModal.key, user, settings, updateSettings]);

  // Handle save PIN
  const handleSavePin = useCallback(async (pin) => {
    await updateSettings.mutateAsync({
      ...settings,
      transaction_pin: pin,
    });
  }, [settings, updateSettings]);

  // Handle change password
  const handleChangePassword = useCallback(async (currentPw, newPw) => {
    await base44.auth.changePassword(currentPw, newPw);
  }, []);

  const hasPin = !!settings?.transaction_pin;

  // Loading state
  if (isLoadingAuth || (loadingSettings && !!user?.email)) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Security</h1>
            <p className="text-xs text-muted-foreground">Manage your account security settings</p>
          </div>
        </div>

        {/* Biometric Section */}
        <BiometricSection
          settings={settings}
          onToggle={handleBiometricToggle}
          disabled={updateSettings.isPending}
        />

        {/* Account Security */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 px-1">
            Account Security
          </p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {/* Transaction PIN */}
            <button
              onClick={() => setPinModal(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
              data-testid="transaction-pin-button"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                hasPin ? 'bg-emerald-50' : 'bg-muted'
              }`}>
                <Lock className={`w-5 h-5 ${hasPin ? 'text-emerald-600' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Transaction PIN</p>
                <p className="text-xs text-muted-foreground">
                  {hasPin ? 'PIN is set' : '4-digit PIN for transaction approval'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Change Password */}
            <button
              onClick={() => setPwModal(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
              data-testid="change-password-button"
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
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground mr-1">
                Soon
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <p className="text-xs font-semibold text-destructive uppercase tracking-wide mb-2.5 px-1">
            Danger Zone
          </p>
          <div className="bg-card border border-destructive/30 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-destructive/5 border-b border-destructive/20">
              <p className="text-xs text-destructive">
                These actions are permanent and cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-destructive/5 transition-colors text-left"
              data-testid="delete-account-button"
            >
              <div className="w-11 h-11 rounded-2xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">Delete Account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently remove your account and all data
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-destructive/60" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BiometricLockModal
        open={bioModal.open}
        operationName={bioModal.key === 'biometric_login_enabled' ? 'enable biometric login' : 'enable biometric transfers'}
        onClose={() => setBioModal({ open: false, key: null })}
        onSuccess={handleBiometricSuccess}
      />

      <TransactionPinModal
        open={pinModal}
        onClose={() => setPinModal(false)}
        hasPin={hasPin}
        onSave={handleSavePin}
      />

      <ChangePasswordModal
        open={pwModal}
        onClose={() => setPwModal(false)}
        onSave={handleChangePassword}
      />

      <DeleteAccountModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
      />
    </div>
  );
}
