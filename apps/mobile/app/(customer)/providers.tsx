import "../../global.css";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { providerService, type Provider } from "@/services/providers";
import { useBookingStore } from "@/store/bookingStore";
import { useAuthStore } from "@/store/authStore";
import { formatRating, formatCurrency } from "@/utils/format";

type SortOption = "rating" | "price" | "distance";

export default function ProviderSelectionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    serviceId,
    serviceName,
    serviceSlug,
    servicePrice,
  } = useLocalSearchParams<{
    serviceId: string;
    serviceName: string;
    serviceSlug: string;
    servicePrice: string;
  }>();

  const setSelectedService = useBookingStore((s) => s.setSelectedService);
  const setSelectedProvider = useBookingStore((s) => s.setSelectedProvider);
  const userLat = useAuthStore((s) => s.lat);
  const userLng = useAuthStore((s) => s.lng);
  const userCity = useAuthStore((s) => s.city);

  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [togglingFavId, setTogglingFavId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["providers", serviceId, userLat, userLng, userCity],
    queryFn: () =>
      providerService.getProviders({
        serviceId,
        city: userCity || undefined,
        lat: userLat ?? undefined,
        lng: userLng ?? undefined,
      }),
    enabled: !!serviceId,
  });

  const { data: favorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => providerService.getFavorites(),
  });

  const favoriteIds = React.useMemo(
    () => new Set((favorites ?? []).map((f) => f.id)),
    [favorites]
  );

  const providers = React.useMemo(() => {
    const list = data?.providers ?? [];
    const sorted = [...list];
    if (sortBy === "rating") {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "distance") {
      sorted.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else {
      sorted.sort((a, b) => ((a as any).customPrice ?? Infinity) - ((b as any).customPrice ?? Infinity));
    }
    return sorted;
  }, [data, sortBy]);

  const handleSelectProvider = (provider: Provider) => {
    setSelectedService({
      id: serviceId!,
      name: serviceName ?? "Service",
      slug: serviceSlug ?? "",
      basePrice: Number(servicePrice) || 0,
    });
    setSelectedProvider({
      id: provider.id,
      name: provider.name,
      city: provider.city,
      rating: provider.rating,
      reviewCount: provider.reviewCount,
      customPrice: provider.customPrice,
    });
    router.push("/(customer)/booking" as any);
  };

  const handleViewProfile = (provider: Provider) => {
    router.push(`/(customer)/provider/${provider.id}` as any);
  };

  const handleToggleFavorite = useCallback(async (provider: Provider) => {
    if (togglingFavId) return;
    setTogglingFavId(provider.id);
    try {
      if (favoriteIds.has(provider.id)) {
        await providerService.removeFavorite(provider.id);
      } else {
        await providerService.addFavorite(provider.id);
      }
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    } catch {
      Alert.alert("Error", "Failed to update favorite.");
    } finally {
      setTogglingFavId(null);
    }
  }, [togglingFavId, favoriteIds, queryClient]);

  const renderProviderCard = ({ item }: { item: Provider }) => {
    const isFav = favoriteIds.has(item.id);

    return (
      <View className="mx-5 mb-3 bg-white rounded-2xl border border-gray-100 p-4">
        <View className="flex-row items-start">
          {/* Avatar */}
          <View className="w-12 h-12 rounded-full bg-primary-50 items-center justify-center mr-3">
            <Text className="text-lg font-bold text-primary">
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-base font-bold text-secondary mr-2">
                {item.name}
              </Text>
              {item.isVerified && (
                <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-blue-600 font-semibold">{"\u2713"} Verified</Text>
                </View>
              )}
            </View>

            {/* Rating */}
            <View className="flex-row items-center mb-1">
              <Text className="text-sm text-yellow-500 mr-1">{"\u2605"}</Text>
              <Text className="text-sm font-semibold text-secondary mr-2">
                {formatRating(item.rating)}
              </Text>
              <Text className="text-xs text-gray-400">
                ({item.reviewCount} reviews)
              </Text>
            </View>

            {/* Stats */}
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-400">
                {item.completedBookings} bookings completed
              </Text>
              {item.distance != null && (
                <Text className="text-xs text-gray-400 ml-2">
                  {"\u2022"} {item.distance.toFixed(1)} km away
                </Text>
              )}
            </View>
          </View>

          {/* Price + Favorite */}
          <View className="items-end">
            <Text className="text-lg font-bold text-primary">
              {formatCurrency((item as any).customPrice ?? Number(servicePrice) ?? 0)}
            </Text>
            <TouchableOpacity
              onPress={() => handleToggleFavorite(item)}
              disabled={togglingFavId === item.id}
              className="mt-1 p-1"
              activeOpacity={0.6}
            >
              <Text style={{ fontSize: 20 }}>
                {isFav ? "\u2764\uFE0F" : "\uD83E\uDD0D"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row mt-3">
          <TouchableOpacity
            onPress={() => handleViewProfile(item)}
            className="flex-1 mr-2 py-2.5 rounded-xl border border-primary items-center"
            activeOpacity={0.7}
          >
            <Text className="text-primary text-sm font-bold">View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSelectProvider(item)}
            className="flex-1 ml-2 py-2.5 rounded-xl bg-primary items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white text-sm font-bold">Select</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary flex-1" numberOfLines={1}>
          Select Provider
        </Text>
      </View>

      {/* Sort Options */}
      <View className="flex-row px-5 py-3">
        <Text className="text-sm text-gray-500 mr-3 self-center">Sort by:</Text>
        <TouchableOpacity
          onPress={() => setSortBy("rating")}
          className={`px-4 py-1.5 rounded-full mr-2 ${
            sortBy === "rating" ? "bg-primary" : "bg-gray-100"
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-sm font-semibold ${
              sortBy === "rating" ? "text-white" : "text-gray-600"
            }`}
          >
            Rating
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSortBy("price")}
          className={`px-4 py-1.5 rounded-full mr-2 ${
            sortBy === "price" ? "bg-primary" : "bg-gray-100"
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-sm font-semibold ${
              sortBy === "price" ? "text-white" : "text-gray-600"
            }`}
          >
            Price
          </Text>
        </TouchableOpacity>
        {userLat != null && userLng != null && (
          <TouchableOpacity
            onPress={() => setSortBy("distance")}
            className={`px-4 py-1.5 rounded-full ${
              sortBy === "distance" ? "bg-primary" : "bg-gray-100"
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-semibold ${
                sortBy === "distance" ? "text-white" : "text-gray-600"
              }`}
            >
              Distance
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Provider List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#FF6B00" className="mt-12" />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => item.id}
          renderItem={renderProviderCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text style={{ fontSize: 48 }}>👷</Text>
              <Text className="text-lg font-semibold text-secondary mt-4">
                No providers available
              </Text>
              <Text className="text-sm text-gray-400 mt-1 text-center px-10">
                There are no providers for this service in your area yet
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
