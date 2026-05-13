import { Input } from '@/components/ui/input';
import { Mail, Shield, MapPin, AlertCircle } from 'lucide-react';

export default function ProfileReadOnlyFields({ user, form, errors, touched, onAddressChange, onBlur }) {
  return (
    <>
      {/* Address */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          Address
          <span className="text-red-500 font-bold">*</span>
        </label>
        <textarea
          value={form.address}
          onChange={onAddressChange}
          onBlur={() => onBlur('address')}
          placeholder="Enter your full residential address"
          rows={3}
          className={`w-full px-3 py-2 text-sm rounded-xl border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring ${touched.address && errors.address ? 'border-red-500 focus:ring-red-500' : 'border-input'}`}
        />
        {touched.address && errors.address && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.address}
          </p>
        )}
      </div>

      {/* Email (read-only) */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" /> Email Address
        </label>
        <Input value={user?.email || ''} disabled className="rounded-xl opacity-60 cursor-not-allowed" />
        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
      </div>

      {/* Account Role (read-only) */}
      {user?.role && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Account Role
          </label>
          <Input value={user?.role || ''} disabled className="rounded-xl opacity-60 cursor-not-allowed capitalize" />
        </div>
      )}
    </>
  );
}
