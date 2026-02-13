import "../../../global.css";
import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { catalogService, type Category, type Service } from "@/services/catalog";
import { notificationService } from "@/services/notifications";
import { useAuthStore } from "@/store/authStore";
import { useLocation } from "@/hooks/useLocation";
import { formatCurrency } from "@/utils/format";
import { CONFIG } from "@/constants/config";

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.2090 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Pune: { lat: 18.5204, lng: 73.8567 },
};

const CITIES = Object.keys(CITY_COORDS);

const CATEGORY_ICONS: Record<string, string> = {
  "salon-women": "\uD83D\uDC87\u200D\u2640\uFE0F",
  "salon-men": "\uD83D\uDC88",
  "ac-appliance": "\u2744\uFE0F",
  cleaning: "\uD83E\uDDF9",
  electrician: "\u26A1",
  plumber: "\uD83D\uDD27",
  painter: "\uD83C\uDFA8",
  "pest-control": "\uD83D\uDC1B",
};

export default function CustomerHomeScreen() {
  const router = useRouter();
  const city = useAuthStore((s) => s.city) ?? CONFIG.DEFAULT_CITY;
  const storedLat = useAuthStore((s) => s.lat);
  const setCity = useAuthStore((s) => s.setCity);
  const setLocation = useAuthStore((s) => s.setLocation);
  const { requestPermission } = useLocation();
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Auto-detect location on first launch if no coords stored
  useEffect(() => {
    if (storedLat === null) {
      requestPermission();
    }
  }, []);

  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: catalogService.getCategories,
  });

  const {
    data: popularData,
    isLoading: servicesLoading,
    isError: servicesError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ["popular-services"],
    queryFn: () => catalogService.getServices({ limit: 10 }),
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["unread-notifications"],
    queryFn: notificationService.getUnreadCount,
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchServices()]);
    setRefreshing(false);
  }, [refetchCategories, refetchServices]);

  const popularServices = popularData?.services ?? [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />
        }
      >
        {/* City Picker Modal */}
        <Modal
          visible={cityModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCityModalVisible(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-center items-center"
            activeOpacity={1}
            onPress={() => setCityModalVisible(false)}
          >
            <View className="bg-white rounded-2xl w-4/5 p-5" onStartShouldSetResponder={() => true}>
              <Text className="text-xl font-bold text-secondary mb-4 text-center">Select City</Text>
              {CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setCity(c);
                    const coords = CITY_COORDS[c];
                    if (coords) {
                      setLocation(coords.lat, coords.lng);
                    }
                    setCityModalVisible(false);
                  }}
                  className="py-3 border-b border-gray-100"
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-base text-center ${
                      c === city ? "font-bold text-primary" : "text-secondary"
                    }`}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setCityModalVisible(false)}
                className="mt-4 py-3 bg-gray-100 rounded-xl"
                activeOpacity={0.7}
              >
                <Text className="text-base font-semibold text-secondary text-center">Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <TouchableOpacity onPress={() => setCityModalVisible(true)} activeOpacity={0.7}>
            <Text className="text-sm text-gray-500">Your location</Text>
            <Text className="text-lg font-bold text-secondary">{city} ▼</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(customer)/notifications" as any)}
            className="relative p-2"
          >
            <Text style={{ fontSize: 24 }}>🔔</Text>
            {(unreadCount ?? 0) > 0 && (
              <View className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {unreadCount! > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          onPress={() => router.push("/(customer)/search" as any)}
          className="mx-5 mt-3 mb-5 flex-row items-center bg-gray-100 rounded-xl px-4 py-3"
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18 }}>🔍</Text>
          <Text className="ml-3 text-base text-gray-400 flex-1">
            Search for services...
          </Text>
        </TouchableOpacity>

        {/* Categories */}
        <View className="px-5 mb-5">
          <Text className="text-xl font-bold text-secondary mb-4">Categories</Text>
          {categoriesLoading ? (
            <ActivityIndicator size="small" color="#FF6B00" className="py-8" />
          ) : categoriesError ? (
            <View className="items-center py-8">
              <Text className="text-sm text-red-500 mb-3">
                Could not load categories. Check your connection.
              </Text>
              <TouchableOpacity
                onPress={() => refetchCategories()}
                className="px-5 py-2 rounded-lg bg-primary"
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-sm">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row flex-wrap">
              {(categories ?? []).map((cat: Category) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => router.push(`/(customer)/category/${cat.slug}` as any)}
                  className="w-1/2 p-1.5"
                  activeOpacity={0.7}
                >
                  <View className="bg-primary-50 rounded-2xl p-4 items-center">
                    <Text style={{ fontSize: 32 }}>
                      {CATEGORY_ICONS[cat.slug] ?? "📋"}
                    </Text>
                    <Text className="text-sm font-semibold text-secondary mt-2 text-center">
                      {cat.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Popular Services */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text className="text-xl font-bold text-secondary">Popular Services</Text>
            <TouchableOpacity onPress={() => router.push("/(customer)/search" as any)}>
              <Text className="text-sm font-semibold text-primary">See All</Text>
            </TouchableOpacity>
          </View>
          {servicesLoading ? (
            <ActivityIndicator size="small" color="#FF6B00" className="py-8" />
          ) : servicesError ? (
            <View className="items-center py-8 px-5">
              <Text className="text-sm text-red-500 mb-3">
                Could not load services. Check your connection.
              </Text>
              <TouchableOpacity
                onPress={() => refetchServices()}
                className="px-5 py-2 rounded-lg bg-primary"
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-sm">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={popularServices}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              renderItem={({ item }: { item: Service }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/(customer)/service/${item.slug}` as any)}
                  className="mr-3 bg-white rounded-2xl border border-gray-100 p-4"
                  style={{ width: 180 }}
                  activeOpacity={0.7}
                >
                  <Text className="text-base font-bold text-secondary mb-1" numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text className="text-xs text-gray-500 mb-3" numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text className="text-base font-bold text-primary">
                    {formatCurrency(item.basePrice)}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="items-center py-8 px-4">
                  <Text className="text-gray-400 text-sm">No services available yet</Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
