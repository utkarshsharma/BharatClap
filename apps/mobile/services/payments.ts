import api from './api';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export const paymentService = {
  getPayment: async (bookingId: string): Promise<Payment> => {
    const response = await api.get(`/payments/booking/${bookingId}`);
    return response.data;
  },

  createPaymentIntent: async (bookingId: string): Promise<{ clientSecret: string }> => {
    const response = await api.post(`/payments/booking/${bookingId}/intent`);
    return response.data;
  },

  confirmPayment: async (bookingId: string, paymentIntentId: string): Promise<Payment> => {
    const response = await api.post(`/payments/booking/${bookingId}/confirm`, { paymentIntentId });
    return response.data;
  },
};
