import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function Onboarding() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { checkAppState, updateUser, user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both your first and last name.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('auth_token');
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/auth/me`,
        { full_name: fullName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local user state
      updateUser({ ...user, full_name: fullName });
      
      // Refresh auth state
      await checkAppState();
    } catch (err) {
      console.error('[Onboarding] updateMe error:', err);
      setError('Could not save your name. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-4">
          <img src="/paysible_icon_white.svg" alt="Paysible" className="w-20 h-20 mx-auto" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome to Paysible</h1>
            <p className="text-sm text-muted-foreground">Tell us your name to get started</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="first-name">First Name</label>
            <Input
              id="first-name"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={e => { setFirstName(e.target.value); setError(''); }}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="last-name">Last Name</label>
            <Input
              id="last-name"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={e => { setLastName(e.target.value); setError(''); }}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full rounded-xl h-12 text-base" disabled={loading}>
            {loading ? 'Saving…' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
