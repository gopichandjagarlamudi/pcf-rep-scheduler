import React, { useState } from 'react';
import { Sparkles, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { supabase, supabaseConfigError } from '../lib/supabase';

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
    if (email.trim() && password.trim()) {
      setIsLoading(true);
      setError(null);

      try {
        if (!supabase) {
          setError(supabaseConfigError || 'Supabase is not configured.');
          setIsLoading(false);
          return;
        }

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
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="app-shell login-shell min-h-screen px-4">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center py-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden lg:block">
            <div className="max-w-lg">
              <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.28em] text-indigo-600/80">
                Workforce Planning Suite
              </p>
              <h1 className="text-5xl font-extrabold tracking-tight text-slate-950">
                Schedule field operations with a calmer control surface.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
                Upload staffing inputs, align availability, and generate weekly deployment plans from one premium internal workspace.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="panel-surface rounded-3xl p-5">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Secure Access</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">Authenticated operations portal with persistent schedule state.</p>
                </div>
                <div className="panel-surface rounded-3xl p-5">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Guided Workflow</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">Upload, configure dates, and generate plans without leaving the dashboard.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-glow">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.26em] text-slate-400">PCF Operations</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">PCF Rep Scheduler</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to access the planning dashboard and existing saved schedules.</p>
            </div>

            <div className="panel-surface rounded-[var(--radius-panel)] p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                    Email Address
                  </label>
                  <div className="field-shell relative rounded-2xl">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="block w-full rounded-2xl border-none bg-transparent py-3 pl-10 pr-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                    Password
                  </label>
                  <div className="field-shell relative rounded-2xl">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="block w-full rounded-2xl border-none bg-transparent py-3 pl-10 pr-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50/90 px-4 py-3 text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-xs font-semibold">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="primary-button flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <div className="subtle-divider mt-8 border-t pt-6">
                <p className="text-center text-[11px] font-medium leading-relaxed text-slate-400">
                  Restricted access for PCF field operations personnel only.
                  Unauthorized access attempts are logged.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
