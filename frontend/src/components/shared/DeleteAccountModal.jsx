/**
 * DeleteAccountModal - Confirmation modal for account deletion
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export default function DeleteAccountModal({ isOpen, onClose, onConfirm, isDeleting }) {
  const [confirmText, setConfirmText] = useState('');
  
  if (!isOpen) return null;
  
  const canDelete = confirmText.toLowerCase() === 'delete';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Delete Account</h2>
              <p className="text-sm text-muted-foreground">This action cannot be undone</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          <p className="font-semibold mb-1">Warning</p>
          <p>Deleting your account will permanently remove all your data, including wallets, transaction history, and KYC records.</p>
        </div>
        
        {/* Confirm input */}
        <div>
          <label className="text-sm font-medium block mb-2">
            Type "delete" to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!canDelete || isDeleting}
            className="flex-1"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
