import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { OAuthCallbackPage } from './features/auth/OAuthCallbackPage';
import { HomePage } from './features/lobby/HomePage';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { attemptSilentRefresh } from './api/client';
import { useAuthStore } from './store/authStore';

export default function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    // Check if a stored refresh token exists in localStorage and attempt silent session recovery
    const bootstrapAuth = async () => {
      const storedToken = localStorage.getItem('meet_refresh_token');
      if (storedToken) {
        await attemptSilentRefresh();
      }
      initAuth();
    };
    bootstrapAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />

        {/* Protected Application Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
