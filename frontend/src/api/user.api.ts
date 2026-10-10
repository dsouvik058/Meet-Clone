import { apiClient } from './client';
import { UserProfile } from '../types/auth.types';

export const userApi = {
  /**
   * Fetch user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(`/users/${userId}`);
    return response.data;
  },

  /**
   * Update profile fields (name, avatar)
   */
  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.patch<UserProfile>(`/users/${userId}`, data);
    return response.data;
  },
};
