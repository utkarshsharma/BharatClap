import api from './api';

export interface UserProfile {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  preferredLanguage: string;
  city?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  providerProfile?: {
    id: string;
    bio?: string;
    avgRating: number;
    totalJobs: number;
    totalEarnings: number;
    walletBalance: number;
    isAvailable: boolean;
    kycStatus: string;
    yearsExperience: number;
    serviceRadiusKm: number;
    languagesSpoken: string[];
    certifications: string[];
  };
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  avatarUrl?: string;
  preferredLanguage?: string;
  city?: string;
  notifPush?: boolean;
  notifWhatsapp?: boolean;
  notifBooking?: boolean;
  notifPromo?: boolean;
}

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async (data: UpdateUserData): Promise<UserProfile> => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    const response = await api.delete('/users/me');
    return response.data;
  },

  exportData: async (): Promise<any> => {
    const response = await api.get('/users/me/data-export');
    return response.data;
  },
};
