import api from './api';

export interface Review {
  id: string;
  bookingId: string;
  providerId: string;
  customerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewData {
  rating: number;
  comment?: string;
}

export interface GetReviewsParams {
  page?: number;
  limit?: number;
}

export const reviewService = {
  createReview: async (bookingId: string, data: CreateReviewData): Promise<Review> => {
    const response = await api.post(`/bookings/${bookingId}/review`, data);
    return response.data;
  },

  getProviderReviews: async (
    providerId: string,
    params?: GetReviewsParams
  ): Promise<{ reviews: Review[]; total: number; avgRating: number }> => {
    const response = await api.get(`/providers/${providerId}/reviews`, { params });
    const raw = response.data.data ?? response.data;
    return {
      reviews: Array.isArray(raw) ? raw : (raw.reviews ?? []),
      total: response.data.meta?.total ?? raw.total ?? 0,
      avgRating: response.data.avgRating ?? raw.avgRating ?? 0,
    };
  },

  getBookingReview: async (bookingId: string): Promise<Review> => {
    const response = await api.get(`/bookings/${bookingId}/review`);
    return response.data;
  },
};
