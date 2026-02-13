import { useState, useCallback } from "react";
import * as Location from "expo-location";
import { useAuthStore } from "@/store/authStore";

export function useLocation() {
  const setCity = useAuthStore((s) => s.setCity);
  const setLocation = useAuthStore((s) => s.setLocation);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [city, setLocalCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        setLoading(false);
        return false;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setLat(coords.lat);
      setLng(coords.lng);
      setLocation(coords.lat, coords.lng);

      const geocode = await Location.reverseGeocodeAsync({
        latitude: coords.lat,
        longitude: coords.lng,
      });

      if (geocode.length > 0) {
        const detectedCity =
          geocode[0].city ||
          geocode[0].subregion ||
          geocode[0].region ||
          "Unknown";
        setLocalCity(detectedCity);
        setCity(detectedCity);
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to get location");
      setLoading(false);
      return false;
    }
  }, [setCity, setLocation]);

  return { city, lat, lng, loading, error, requestPermission };
}
