import "../../global.css";
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";

const SUPPORTED_CITIES = [
  { name: "Delhi NCR", icon: "\uD83C\uDFDB\uFE0F" },
  { name: "Mumbai", icon: "\uD83C\uDFD6\uFE0F" },
  { name: "Bangalore", icon: "\uD83D\uDCBB" },
  { name: "Hyderabad", icon: "\uD83C\uDFB0" },
  { name: "Chennai", icon: "\uD83C\uDFDB\uFE0F" },
  { name: "Kolkata", icon: "\uD83C\uDF09" },
  { name: "Pune", icon: "\u26F0\uFE0F" },
] as const;

export default function CitySelectScreen() {
  const router = useRouter();
  const currentCity = useAuthStore((s) => s.city);
  const setCity = useAuthStore((s) => s.setCity);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return SUPPORTED_CITIES;
    const query = searchQuery.toLowerCase().trim();
    return SUPPORTED_CITIES.filter((city) =>
      city.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleCitySelect = (cityName: string) => {
    setCity(cityName);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 p-1"
          activeOpacity={0.7}
        >
          <Text className="text-2xl text-secondary">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary flex-1">
          Select City
        </Text>
      </View>

      {/* Search Input */}
      <View className="px-5 py-4">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Text className="text-lg mr-3">{"\uD83D\uDD0D"}</Text>
          <TextInput
            className="flex-1 text-base text-secondary"
            placeholder="Search cities..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text className="text-gray-400 text-lg">{"\u2715"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Info */}
      <View className="px-5 pb-3">
        <Text className="text-xs text-gray-400">
          BharatClap is currently available in {SUPPORTED_CITIES.length} cities
        </Text>
      </View>

      {/* City List */}
      <FlatList
        data={filteredCities}
        keyExtractor={(item) => item.name}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = item.name === currentCity;
          return (
            <TouchableOpacity
              onPress={() => handleCitySelect(item.name)}
              className={`flex-row items-center py-4 px-4 mb-2 rounded-xl border ${
                isSelected
                  ? "border-primary bg-orange-50"
                  : "border-gray-100 bg-white"
              }`}
              activeOpacity={0.7}
            >
              {/* City Icon */}
              <Text className="text-2xl mr-4">{item.icon}</Text>

              {/* City Name */}
              <Text
                className={`text-base flex-1 ${
                  isSelected
                    ? "text-primary font-bold"
                    : "text-secondary font-medium"
                }`}
              >
                {item.name}
              </Text>

              {/* Radio Indicator */}
              <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  isSelected ? "border-primary" : "border-gray-300"
                }`}
              >
                {isSelected && (
                  <View className="w-3.5 h-3.5 rounded-full bg-primary" />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-4xl mb-4">{"\uD83C\uDFD9\uFE0F"}</Text>
            <Text className="text-base text-gray-500">
              No cities match "{searchQuery}"
            </Text>
            <Text className="text-sm text-gray-400 mt-1">
              Try a different search term
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
