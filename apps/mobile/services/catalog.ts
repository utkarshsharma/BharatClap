import api from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  categoryId: string;
  category?: Category;
  estimatedDuration: number;
  isActive: boolean;
}

export interface GetServicesParams {
  categorySlug?: string;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const catalogService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data.data ?? response.data;
  },

  getCategoryBySlug: async (slug: string): Promise<Category> => {
    const response = await api.get(`/categories/${slug}`);
    return response.data.data ?? response.data;
  },

  getServices: async (params?: GetServicesParams): Promise<{ services: Service[]; total: number }> => {
    const response = await api.get('/services', { params });
    return { services: response.data.data ?? response.data, total: response.data.meta?.total ?? 0 };
  },

  getServiceBySlug: async (slug: string): Promise<Service> => {
    const response = await api.get(`/services/${slug}`);
    return response.data.data ?? response.data;
  },
};
