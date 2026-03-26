import { Check, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * KYCProgressTracker - Shows verification status and highlights missing/failed steps
 * - Visual progress through all KYC steps
 * - Displays rejection reasons for failed submissions
 * - Highlights which documents need to be re-uploaded
 */
export default function KYCProgressTracker({ kycRecord, rejectionDetails }) {
  const steps = [
    { id: 'personal', label: 'Personal Details', icon: 'user' },
    { id: 'id_document', label: 'Identity Document', icon: 'id' },
    { id: 'selfie', label: 'Selfie Verification', icon: 'camera' },
    { id: 'approval', label: 'Final Approval', icon: 'check' },
  ];

  const getStepStatus = (stepId) => {
    if (stepId === 'approval') {
      if (kycRecord?.status === 'approved') return 'completed';
      if (kycRecord?.status === 'in_review' || kycRecord?.status === 'pending') return 'pending';
      if (kycRecord?.status === 'rejected') return 'failed';
      return 'pending';
    }

    if (kycRecord?.status === 'rejected') {
      // For rejected status, check which fields have rejection feedback
      if (rejectionDetails?.includes(stepId)) return 'failed';
      if (stepId === 'personal' || (stepId === 'id_document' && kycRecord?.id_document_url) || (stepId === 'selfie' && kycRecord?.selfie_url)) {
        return 'completed';
      }
      return 'pending';
    }

    if (kycRecord?.status === 'in_review' || kycRecord?.status === 'pending') {
      if (stepId === 'personal') return 'completed';
      if (stepId === 'id_document' && kycRecord?.id_document_url) return 'completed';
      if (stepId === 'selfie' && kycRecord?.selfie_url) return 'completed';
      return 'pending';
    }

    if (kycRecord?.status === 'approved') return 'completed';

    // Initial state: not_started
    if (stepId === 'personal') return 'current';
    return 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-600';
      case 'failed':
        return 'bg-red-100 text-red-600';
      case 'pending':
        return 'bg-muted text-muted-foreground';
      case 'current':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
        return <div className="w-2 h-2 rounded-full bg-current" />;
      case 'current':
        return <Clock className="w-4 h-4 animate-pulse" />;
      default:
        return null;
    }
  };

  const hasRejections = kycRecord?.status === 'rejected';

  return (
    <div className="space-y-6">
      {/* Progress indicator visual */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.id);
          const isRejected = hasRejections && rejectionDetails?.includes(step.id);
          
          return (
            <div key={step.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                  getStatusColor(status)
                )}>
                  {getStatusIcon(status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    status === 'completed' && 'text-emerald-600',
                    status === 'failed' && 'text-red-600',
                    status === 'current' && 'text-primary',
                    status === 'pending' && 'text-muted-foreground'
                  )}>
                    {step.label}
                  </p>
                  {isRejected && (
                    <p className="text-xs text-red-600 mt-1">Requires re-submission</p>
                  )}
                </div>
                {status === 'completed' && !isRejected && (
                  <span className="text-xs font-semibold text-emerald-600">Done</span>
                )}
                {status === 'failed' && (
                  <span className="text-xs font-semibold text-red-600">Failed</span>
                )}
                {status === 'pending' && (
                  <span className="text-xs font-semibold text-muted-foreground">Waiting</span>
                )}
              </div>

              {/* Connecting line between steps (except for the last one) */}
              {idx < steps.length - 1 && (
                <div className="ml-4 h-2 border-l-2 border-muted" />
              )}
            </div>
          );
        })}
      </div>

      {/* Rejection feedback banner */}
      {hasRejections && kycRecord?.rejection_reason && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Verification Failed</p>
              <p className="text-sm text-red-700 mt-1">{kycRecord.rejection_reason}</p>
            </div>
          </div>
          {rejectionDetails && rejectionDetails.length > 0 && (
            <div className="mt-3 pl-7">
              <p className="text-xs font-medium text-red-800 mb-2">Please re-upload:</p>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                {rejectionDetails.includes('personal') && <li>Personal details</li>}
                {rejectionDetails.includes('id_document') && <li>Identity document</li>}
                {rejectionDetails.includes('selfie') && <li>Selfie verification</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Status messages */}
      {kycRecord?.status === 'approved' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Fully Verified</p>
            <p className="text-sm text-emerald-700 mt-1">Your identity has been verified. You have full access to all features.</p>
          </div>
        </div>
      )}

      {(kycRecord?.status === 'pending' || kycRecord?.status === 'in_review') && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Under Review</p>
            <p className="text-sm text-amber-700 mt-1">Your documents are being reviewed. This typically takes 1–24 hours.</p>
          </div>
        </div>
      )}
    </div>
  );
}