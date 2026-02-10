export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN'
}

export enum KycStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  avatarUrl: string | null;
  firebaseUid: string;
  preferredLanguage: string;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderProfileSummary {
  id: string;
  userId: string;
  bio: string | null;
  kycStatus: KycStatus;
  aadhaarVerified: boolean;
  avgRating: number;
  totalJobs: number;
  isAvailable: boolean;
  yearsExperience: number | null;
}
