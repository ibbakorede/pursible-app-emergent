import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Fingerprint, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { toast } from 'sonner';

export default function BiometricLockModal({ 
  open = false, 
  onClose = () => {}, 
  onSuccess = () => {},
  operationName = 'Complete this operation'
}) {
  const { authenticate, requestBiometricChallenge, isAuthenticating } = useBiometricAuth();
  const [status, setStatus] = useState('waiting'); // waiting | authenticating | success | error
  const [error, setError] = useState(null);

  const handleBiometricAuth = async () => {
    setStatus('authenticating');
    setError(null);

    try {
      const success = await requestBiometricChallenge();
      
      if (success) {
        setStatus('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setStatus('error');
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Biometric authentication failed');
      toast.error('Authentication failed');
    }
  };

  useEffect(() => {
    if (open) {
      setStatus('waiting');
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Verify Identity
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            {status === 'waiting' && (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Fingerprint className="w-12 h-12 text-primary" />
              </div>
            )}
            {status === 'authenticating' && (
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
                <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
            )}
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            {status === 'waiting' && (
              <>
                <p className="font-semibold text-foreground">Use your biometric</p>
                <p className="text-sm text-muted-foreground">
                  Verify with your fingerprint or face to {operationName.toLowerCase()}
                </p>
              </>
            )}
            {status === 'authenticating' && (
              <>
                <p className="font-semibold text-foreground">Verifying...</p>
                <p className="text-sm text-muted-foreground">
                  Keep your finger on the sensor or look at the camera
                </p>
              </>
            )}
            {status === 'success' && (
              <>
                <p className="font-semibold text-emerald-700">Authentication successful</p>
                <p className="text-sm text-emerald-600">
                  Proceeding with operation...
                </p>
              </>
            )}
            {status === 'error' && (
              <>
                <p className="font-semibold text-red-700">Authentication failed</p>
                <p className="text-sm text-red-600">{error}</p>
              </>
            )}
          </div>

          {/* Button */}
          {(status === 'waiting' || status === 'error') && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={handleBiometricAuth}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="border-t border-border pt-4 text-xs text-muted-foreground text-center">
          Your biometric data is processed securely and never stored on our servers.
        </div>
      </DialogContent>
    </Dialog>
  );
}