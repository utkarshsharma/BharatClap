export enum PaymentStatus {
  PENDING = 'PENDING',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface PaymentSummary {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  commission: number;
  providerPayout: number;
  payoutStatus: PayoutStatus;
  createdAt: string;
}
