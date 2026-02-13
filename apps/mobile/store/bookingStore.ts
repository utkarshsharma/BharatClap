import { create } from 'zustand';

interface Service {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
}

interface Provider {
  id: string;
  name: string;
  city?: string;
  rating: number;
  reviewCount: number;
}

interface Address {
  id?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

interface BookingState {
  selectedService: Service | null;
  selectedProvider: Provider | null;
  selectedDate: string | null;
  selectedHour: number | null;
  selectedAddress: Address | null;
  customerNotes: string;
  emergencyContact: string;
  step: number;
  setSelectedService: (service: Service) => void;
  setSelectedProvider: (provider: Provider) => void;
  setSelectedDate: (date: string) => void;
  setSelectedHour: (hour: number) => void;
  setSelectedAddress: (address: Address) => void;
  setCustomerNotes: (notes: string) => void;
  setEmergencyContact: (contact: string) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
}

const initialState = {
  selectedService: null,
  selectedProvider: null,
  selectedDate: null,
  selectedHour: null,
  selectedAddress: null,
  customerNotes: '',
  emergencyContact: '',
  step: 1,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,
  setSelectedService: (service) => set({ selectedService: service }),
  setSelectedProvider: (provider) => set({ selectedProvider: provider }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedHour: (hour) => set({ selectedHour: hour }),
  setSelectedAddress: (address) => set({ selectedAddress: address }),
  setCustomerNotes: (notes) => set({ customerNotes: notes }),
  setEmergencyContact: (contact) => set({ emergencyContact: contact }),
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  previousStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
  reset: () => set(initialState),
}));
