import api from './api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export const notificationService = {
  getNotifications: async (params?: GetNotificationsParams): Promise<{ notifications: Notification[]; total: number }> => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  registerDevice: async (token: string): Promise<void> => {
    await api.post('/notifications/device', { token });
  },

  unregisterDevice: async (token: string): Promise<void> => {
    await api.delete('/notifications/device', { data: { token } });
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },
};
