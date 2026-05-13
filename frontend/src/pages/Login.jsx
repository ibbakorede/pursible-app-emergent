import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  getBiometricUser,
  authenticateWithBiometric,
  getBiometricTypeName,
} from '@/lib/biometricAuth';
import { LoginBackground, LoginBranding } from './login/LoginHeader';
import LoginForm from './login/LoginForm';
import BiometricPrompt from './login/BiometricPrompt';

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
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });

  useEffect(() => {
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      const enabled = isBiometricEnabled();
      const user = getBiometricUser();
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
      setBiometricUser(user);
      if (available && enabled && user) setShowBiometricPrompt(true);
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
    } catch {
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
        await register({ email: form.email, password: form.password, full_name: form.full_name });
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = (loginMode) => {
    setIsLogin(loginMode);
    setError('');
  };

  const biometricTypeName = getBiometricTypeName();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements - absolute positioned */}
      <LoginBackground />

      {/* Main content container */}
      <div className="w-full max-w-md relative z-10">
        {/* Branding section */}
        <LoginBranding />

        {/* Auth forms */}
        {showBiometricPrompt && biometricEnabled ? (
          <BiometricPrompt
            biometricUser={biometricUser}
            biometricLoading={biometricLoading}
            biometricTypeName={biometricTypeName}
            onBiometricLogin={handleBiometricLogin}
            onUsePassword={() => setShowBiometricPrompt(false)}
          />
        ) : (
          <LoginForm
            isLogin={isLogin}
            form={form}
            setForm={setForm}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loading={loading}
            error={error}
            biometricAvailable={biometricAvailable}
            biometricEnabled={biometricEnabled}
            showBiometricPrompt={showBiometricPrompt}
            biometricTypeName={biometricTypeName}
            onSubmit={handleSubmit}
            onToggleMode={handleToggleMode}
            onShowBiometric={() => setShowBiometricPrompt(true)}
          />
        )}

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-8">
          By continuing, you agree to our{' '}
          <a href="/legal" className="text-gray-500 hover:text-white transition-colors">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/legal" className="text-gray-500 hover:text-white transition-colors">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
