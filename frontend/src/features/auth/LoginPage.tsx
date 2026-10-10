import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Video, Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authApi.login({ email, password });
      login(response.accessToken, response.refreshToken);
      navigate(from, { replace: true });
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid email or password. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'discord' | 'facebook') => {
    setOauthLoading(provider);
    setErrorMessage(null);
    try {
      const url = await authApi.getOAuthUrl(provider);
      window.location.href = url;
    } catch (err: any) {
      setErrorMessage(`Failed to initiate ${provider} login. Please try again.`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-meet-dark text-meet-text-primary flex flex-col justify-between selection:bg-meet-blue selection:text-meet-dark">
      {/* Top Header */}
      <header className="h-16 px-8 flex items-center justify-between border-b border-meet-tile/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-meet-blue-dark to-meet-blue flex items-center justify-center shadow-md">
            <Video className="w-5 h-5 text-meet-dark" />
          </div>
          <span className="text-xl font-medium tracking-tight text-white">Orbit</span>
        </div>
        <Link
          to="/register"
          className="text-sm font-medium text-meet-blue hover:text-meet-blue-hover transition"
        >
          Create an account
        </Link>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-meet-surface rounded-3xl p-8 sm:p-10 border border-meet-tile/80 shadow-meet-modal space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
              Sign in
            </h1>
            <p className="text-sm text-meet-text-secondary">
              to continue to Orbit
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-meet-red/10 border border-meet-red/30 text-meet-red rounded-xl p-3.5 flex items-start space-x-3 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-meet-text-muted mb-1.5 ml-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-meet-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-meet-dark text-white text-sm rounded-xl pl-10 pr-4 py-3 border border-meet-tile focus:border-meet-blue focus:ring-1 focus:ring-meet-blue outline-none transition placeholder:text-meet-text-muted"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="block text-xs font-medium text-meet-text-muted">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-meet-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-meet-dark text-white text-sm rounded-xl pl-10 pr-4 py-3 border border-meet-tile focus:border-meet-blue focus:ring-1 focus:ring-meet-blue outline-none transition placeholder:text-meet-text-muted"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full meet-btn-primary py-3 rounded-xl flex items-center justify-center space-x-2 font-medium text-sm transition mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-1">
            <div className="border-t border-meet-tile/80 w-full"></div>
            <span className="bg-meet-surface px-3 text-xs text-meet-text-muted uppercase tracking-wider font-semibold">
              or continue with
            </span>
          </div>

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={!!oauthLoading}
              className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-meet-dark hover:bg-meet-hover border border-meet-tile/80 transition text-sm font-medium disabled:opacity-50"
              title="Sign in with Google"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin text-meet-blue" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
            </button>

            {/* Discord */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('discord')}
              disabled={!!oauthLoading}
              className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-meet-dark hover:bg-meet-hover border border-meet-tile/80 transition text-sm font-medium text-[#5865F2] disabled:opacity-50"
              title="Sign in with Discord"
            >
              {oauthLoading === 'discord' ? (
                <Loader2 className="w-4 h-4 animate-spin text-meet-blue" />
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              )}
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('facebook')}
              disabled={!!oauthLoading}
              className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-meet-dark hover:bg-meet-hover border border-meet-tile/80 transition text-sm font-medium text-[#1877F2] disabled:opacity-50"
              title="Sign in with Facebook"
            >
              {oauthLoading === 'facebook' ? (
                <Loader2 className="w-4 h-4 animate-spin text-meet-blue" />
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <span className="text-xs text-meet-text-muted">
              Don't have an account?{' '}
              <Link to="/register" className="text-meet-blue hover:text-meet-blue-hover font-medium">
                Sign up
              </Link>
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 px-8 text-xs text-meet-text-muted flex items-center justify-between border-t border-meet-tile/40">
        <span>English (United States)</span>
        <div className="space-x-6">
          <a href="#" className="hover:underline">Help</a>
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
        </div>
      </footer>
    </div>
  );
};
