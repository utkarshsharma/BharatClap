import Constants from 'expo-constants';

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:3000";

export const APP_NAME = "BharatClap";

export const APP_VERSION = Constants.expoConfig?.version || "1.0.0";

export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export const CONFIG = {
  API_URL,
  APP_NAME,
  APP_VERSION,
  GOOGLE_MAPS_API_KEY,
  DEFAULT_CITY: "Bangalore",
  PHONE_PREFIX: "+91",
  OTP_LENGTH: 6,
  MIN_BOOKING_ADVANCE_HOURS: 2,
  MAX_BOOKING_ADVANCE_DAYS: 30,
  RESULTS_PER_PAGE: 20,
  SEARCH_DEBOUNCE_MS: 300,
} as const;
