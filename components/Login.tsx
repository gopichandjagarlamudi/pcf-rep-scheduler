import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        onLogin(data.user.email || email);
      }
    } catch (_err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">PCF Rep Scheduler</h1>
          <p className="text-sm text-slate-500 mt-1">Operations Management Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 uppercase">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
