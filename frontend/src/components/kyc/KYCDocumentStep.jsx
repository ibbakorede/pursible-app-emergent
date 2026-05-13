/**
 * KYCDocumentStep - ID document upload step for KYC flow
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import DocUpload from './DocUpload';
import { KYC_STEPS, ID_TYPES } from './kycConstants';

export default function KYCDocumentStep({
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
            Identity Document
          </p>
        </div>
        <div className="p-5 space-y-4">
          {/* ID Type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              ID Type
            </label>
            <Select 
              value={form.id_type || ''} 
              onValueChange={(v) => onFormChange('id_type', v)}
            >
              <SelectTrigger 
                className={`rounded-xl ${errors.id_type ? 'border-destructive' : ''}`}
                data-testid="kyc-id-type-select"
              >
                <SelectValue placeholder="Select ID type" />
              </SelectTrigger>
              <SelectContent>
                {ID_TYPES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.id_type && (
              <p className="text-xs text-destructive mt-1">{errors.id_type}</p>
            )}
          </div>

          {/* ID Number */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              ID Number
            </label>
            <Input
              value={form.id_number || ''}
              onChange={(e) => onFormChange('id_number', e.target.value)}
              className={`rounded-xl ${errors.id_number ? 'border-destructive' : ''}`}
              data-testid="kyc-id-number-input"
            />
            {errors.id_number && (
              <p className="text-xs text-destructive mt-1">{errors.id_number}</p>
            )}
          </div>

          {/* Document Upload */}
          <DocUpload
            label="Upload ID Document"
            hint="Clear photo or scan of your government-issued ID"
            icon={FileText}
            value={form.id_document_url}
            onChange={(url) => onFormChange('id_document_url', url)}
            accept="image/*,.pdf"
          />
          {errors.id_document_url && (
            <p className="text-xs text-destructive mt-1">{errors.id_document_url}</p>
          )}
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
