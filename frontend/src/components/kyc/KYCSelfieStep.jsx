/**
 * KYCSelfieStep - Selfie verification step for KYC flow
 */
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import DocUpload from './DocUpload';
import { KYC_STEPS } from './kycConstants';

export default function KYCSelfieStep({
  form,
  errors,
  onFormChange,
  onBack,
  onSubmit,
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
            Selfie Verification
          </p>
        </div>
        <div className="p-5 space-y-4">
          {/* Instructions */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5">
            <Camera className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Take a clear selfie holding your ID document next to your face in good lighting.
            </p>
          </div>

          {/* Selfie Upload */}
          <DocUpload
            hint="Selfie with your ID visible"
            icon={Camera}
            value={form.selfie_url}
            onChange={(url) => {
              // Use placeholder in test mode when no file hosting configured
              onFormChange('selfie_url', url || 'test-mode-selfie');
            }}
            accept="image/*"
            capture="user"
          />
          {errors.selfie_url && (
            <p className="text-xs text-destructive mt-1">{errors.selfie_url}</p>
          )}
        </div>
      </div>

      <Button
        className="w-full rounded-xl h-12 text-base"
        disabled={isSubmitting}
        onClick={onSubmit}
        data-testid="kyc-submit-button"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Submitting...
          </>
        ) : (
          'Submit Verification'
        )}
      </Button>
    </div>
  );
}
