export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface DecodedJwtPayload {
  sub: string;       // User UUID
  email?: string;
  name?: string;
  type?: string;     // "ACCESS"
  exp?: number;      // Unix timestamp in seconds
  iat?: number;
}
