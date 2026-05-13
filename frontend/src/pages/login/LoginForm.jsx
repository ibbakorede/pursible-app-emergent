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
  showBiometricPrompt,
  biometricTypeName,
  onSubmit,
  onToggleMode,
  onShowBiometric,
}) {
  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
      {/* Tab Switcher */}
      <div className="flex bg-white/5 rounded-xl p-1 mb-8">
        <button
          onClick={() => onToggleMode(true)}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
            isLogin ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => onToggleMode(false)}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
            !isLogin ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          Sign Up
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
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Full Name</label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Your full name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="pl-12 rounded-xl h-13 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20 transition-all"
                  required={!isLogin}
                  data-testid="input-fullname"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email Address</label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="pl-12 rounded-xl h-13 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20 transition-all"
                required
                data-testid="input-email"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="pl-12 pr-12 rounded-xl h-13 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20 transition-all"
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

        {isLogin && (
          <div className="flex justify-end">
            <button type="button" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
              Forgot password?
            </button>
          </div>
        )}

        <Button
          type="submit"
          className="w-full rounded-xl h-13 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-300 mt-2"
          disabled={loading}
          data-testid="submit-button"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Please wait...
            </>
          ) : (
            <>
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        {isLogin && biometricAvailable && biometricEnabled && !showBiometricPrompt && (
          <Button
            type="button"
            variant="outline"
            onClick={onShowBiometric}
            className="w-full rounded-xl h-13 bg-white/5 border-white/10 text-white hover:bg-white/10 text-base font-semibold"
          >
            <Fingerprint className="w-5 h-5 mr-2" /> Use {biometricTypeName}
          </Button>
        )}
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Switch auth mode */}
      <p className="text-center text-sm text-gray-400">
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={() => onToggleMode(!isLogin)}
          className="text-primary hover:text-primary/80 font-semibold transition-colors"
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
