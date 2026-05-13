/**
 * KYCPersonalStep - Personal information step for KYC flow
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { KYC_STEPS } from './kycConstants';

const PERSONAL_FIELDS = [
  { key: 'full_name', label: 'Full Legal Name', placeholder: 'As on government ID', type: 'text', required: true },
  { key: 'date_of_birth', label: 'Date of Birth', placeholder: '', type: 'date', required: false },
  { key: 'nationality', label: 'Nationality', placeholder: 'e.g. Nigerian', type: 'text', required: false },
  { key: 'address', label: 'Residential Address', placeholder: 'Full address', type: 'text', required: false },
];

export default function KYCPersonalStep({
  form,
  errors,
  onFormChange,
  onBack,
  onContinue,
  isSubmitting,
  currentStep
}) {
  const progressSteps = KYC_STEPS.slice(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack} 
          className="p-2 rounded-xl bg-card border border-border hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{KYC_STEPS[currentStep]}</h1>
          <p className="text-xs text-muted-foreground">Step {currentStep + 1} of 4</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5">
        {progressSteps.map((stepName, i) => (
          <div 
            key={`progress-${stepName}`} 
            className={`flex-1 h-1.5 rounded-full transition-all ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} 
          />
        ))}
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 bg-muted/30 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Personal Information
          </p>
        </div>
        <div className="p-5 space-y-4">
          {PERSONAL_FIELDS.map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {label}
              </label>
              <Input
                type={type}
                value={form[key] || ''}
                onChange={(e) => onFormChange(key, e.target.value)}
                className={`rounded-xl ${errors[key] ? 'border-destructive' : ''}`}
                placeholder={placeholder}
                style={type === 'date' ? { colorScheme: 'light', backgroundColor: 'white', color: '#1a1a0e' } : undefined}
                data-testid={`kyc-${key}-input`}
              />
              {errors[key] && (
                <p className="text-xs text-destructive mt-1">{errors[key]}</p>
              )}
            </div>
          ))}

          {/* BVN */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              BVN <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <Input
              value={form.bvn || ''}
              onChange={(e) => onFormChange('bvn', e.target.value)}
              className={`rounded-xl ${errors.bvn ? 'border-destructive' : ''}`}
              placeholder="11-digit BVN"
              maxLength={11}
              data-testid="kyc-bvn-input"
            />
            {errors.bvn && <p className="text-xs text-destructive mt-1">{errors.bvn}</p>}
          </div>

          {/* NIN */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              NIN <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <Input
              value={form.nin || ''}
              onChange={(e) => onFormChange('nin', e.target.value)}
              className={`rounded-xl ${errors.nin ? 'border-destructive' : ''}`}
              placeholder="11-digit NIN"
              maxLength={11}
              data-testid="kyc-nin-input"
            />
            {errors.nin && <p className="text-xs text-destructive mt-1">{errors.nin}</p>}
          </div>
        </div>
      </div>

      <Button
        className="w-full rounded-xl h-12 text-base"
        disabled={isSubmitting}
        onClick={onContinue}
        data-testid="kyc-continue-button"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </div>
  );
}
