import "../../../global.css";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { catalogService, type Service } from "@/services/catalog";
import { formatCurrency, formatDuration } from "@/utils/format";

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: { elevation: 3 },
  default: {},
});

export default function CategoryDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: () => catalogService.getCategoryBySlug(slug!),
    enabled: !!slug,
  });

  const {
    data: servicesData,
    isLoading: servicesLoading,
    isError: servicesError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ["services", "category", slug],
    queryFn: () => catalogService.getServices({ categorySlug: slug }),
    enabled: !!slug,
  });

  const services = servicesData?.services ?? [];
  const isLoading = categoryLoading || servicesLoading;

  const renderServiceCard = ({ item }: { item: Service }) => {
    const inclusions = (item as any).inclusions as string[] | undefined;
    const exclusions = (item as any).exclusions as string[] | undefined;

    return (
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/(customer)/providers?serviceId=${item.id}&serviceName=${encodeURIComponent(item.name)}&serviceSlug=${item.slug}&servicePrice=${item.basePrice}` as any
          )
        }
        className="mx-5 mb-4 bg-white rounded-2xl overflow-hidden"
        style={CARD_SHADOW}
        activeOpacity={0.7}
      >
        {/* Orange accent top bar */}
        <View className="h-1 bg-primary" />

        <View className="p-4">
          {/* Row 1: Name + Price */}
          <View className="flex-row items-start justify-between mb-2">
            <Text
              className="text-base font-bold text-secondary flex-1 mr-3"
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <View className="bg-orange-50 px-3 py-1 rounded-lg">
              <Text className="text-base font-bold text-primary">
                {formatCurrency(item.basePrice)}
              </Text>
            </View>
          </View>

          {/* Row 2: Inclusion pills */}
          {inclusions && inclusions.length > 0 && (
            <View className="flex-row flex-wrap mb-2">
              {inclusions.slice(0, 4).map((tag, i) => (
                <View
                  key={i}
                  className="bg-green-50 border border-green-100 rounded-full px-2.5 py-1 mr-1.5 mb-1"
                >
                  <Text className="text-xs text-green-700">
                    {"\u2713"} {tag}
                  </Text>
                </View>
              ))}
              {inclusions.length > 4 && (
                <View className="bg-gray-50 rounded-full px-2.5 py-1 mb-1">
                  <Text className="text-xs text-gray-400">
                    +{inclusions.length - 4} more
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Row 2 fallback: Description if no inclusions */}
          {(!inclusions || inclusions.length === 0) && item.description ? (
            <Text
              className="text-sm text-gray-500 mb-2 leading-5"
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}

          {/* Row 3: Exclusion hint (subtle) */}
          {exclusions && exclusions.length > 0 && (
            <Text className="text-xs text-gray-400 mb-2" numberOfLines={1}>
              Excludes: {exclusions.join(", ")}
            </Text>
          )}

          {/* Row 4: Duration + CTA */}
          <View className="flex-row items-center justify-between mt-1 pt-2 border-t border-gray-50">
            {item.estimatedDuration > 0 ? (
              <View className="flex-row items-center">
                <Text className="text-xs text-gray-400 mr-1">{"\u23F1"}</Text>
                <Text className="text-xs text-gray-500 font-medium">
                  {formatDuration(item.estimatedDuration)}
                </Text>
              </View>
            ) : (
              <View />
            )}
            <View className="bg-primary px-4 py-2 rounded-lg">
              <Text className="text-xs font-bold text-white">
                View Providers
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">{"\u2190"}</Text>
        </TouchableOpacity>
        <Text
          className="text-xl font-bold text-secondary flex-1"
          numberOfLines={1}
        >
          {category?.name ?? "Category"}
        </Text>
        <Text className="text-sm text-gray-400">
          {services.length} service{services.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Service List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#FF6B00" className="mt-12" />
      ) : servicesError ? (
        <View className="flex-1 items-center justify-center py-20">
          <Text style={{ fontSize: 48 }}>{"\u26A0\uFE0F"}</Text>
          <Text className="text-lg font-semibold text-secondary mt-4">
            Could not load services
          </Text>
          <Text className="text-sm text-gray-400 mt-1 text-center px-10">
            Please check your connection and try again
          </Text>
          <TouchableOpacity
            onPress={() => refetchServices()}
            className="mt-5 px-6 py-3 rounded-xl bg-primary"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={renderServiceCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 24,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text style={{ fontSize: 48 }}>{"\uD83D\uDCED"}</Text>
              <Text className="text-lg font-semibold text-secondary mt-4">
                No services in this category
              </Text>
              <Text className="text-sm text-gray-400 mt-1 text-center px-10">
                New services will appear here soon
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
