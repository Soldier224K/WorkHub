import React, { useState } from 'react';
import { X, UserCheck, Shield, KeyRound, Sparkles } from 'lucide-react';
import { api, setAuthToken, setSavedUser } from '../../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.auth.login({ email: loginEmail, password: loginPass });
      setAuthToken(data.accessToken, data.refreshToken);
      setSavedUser(data.user);
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (userEmail: string) => {
    handleLogin(userEmail, 'Password123!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-surface dark:bg-surface-dark border border-ink-hairline dark:border-ink-dark-hairline rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-paper dark:bg-paper-dark border-b border-ink-hairline dark:border-ink-dark-hairline flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent font-semibold">
              WorkHub Access
            </span>
            <h2 className="font-serif text-3xl font-normal text-ink dark:text-ink-dark mt-0.5">
              Sign In
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-surface text-ink-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded bg-accent-light dark:bg-accent-dark-light border border-accent/20 text-accent text-xs font-mono">
              {error}
            </div>
          )}

          {/* 1-Click Persona Demo Switcher */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-accent" />
              Demo Persona Switcher (Viva Mode)
            </span>

            <div className="grid grid-cols-1 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('sarah@cyberdyne.io')}
                className="w-full p-2.5 rounded bg-paper dark:bg-paper-dark border border-ink-hairline hover:border-accent flex items-center justify-between transition-colors text-left"
              >
                <div>
                  <strong className="block text-ink dark:text-ink-dark">Sarah Connor</strong>
                  <span className="text-[11px] text-accent">Member · Hot Desk Monthly Pass</span>
                </div>
                <UserCheck className="w-4 h-4 text-accent" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager@workhub.io')}
                className="w-full p-2.5 rounded bg-paper dark:bg-paper-dark border border-ink-hairline hover:border-accent flex items-center justify-between transition-colors text-left"
              >
                <div>
                  <strong className="block text-ink dark:text-ink-dark">Marcus Vance</strong>
                  <span className="text-[11px] text-ink-muted">Operations Manager</span>
                </div>
                <Shield className="w-4 h-4 text-ink-muted" />
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-ink-hairline" />
            <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-ink-muted">or custom login</span>
            <div className="flex-grow border-t border-ink-hairline" />
          </div>

          {/* Custom Login Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin(email, password);
            }}
            className="space-y-3 font-mono text-xs"
          >
            <div>
              <label className="block text-[11px] text-ink-muted mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full p-2.5 rounded bg-paper dark:bg-paper-dark border border-ink-hairline text-ink placeholder:text-ink-muted"
              />
            </div>

            <div>
              <label className="block text-[11px] text-ink-muted mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 rounded bg-paper dark:bg-paper-dark border border-ink-hairline text-ink"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded bg-accent hover:bg-accent-hover text-white uppercase tracking-wider font-semibold shadow-sm transition-all"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
