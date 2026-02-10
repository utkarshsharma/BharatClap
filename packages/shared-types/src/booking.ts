export enum BookingStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  PROVIDER_ASSIGNED = 'PROVIDER_ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export interface CreateBookingDto {
  serviceId: string;
  providerId: string;
  addressId: string;
  scheduledDate: string;
  scheduledHour: number;
  customerNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface BookingSummary {
  id: string;
  status: BookingStatus;
  serviceName: string;
  providerName: string | null;
  scheduledDate: string;
  scheduledHour: number;
  amount: number;
  createdAt: string;
}
