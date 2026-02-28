import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'bharatclap_access_token',
  REFRESH_TOKEN: 'bharatclap_refresh_token',
  USER: 'bharatclap_user',
  ROLE: 'bharatclap_role',
  CITY: 'bharatclap_city',
  LAT: 'bharatclap_lat',
  LNG: 'bharatclap_lng',
  SELECTED_ADDRESS: 'bharatclap_selected_address',
} as const;

const DEFAULT_CITY = 'Mumbai';

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatar?: string;
}

export interface SelectedAddress {
  id: string;
  label: string;
  city: string;
  pincode: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: 'customer' | 'provider' | null;
  /** Derived from selectedAddress.city, falls back to DEFAULT_CITY */
  city: string;
  lat: number | null;
  lng: number | null;
  selectedAddress: SelectedAddress | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setRole: (role: 'customer' | 'provider') => void;
  setCity: (city: string) => void;
  setLocation: (lat: number, lng: number) => void;
  setSelectedAddress: (addr: SelectedAddress | null) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  role: null,
  city: DEFAULT_CITY,
  lat: null,
  lng: null,
  selectedAddress: null,
  isAuthenticated: false,
  isHydrated: false,

  setUser: (user) => {
    if (user) {
      SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
    } else {
      SecureStore.deleteItemAsync(KEYS.USER);
    }
    const state = get();
    set({
      user,
      isAuthenticated: !!(user && state.accessToken && state.role),
    });
  },

  setTokens: (accessToken, refreshToken) => {
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
    const state = get();
    set({
      accessToken,
      refreshToken,
      isAuthenticated: !!(state.user && accessToken && state.role),
    });
  },

  setRole: (role) => {
    SecureStore.setItemAsync(KEYS.ROLE, role);
    const state = get();
    set({
      role,
      isAuthenticated: !!(state.user && state.accessToken && role),
    });
  },

  setCity: (city) => {
    SecureStore.setItemAsync(KEYS.CITY, city);
    set({ city });
  },

  setLocation: (lat, lng) => {
    SecureStore.setItemAsync(KEYS.LAT, String(lat));
    SecureStore.setItemAsync(KEYS.LNG, String(lng));
    set({ lat, lng });
  },

  setSelectedAddress: (addr) => {
    if (addr) {
      SecureStore.setItemAsync(KEYS.SELECTED_ADDRESS, JSON.stringify(addr));
      SecureStore.setItemAsync(KEYS.CITY, addr.city);
      set({ selectedAddress: addr, city: addr.city });
    } else {
      SecureStore.deleteItemAsync(KEYS.SELECTED_ADDRESS);
      set({ selectedAddress: null, city: DEFAULT_CITY });
    }
  },

  logout: () => {
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    SecureStore.deleteItemAsync(KEYS.USER);
    SecureStore.deleteItemAsync(KEYS.ROLE);
    SecureStore.deleteItemAsync(KEYS.CITY);
    SecureStore.deleteItemAsync(KEYS.LAT);
    SecureStore.deleteItemAsync(KEYS.LNG);
    SecureStore.deleteItemAsync(KEYS.SELECTED_ADDRESS);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      role: null,
      city: DEFAULT_CITY,
      lat: null,
      lng: null,
      selectedAddress: null,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    const [accessToken, refreshToken, userJson, role, city, latStr, lngStr, addrJson] = await Promise.all([
      SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.getItemAsync(KEYS.USER),
      SecureStore.getItemAsync(KEYS.ROLE),
      SecureStore.getItemAsync(KEYS.CITY),
      SecureStore.getItemAsync(KEYS.LAT),
      SecureStore.getItemAsync(KEYS.LNG),
      SecureStore.getItemAsync(KEYS.SELECTED_ADDRESS),
    ]);

    const user = userJson ? (JSON.parse(userJson) as User) : null;
    const validRole = role === 'customer' || role === 'provider' ? role : null;
    const lat = latStr ? parseFloat(latStr) : null;
    const lng = lngStr ? parseFloat(lngStr) : null;
    const selectedAddress = addrJson ? (JSON.parse(addrJson) as SelectedAddress) : null;
    // Derive city: address city > stored city > default
    const derivedCity = selectedAddress?.city ?? city ?? DEFAULT_CITY;

    set({
      accessToken,
      refreshToken,
      user,
      role: validRole,
      city: derivedCity,
      lat: lat !== null && !isNaN(lat) ? lat : null,
      lng: lng !== null && !isNaN(lng) ? lng : null,
      selectedAddress,
      isAuthenticated: !!(user && accessToken && validRole),
      isHydrated: true,
    });
  },
}));

export const hydrate = () => useAuthStore.getState().hydrate();
