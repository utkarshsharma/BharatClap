import api from './api';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
  role?: 'customer' | 'provider';
  city?: string;
}

export interface SetRoleResponse {
  role: 'customer' | 'provider';
}

export const authService = {
  login: async (firebaseIdToken: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { firebaseIdToken });
    return response.data;
  },

  setRole: async (role: 'customer' | 'provider'): Promise<SetRoleResponse> => {
    const response = await api.post('/auth/set-role', { role });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};
