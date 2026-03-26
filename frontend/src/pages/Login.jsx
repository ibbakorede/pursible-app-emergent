import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Lock, User, ArrowRight, Eye, EyeOff, Fingerprint } from 'lucide-react';
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
        // Get stored token or request new one via biometric endpoint
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/biometric-login`, {
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img src="/paysible_icon_white.svg" alt="Paysible" className="w-full h-full" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Paysible</h1>
          <p className="text-muted-foreground text-sm">Send, Receive, Convert & Withdraw — Instantly</p>
        </div>

        {/* Biometric Login Prompt */}
        {showBiometricPrompt && biometricEnabled && (
          <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl mb-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Fingerprint className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">Welcome back!</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {biometricUser}
              </p>
              
              <Button
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
                className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold mb-3"
              >
                {biometricLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying...</>
                ) : (
                  <><Fingerprint className="w-5 h-5 mr-2" /> Use {biometricTypeName}</>
                )}
              </Button>
              
              <button
                onClick={() => setShowBiometricPrompt(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Use password instead
              </button>
            </div>
          </div>
        )}

        {/* Card - Show when biometric prompt is hidden or not available */}
        {(!showBiometricPrompt || !biometricEnabled) && (
          <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-center text-foreground mb-6">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
              {!isLogin && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Your full name"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="pl-10 rounded-xl h-12"
                      required={!isLogin}
                      data-testid="input-fullname"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="pl-10 rounded-xl h-12"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pl-10 pr-10 rounded-xl h-12"
                    required
                    minLength={6}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold"
                disabled={loading}
                data-testid="submit-button"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Please wait...</>
                ) : (
                  <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>

              {/* Biometric option for login */}
              {isLogin && biometricAvailable && biometricEnabled && !showBiometricPrompt && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBiometricPrompt(true)}
                  className="w-full rounded-xl h-12 text-base font-semibold"
                >
                  <Fingerprint className="w-5 h-5 mr-2" /> Use {biometricTypeName}
                </Button>
              )}
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-muted-foreground text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
