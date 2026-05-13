import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Fingerprint, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  registerBiometric,
  getBiometricTypeName,
} from '@/lib/biometricAuth';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  hasSeenNotificationPrompt,
  markNotificationPromptSeen,
} from '@/lib/pushNotifications';

// Use sessionStorage for prompt tracking (non-persistent, session-scoped)
const BIOMETRIC_PROMPT_KEY = 'pursible_biometric_prompt_seen';

/**
 * Secure prompt storage utilities
 * Uses sessionStorage for session-scoped tracking
 */
const promptStorage = {
  hasSeen: (key) => sessionStorage.getItem(key) === 'true',
  markSeen: (key) => sessionStorage.setItem(key, 'true'),
};

export default function PostLoginPrompts() {
  const { user, isAuthenticated } = useAuth();
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkNotificationPrompt = useCallback(() => {
    const notifSupported = isNotificationSupported();
    const notifPermission = getNotificationPermission();
    const notifPromptSeen = hasSeenNotificationPrompt();
    if (notifSupported && notifPermission === 'default' && !notifPromptSeen) {
      setShowNotificationPrompt(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const checkPrompts = async () => {
      // Check biometric prompt
      const biometricAvailable = await isBiometricAvailable();
      const biometricEnabled = isBiometricEnabled();
      const biometricPromptSeen = promptStorage.hasSeen(BIOMETRIC_PROMPT_KEY);

      if (biometricAvailable && !biometricEnabled && !biometricPromptSeen) {
        // Delay showing prompt for better UX
        setTimeout(() => setShowBiometricPrompt(true), 2000);
        return; // Show one prompt at a time
      }

      // Check notification prompt
      setTimeout(() => checkNotificationPrompt(), 2000);
    };

    checkPrompts();
  }, [isAuthenticated, user, checkNotificationPrompt]);

  const handleEnableBiometric = async () => {
    setLoading(true);
    try {
      await registerBiometric(user.email, user.full_name || user.email);
      toast.success('Biometric login enabled!');
      setShowBiometricPrompt(false);
      promptStorage.markSeen(BIOMETRIC_PROMPT_KEY);
      
      // Show notification prompt next
      setTimeout(() => checkNotificationPrompt(), 1000);
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      toast.error('Failed to enable biometric login');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipBiometric = () => {
    setShowBiometricPrompt(false);
    promptStorage.markSeen(BIOMETRIC_PROMPT_KEY);
    
    // Show notification prompt next
    setTimeout(() => checkNotificationPrompt(), 500);
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const result = await requestNotificationPermission();
      if (result.granted) {
        toast.success('Notifications enabled!');
      }
      setShowNotificationPrompt(false);
      markNotificationPromptSeen();
    } catch {
      toast.error('Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipNotifications = () => {
    setShowNotificationPrompt(false);
    markNotificationPromptSeen();
  };

  const biometricName = getBiometricTypeName();

  return (
    <>
      {/* Biometric Prompt */}
      <Dialog open={showBiometricPrompt} onOpenChange={setShowBiometricPrompt}>
        <DialogContent className="rounded-3xl max-w-sm p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Fingerprint className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Quick & Secure Login</h2>
            <p className="text-sm text-muted-foreground">
              Enable {biometricName} to log in faster and more securely next time
            </p>
          </div>
          
          <div className="p-6 space-y-3">
            <div className="flex items-start gap-3 text-left">
              <Shield className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Bank-level security</p>
                <p className="text-xs text-muted-foreground">Your biometric data never leaves your device</p>
              </div>
            </div>
            
            <Button
              onClick={handleEnableBiometric}
              disabled={loading}
              className="w-full rounded-xl h-12 text-base font-semibold"
            >
              {loading ? 'Setting up...' : `Enable ${biometricName}`}
            </Button>
            
            <button
              onClick={handleSkipBiometric}
              className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
            >
              Maybe later
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Prompt */}
      <Dialog open={showNotificationPrompt} onOpenChange={setShowNotificationPrompt}>
        <DialogContent className="rounded-3xl max-w-sm p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6 text-center">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Stay Updated</h2>
            <p className="text-sm text-muted-foreground">
              Get instant alerts for transactions, rate changes, and security updates
            </p>
          </div>
          
          <div className="p-6 space-y-3">
            <Button
              onClick={handleEnableNotifications}
              disabled={loading}
              className="w-full rounded-xl h-12 text-base font-semibold bg-blue-500 hover:bg-blue-600"
            >
              {loading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
            
            <button
              onClick={handleSkipNotifications}
              className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
            >
              Not now
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
