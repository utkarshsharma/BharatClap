import "../../../global.css";
import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { catalogService, type Category, type Service } from "@/services/catalog";
import { notificationService } from "@/services/notifications";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/format";
import { CONFIG } from "@/constants/config";

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

  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: catalogService.getCategories,
  });

  const {
    data: popularData,
    isLoading: servicesLoading,
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
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <View>
            <Text className="text-sm text-gray-500">Your location</Text>
            <Text className="text-lg font-bold text-secondary">{city} ▼</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(customer)/search" as any)}
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
