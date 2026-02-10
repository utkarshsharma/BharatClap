import api from './api';

export interface CreateBookingData {
  serviceId: string;
  providerId: string;
  scheduledDate: string;
  scheduledHour: number;
  addressId?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    lat?: number;
    lng?: number;
  };
  customerNotes?: string;
  emergencyContact?: string;
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
  createdAt: string;
  updatedAt: string;
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
    return response.data;
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
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
};
