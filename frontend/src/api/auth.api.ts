import { apiClient } from './client';
import { LoginRequest, RegisterRequest, LoginResponse } from '../types/auth.types';

export const authApi = {
  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new user account
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Rotate access token using long-lived refresh token
   */
  async refresh(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/refresh', null, {
      params: { refreshToken },
    });
    return response.data;
  },

  /**
   * Retrieve OAuth provider authorization URL (Google, Discord, Facebook)
   */
  async getOAuthUrl(provider: 'google' | 'discord' | 'facebook'): Promise<string> {
    const response = await apiClient.get<{ url: string }>(`/auth/oauth/${provider}/url`);
    return response.data.url;
  },
};
