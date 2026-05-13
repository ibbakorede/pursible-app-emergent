import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ShieldCheck, ShieldAlert, CheckCircle, AlertCircle, ChevronRight, Lock, Fingerprint, Mail, FileCheck } from 'lucide-react';
import { isBiometricEnabled, getBiometricUser } from '@/lib/biometricAuth';

/**
 * Security Score Component
 * Shows users their account security status based on various factors
 */

const SECURITY_FACTORS = [
  {
    id: 'kyc',
    label: 'Identity Verified',
    description: 'Complete KYC verification',
    icon: FileCheck,
    path: '/kyc',
    weight: 30,
  },
  {
    id: 'biometric',
    label: 'Biometric Login',
    description: 'Enable Face ID or fingerprint',
    icon: Fingerprint,
    path: '/profile/security',
    weight: 25,
  },
  {
    id: 'email_verified',
    label: 'Email Verified',
    description: 'Confirm your email address',
    icon: Mail,
    path: null,
    weight: 20,
  },
  {
    id: 'strong_password',
    label: 'Strong Password',
    description: 'Use a secure password',
    icon: Lock,
    path: '/profile/security',
    weight: 15,
  },
  {
    id: 'bank_linked',
    label: 'Bank Linked',
    description: 'Add a verified bank account',
    icon: Shield,
    path: '/bank-accounts',
    weight: 10,
  },
];

function getScoreColor(score) {
  if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-100' };
  if (score >= 60) return { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-100' };
  if (score >= 40) return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-100' };
  return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100' };
}

function getScoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
}

export default function SecurityScore({ user, kycStatus, bankAccounts = [] }) {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  useEffect(() => {
    // Check if biometric is enabled for this user
    const enabled = isBiometricEnabled();
    const biometricUser = getBiometricUser();
    setBiometricEnabled(enabled && biometricUser === user?.email);
  }, [user?.email]);

  // Calculate security factors status
  const factorsStatus = useMemo(() => {
    return SECURITY_FACTORS.map(factor => {
      let completed = false;
      
      switch (factor.id) {
        case 'kyc':
          completed = kycStatus === 'approved';
          break;
        case 'biometric':
          completed = biometricEnabled;
          break;
        case 'email_verified':
          // For now, assume email is verified if user exists
          // In production, this would check a verified_email field
          completed = !!user?.email;
          break;
        case 'strong_password':
          // Assume true if user has logged in successfully
          // In production, this could check password strength requirements
          completed = true;
          break;
        case 'bank_linked':
          completed = bankAccounts.length > 0 && bankAccounts.some(b => b.is_verified);
          break;
        default:
          completed = false;
      }
      
      return { ...factor, completed };
    });
  }, [kycStatus, biometricEnabled, user, bankAccounts]);

  // Calculate total score
  const score = useMemo(() => {
    return factorsStatus.reduce((total, factor) => {
      return total + (factor.completed ? factor.weight : 0);
    }, 0);
  }, [factorsStatus]);

  const completedCount = factorsStatus.filter(f => f.completed).length;
  const incompleteFactors = factorsStatus.filter(f => !f.completed);
  const colors = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden" data-testid="security-score-card">
      {/* Header with score */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${colors.light} flex items-center justify-center`}>
              {score >= 60 ? (
                <ShieldCheck className={`w-6 h-6 ${colors.text}`} />
              ) : (
                <ShieldAlert className={`w-6 h-6 ${colors.text}`} />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold">Security Score</h3>
              <p className="text-xs text-muted-foreground">{completedCount}/{SECURITY_FACTORS.length} factors complete</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${colors.text}`}>{score}</p>
            <p className={`text-xs font-semibold ${colors.text}`}>{label}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Factors list */}
      <div className="divide-y divide-border">
        {factorsStatus.map((factor) => {
          const Icon = factor.icon;
          const content = (
            <div className="flex items-center gap-3.5 px-4 py-3.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                factor.completed ? 'bg-emerald-100' : 'bg-muted'
              }`}>
                <Icon className={`w-4 h-4 ${factor.completed ? 'text-emerald-600' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${factor.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {factor.label}
                  </p>
                  {factor.completed && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{factor.description}</p>
              </div>
              {!factor.completed && factor.path && (
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              {factor.completed && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  +{factor.weight}
                </span>
              )}
            </div>
          );

          // If not completed and has a path, make it a link
          if (!factor.completed && factor.path) {
            return (
              <Link
                key={factor.id}
                to={factor.path}
                className="block hover:bg-muted/50 transition-colors"
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={factor.id} className={factor.completed ? '' : 'opacity-60'}>
              {content}
            </div>
          );
        })}
      </div>

      {/* Improvement tip */}
      {incompleteFactors.length > 0 && (
        <div className="px-4 py-3 bg-muted/30 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Tip:</span> {incompleteFactors[0].description} to increase your score by +{incompleteFactors[0].weight} points
          </p>
        </div>
      )}
    </div>
  );
}
