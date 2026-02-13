import api from './api';

export interface Address {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

export interface CreateAddressData {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

export const addressService = {
  getAll: async (): Promise<Address[]> => {
    const response = await api.get('/addresses');
    return response.data;
  },

  getById: async (id: string): Promise<Address> => {
    const response = await api.get(`/addresses/${id}`);
    return response.data;
  },

  create: async (data: CreateAddressData): Promise<Address> => {
    const response = await api.post('/addresses', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateAddressData>): Promise<Address> => {
    const response = await api.patch(`/addresses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },

  setDefault: async (id: string): Promise<Address> => {
    const response = await api.patch(`/addresses/${id}/set-default`);
    return response.data;
  },
};
