import { Input } from '@/components/ui/input';
import { User, Calendar, Phone, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NATIONALITIES } from '@/lib/countryConstants';

export default function ProfileFormFields({
  form,
  errors,
  touched,
  maxDateStr,
  onNameChange,
  onPhoneChange,
  onFieldChange,
  onBlur,
  onNationalityChange,
}) {
  return (
    <>
      {/* Full Legal Name */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          Full Legal Name
          <span className="text-red-500 font-bold">*</span>
        </label>
        <Input
          value={form.full_name}
          onChange={onNameChange}
          onBlur={() => onBlur('full_name')}
          placeholder="Enter your full legal name (letters and hyphens only)"
          className={`rounded-xl ${touched.full_name && errors.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        <p className="text-xs text-muted-foreground mt-1">Only letters, spaces, and hyphens allowed</p>
        {touched.full_name && errors.full_name && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.full_name}
          </p>
        )}
      </div>

      {/* Date of Birth */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Date of Birth
          <span className="text-red-500 font-bold">*</span>
        </label>
        <Input
          type="date"
          value={form.date_of_birth}
          onChange={(e) => onFieldChange('date_of_birth', e.target.value)}
          onBlur={() => onBlur('date_of_birth')}
          max={maxDateStr}
          className={`rounded-xl ${touched.date_of_birth && errors.date_of_birth ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        {touched.date_of_birth && errors.date_of_birth && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.date_of_birth}
          </p>
        )}
      </div>

      {/* Nationality */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <span className="w-3.5 h-3.5" />
          Nationality
          <span className="text-red-500 font-bold">*</span>
        </label>
        <Select value={form.nationality} onValueChange={onNationalityChange}>
          <SelectTrigger
            className={`rounded-xl ${touched.nationality && errors.nationality ? 'border-red-500 focus:ring-red-500' : ''}`}
          >
            <SelectValue placeholder="Select your nationality" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {NATIONALITIES.map((nationality) => (
              <SelectItem key={nationality} value={nationality}>
                {nationality}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {touched.nationality && errors.nationality && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.nationality}
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" />
          Phone Number
        </label>
        <Input
          value={form.phone}
          onChange={onPhoneChange}
          onBlur={() => onBlur('phone')}
          placeholder="Enter your phone number (numbers only)"
          className={`rounded-xl ${touched.phone && errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        <p className="text-xs text-muted-foreground mt-1">Only numbers allowed</p>
        {touched.phone && errors.phone && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.phone}
          </p>
        )}
      </div>
    </>
  );
}
