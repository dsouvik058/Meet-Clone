import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import { UserProfile, DecodedJwtPayload } from '../types/auth.types';

const REFRESH_TOKEN_KEY = 'meet_refresh_token';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // Actions
  login: (accessToken: string, refreshToken: string, userProfile?: UserProfile) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  login: (accessToken: string, refreshToken: string, userProfile?: UserProfile) => {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    
    let decodedUser: UserProfile | null = userProfile || null;
    if (!decodedUser) {
      try {
        const decoded = jwtDecode<DecodedJwtPayload>(accessToken);
        decodedUser = {
          id: decoded.sub,
          email: decoded.email || '',
          name: decoded.name || 'User',
          avatarUrl: null,
        };
      } catch (err) {
        console.error('Failed to decode JWT access token', err);
      }
    }

    set({
      accessToken,
      refreshToken,
      user: decodedUser,
      isAuthenticated: true,
      isInitialized: true,
    });
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    let decodedUser = get().user;

    try {
      const decoded = jwtDecode<DecodedJwtPayload>(accessToken);
      decodedUser = {
        id: decoded.sub,
        email: decoded.email || decodedUser?.email || '',
        name: decoded.name || decodedUser?.name || 'User',
        avatarUrl: decodedUser?.avatarUrl || null,
      };
    } catch (err) {
      console.error('Failed to decode JWT on token refresh', err);
    }

    set({
      accessToken,
      refreshToken,
      user: decodedUser,
      isAuthenticated: true,
    });
  },

  setUser: (user: UserProfile) => {
    set({ user });
  },

  logout: () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isInitialized: true,
    });
  },

  initAuth: () => {
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    set({
      refreshToken: storedRefresh,
      isInitialized: true,
    });
  },
}));
