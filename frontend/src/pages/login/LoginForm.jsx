import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Lock, User, ArrowRight, Eye, EyeOff, Fingerprint } from 'lucide-react';

export default function LoginForm({
  isLogin,
  form,
  setForm,
  showPassword,
  setShowPassword,
  loading,
  error,
  biometricAvailable,
  biometricEnabled,
  biometricTypeName,
  onSubmit,
  onToggleMode,
  onBiometricLogin,
  biometricLoading,
}) {
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
      {/* Tab Switcher */}
      <div className="flex bg-white/5 rounded-xl p-1 mb-8">
        <button
          onClick={() => onToggleMode(true)}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
            isLogin ? 'bg-[#5C6B3E] text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          Sign in
        </button>
        <button
          onClick={() => onToggleMode(false)}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
            !isLogin ? 'bg-[#5C6B3E] text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          Create account
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs">!</span>
          </div>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5" data-testid="login-form">
        {!isLogin && (
          <div className="space-y-2">
            <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>Full name</label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#5C6B3E]/30 to-[#97C459]/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#7A8C54] transition-colors" />
                <Input
                  type="text"
                  placeholder="Your full name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="pl-12 rounded-xl h-13 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#5C6B3E]/50 focus:ring-[#5C6B3E]/20 transition-all"
                  required={!isLogin}
                  data-testid="input-fullname"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>Email</label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#5C6B3E]/30 to-[#97C459]/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#7A8C54] transition-colors" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="pl-12 rounded-xl h-13 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#5C6B3E]/50 focus:ring-[#5C6B3E]/20 transition-all"
                required
                data-testid="input-email"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>Password</label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#5C6B3E]/30 to-[#97C459]/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#7A8C54] transition-colors" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="pl-12 pr-12 rounded-xl h-13 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#5C6B3E]/50 focus:ring-[#5C6B3E]/20 transition-all"
                required
                minLength={6}
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Remember me + Forgot password row */}
        {isLogin && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className="w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: rememberMe ? '#5C6B3E' : 'transparent',
                  border: rememberMe ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {rememberMe && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: '#7A8C54' }}
            >
              Forgot password?
            </Link>
          </div>
        )}

        <Button
          type="submit"
          className="w-full rounded-xl h-13 text-white text-base font-semibold shadow-lg transition-all duration-300 mt-2"
          style={{
            background: 'linear-gradient(to right, #5C6B3E, rgba(92,107,62,0.8))',
            boxShadow: '0 10px 15px -3px rgba(92,107,62,0.25)',
          }}
          disabled={loading}
          data-testid="submit-button"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Please wait...
            </>
          ) : (
            <>
              {isLogin ? 'Sign in' : 'Create account'}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        {/* OR Divider */}
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1" style={{ height: '0.5px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <span
            className="text-[10px] uppercase font-medium"
            style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px' }}
          >
            OR
          </span>
          <div className="flex-1" style={{ height: '0.5px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Inline Biometric Button */}
        {isLogin && biometricAvailable && biometricEnabled && (
          <button
            type="button"
            onClick={onBiometricLogin}
            disabled={biometricLoading}
            className="w-full py-3 rounded-[14px] flex items-center justify-center gap-2 transition-all hover:bg-white/5"
            style={{
              backgroundColor: 'transparent',
              border: '0.5px solid rgba(255,255,255,0.12)',
            }}
          >
            {biometricLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#7A8C54' }} />
            ) : (
              <Fingerprint className="w-5 h-5" style={{ color: '#7A8C54' }} />
            )}
            <span className="text-sm text-white">
              {biometricLoading ? 'Verifying...' : `Sign in with ${biometricTypeName}`}
            </span>
          </button>
        )}

        {/* Switch auth mode */}
        <p className="text-center text-sm text-gray-400 mt-4">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => onToggleMode(!isLogin)}
            className="font-semibold transition-colors hover:opacity-80"
            style={{ color: '#7A8C54' }}
          >
            {isLogin ? 'Create account' : 'Sign in'}
          </button>
        </p>
      </form>
    </div>
  );
}
