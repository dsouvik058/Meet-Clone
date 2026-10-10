import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Video, Loader2, AlertCircle } from 'lucide-react';

export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`OAuth authentication error: ${errorParam}`);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    if (accessToken && refreshToken) {
      try {
        login(accessToken, refreshToken);
        navigate('/', { replace: true });
      } catch (err) {
        setError('Failed to process authentication tokens.');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    } else {
      setError('Missing authentication tokens in redirect URL.');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-meet-dark text-meet-text-primary flex flex-col items-center justify-center p-6 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-meet-blue-dark to-meet-blue flex items-center justify-center shadow-lg">
        <Video className="w-8 h-8 text-meet-dark" />
      </div>

      {error ? (
        <div className="bg-meet-red/10 border border-meet-red/30 text-meet-red rounded-xl p-4 flex items-center space-x-3 text-sm max-w-md">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error} Redirecting to login...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-3 text-meet-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin text-meet-blue" />
          <span className="text-sm font-medium">Completing social sign-in...</span>
        </div>
      )}
    </div>
  );
};
