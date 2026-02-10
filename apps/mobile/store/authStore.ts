import { create } from 'zustand';

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: 'customer' | 'provider' | null;
  city: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setRole: (role: 'customer' | 'provider') => void;
  setCity: (city: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  role: null,
  city: null,
  get isAuthenticated() {
    const state = get();
    return !!(state.user && state.accessToken && state.role);
  },
  setUser: (user) => set({ user }),
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
  setRole: (role) => set({ role }),
  setCity: (city) => set({ city }),
  logout: () => set({
    user: null,
    accessToken: null,
    refreshToken: null,
    role: null,
    city: null,
  }),
}));
