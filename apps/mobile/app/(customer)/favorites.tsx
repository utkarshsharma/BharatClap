import "../../global.css";
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { providerService, type Provider } from "@/services/providers";
import { formatRating } from "@/utils/format";

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

export default function FavoritesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: favorites,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => providerService.getFavorites(),
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (providerId: string) => providerService.removeFavorite(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message ?? "Failed to remove from favorites.");
    },
  });

  const handleRemoveFavorite = (provider: Provider) => {
    Alert.alert(
      "Remove Favorite",
      `Remove ${provider.name} from your favorites?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeFavoriteMutation.mutate(provider.id),
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderProviderCard = ({ item }: { item: Provider }) => {
    const avatarColor = getAvatarColor(item.name);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(customer)/provider/${item.id}` as any)}
        className="mx-5 mb-3 bg-white rounded-2xl border border-gray-100 p-4"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          {/* Avatar */}
          <View
            className="w-14 h-14 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: avatarColor }}
          >
            <Text className="text-xl font-bold text-white">
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Info */}
          <View className="flex-1">
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

            {/* Rating */}
            <View className="flex-row items-center mb-0.5">
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

            {/* City */}
            <Text className="text-xs text-gray-400">{item.city}</Text>
          </View>

          {/* Favorite Heart Button */}
          <TouchableOpacity
            onPress={() => handleRemoveFavorite(item)}
            disabled={removeFavoriteMutation.isPending}
            className="p-2"
          >
            <Text style={{ fontSize: 22 }}>{"\u2764\uFE0F"}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-sm text-gray-500 mt-3">Loading favorites...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">Saved Providers</Text>
      </View>

      <FlatList
        data={favorites ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderProviderCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B00"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text style={{ fontSize: 48 }}>{"\uD83E\uDD0D"}</Text>
            <Text className="text-lg font-semibold text-secondary mt-4">
              No favorite providers yet
            </Text>
            <Text className="text-sm text-gray-400 mt-2 text-center px-10">
              When you find a provider you like, tap the heart icon to save them here
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(customer)/(tabs)" as any)}
              className="mt-6 px-6 py-3 rounded-xl bg-primary"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold">Browse Services</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}
