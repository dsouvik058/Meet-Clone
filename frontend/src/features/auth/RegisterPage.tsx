import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, User, Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authApi.register({ name, email, password });
      login(response.accessToken, response.refreshToken);
      navigate('/', { replace: true });
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.status === 409
          ? 'This email address is already registered.'
          : err.response?.status
          ? `Server error (${err.response.status}): ${err.response.statusText || 'Request failed'}`
          : 'Unable to reach authentication server.');
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
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
          to="/login"
          className="text-sm font-medium text-meet-blue hover:text-meet-blue-hover transition"
        >
          Sign in instead
        </Link>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-meet-surface rounded-3xl p-8 sm:p-10 border border-meet-tile/80 shadow-meet-modal space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
              Create your account
            </h1>
            <p className="text-sm text-meet-text-secondary">
              to start and join meetings securely
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-meet-red/10 border border-meet-red/30 text-meet-red rounded-xl p-3.5 flex items-start space-x-3 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-meet-text-muted mb-1.5 ml-1">
                Full name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-meet-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  required
                  className="w-full bg-meet-dark text-white text-sm rounded-xl pl-10 pr-4 py-3 border border-meet-tile focus:border-meet-blue focus:ring-1 focus:ring-meet-blue outline-none transition placeholder:text-meet-text-muted"
                />
              </div>
            </div>

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
                  placeholder="alex@example.com"
                  required
                  className="w-full bg-meet-dark text-white text-sm rounded-xl pl-10 pr-4 py-3 border border-meet-tile focus:border-meet-blue focus:ring-1 focus:ring-meet-blue outline-none transition placeholder:text-meet-text-muted"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-meet-text-muted mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-meet-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full bg-meet-dark text-white text-sm rounded-xl pl-10 pr-4 py-3 border border-meet-tile focus:border-meet-blue focus:ring-1 focus:ring-meet-blue outline-none transition placeholder:text-meet-text-muted"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full meet-btn-primary py-3 rounded-xl flex items-center justify-center space-x-2 font-medium text-sm transition mt-3 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-xs text-meet-text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-meet-blue hover:text-meet-blue-hover font-medium">
                Sign in
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
