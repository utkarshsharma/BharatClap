export interface Category {
  id: string;
  name: string;
  nameHi: string | null;
  nameMr: string | null;
  nameKn: string | null;
  slug: string;
  iconUrl: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  nameHi: string | null;
  nameMr: string | null;
  nameKn: string | null;
  slug: string;
  description: string | null;
  basePrice: number;
  durationMin: number;
  imageUrl: string | null;
  inclusions: string[];
  exclusions: string[];
  isActive: boolean;
}

export interface ProviderServiceListing {
  id: string;
  providerId: string;
  serviceId: string;
  customPrice: number;
  isActive: boolean;
}
