/**
 * KYCIntroStep - Introduction step for KYC flow
 */
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, FileText, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

const REQUIREMENTS = [
  { 
    icon: Shield, 
    label: 'Government-issued ID', 
    desc: "International Passport, Driver's Licence, or Voter's Card" 
  },
  { 
    icon: FileText, 
    label: 'BVN or NIN', 
    desc: 'Bank Verification Number or National Identity Number' 
  },
  { 
    icon: Camera, 
    label: 'A clear selfie', 
    desc: 'A photo of your face in good lighting' 
  },
];

export default function KYCIntroStep({ onStart }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Verify Your Identity</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          To comply with financial regulations and keep your account secure, we need to verify 
          your identity before you can send or receive funds.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
          What you'll need
        </p>
        {REQUIREMENTS.map(({ icon: Icon, label, desc }) => (
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

      <Button 
        className="w-full rounded-xl h-12 text-base" 
        onClick={onStart}
        data-testid="kyc-start-button"
      >
        Get Started
      </Button>
    </div>
  );
}
