/**
 * TransactionPinModal - Modal for setting/changing transaction PIN
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
import { validatePin } from './securityConstants';
import { toast } from 'sonner';

export default function TransactionPinModal({
  open,
  onClose,
  hasPin,
  onSave
}) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setPin('');
    setConfirmPin('');
    onClose();
  };

  const handleSave = async () => {
    const validation = validatePin(pin, confirmPin);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSaving(true);
    try {
      await onSave(pin);
      toast.success(hasPin ? 'PIN updated successfully!' : 'Transaction PIN set!');
      handleClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save PIN');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" />
            {hasPin ? 'Change Transaction PIN' : 'Set Transaction PIN'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              New PIN
            </label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-digit PIN"
              className="rounded-xl text-center tracking-widest text-lg"
              data-testid="pin-input"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Confirm PIN
            </label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Repeat PIN"
              className="rounded-xl text-center tracking-widest text-lg"
              onKeyDown={(e) => e.key === 'Enter' && !saving && handleSave()}
              data-testid="confirm-pin-input"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl" 
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl" 
              onClick={handleSave} 
              disabled={saving || pin.length !== 4 || confirmPin.length !== 4}
              data-testid="save-pin-button"
            >
              {saving ? 'Saving…' : 'Save PIN'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
