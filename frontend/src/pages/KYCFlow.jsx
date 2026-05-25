/**
 * KYCFlow - KYC Verification Flow
 * Refactored to use smaller, single-responsibility step components
 * Enhanced with unlock features, verification ID, progress tracker, and rejection breakdown
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, CheckCircle, AlertTriangle, XCircle, Check, X,
  Copy, Loader2, Info, Bell, Mail, Lightbulb, Sun, Camera, Hand
} from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Import step components
import {
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

// Generate short verification ID
const generateShortId = (id) => {
  if (!id) return 'KYC-XXXX-XXXX';
  const hash = id.replace(/-/g, '').toUpperCase();
  return `KYC-${hash.slice(0, 4)}-${hash.slice(4, 8)}`;
};

// Unlocked Features Component
function UnlockedFeatures() {
  const features = [
    { text: 'NGN bank withdrawals' },
    { text: 'Virtual USD account' },
    { text: 'Higher daily limits — Up to $50,000/day' },
  ];

  return (
    <div 
      className="rounded-[18px] p-4 space-y-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.1)',
      }}
    >
      <p className="text-sm font-semibold">Now unlocked</p>
      <div className="space-y-2.5">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(122,140,84,0.2)' }}
            >
              <Check className="w-3 h-3" style={{ color: '#97C459' }} />
            </div>
            <span className="text-sm text-muted-foreground">{feature.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Verification ID Card Component
function VerificationIdCard({ kycId }) {
  const [copied, setCopied] = useState(false);
  const shortId = generateShortId(kycId);

  const copyId = () => {
    navigator.clipboard.writeText(shortId);
    setCopied(true);
    toast.success('Verification ID copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="rounded-[18px] p-4 flex items-center justify-between"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.1)',
      }}
    >
      <div>
        <p className="text-xs text-muted-foreground mb-1">Verification ID</p>
        <p 
          className="text-sm font-semibold"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {shortId}
        </p>
      </div>
      <button
        onClick={copyId}
        className="p-2 rounded-lg transition-all"
        style={{
          background: copied ? 'rgba(122,140,84,0.18)' : 'rgba(255,255,255,0.05)',
          color: copied ? '#97C459' : 'rgba(255,255,255,0.6)',
        }}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

// In Review Progress Tracker
function InReviewProgressTracker() {
  const steps = [
    { label: 'Personal information', status: 'submitted' },
    { label: 'ID document', status: 'submitted' },
    { label: 'Selfie', status: 'submitted' },
    { label: 'Manual review', status: 'in_progress' },
  ];

  return (
    <div 
      className="rounded-[18px] p-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3">
            {/* Icon */}
            {step.status === 'submitted' ? (
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(122,140,84,0.2)' }}
              >
                <Check className="w-3.5 h-3.5" style={{ color: '#97C459' }} />
              </div>
            ) : (
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,159,39,0.15)' }}
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#FAC775' }} />
              </div>
            )}
            {/* Label */}
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium">{step.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.status === 'submitted' ? 'Submitted' : 'In progress'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Info Banner Component
function InfoBanner({ icon: Icon, title, subtitle, color = 'blue' }) {
  const colors = {
    blue: { bg: 'rgba(133,183,235,0.08)', border: 'rgba(133,183,235,0.25)', text: '#85B7EB' },
    amber: { bg: 'rgba(239,159,39,0.08)', border: 'rgba(239,159,39,0.25)', text: '#FAC775' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div 
      className="rounded-xl p-3.5 flex items-start gap-3"
      style={{ background: c.bg, border: `0.5px solid ${c.border}` }}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: c.text }} />
      <div>
        <p className="text-sm font-medium" style={{ color: c.text }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{subtitle}</p>
      </div>
    </div>
  );
}

// Rejection Breakdown Component
function RejectionBreakdown({ kycRecord, rejectionDetails, onResubmit }) {
  const steps = [
    { id: 'personal', label: 'Personal information' },
    { id: 'id_document', label: 'ID document' },
    { id: 'selfie', label: 'Selfie verification' },
  ];

  const tips = [
    { icon: Sun, text: 'Use natural light' },
    { icon: Camera, text: 'No glare' },
    { icon: Hand, text: 'Hold steady' },
  ];

  return (
    <div className="space-y-4">
      {/* Pass/Fail Breakdown Card */}
      <div 
        className="rounded-[18px] overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.1)',
        }}
      >
        {steps.map((step, idx) => {
          const isFailed = rejectionDetails?.includes(step.id);
          return (
            <div key={step.id}>
              <div className={`p-4 ${isFailed ? 'pb-2' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{step.label}</span>
                  {isFailed ? (
                    <div className="flex items-center gap-1.5">
                      <X className="w-4 h-4" style={{ color: '#F09595' }} />
                      <span className="text-xs font-semibold" style={{ color: '#F09595' }}>Failed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Check className="w-4 h-4" style={{ color: '#97C459' }} />
                      <span className="text-xs font-semibold" style={{ color: '#97C459' }}>Passed</span>
                    </div>
                  )}
                </div>
                
                {/* Expanded failure details */}
                {isFailed && (
                  <div className="mt-3 space-y-3">
                    {/* Rejection reason */}
                    <div 
                      className="p-3 rounded-xl text-sm"
                      style={{ 
                        background: 'rgba(240,149,149,0.08)',
                        border: '0.5px solid rgba(240,149,149,0.2)',
                        color: 'rgba(255,255,255,0.8)',
                      }}
                    >
                      {kycRecord?.rejection_reason || 'Document verification failed. Please resubmit.'}
                    </div>
                    
                    {/* Tips */}
                    <div className="flex flex-wrap gap-2">
                      {tips.map((tip, tipIdx) => (
                        <div 
                          key={tipIdx}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                          style={{ 
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.7)',
                          }}
                        >
                          <tip.icon className="w-3 h-3" />
                          {tip.text}
                        </div>
                      ))}
                    </div>
                    
                    {/* Inline guidance */}
                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FAC775' }} />
                      Ensure your document is clearly visible with all corners showing. Avoid shadows and reflections.
                    </p>
                  </div>
                )}
              </div>
              {idx < steps.length - 1 && <div className="border-t border-border/50" />}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <Button 
          className="w-full rounded-xl h-12 text-base text-white"
          style={{ background: '#5C6B3E' }}
          onClick={onResubmit}
        >
          Re-submit Documents
        </Button>
        <Button 
          variant="outline"
          className="w-full rounded-xl h-11"
          onClick={() => window.open('mailto:support@pursible.com', '_blank')}
        >
          Contact support
        </Button>
      </div>
    </div>
  );
}

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
        <div className="max-w-sm mx-auto px-4 pt-6 pb-10 space-y-5">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Identity Verified</h1>
          </div>

          <div className="text-center py-6 space-y-3">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(122,140,84,0.15)' }}>
              <CheckCircle className="w-10 h-10" style={{ color: '#97C459' }} />
            </div>
            <div>
              <p className="font-semibold text-lg">You're all set!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your identity has been verified. You have full access to all features.
              </p>
            </div>
          </div>

          {/* Unlocked features list */}
          <UnlockedFeatures />

          {/* Verification ID card */}
          <VerificationIdCard kycId={kycRecord?.id} />

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
        <div className="max-w-sm mx-auto px-4 pt-6 pb-10 space-y-5">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Verification in Progress</h1>
          </div>

          <div className="text-center py-6 space-y-3">
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

          {/* 4-step vertical progress tracker */}
          <InReviewProgressTracker />

          {/* Info banner */}
          <InfoBanner 
            icon={Bell}
            title="We'll notify you when done"
            subtitle="Email and push notification — no need to check back"
            color="blue"
          />

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
    
    // If no specific details detected, default to document issue
    if (rejectionDetails.length === 0) rejectionDetails.push('id_document');

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-sm mx-auto px-4 pt-6 pb-10 space-y-5">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Verification Failed</h1>
          </div>

          <div className="text-center py-6 space-y-3">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-lg">Verification Unsuccessful</p>
              <p className="text-sm text-muted-foreground mt-1">
                Some documents couldn't be verified. Please review and resubmit.
              </p>
            </div>
          </div>

          {/* Pass/Fail Breakdown */}
          <RejectionBreakdown 
            kycRecord={kycRecord}
            rejectionDetails={rejectionDetails}
            onResubmit={() => setStep(1)}
          />
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
