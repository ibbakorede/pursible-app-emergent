import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Lock, User, ArrowRight, Eye, EyeOff, Fingerprint, Sparkles, Shield, Zap } from 'lucide-react';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  getBiometricUser,
  authenticateWithBiometric,
  getBiometricTypeName,
} from '@/lib/biometricAuth';

export default function Login() {
  const { login, register, loginWithToken } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricUser, setBiometricUser] = useState(null);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: ''
  });

  // Check biometric availability on mount
  useEffect(() => {
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      const enabled = isBiometricEnabled();
      const user = getBiometricUser();
      
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
      setBiometricUser(user);
      
      // Show biometric prompt if enabled
      if (available && enabled && user) {
        setShowBiometricPrompt(true);
      }
    };
    
    checkBiometric();
  }, []);

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError('');
    
    try {
      const result = await authenticateWithBiometric();
      if (result.success && result.email) {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/biometric-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: result.email }),
        });
        
        const data = await response.json();
        if (data.success && data.token) {
          await loginWithToken(data.token, data.user);
        } else {
          throw new Error('Biometric verification failed. Please use password.');
        }
      }
    } catch (err) {
      console.error('Biometric login error:', err);
      setError('Biometric login failed. Please use your password.');
      setShowBiometricPrompt(false);
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register({
          email: form.email,
          password: form.password,
          full_name: form.full_name
        });
      }
    } catch (err) {
      console.error('[Login] Error:', err);
      setError(err.response?.data?.detail || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const biometricTypeName = getBiometricTypeName();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-5 relative">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/20 rounded-2xl p-3">
              <img src="/paysible_icon_white.svg" alt="Paysible" className="w-full h-full drop-shadow-2xl" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Paysible
          </h1>
          <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
            Send, Receive, Convert & Withdraw — Instantly
          </p>
        </div>

        {/* Feature badges */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-gray-300">Secure</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-gray-300">Instant</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs text-gray-300">Simple</span>
          </div>
        </div>

        {/* Biometric Login Prompt */}
        {showBiometricPrompt && biometricEnabled && (
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl mb-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-primary/20">
                <Fingerprint className="w-10 h-10 text-primary" />
              </div>
              <p className="text-sm text-gray-400 mb-6">
                {biometricUser}
              </p>
              
              <Button
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
                className="w-full rounded-xl h-13 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white text-base font-semibold mb-4 shadow-lg shadow-primary/25 transition-all duration-300"
              >
                {biometricLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Verifying...</>
                ) : (
                  <><Fingerprint className="w-5 h-5 mr-2" /> Use {biometricTypeName}</>
                )}
              </Button>
              
              <button
                onClick={() => setShowBiometricPrompt(false)}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Use password instead
              </button>
            </div>
          </div>
        )}

        {/* Main Login Card */}
        {(!showBiometricPrompt || !biometricEnabled) && (
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Tab Switcher */}
            <div className="flex bg-white/5 rounded-xl p-1 mb-8">
              <button
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                  isLogin 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                  !isLogin 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
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

            <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Full Name
                  </label>
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
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email Address
                </label>
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
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Password
                </label>
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
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Please wait...</>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'} 
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              {/* Biometric option for login */}
              {isLogin && biometricAvailable && biometricEnabled && !showBiometricPrompt && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBiometricPrompt(true)}
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
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-8">
          By continuing, you agree to our{' '}
          <a href="/legal" className="text-gray-500 hover:text-white transition-colors">Terms of Service</a>
          {' '}and{' '}
          <a href="/legal" className="text-gray-500 hover:text-white transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
