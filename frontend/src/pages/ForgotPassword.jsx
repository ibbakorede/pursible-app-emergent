import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm mb-8 transition-colors hover:opacity-80"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>

        {/* Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
          {/* Success Icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(92,107,62,0.15)' }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: '#7A8C54' }} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3">Check your email</h1>

          {/* Message */}
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Reset link sent to your email
          </p>

          {/* Additional info */}
          <div
            className="p-4 rounded-xl mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="w-4 h-4" style={{ color: '#7A8C54' }} />
              <span className="text-sm text-white">Email sent</span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              If an account exists with that email, you&apos;ll receive a password reset link shortly.
            </p>
          </div>

          {/* Back to login */}
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: 'linear-gradient(to right, #5C6B3E, rgba(92,107,62,0.8))',
              boxShadow: '0 10px 15px -3px rgba(92,107,62,0.25)',
            }}
          >
            Back to sign in
          </Link>

          {/* Resend link */}
          <p className="text-xs mt-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Didn&apos;t receive the email?{' '}
            <button
              type="button"
              className="font-medium hover:opacity-80"
              style={{ color: '#7A8C54' }}
            >
              Resend
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
