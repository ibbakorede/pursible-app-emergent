/**
 * ChangePasswordModal - Modal for changing account password
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key } from 'lucide-react';
import { validatePassword } from './securityConstants';
import { toast } from 'sonner';

export default function ChangePasswordModal({
  open,
  onClose,
  onSave
}) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    onClose();
  };

  const handleSave = async () => {
    const validation = validatePassword(currentPw, newPw, confirmPw);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSaving(true);
    try {
      await onSave(currentPw, newPw);
      toast.success('Password updated successfully!');
      handleClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-muted-foreground" />
            Change Password
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Current Password
            </label>
            <Input 
              type="password" 
              value={currentPw} 
              onChange={(e) => setCurrentPw(e.target.value)} 
              className="rounded-xl" 
              placeholder="Enter current password"
              data-testid="current-password-input"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              New Password
            </label>
            <Input 
              type="password" 
              value={newPw} 
              onChange={(e) => setNewPw(e.target.value)} 
              className="rounded-xl" 
              placeholder="Min. 8 characters"
              data-testid="new-password-input"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="rounded-xl"
              placeholder="Repeat new password"
              onKeyDown={(e) => e.key === 'Enter' && !saving && handleSave()}
              data-testid="confirm-password-input"
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
              disabled={saving}
              data-testid="update-password-button"
            >
              {saving ? 'Updating…' : 'Update Password'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
