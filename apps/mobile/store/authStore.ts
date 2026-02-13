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
} as const;

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
  lat: number | null;
  lng: number | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setRole: (role: 'customer' | 'provider') => void;
  setCity: (city: string) => void;
  setLocation: (lat: number, lng: number) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  role: null,
  city: null,
  lat: null,
  lng: null,
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

  logout: () => {
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    SecureStore.deleteItemAsync(KEYS.USER);
    SecureStore.deleteItemAsync(KEYS.ROLE);
    SecureStore.deleteItemAsync(KEYS.CITY);
    SecureStore.deleteItemAsync(KEYS.LAT);
    SecureStore.deleteItemAsync(KEYS.LNG);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      role: null,
      city: null,
      lat: null,
      lng: null,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    const [accessToken, refreshToken, userJson, role, city, latStr, lngStr] = await Promise.all([
      SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.getItemAsync(KEYS.USER),
      SecureStore.getItemAsync(KEYS.ROLE),
      SecureStore.getItemAsync(KEYS.CITY),
      SecureStore.getItemAsync(KEYS.LAT),
      SecureStore.getItemAsync(KEYS.LNG),
    ]);

    const user = userJson ? (JSON.parse(userJson) as User) : null;
    const validRole = role === 'customer' || role === 'provider' ? role : null;
    const lat = latStr ? parseFloat(latStr) : null;
    const lng = lngStr ? parseFloat(lngStr) : null;

    set({
      accessToken,
      refreshToken,
      user,
      role: validRole,
      city,
      lat: lat !== null && !isNaN(lat) ? lat : null,
      lng: lng !== null && !isNaN(lng) ? lng : null,
      isAuthenticated: !!(user && accessToken && validRole),
      isHydrated: true,
    });
  },
}));

export const hydrate = () => useAuthStore.getState().hydrate();
