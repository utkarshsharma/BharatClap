import "../../../global.css";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { catalogService, type Service } from "@/services/catalog";
import { formatCurrency, formatDuration } from "@/utils/format";

export default function CategoryDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: () => catalogService.getCategoryBySlug(slug!),
    enabled: !!slug,
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ["services", "category", slug],
    queryFn: () => catalogService.getServices({ categorySlug: slug }),
    enabled: !!slug,
  });

  const services = servicesData?.services ?? [];
  const isLoading = categoryLoading || servicesLoading;

  const renderServiceCard = ({ item }: { item: Service }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(customer)/service/${item.slug}` as any)}
      className="mx-5 mb-3 bg-white rounded-2xl border border-gray-100 p-4"
      activeOpacity={0.7}
    >
      <Text className="text-base font-bold text-secondary mb-1">{item.name}</Text>
      {item.description && (
        <Text className="text-sm text-gray-500 mb-2" numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-primary">
          {formatCurrency(item.basePrice)}
        </Text>
        {item.estimatedDuration > 0 && (
          <Text className="text-xs text-gray-400">
            ~{formatDuration(item.estimatedDuration)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-2xl text-secondary">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary flex-1" numberOfLines={1}>
          {category?.name ?? "Category"}
        </Text>
      </View>

      {/* Service List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#FF6B00" className="mt-12" />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={renderServiceCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text style={{ fontSize: 48 }}>📭</Text>
              <Text className="text-lg font-semibold text-secondary mt-4">
                No services found
              </Text>
              <Text className="text-sm text-gray-400 mt-1 text-center px-10">
                Services in this category will appear here
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
