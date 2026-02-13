import api from './api';

export interface Provider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  bio?: string;
  city: string;
  rating: number;
  reviewCount: number;
  completedBookings: number;
  isActive: boolean;
  isVerified: boolean;
  isFavorite?: boolean;
  customPrice?: number;
  distance?: number | null;
}

// Maps raw API provider object to the Provider interface
function mapProvider(raw: any): Provider {
  return {
    id: raw.id,
    name: raw.user?.name ?? 'Provider',
    phone: raw.user?.phone ?? '',
    email: raw.user?.email,
    avatar: raw.user?.avatarUrl,
    bio: raw.bio,
    city: raw.city ?? '',
    rating: raw.avgRating ?? 0,
    reviewCount: raw.totalJobs ?? 0,
    completedBookings: raw.totalJobs ?? 0,
    isActive: raw.isAvailable ?? true,
    isVerified: raw.aadhaarVerified ?? false,
    customPrice: raw.providerServices?.[0]?.customPrice,
    distance: raw.distance ?? null,
  };
}

export interface GetProvidersParams {
  serviceId?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  minRating?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProviderService {
  id: string;
  serviceId: string;
  providerId: string;
  customPrice?: number;
  isActive: boolean;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  city?: string;
}

export interface PortfolioItem {
  id: string;
  providerId: string;
  mediaUrl: string;
  mediaType: string;
  caption?: string;
  createdAt: string;
}

export const providerService = {
  getProviders: async (params?: GetProvidersParams): Promise<{ providers: Provider[]; total: number }> => {
    const response = await api.get('/providers', { params });
    const raw = response.data.data ?? response.data;
    return { providers: Array.isArray(raw) ? raw.map(mapProvider) : [], total: response.data.meta?.total ?? 0 };
  },

  getProviderById: async (id: string): Promise<Provider> => {
    const response = await api.get(`/providers/${id}`);
    const raw = response.data.data ?? response.data;
    return mapProvider(raw);
  },

  addFavorite: async (providerId: string): Promise<void> => {
    await api.post(`/providers/${providerId}/favorite`);
  },

  removeFavorite: async (providerId: string): Promise<void> => {
    await api.delete(`/providers/${providerId}/favorite`);
  },

  getFavorites: async (): Promise<Provider[]> => {
    const response = await api.get('/favorites');
    return response.data;
  },

  // Provider self-management
  getOwnProfile: async (): Promise<Provider> => {
    const response = await api.get('/provider/profile');
    const raw = response.data.data ?? response.data;
    return mapProvider(raw);
  },

  updateProfile: async (data: UpdateProfileData): Promise<Provider> => {
    const response = await api.patch('/provider/profile', data);
    const raw = response.data.data ?? response.data;
    return mapProvider(raw);
  },

  getOwnServices: async (): Promise<ProviderService[]> => {
    const response = await api.get('/provider/services');
    return response.data;
  },

  addService: async (serviceId: string, customPrice?: number): Promise<ProviderService> => {
    const response = await api.post('/provider/services', { serviceId, customPrice });
    return response.data;
  },

  removeService: async (serviceId: string): Promise<void> => {
    await api.delete(`/provider/services/${serviceId}`);
  },

  updateServicePrice: async (serviceId: string, customPrice: number): Promise<ProviderService> => {
    const response = await api.patch(`/provider/services/${serviceId}`, { customPrice });
    return response.data;
  },

  // Portfolio management
  addPortfolioItem: async (mediaUrl: string, mediaType: string, caption?: string): Promise<PortfolioItem> => {
    const response = await api.post('/provider/portfolio', { mediaUrl, mediaType, caption });
    return response.data;
  },

  removePortfolioItem: async (id: string): Promise<void> => {
    await api.delete(`/provider/portfolio/${id}`);
  },
};
