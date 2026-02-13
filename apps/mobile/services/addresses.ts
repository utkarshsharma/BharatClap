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
  pincode: string;
  lat?: number;
  lng?: number;
}

// Maps API address (addressLine, landmark, latitude, longitude) to mobile interface
function mapAddress(raw: any): Address {
  return {
    id: raw.id,
    label: raw.label,
    line1: raw.addressLine ?? raw.line1 ?? '',
    line2: raw.landmark ?? raw.line2,
    city: raw.city ?? '',
    state: raw.state ?? '',
    pincode: raw.pincode ?? '',
    lat: raw.latitude ?? raw.lat,
    lng: raw.longitude ?? raw.lng,
    isDefault: raw.isDefault ?? false,
  };
}

// Maps mobile fields to backend DTO fields
function toApiAddress(data: CreateAddressData) {
  return {
    label: data.label || 'Home',
    addressLine: data.line1,
    landmark: data.line2 || undefined,
    city: data.city,
    pincode: data.pincode,
    latitude: data.lat ?? 0,
    longitude: data.lng ?? 0,
  };
}

export const addressService = {
  getAll: async (): Promise<Address[]> => {
    const response = await api.get('/addresses');
    const raw = response.data.data ?? response.data;
    return Array.isArray(raw) ? raw.map(mapAddress) : [];
  },

  getById: async (id: string): Promise<Address> => {
    const response = await api.get(`/addresses/${id}`);
    const raw = response.data.data ?? response.data;
    return mapAddress(raw);
  },

  create: async (data: CreateAddressData): Promise<Address> => {
    const response = await api.post('/addresses', toApiAddress(data));
    return mapAddress(response.data.data ?? response.data);
  },

  update: async (id: string, data: Partial<CreateAddressData>): Promise<Address> => {
    const payload: any = {};
    if (data.label !== undefined) payload.label = data.label;
    if (data.line1 !== undefined) payload.addressLine = data.line1;
    if (data.line2 !== undefined) payload.landmark = data.line2;
    if (data.city !== undefined) payload.city = data.city;
    if (data.pincode !== undefined) payload.pincode = data.pincode;
    if (data.lat !== undefined) payload.latitude = data.lat;
    if (data.lng !== undefined) payload.longitude = data.lng;
    const response = await api.patch(`/addresses/${id}`, payload);
    return mapAddress(response.data.data ?? response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },

  setDefault: async (id: string): Promise<Address> => {
    const response = await api.patch(`/addresses/${id}/set-default`);
    return mapAddress(response.data.data ?? response.data);
  },
};
