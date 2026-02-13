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
    const raw = response.data.data ?? response.data;
    if (!Array.isArray(raw)) return [];
    return raw.map((fav: any) => {
      // Each favorite has a `provider` relation with user data
      if (fav.provider) {
        return {
          id: fav.provider.providerProfile?.id ?? fav.providerId ?? fav.provider.id,
          name: fav.provider.name ?? fav.provider.user?.name ?? 'Provider',
          phone: fav.provider.phone ?? fav.provider.user?.phone ?? '',
          email: fav.provider.email ?? fav.provider.user?.email,
          avatar: fav.provider.avatarUrl ?? fav.provider.user?.avatarUrl,
          bio: fav.provider.providerProfile?.bio ?? fav.provider.bio,
          city: fav.provider.city ?? fav.provider.user?.city ?? '',
          rating: fav.provider.providerProfile?.avgRating ?? fav.provider.avgRating ?? 0,
          reviewCount: fav.provider.providerProfile?.totalJobs ?? fav.provider.totalJobs ?? 0,
          completedBookings: fav.provider.providerProfile?.totalJobs ?? fav.provider.totalJobs ?? 0,
          isActive: true,
          isVerified: fav.provider.providerProfile?.aadhaarVerified ?? fav.provider.aadhaarVerified ?? false,
          isFavorite: true,
        };
      }
      // Fallback: raw might already be a provider-like object
      return mapProvider(fav);
    });
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
