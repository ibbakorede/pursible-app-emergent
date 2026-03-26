import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Shield, Camera, CheckCircle, Clock, XCircle, Loader2, FileText, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import DocUpload from '@/components/kyc/DocUpload';
import KYCProgressTracker from '@/components/kyc/KYCProgressTracker';
import { toast } from 'sonner';

const STEPS = ['Introduction', 'Personal Details', 'Identity Document', 'Selfie'];

export default function KYCFlow() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    full_name: '', date_of_birth: '', nationality: '', address: '',
    bvn: '', nin: '',
    id_type: '', id_number: '', id_document_url: '', selfie_url: '',
  });
  const [verificationState, setVerificationState] = useState('idle'); // idle | processing | approved | rejected
  const [rejectionReason, setRejectionReason] = useState('');
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setForm(f => ({ ...f, full_name: u?.full_name || '' })); });
  }, []);

  const { data: kyc = [], isLoading } = useQuery({
    queryKey: ['kyc'],
    queryFn: () => base44.entities.KYCRecord.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const kycRecord = kyc[0];

  useEffect(() => {
    if (verificationState !== 'approved') return;
    const timer = setTimeout(() => navigate('/'), 3000);
    return () => clearTimeout(timer);
  }, [verificationState, navigate]);

  const submitKYC = useMutation({
    mutationFn: async () => {
      setVerificationState('processing');
      return base44.functions.invoke('submitKYC', { kycData: form });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
      if (result?.approved) {
        setVerificationState('approved');
      } else {
        setRejectionReason(result?.rejectionReason || 'Verification was not successful. Please review your documents and try again.');
        setVerificationState('rejected');
      }
    },
    onError: (err) => {
      setRejectionReason(err?.message || 'Verification could not be completed. Please try again or contact support.');
      setVerificationState('rejected');
    },
  });

  function validateStep(s) {
    console.log('[KYCFlow] validateStep called — s:', s, '| form:', JSON.stringify(form));
    const e = {};
    if (s === 1) {
      // (a) full_name
      const name = form.full_name.trim();
      console.log('[KYCFlow] step1 full_name check — value:', JSON.stringify(name));
      if (!name) {
        e.full_name = 'Full name is required.';
        console.log('[KYCFlow] step1 full_name FAIL — empty');
      } else if (name.split(/\s+/).length < 2) {
        e.full_name = 'Please enter your full name (first and last name).';
        console.log('[KYCFlow] step1 full_name FAIL — less than 2 words:', name.split(/\s+/));
      } else if (/[0-9@#$%^&*()+={}|<>?]/.test(name)) {
        e.full_name = 'Name must not contain numbers or special characters.';
        console.log('[KYCFlow] step1 full_name FAIL — special chars in:', name);
      } else {
        console.log('[KYCFlow] step1 full_name PASS');
      }

      // (b) date_of_birth
      console.log('[KYCFlow] step1 date_of_birth check — value:', JSON.stringify(form.date_of_birth));
      if (!form.date_of_birth) {
        e.date_of_birth = 'Date of birth is required.';
        console.log('[KYCFlow] step1 date_of_birth FAIL — empty');
      } else {
        // Parse as local date to avoid UTC timezone offset issues
        const [y, m, d] = form.date_of_birth.split('-').map(Number);
        const dob = new Date(y, m - 1, d);
        console.log('[KYCFlow] step1 date_of_birth parsed — dob:', dob, '| isNaN:', isNaN(dob.getTime()));
        if (isNaN(dob.getTime())) {
          e.date_of_birth = 'Please enter a valid date.';
          console.log('[KYCFlow] step1 date_of_birth FAIL — invalid date');
        } else {
          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const hasHadBirthdayThisYear =
            today.getMonth() > dob.getMonth() ||
            (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
          if (!hasHadBirthdayThisYear) age -= 1;
          console.log('[KYCFlow] step1 date_of_birth age:', age);
          if (age < 18) {
            e.date_of_birth = 'You must be at least 18 years old.';
            console.log('[KYCFlow] step1 date_of_birth FAIL — under 18');
          } else {
            console.log('[KYCFlow] step1 date_of_birth PASS');
          }
        }
      }

      // (c) BVN — optional, only validate if non-empty
      console.log('[KYCFlow] step1 bvn check — value:', JSON.stringify(form.bvn), '| empty:', !form.bvn);
      if (form.bvn && !/^\d{11}$/.test(form.bvn.trim())) {
        e.bvn = 'BVN must be exactly 11 digits.';
        console.log('[KYCFlow] step1 bvn FAIL — not 11 digits');
      } else {
        console.log('[KYCFlow] step1 bvn PASS (empty or valid)');
      }

      // (d) NIN — optional, only validate if non-empty
      console.log('[KYCFlow] step1 nin check — value:', JSON.stringify(form.nin), '| empty:', !form.nin);
      if (form.nin && !/^\d{11}$/.test(form.nin.trim())) {
        e.nin = 'NIN must be exactly 11 digits.';
        console.log('[KYCFlow] step1 nin FAIL — not 11 digits');
      } else {
        console.log('[KYCFlow] step1 nin PASS (empty or valid)');
      }
    }
    if (s === 2) {
      if (!form.id_type) e.id_type = 'Please select an ID type.';
      if (!form.id_number.trim()) e.id_number = 'ID number is required.';
      // TODO: Restore document upload requirement when file hosting is configured
      // if (!form.id_document_url) e.id_document_url = 'Please upload your ID document.';
    }
    if (s === 3) {
      if (!form.selfie_url) e.selfie_url = 'Please upload a selfie photo.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  if (isLoading) return <LoadingSpinner />;

  // ── Dojah verification state screens ────────────────────────────────────────

  if (verificationState === 'processing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-sm mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Verifying your identity</h2>
            <p className="text-sm text-muted-foreground">We're checking your documents with our verification partner. This usually takes a few seconds.</p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationState === 'approved') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-sm mx-auto px-4 pt-6 pb-10 space-y-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Verification Complete</h1>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-green-700 mb-1">Identity Verified</h2>
              <p className="text-sm text-muted-foreground">Your identity has been verified successfully. Redirecting you to the home screen in a moment…</p>
            </div>
          </div>
          <Link to="/" className="block">
            <Button className="rounded-xl w-full h-12 text-base">Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (verificationState === 'rejected') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-sm mx-auto px-4 pt-6 pb-10 space-y-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Verification Unsuccessful</h1>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
            <p className="text-sm font-semibold text-center">We could not verify your identity</p>
            {rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-700 leading-relaxed">
                {rejectionReason.split(' | ').map((msg, i) => (
                  <p key={i} className={i > 0 ? 'mt-1.5' : ''}>{msg}</p>
                ))}
              </div>
            )}
          </div>
          <Button
            className="w-full rounded-xl h-12 text-base"
            onClick={() => { setVerificationState('idle'); setRejectionReason(''); setStep(1); }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Status screens
  if (kycRecord?.status === 'approved') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-sm mx-auto px-4 pt-6 pb-10 space-y-6">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Verification Complete</h1>
          </div>

          <KYCProgressTracker kycRecord={kycRecord} rejectionDetails={[]} />

          <Link to="/" className="block">
            <Button className="rounded-xl w-full h-12 text-base">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (kycRecord?.status === 'pending' || kycRecord?.status === 'in_review') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-sm mx-auto px-4 pt-6 pb-10 space-y-6">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Verification in Progress</h1>
          </div>

          <KYCProgressTracker kycRecord={kycRecord} rejectionDetails={[]} />

          <Link to="/" className="block">
            <Button variant="outline" className="rounded-xl w-full">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (kycRecord?.status === 'rejected') {
    // Parse rejection details from rejection_reason to determine which steps failed
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

          <KYCProgressTracker kycRecord={kycRecord} rejectionDetails={rejectionDetails} />

          <Button className="w-full rounded-xl h-12 text-base" onClick={() => setStep(1)}>
            Re-submit Documents
          </Button>
        </div>
      </div>
    );
  }

  // Progress indicator
  const progressSteps = STEPS.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10">

        {/* Step 0 — intro (Step 1 of 4) */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Link>
              <h1 className="text-xl font-bold">Verify Your Identity</h1>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                To comply with financial regulations and keep your account secure, we need to verify your identity before you can send or receive funds.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">What you'll need</p>
              {[
                { icon: Shield,   label: 'Government-issued ID',  desc: 'International Passport, Driver\'s Licence, or Voter\'s Card' },
                { icon: FileText, label: 'BVN or NIN',            desc: 'Bank Verification Number or National Identity Number' },
                { icon: Camera,   label: 'A clear selfie',        desc: 'A photo of your face in good lighting' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full rounded-xl h-12 text-base" onClick={() => setStep(1)}>Get Started</Button>
          </div>
        )}

        {/* Steps 1–3 with progress bar */}
        {step > 0 && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <button onClick={() => { setStep(s => s - 1); setErrors({}); }} className="p-2 rounded-xl bg-card border border-border hover:bg-muted">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-bold">{STEPS[step]}</h1>
                <p className="text-xs text-muted-foreground">Step {step + 1} of 4</p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex gap-1.5">
              {progressSteps.map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < step ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>

            {/* Step 1 — personal info */}
            {step === 1 && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 bg-muted/30 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Personal Information</p>
                </div>
                <div className="p-5 space-y-4">
                  {[
                    { key: 'full_name', label: 'Full Legal Name', placeholder: 'As on government ID', type: 'text' },
                    { key: 'date_of_birth', label: 'Date of Birth', placeholder: '', type: 'date' },
                    { key: 'nationality', label: 'Nationality', placeholder: 'e.g. Nigerian', type: 'text' },
                    { key: 'address', label: 'Residential Address', placeholder: 'Full address', type: 'text' },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
                      <Input type={type} value={form[key]} onChange={e => { setForm({ ...form, [key]: e.target.value }); setErrors(er => ({ ...er, [key]: undefined })); }} className={`rounded-xl ${errors[key] ? 'border-destructive' : ''}`} placeholder={placeholder} style={type === 'date' ? { colorScheme: 'light', backgroundColor: 'white', color: '#1a1a0e' } : undefined} />
                      {errors[key] && <p className="text-xs text-destructive mt-1">{errors[key]}</p>}
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">BVN <span className="text-muted-foreground/60">(optional)</span></label>
                    <Input value={form.bvn} onChange={e => { setForm({ ...form, bvn: e.target.value }); setErrors(er => ({ ...er, bvn: undefined })); }} className={`rounded-xl ${errors.bvn ? 'border-destructive' : ''}`} placeholder="11-digit BVN" maxLength={11} />
                    {errors.bvn && <p className="text-xs text-destructive mt-1">{errors.bvn}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">NIN <span className="text-muted-foreground/60">(optional)</span></label>
                    <Input value={form.nin} onChange={e => { setForm({ ...form, nin: e.target.value }); setErrors(er => ({ ...er, nin: undefined })); }} className={`rounded-xl ${errors.nin ? 'border-destructive' : ''}`} placeholder="11-digit NIN" maxLength={11} />
                    {errors.nin && <p className="text-xs text-destructive mt-1">{errors.nin}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — ID upload */}
            {step === 2 && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 bg-muted/30 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Identity Document</p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ID Type</label>
                    <Select value={form.id_type} onValueChange={v => { setForm({ ...form, id_type: v }); setErrors(er => ({ ...er, id_type: undefined })); }}>
                      <SelectTrigger className={`rounded-xl ${errors.id_type ? 'border-destructive' : ''}`}><SelectValue placeholder="Select ID type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="International Passport">International Passport</SelectItem>
                        <SelectItem value="Drivers Licence">Driver's Licence</SelectItem>
                        <SelectItem value="Voters Card">Voter's Card</SelectItem>
                        <SelectItem value="NIN">NIN</SelectItem>
                        <SelectItem value="BVN">BVN</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.id_type && <p className="text-xs text-destructive mt-1">{errors.id_type}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ID Number</label>
                    <Input value={form.id_number} onChange={e => { setForm({ ...form, id_number: e.target.value }); setErrors(er => ({ ...er, id_number: undefined })); }} className={`rounded-xl ${errors.id_number ? 'border-destructive' : ''}`} />
                    {errors.id_number && <p className="text-xs text-destructive mt-1">{errors.id_number}</p>}
                  </div>
                  <DocUpload label="Upload ID Document" hint="Clear photo or scan of your government-issued ID" icon={FileText}
                    value={form.id_document_url} onChange={url => { setForm(f => ({ ...f, id_document_url: url })); setErrors(er => ({ ...er, id_document_url: undefined })); }} accept="image/*,.pdf" />
                  {errors.id_document_url && <p className="text-xs text-destructive mt-1">{errors.id_document_url}</p>}
                </div>
              </div>
            )}

            {/* Step 3 — selfie */}
            {step === 3 && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 bg-muted/30 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selfie Verification</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                    <Camera className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">Take a clear selfie holding your ID document next to your face in good lighting.</p>
                  </div>
                  <DocUpload hint="Selfie with your ID visible" icon={Camera}
                    value={form.selfie_url} onChange={url => {
                      // TODO: Remove placeholder when file hosting is configured
                      setForm(f => ({ ...f, selfie_url: url || 'test-mode-selfie' }));
                      setErrors(er => ({ ...er, selfie_url: undefined }));
                    }} accept="image/*" capture="user" />
                  {errors.selfie_url && <p className="text-xs text-destructive mt-1">{errors.selfie_url}</p>}
                </div>
              </div>
            )}

            <Button
              className="w-full rounded-xl h-12 text-base"
              disabled={submitKYC.isPending}
              onClick={() => {
                try {
                  console.log('[KYCFlow] Continue clicked, step=', step);
                  if (!validateStep(step)) { console.log('[KYCFlow] Validation failed, errors set'); return; }
                  console.log('[KYCFlow] Validation passed, advancing');
                  if (step < 3) { setStep(s => s + 1); } else { submitKYC.mutate(); }
                } catch (err) {
                  console.error('[KYCFlow] Continue handler error:', err);
                  toast.error('Something went wrong. Please try again.');
                }
              }}
            >
              {submitKYC.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : step < 3 ? 'Continue' : 'Submit Verification'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}