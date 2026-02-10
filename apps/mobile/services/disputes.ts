import api from './api';

export interface Dispute {
  id: string;
  bookingId: string;
  raisedBy: string;
  reason: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpenDisputeData {
  reason: string;
  description: string;
}

export interface RespondToDisputeData {
  response: string;
}

export const disputeService = {
  openDispute: async (bookingId: string, data: OpenDisputeData): Promise<Dispute> => {
    const response = await api.post(`/bookings/${bookingId}/dispute`, data);
    return response.data;
  },

  respondToDispute: async (id: string, data: RespondToDisputeData): Promise<Dispute> => {
    const response = await api.post(`/disputes/${id}/respond`, data);
    return response.data;
  },

  getDispute: async (id: string): Promise<Dispute> => {
    const response = await api.get(`/disputes/${id}`);
    return response.data;
  },

  getBookingDispute: async (bookingId: string): Promise<Dispute> => {
    const response = await api.get(`/bookings/${bookingId}/dispute`);
    return response.data;
  },
};
