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
  search?: string;
  page?: number;
  limit?: number;
}

export const catalogService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/catalog/categories');
    return response.data;
  },

  getCategoryBySlug: async (slug: string): Promise<Category> => {
    const response = await api.get(`/catalog/categories/${slug}`);
    return response.data;
  },

  getServices: async (params?: GetServicesParams): Promise<{ services: Service[]; total: number }> => {
    const response = await api.get('/catalog/services', { params });
    return response.data;
  },

  getServiceBySlug: async (slug: string): Promise<Service> => {
    const response = await api.get(`/catalog/services/${slug}`);
    return response.data;
  },
};
