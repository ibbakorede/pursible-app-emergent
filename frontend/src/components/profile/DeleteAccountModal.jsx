import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function DeleteAccountModal({ isOpen, onClose }) {
  const [step, setStep] = useState('confirm'); // confirm -> password -> processing
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (step === 'confirm') {
      setStep('password');
      return;
    }

    if (step === 'password') {
      if (!password.trim()) {
        toast.error('Please enter your password to confirm');
        return;
      }

      setIsLoading(true);
      try {
        // Call backend function to delete account and associated data
        const response = await base44.functions.invoke('deleteUserAccount', {
          password: password,
        });

        if (response.data?.success) {
          toast.success('Account deleted successfully');
          // Log out and redirect to home
          await base44.auth.logout();
          window.location.href = '/';
        } else {
          toast.error(response.data?.error || 'Failed to delete account');
        }
      } catch (error) {
        toast.error(error.message || 'Failed to delete account');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setStep('confirm');
      setPassword('');
      // Return focus to the trigger button after dialog closes
      const triggerButton = document.querySelector('[role="button"][aria-label*="Delete"]');
      if (triggerButton) {
        setTimeout(() => triggerButton.focus(), 0);
      }
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        {step === 'confirm' && (
          <>
            <AlertDialogDescription className="text-base space-y-3">
              <p className="font-semibold text-foreground">This action cannot be undone.</p>
              <p>Deleting your account will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Permanently remove all your data</li>
                <li>Cancel any pending transactions</li>
                <li>Close all connected wallets</li>
              </ul>
            </AlertDialogDescription>
            <div className="flex gap-3 mt-6">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Continue
              </AlertDialogAction>
            </div>
          </>
        )}

        {step === 'password' && (
          <>
            <AlertDialogDescription>
              Enter your password to confirm account deletion.
            </AlertDialogDescription>
            <div className="mt-4">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleDelete()}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                disabled={isLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Deleting...</> : 'Delete My Account'}
              </AlertDialogAction>
            </div>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}