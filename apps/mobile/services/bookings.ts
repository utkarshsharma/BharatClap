import api from './api';

export interface CreateBookingData {
  serviceId: string;
  providerId: string;
  addressId: string;
  scheduledDate: string;
  scheduledHour: number;
  customerNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  providerId: string;
  customerId: string;
  status: string;
  scheduledDate: string;
  scheduledHour: number;
  address: any;
  customerNotes?: string;
  emergencyContact?: string;
  providerNotes?: string;
  verificationOtp?: string;
  completionOtp?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  finalPrice?: number;
  amount?: number;
  serviceName?: string;
  providerName?: string;
  customerName?: string;
  createdAt: string;
  updatedAt: string;
}

function mapBooking(raw: any): Booking {
  return {
    ...raw,
    serviceName: raw.service?.name ?? raw.serviceName,
    providerName: raw.provider?.name ?? raw.providerName,
    customerName: raw.customer?.name ?? raw.customerName,
    finalPrice: raw.finalPrice ?? raw.amount,
    address: raw.address
      ? {
          line1: raw.address.addressLine ?? raw.address.line1 ?? raw.address.label ?? '',
          line2: raw.address.line2,
          city: raw.address.city ?? '',
          state: raw.address.state ?? '',
          pincode: raw.address.pincode ?? '',
          lat: raw.address.lat,
          lng: raw.address.lng,
        }
      : undefined,
  };
}

export interface GetBookingsParams {
  status?: string;
  role?: 'customer' | 'provider';
  page?: number;
  limit?: number;
}

export const bookingService = {
  createBooking: async (data: CreateBookingData): Promise<Booking> => {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  getBookings: async (params?: GetBookingsParams): Promise<{ bookings: Booking[]; total: number }> => {
    const response = await api.get('/bookings', { params });
    const raw = response.data.data ?? response.data;
    return {
      bookings: Array.isArray(raw) ? raw.map(mapBooking) : [],
      total: response.data.meta?.total ?? 0,
    };
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`);
    const raw = response.data.data ?? response.data;
    return mapBooking(raw);
  },

  acceptBooking: async (id: string): Promise<Booking> => {
    const response = await api.post(`/bookings/${id}/accept`);
    return response.data;
  },

  rejectBooking: async (id: string, reason: string): Promise<Booking> => {
    const response = await api.post(`/bookings/${id}/reject`, { reason });
    return response.data;
  },

  verifyOtp: async (id: string, otp: string): Promise<Booking> => {
    const response = await api.post(`/bookings/${id}/verify-otp`, { otp });
    return response.data;
  },

  completeBooking: async (id: string, finalPrice?: number): Promise<Booking> => {
    const response = await api.post(`/bookings/${id}/complete`, { finalPrice });
    return response.data;
  },

  cancelBooking: async (id: string, reason: string): Promise<Booking> => {
    const response = await api.post(`/bookings/${id}/cancel`, { reason });
    return response.data;
  },

  rebookBooking: async (id: string): Promise<Booking> => {
    const response = await api.post(`/bookings/${id}/rebook`);
    return response.data;
  },

  devConfirmBooking: async (id: string): Promise<Booking> => {
    const response = await api.post(`/bookings/${id}/dev-confirm`);
    return response.data;
  },
};
