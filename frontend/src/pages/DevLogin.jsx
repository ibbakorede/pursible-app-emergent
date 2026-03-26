import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TEST_CREDENTIALS } from '@/dev/seedData';

export default function DevLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFillTest = () => {
    setEmail(TEST_CREDENTIALS.email);
    setPassword(TEST_CREDENTIALS.password);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.reload();
    } catch (err) {
      console.error('[DevLogin] login error:', err);
      setError(err?.message || 'Login failed. Check credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Dev badge */}
        <div className="flex justify-center">
          <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300 rounded-full px-3 py-1">
            Development only — not shown in production
          </span>
        </div>

        {/* Logo */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-primary">Paysible</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="dev-email">Email</label>
            <Input
              id="dev-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="dev-password">Password</label>
            <Input
              id="dev-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        {/* Test credentials */}
        <div className="border border-dashed border-border rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Test Credentials</p>
          <div className="space-y-1 text-xs text-muted-foreground font-mono">
            <p>Email: <span className="text-foreground">{TEST_CREDENTIALS.email}</span></p>
            <p>Password: <span className="text-foreground">{TEST_CREDENTIALS.password}</span></p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-xl"
            onClick={handleFillTest}
          >
            Fill Test Credentials
          </Button>
        </div>
      </div>
    </div>
  );
}
