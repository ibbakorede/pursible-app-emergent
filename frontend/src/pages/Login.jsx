import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

export default function Login() {
  const { login, register, loginWithToken } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });

  useEffect(() => {
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      const enabled = isBiometricEnabled();
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
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

        {/* Auth form */}
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
          biometricTypeName={biometricTypeName}
          onSubmit={handleSubmit}
          onToggleMode={handleToggleMode}
          onBiometricLogin={handleBiometricLogin}
          biometricLoading={biometricLoading}
        />

        {/* Terms/Privacy Footer */}
        <div className="text-center mt-8">
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            By continuing, you agree to our
          </p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <Link to="/legal" className="font-medium hover:opacity-80" style={{ color: '#7A8C54' }}>
              Terms of Service
            </Link>
            {' and '}
            <Link to="/legal" className="font-medium hover:opacity-80" style={{ color: '#7A8C54' }}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
