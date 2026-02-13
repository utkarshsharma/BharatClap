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

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
}

export interface PaymentVerifyData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const paymentService = {
  getPayment: async (bookingId: string): Promise<Payment> => {
    const response = await api.get(`/payments/${bookingId}`);
    return response.data;
  },

  createPaymentOrder: async (bookingId: string): Promise<PaymentOrder> => {
    const response = await api.post(`/payments/${bookingId}/order`);
    return response.data;
  },

  verifyPayment: async (
    bookingId: string,
    data: PaymentVerifyData,
  ): Promise<{ verified: boolean; status: string }> => {
    const response = await api.post(`/payments/${bookingId}/verify`, data);
    return response.data;
  },

  getPaymentConfig: async (): Promise<{ keyId: string }> => {
    const response = await api.get('/payments/config');
    return response.data;
  },
};
