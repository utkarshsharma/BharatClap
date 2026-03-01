import "../../../global.css";
import React, { useState, useMemo, useCallback } from "react";
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

type SortOption = "rating" | "distance" | "price";

const AVATAR_COLORS = [
  "#FF6B00",
  "#1A1A2E",
  "#2563EB",
  "#059669",
  "#7C3AED",
  "#DC2626",
  "#D97706",
  "#0891B2",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function SelectProviderScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    serviceId: string;
    serviceName: string;
    serviceSlug: string;
    servicePrice: string;
  }>();

  const selectedService = useBookingStore((s) => s.selectedService);
  const setSelectedService = useBookingStore((s) => s.setSelectedService);
  const setSelectedProvider = useBookingStore((s) => s.setSelectedProvider);

  // Use serviceId from route params or from booking store
  const serviceId = params.serviceId ?? selectedService?.id;
  const serviceName = params.serviceName ?? selectedService?.name ?? "Service";
  const serviceSlug = params.serviceSlug ?? selectedService?.slug ?? "";
  const servicePrice = params.servicePrice ?? String(selectedService?.basePrice ?? 0);

  const lat = useAuthStore((s) => s.lat);
  const lng = useAuthStore((s) => s.lng);
  const userCity = useAuthStore((s) => s.city);

  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [togglingFavId, setTogglingFavId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["providers", serviceId, lat, lng, userCity],
    queryFn: () =>
      providerService.getProviders({
        serviceId,
        city: userCity || undefined,
        ...(lat !== null && lng !== null ? { lat, lng } : {}),
      }),
    enabled: !!serviceId,
  });

  const { data: favorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => providerService.getFavorites(),
  });

  const favoriteIds = useMemo(
    () => new Set((favorites ?? []).map((f) => f.id)),
    [favorites]
  );

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

  const providers = useMemo(() => {
    const list = data?.providers ?? [];
    const sorted = [...list];
    if (sortBy === "rating") {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price") {
      sorted.sort(
        (a, b) =>
          ((a as any).customPrice ?? Number(servicePrice)) -
          ((b as any).customPrice ?? Number(servicePrice))
      );
    } else if (sortBy === "distance") {
      // Distance sort — use distance field if available, otherwise keep original order
      sorted.sort(
        (a, b) => ((a as any).distance ?? 9999) - ((b as any).distance ?? 9999)
      );
    }
    return sorted;
  }, [data, sortBy, servicePrice]);

  const handleViewProfile = (provider: Provider) => {
    router.push(`/(customer)/provider/${provider.id}` as any);
  };

  const handleSelectProvider = (provider: Provider) => {
    if (serviceId) {
      setSelectedService({
        id: serviceId,
        name: serviceName,
        slug: serviceSlug,
        basePrice: Number(servicePrice) || 0,
      });
    }
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

  const renderSortButton = (option: SortOption, label: string) => (
    <TouchableOpacity
      onPress={() => setSortBy(option)}
      className={`px-4 py-1.5 rounded-full mr-2 ${
        sortBy === option ? "bg-primary" : "bg-gray-100"
      }`}
      activeOpacity={0.7}
    >
      <Text
        className={`text-sm font-semibold ${
          sortBy === option ? "text-white" : "text-gray-600"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderProviderCard = ({ item }: { item: Provider }) => {
    const avatarColor = getAvatarColor(item.name);
    const price = (item as any).customPrice ?? Number(servicePrice) ?? 0;
    const isFav = favoriteIds.has(item.id);

    return (
      <View className="mx-5 mb-3 bg-white rounded-2xl border border-gray-100 p-4">
        <View className="flex-row items-start">
          {/* Avatar */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: avatarColor }}
          >
            <Text className="text-lg font-bold text-white">
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View className="flex-1">
            {/* Name + Verified */}
            <View className="flex-row items-center mb-1">
              <Text className="text-base font-bold text-secondary mr-2" numberOfLines={1}>
                {item.name}
              </Text>
              {item.isVerified && (
                <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-blue-600 font-semibold">
                    {"\u2713"} Verified
                  </Text>
                </View>
              )}
            </View>

            {/* Rating Stars */}
            <View className="flex-row items-center mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Text
                  key={star}
                  style={{ fontSize: 14 }}
                  className={
                    star <= Math.round(item.rating)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }
                >
                  {"\u2605"}
                </Text>
              ))}
              <Text className="text-sm font-semibold text-secondary ml-1">
                {formatRating(item.rating)}
              </Text>
              <Text className="text-xs text-gray-400 ml-1">
                ({item.reviewCount})
              </Text>
            </View>

            {/* Distance */}
            {(item as any).distance != null && (
              <Text className="text-xs text-gray-400">
                {Number((item as any).distance).toFixed(1)} km away
              </Text>
            )}
          </View>

          {/* Price + Favorite */}
          <View className="items-end">
            <Text className="text-lg font-bold text-primary">
              {formatCurrency(price)}
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
          <Text className="text-2xl text-secondary">{"\u2190"}</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-secondary" numberOfLines={1}>
            Select Provider
          </Text>
          {serviceName !== "Service" && (
            <Text className="text-xs text-gray-400" numberOfLines={1}>
              for {serviceName}
            </Text>
          )}
        </View>
      </View>

      {/* Sort Options */}
      <View className="flex-row px-5 py-3 items-center">
        <Text className="text-sm text-gray-500 mr-3">Sort by:</Text>
        {renderSortButton("rating", "Rating")}
        {renderSortButton("distance", "Distance")}
        {renderSortButton("price", "Price")}
      </View>

      {/* Provider List */}
      {!serviceId ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text style={{ fontSize: 48 }}>{"\uD83D\uDD0D"}</Text>
          <Text className="text-lg font-semibold text-secondary mt-4">
            No service selected
          </Text>
          <Text className="text-sm text-gray-400 mt-1 text-center">
            Please select a service first to see available providers
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 rounded-xl bg-primary"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text className="text-sm text-gray-500 mt-3">Finding providers...</Text>
        </View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => item.id}
          renderItem={renderProviderCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24, flexGrow: 1 }}
          onRefresh={() => refetch()}
          refreshing={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text style={{ fontSize: 48 }}>{"\uD83D\uDC77"}</Text>
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
