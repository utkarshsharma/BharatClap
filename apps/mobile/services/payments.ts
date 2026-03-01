import api from './api';
import { CONFIG } from '@/constants/config';

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

export interface PaymentInitiation {
  html: string;
  txnid: string;
  amount: number;
}

export interface PayuVerifyData {
  mihpayid: string;
  txnid: string;
  status: string;
  hash: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  error_Message?: string;
  udf1?: string;
}

export const paymentService = {
  getPayment: async (bookingId: string): Promise<Payment> => {
    const response = await api.get(`/payments/${bookingId}`);
    return response.data;
  },

  createPaymentOrder: async (bookingId: string): Promise<PaymentInitiation> => {
    const response = await api.post(`/payments/${bookingId}/order`, {
      callbackBaseUrl: CONFIG.API_URL,
    });
    return response.data;
  },

  autoPayTestMode: async (bookingId: string): Promise<{ autoPaid: boolean; status: string; bookingId: string }> => {
    const response = await api.post(`/payments/${bookingId}/order`, {
      autoPayTest: true,
    });
    return response.data;
  },

  verifyPayment: async (
    bookingId: string,
    data: PayuVerifyData,
  ): Promise<{ verified: boolean; status: string }> => {
    const response = await api.post(`/payments/${bookingId}/verify`, data);
    return response.data;
  },

  checkPaymentStatus: async (bookingId: string): Promise<{ status: string; captured: boolean }> => {
    const response = await api.get(`/payments/${bookingId}/status`);
    return response.data;
  },

  getPaymentConfig: async (): Promise<{ merchantKey: string; gateway: string }> => {
    const response = await api.get('/payments/config');
    return response.data;
  },
};
