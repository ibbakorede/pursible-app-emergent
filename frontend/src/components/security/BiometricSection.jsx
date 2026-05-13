/**
 * BiometricSection - Biometric authentication settings
 */
import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Fingerprint, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  disableBiometric,
  getBiometricTypeName
} from '@/lib/biometricAuth';
import { toast } from 'sonner';

export default function BiometricSection({
  settings,
  onToggle,
  disabled
}) {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const biometricTypeName = getBiometricTypeName();

  useEffect(() => {
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      const enabled = isBiometricEnabled();
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
    };
    checkBiometric();
  }, [settings]);

  const handleBiometricLoginToggle = async () => {
    if (biometricEnabled) {
      disableBiometric();
      setBiometricEnabled(false);
      toast.success('Biometric login disabled');
    } else {
      onToggle('biometric_login_enabled');
    }
  };

  const handleBiometricTransfersToggle = () => {
    onToggle('biometric_transfers');
  };

  if (!biometricAvailable) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <Fingerprint className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Biometric Authentication</p>
            <p className="text-xs text-muted-foreground mt-1">
              Biometric authentication is not available on this device.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
      <div className="px-4 py-3 bg-muted/30">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Biometric Security
        </p>
      </div>

      {/* Biometric Login */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Fingerprint className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{biometricTypeName} Login</p>
          <p className="text-xs text-muted-foreground">
            Use {biometricTypeName.toLowerCase()} to log in quickly
          </p>
        </div>
        <div className="flex items-center gap-2">
          {biometricEnabled && (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          )}
          <Switch
            checked={biometricEnabled}
            onCheckedChange={handleBiometricLoginToggle}
            disabled={disabled}
            data-testid="biometric-login-toggle"
          />
        </div>
      </div>

      {/* Biometric Transfers */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Biometric Transfers</p>
          <p className="text-xs text-muted-foreground">
            Require {biometricTypeName.toLowerCase()} to confirm transfers
          </p>
        </div>
        <Switch
          checked={settings?.biometric_transfers || false}
          onCheckedChange={handleBiometricTransfersToggle}
          disabled={disabled || !biometricEnabled}
          data-testid="biometric-transfers-toggle"
        />
      </div>

      {/* Warning if biometric not enabled */}
      {!biometricEnabled && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50/50">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Enable biometric login to unlock additional security features.
          </p>
        </div>
      )}
    </div>
  );
}
