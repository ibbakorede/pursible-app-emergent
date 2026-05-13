/**
 * KYCFlow - KYC Verification Flow
 * Refactored to use smaller, single-responsibility step components
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Import step components
import {
  KYCProgressTracker,
  KYCIntroStep,
  KYCPersonalStep,
  KYCDocumentStep,
  KYCSelfieStep,
  validatePersonalInfo,
  validateIdDocument,
  validateSelfie
} from '@/components/kyc';

const INITIAL_FORM = {
  full_name: '',
  date_of_birth: '',
  nationality: '',
  address: '',
  bvn: '',
  nin: '',
  id_type: '',
  id_number: '',
  id_document_url: '',
  selfie_url: ''
};

export default function KYCFlow() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  // Fetch existing KYC record
  const { data: kycRecord, isLoading: loadingKYC } = useQuery({
    queryKey: ['kyc', user?.email],
    queryFn: async () => {
      const records = await base44.entities.KYCRecord.filter({ user_email: user?.email });
      return records?.[0] || null;
    },
    enabled: !!user?.email,
  });

  // Handle form field changes
  const handleFormChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  // Validate current step
  const validateStep = useCallback((currentStep) => {
    let validation = { valid: true, errors: {} };

    switch (currentStep) {
      case 1:
        validation = validatePersonalInfo(form);
        break;
      case 2:
        validation = validateIdDocument(form);
        break;
      case 3:
        validation = validateSelfie(form);
        break;
      default:
        return true;
    }

    if (!validation.valid) {
      setErrors(validation.errors);
      return false;
    }
    return true;
  }, [form]);

  // Submit KYC mutation
  const submitKYC = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('submitKYC', form);
      if (!result.success) throw new Error(result.error || 'KYC submission failed');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
      toast.success('Verification submitted successfully!');
      navigate('/profile');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to submit verification');
    },
  });

  // Navigation handlers
  const handleBack = useCallback(() => {
    setStep(s => Math.max(0, s - 1));
    setErrors({});
  }, []);

  const handleContinue = useCallback(() => {
    if (!validateStep(step)) return;
    
    if (step < 3) {
      setStep(s => s + 1);
    } else {
      submitKYC.mutate();
    }
  }, [step, validateStep, submitKYC]);

  // Loading state
  if (isLoadingAuth || (loadingKYC && !!user?.email)) {
    return <LoadingSpinner />;
  }

  // Already approved
  if (kycRecord?.status === 'approved') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-sm mx-auto px-4 pt-6 pb-10 space-y-6">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Identity Verified</h1>
          </div>

          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-lg">You're all set!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your identity has been verified. You have full access to all features.
              </p>
            </div>
          </div>

          <Link to="/">
            <Button variant="outline" className="rounded-xl w-full">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // In review
  if (kycRecord?.status === 'in_review') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-sm mx-auto px-4 pt-6 pb-10 space-y-6">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Verification in Progress</h1>
          </div>

          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-lg">Under Review</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your verification is being processed. This usually takes 1-2 business days.
              </p>
            </div>
          </div>

          <KYCProgressTracker kycRecord={kycRecord} rejectionDetails={[]} />

          <Link to="/">
            <Button variant="outline" className="rounded-xl w-full">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Rejected
  if (kycRecord?.status === 'rejected') {
    const rejectionDetails = [];
    const reason = kycRecord.rejection_reason || '';
    if (reason.includes('personal') || reason.includes('details')) rejectionDetails.push('personal');
    if (reason.includes('document') || reason.includes('id')) rejectionDetails.push('id_document');
    if (reason.includes('selfie') || reason.includes('face')) rejectionDetails.push('selfie');

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-sm mx-auto px-4 pt-6 pb-10 space-y-6">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Verification Failed</h1>
          </div>

          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-lg">Verification Unsuccessful</p>
              <p className="text-sm text-muted-foreground mt-1">
                {kycRecord.rejection_reason || 'Please re-submit your documents.'}
              </p>
            </div>
          </div>

          <KYCProgressTracker kycRecord={kycRecord} rejectionDetails={rejectionDetails} />

          <Button 
            className="w-full rounded-xl h-12 text-base" 
            onClick={() => setStep(1)}
          >
            Re-submit Documents
          </Button>
        </div>
      </div>
    );
  }

  // Main KYC flow steps
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
        {step === 0 && (
          <KYCIntroStep onStart={() => setStep(1)} />
        )}

        {step === 1 && (
          <KYCPersonalStep
            form={form}
            errors={errors}
            onFormChange={handleFormChange}
            onBack={handleBack}
            onContinue={handleContinue}
            isSubmitting={false}
            currentStep={step}
          />
        )}

        {step === 2 && (
          <KYCDocumentStep
            form={form}
            errors={errors}
            onFormChange={handleFormChange}
            onBack={handleBack}
            onContinue={handleContinue}
            isSubmitting={false}
            currentStep={step}
          />
        )}

        {step === 3 && (
          <KYCSelfieStep
            form={form}
            errors={errors}
            onFormChange={handleFormChange}
            onBack={handleBack}
            onSubmit={handleContinue}
            isSubmitting={submitKYC.isPending}
            currentStep={step}
          />
        )}
      </div>
    </div>
  );
}
