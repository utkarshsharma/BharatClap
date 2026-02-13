import "../../global.css";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useAuthStore } from "@/store/authStore";

const SUPPORTED_CITIES = [
  { name: "Delhi NCR", icon: "\uD83C\uDFDB\uFE0F" },
  { name: "Mumbai", icon: "\uD83C\uDFD9\uFE0F" },
  { name: "Bangalore", icon: "\uD83D\uDCBB" },
  { name: "Hyderabad", icon: "\uD83C\uDFF0" },
  { name: "Chennai", icon: "\uD83C\uDFD6\uFE0F" },
  { name: "Kolkata", icon: "\uD83C\uDF09" },
  { name: "Pune", icon: "\u26F0\uFE0F" },
];

type LocationState =
  | "loading"
  | "detected"
  | "denied"
  | "error"
  | "manual";

export default function LocationScreen() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const setCity = useAuthStore((s) => s.setCity);

  const [locationState, setLocationState] =
    useState<LocationState>("loading");
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(true);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    setIsRequesting(true);
    setLocationState("loading");

    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationState("denied");
        setIsRequesting(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [reverseGeocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode) {
        const city =
          reverseGeocode.city ||
          reverseGeocode.subregion ||
          reverseGeocode.region ||
          null;

        if (city) {
          // Try to match to a supported city
          const matched = matchCity(city);
          setDetectedCity(matched || city);
          setSelectedCity(matched || city);
          setLocationState("detected");
        } else {
          setLocationState("denied");
        }
      } else {
        setLocationState("denied");
      }
    } catch (error) {
      console.warn("Location error:", error);
      setLocationState("error");
    } finally {
      setIsRequesting(false);
    }
  };

  const matchCity = (detected: string): string | null => {
    const lower = detected.toLowerCase();

    // Check for common aliases
    if (
      lower.includes("delhi") ||
      lower.includes("new delhi") ||
      lower.includes("noida") ||
      lower.includes("gurgaon") ||
      lower.includes("gurugram") ||
      lower.includes("faridabad") ||
      lower.includes("ghaziabad")
    ) {
      return "Delhi NCR";
    }
    if (lower.includes("mumbai") || lower.includes("bombay")) {
      return "Mumbai";
    }
    if (
      lower.includes("bangalore") ||
      lower.includes("bengaluru")
    ) {
      return "Bangalore";
    }
    if (lower.includes("hyderabad")) return "Hyderabad";
    if (lower.includes("chennai") || lower.includes("madras")) {
      return "Chennai";
    }
    if (lower.includes("kolkata") || lower.includes("calcutta")) {
      return "Kolkata";
    }
    if (lower.includes("pune")) return "Pune";

    return null;
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
  };

  const handleContinue = () => {
    if (!selectedCity) {
      Alert.alert("Select City", "Please select a city to continue.");
      return;
    }

    setCity(selectedCity);

    if (role === "provider") {
      router.replace("/(provider)/(tabs)" as any);
    } else {
      router.replace("/(customer)/(tabs)" as any);
    }
  };

  const handleShowManualPicker = () => {
    setLocationState("manual");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header */}
        <View className="px-6 pt-12 mb-6">
          <Text className="text-3xl font-bold text-[#1A1A2E] mb-2">
            Your Location
          </Text>
          <Text className="text-base text-[#757575]">
            We need your city to show relevant services near you.
          </Text>
        </View>

        {/* Loading State */}
        {locationState === "loading" && isRequesting && (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text className="text-base font-semibold text-[#1A1A2E] mt-6">
              Detecting your location...
            </Text>
            <Text className="text-sm text-[#757575] mt-2 text-center px-8">
              Please allow location access when prompted
            </Text>
          </View>
        )}

        {/* Detected State */}
        {locationState === "detected" && detectedCity && (
          <View className="px-6">
            <View className="bg-green-50 border border-green-200 rounded-2xl p-6 items-center mb-6">
              <Text style={{ fontSize: 40, marginBottom: 12 }}>
                {"\uD83D\uDCCD"}
              </Text>
              <Text className="text-lg font-bold text-[#1A1A2E] mb-1">
                We detected you're in
              </Text>
              <Text className="text-2xl font-bold text-[#FF6B00]">
                {detectedCity}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleShowManualPicker}
              className="items-center mb-6"
              activeOpacity={0.7}
            >
              <Text className="text-sm text-[#FF6B00] font-semibold">
                Not your city? Choose manually
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Denied / Error / Manual State - Show City Picker */}
        {(locationState === "denied" ||
          locationState === "error" ||
          locationState === "manual") && (
          <View className="px-6">
            {locationState === "denied" && (
              <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <Text className="text-sm text-amber-800 font-semibold mb-1">
                  Location access not available
                </Text>
                <Text className="text-xs text-amber-700">
                  Please select your city manually from the list below.
                </Text>
              </View>
            )}

            {locationState === "error" && (
              <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                <Text className="text-sm text-red-700 font-semibold mb-1">
                  Could not detect location
                </Text>
                <Text className="text-xs text-red-600">
                  Please select your city manually from the list below.
                </Text>
              </View>
            )}

            <Text className="text-base font-bold text-[#1A1A2E] mb-4">
              Select your city
            </Text>

            {SUPPORTED_CITIES.map((city) => (
              <TouchableOpacity
                key={city.name}
                onPress={() => handleCitySelect(city.name)}
                activeOpacity={0.7}
                className={`flex-row items-center p-4 rounded-2xl border mb-3 ${
                  selectedCity === city.name
                    ? "bg-orange-50 border-[#FF6B00]"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text style={{ fontSize: 24 }} className="mr-4">
                  {city.icon}
                </Text>
                <Text
                  className={`text-base flex-1 ${
                    selectedCity === city.name
                      ? "font-bold text-[#FF6B00]"
                      : "font-medium text-[#1A1A2E]"
                  }`}
                >
                  {city.name}
                </Text>
                {selectedCity === city.name && (
                  <View className="w-6 h-6 rounded-full bg-[#FF6B00] items-center justify-center">
                    <Text className="text-white text-xs font-bold">
                      {"\u2713"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Continue Button */}
      {!isRequesting && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pb-8 pt-4">
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!selectedCity}
            className={`rounded-xl py-4 items-center ${
              selectedCity ? "bg-[#FF6B00]" : "bg-gray-300"
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-base font-bold ${
                selectedCity ? "text-white" : "text-gray-500"
              }`}
            >
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
